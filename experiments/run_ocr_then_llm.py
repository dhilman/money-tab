#!/usr/bin/env python3
"""
Test OCR-then-LLM pipeline for receipt parsing.

Uses Tesseract or EasyOCR to extract text, then LiteLLM/OpenRouter to parse it.
This approach may be cheaper than multimodal but potentially less accurate.
"""

import json
import os
import sys
import time
from pathlib import Path

import litellm

from schema import ExperimentResult, ReceiptParse

# Try to import OCR libraries
try:
    import pytesseract
    from PIL import Image

    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

try:
    import easyocr

    EASYOCR_AVAILABLE = True
    _easyocr_reader = None
except ImportError:
    EASYOCR_AVAILABLE = False

# Model for text parsing (text-only, so cheaper models work well)
TEXT_MODELS = {
    "claude-haiku": "openrouter/anthropic/claude-3.5-haiku",
    "gpt-4o-mini": "openrouter/openai/gpt-4o-mini",
    "gemini-flash": "openrouter/google/gemini-2.0-flash-001",
}

# Approximate costs per 1M tokens (text-only is much cheaper)
COSTS = {
    "claude-haiku": {"input": 0.25, "output": 1.25},
    "gpt-4o-mini": {"input": 0.15, "output": 0.6},
    "gemini-flash": {"input": 0.075, "output": 0.3},
}


def get_easyocr_reader():
    """Lazy-load EasyOCR reader."""
    global _easyocr_reader
    if _easyocr_reader is None:
        _easyocr_reader = easyocr.Reader(["en"])
    return _easyocr_reader


def ocr_tesseract(image_path: Path) -> str:
    """Extract text from image using Tesseract."""
    if not TESSERACT_AVAILABLE:
        raise ImportError("pytesseract not installed. Run: pip install pytesseract")

    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    return text


def ocr_easyocr(image_path: Path) -> str:
    """Extract text from image using EasyOCR."""
    if not EASYOCR_AVAILABLE:
        raise ImportError("easyocr not installed. Run: pip install easyocr")

    reader = get_easyocr_reader()
    results = reader.readtext(str(image_path))

    # Combine detected text blocks
    lines = [text for _, text, _ in results]
    return "\n".join(lines)


def parse_text_with_llm(
    raw_text: str, model_key: str = "claude-haiku"
) -> dict:
    """Parse raw OCR text into structured receipt data using LLM."""
    model = TEXT_MODELS.get(model_key)
    if not model:
        raise ValueError(f"Unknown model: {model_key}")

    system_prompt = """You are a receipt parser. Given raw OCR text from a receipt, extract structured data.

Return a JSON object with these fields (all amounts in CENTS as integers):
- merchant: string or null (store name)
- date: string or null (ISO format YYYY-MM-DD)
- currency_code: string or null (e.g., "USD", "EUR")
- total: integer or null (total in cents, e.g., $12.34 = 1234)
- subtotal: integer or null (subtotal before tax/tip in cents)
- tax: integer or null (tax in cents)
- tip: integer or null (tip in cents)
- service: integer or null (service charge in cents)
- discount: integer or null (discount in cents, positive value)
- items: array of {name: string, quantity: int or null, unit_price: int or null, total: int}

IMPORTANT:
- Convert all dollar amounts to cents (multiply by 100)
- If you can't determine a value, use null
- OCR text may have errors - use context to interpret
- Look for patterns like "TOTAL", "TAX", "SUBTOTAL" to identify amounts

Return ONLY valid JSON, no other text."""

    response = litellm.completion(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"Parse this receipt text and return JSON only:\n\n{raw_text}",
            },
        ],
        max_tokens=1024,
    )

    response_text = response.choices[0].message.content

    # Extract JSON from response
    if "```json" in response_text:
        json_str = response_text.split("```json")[1].split("```")[0]
    elif "```" in response_text:
        json_str = response_text.split("```")[1].split("```")[0]
    else:
        json_str = response_text

    data = json.loads(json_str.strip())

    # Return with token counts for cost calculation
    input_tokens = 0
    output_tokens = 0
    if hasattr(response, "usage") and response.usage:
        input_tokens = response.usage.prompt_tokens or 0
        output_tokens = response.usage.completion_tokens or 0

    return {
        "data": data,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
    }


def parse_receipt_ocr_llm(
    image_path: Path, ocr_engine: str = "tesseract", llm_model: str = "claude-haiku"
) -> ExperimentResult:
    """Parse receipt using OCR + LLM pipeline."""
    start_time = time.time()
    error_msg = None
    parsed = None
    cost = None

    try:
        # Step 1: OCR
        if ocr_engine == "tesseract":
            raw_text = ocr_tesseract(image_path)
        elif ocr_engine == "easyocr":
            raw_text = ocr_easyocr(image_path)
        else:
            raise ValueError(f"Unknown OCR engine: {ocr_engine}")

        if not raw_text.strip():
            raise ValueError("OCR returned empty text")

        # Step 2: LLM parsing
        result = parse_text_with_llm(raw_text, llm_model)
        parsed = ReceiptParse(**result["data"], raw_text=raw_text)

        # Calculate cost
        input_tokens = result["input_tokens"]
        output_tokens = result["output_tokens"]
        model_costs = COSTS.get(llm_model, {"input": 0, "output": 0})
        cost = (input_tokens / 1_000_000 * model_costs["input"]) + (
            output_tokens / 1_000_000 * model_costs["output"]
        )

    except json.JSONDecodeError as e:
        error_msg = f"JSON parse error: {e}"
    except litellm.exceptions.APIError as e:
        error_msg = f"API error: {e}"
    except Exception as e:
        error_msg = f"Error: {type(e).__name__}: {e}"

    latency = (time.time() - start_time) * 1000

    return ExperimentResult(
        receipt_file=str(image_path),
        approach=f"ocr_{ocr_engine}_{llm_model}",
        parsed=parsed,
        error=error_msg,
        latency_ms=latency,
        cost_usd=cost,
    )


def run_all_receipts(receipts_dir: Path, output_dir: Path):
    """Run OCR+LLM parsing on all receipt images."""
    results = []

    image_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    receipt_files = [
        f for f in receipts_dir.iterdir() if f.suffix.lower() in image_extensions
    ]

    if not receipt_files:
        print(f"No receipt images found in {receipts_dir}")
        print("Add receipt images (jpg, png, etc.) to the receipts/ folder")
        return

    # Check available OCR engines
    ocr_engines = []
    if TESSERACT_AVAILABLE:
        try:
            # Test if tesseract binary is available
            pytesseract.get_tesseract_version()
            ocr_engines.append("tesseract")
        except Exception:
            print("Warning: Tesseract not properly installed")

    if EASYOCR_AVAILABLE:
        ocr_engines.append("easyocr")

    if not ocr_engines:
        print("Error: No OCR engines available")
        print("Install Tesseract: brew install tesseract && pip install pytesseract pillow")
        print("Or install EasyOCR: pip install easyocr")
        return

    print(f"Found {len(receipt_files)} receipt images")
    print(f"Available OCR engines: {ocr_engines}")
    print(f"LLM model: claude-haiku")

    for receipt_file in sorted(receipt_files):
        print(f"\nProcessing: {receipt_file.name}")

        for engine in ocr_engines:
            result = parse_receipt_ocr_llm(receipt_file, engine, "claude-haiku")
            results.append(result)

            if result.error:
                print(f"  {engine}: Error - {result.error[:50]}...")
            else:
                cost_str = f"${result.cost_usd:.6f}" if result.cost_usd else "N/A"
                print(f"  {engine}: {result.latency_ms:.0f}ms, {cost_str}")
                if result.parsed:
                    total_str = (
                        f"${result.parsed.total/100:.2f}"
                        if result.parsed.total
                        else "N/A"
                    )
                    print(f"    Total: {total_str}")
                    print(f"    Items: {len(result.parsed.items)}")

    # Save results
    output_file = output_dir / "ocr_llm_results.json"
    with open(output_file, "w") as f:
        json.dump([r.model_dump() for r in results], f, indent=2, default=str)

    print(f"\nResults saved to {output_file}")


def main():
    script_dir = Path(__file__).parent
    receipts_dir = script_dir / "receipts"
    output_dir = script_dir / "outputs"

    if not receipts_dir.exists():
        print(f"Creating receipts directory: {receipts_dir}")
        receipts_dir.mkdir()

    output_dir.mkdir(exist_ok=True)

    # Check for OpenRouter API key
    if not os.environ.get("OPENROUTER_API_KEY"):
        print("Error: OPENROUTER_API_KEY environment variable not set")
        print("Get an API key from https://openrouter.ai/keys")
        print("Export: export OPENROUTER_API_KEY=sk-or-...")
        sys.exit(1)

    run_all_receipts(receipts_dir, output_dir)


if __name__ == "__main__":
    main()
