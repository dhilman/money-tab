#!/usr/bin/env python3
"""
Test multimodal LLM approach for receipt OCR.

Uses LiteLLM with OpenRouter to test various vision models:
- Claude Sonnet/Haiku
- GPT-4o
- Gemini
- etc.
"""

import base64
import io
import json
import os
import sys
import time
from pathlib import Path

import litellm
from PIL import Image

from schema import ExperimentResult, ReceiptParse

# Max image size (pixels on longest edge) and quality for compression
MAX_IMAGE_SIZE = 1920
JPEG_QUALITY = 85

# Model configurations (OpenRouter format)
MODELS = {
    "claude-sonnet": "openrouter/anthropic/claude-sonnet-4",
    "claude-haiku": "openrouter/anthropic/claude-3.5-haiku",
    "gpt-4o": "openrouter/openai/gpt-4o",
    "gpt-4o-mini": "openrouter/openai/gpt-4o-mini",
    "gemini-flash": "openrouter/google/gemini-2.0-flash-001",
    "gemini-pro": "openrouter/google/gemini-pro-vision",
}

# Approximate costs per 1M tokens (from OpenRouter)
COSTS = {
    "claude-sonnet": {"input": 3.0, "output": 15.0},
    "claude-haiku": {"input": 0.25, "output": 1.25},
    "gpt-4o": {"input": 2.5, "output": 10.0},
    "gpt-4o-mini": {"input": 0.15, "output": 0.6},
    "gemini-flash": {"input": 0.075, "output": 0.3},
    "gemini-pro": {"input": 0.25, "output": 0.5},
}


def load_and_compress_image(image_path: Path) -> tuple:
    """Load image, resize if needed, compress, and return (base64_data, media_type, original_size, compressed_size)."""
    img = Image.open(image_path)
    original_size = image_path.stat().st_size

    # Convert to RGB if necessary (handles RGBA, P mode, etc.)
    if img.mode in ('RGBA', 'P', 'LA'):
        img = img.convert('RGB')

    # Resize if larger than max size
    width, height = img.size
    if max(width, height) > MAX_IMAGE_SIZE:
        if width > height:
            new_width = MAX_IMAGE_SIZE
            new_height = int(height * MAX_IMAGE_SIZE / width)
        else:
            new_height = MAX_IMAGE_SIZE
            new_width = int(width * MAX_IMAGE_SIZE / height)
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Compress to JPEG
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    compressed_data = buffer.getvalue()
    compressed_size = len(compressed_data)

    data = base64.standard_b64encode(compressed_data).decode("utf-8")

    return data, "image/jpeg", original_size, compressed_size


def parse_receipt(image_path: Path, model_key: str) -> ExperimentResult:
    """Parse receipt using specified vision model via OpenRouter."""
    model = MODELS.get(model_key)
    if not model:
        return ExperimentResult(
            receipt_file=str(image_path),
            approach=f"multimodal_{model_key}",
            error=f"Unknown model: {model_key}",
            latency_ms=0,
        )

    image_data, media_type, orig_size, comp_size = load_and_compress_image(image_path)

    system_prompt = """You are a receipt parser. Extract structured data from receipt images.

Return a JSON object with these fields (all amounts in CENTS as integers):
- merchant: string or null (store name)
- date: string or null (ISO format YYYY-MM-DD)
- currency_code: string or null (e.g., "USD", "EUR", "GBP", "JPY")
- total: integer or null (total in cents, e.g., $12.34 = 1234)
- subtotal: integer or null (subtotal before tax/tip in cents)
- tax: integer or null (tax in cents)
- tip: integer or null (tip in cents)
- service: integer or null (service charge in cents)
- discount: integer or null (discount in cents, positive value)
- items: array of objects, each with:
  - name: string (item description)
  - quantity: integer or null
  - unit_price: integer or null (in cents)
  - total: integer (REQUIRED - item total in cents, must not be null)

CRITICAL RULES:
- ALL amounts must be in CENTS (multiply by 100). $12.34 = 1234, £15.17 = 1517, ¥2285 = 2285
- Each item MUST have a "total" field with an integer value (not null)
- If you can't determine an item's total, estimate it or omit that item
- Return ONLY valid JSON, no markdown, no explanation"""

    start_time = time.time()
    error_msg = None
    parsed = None
    cost = None

    try:
        response = litellm.completion(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{image_data}"
                            },
                        },
                        {
                            "type": "text",
                            "text": "Parse this receipt and return JSON only.",
                        },
                    ],
                },
            ],
            max_tokens=2048,
        )

        # Extract response text
        response_text = response.choices[0].message.content

        # Try to find JSON in the response
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            json_str = response_text.split("```")[1].split("```")[0]
        else:
            json_str = response_text

        data = json.loads(json_str.strip())

        # Post-process items to handle null totals (filter out items with null total)
        if "items" in data and data["items"]:
            valid_items = []
            for item in data["items"]:
                if item.get("total") is not None:
                    valid_items.append(item)
                elif item.get("unit_price") is not None and item.get("quantity"):
                    # Calculate total from unit_price * quantity
                    item["total"] = item["unit_price"] * item["quantity"]
                    valid_items.append(item)
                # Skip items with no total and no way to calculate it
            data["items"] = valid_items

        parsed = ReceiptParse(**data)

        # Calculate cost if usage info available
        if hasattr(response, "usage") and response.usage:
            input_tokens = response.usage.prompt_tokens or 0
            output_tokens = response.usage.completion_tokens or 0
            model_costs = COSTS.get(model_key, {"input": 0, "output": 0})
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
        approach=f"multimodal_{model_key}",
        parsed=parsed,
        error=error_msg,
        latency_ms=latency,
        cost_usd=cost,
    )


def run_all_receipts(
    receipts_dir: Path, output_dir: Path, models=None
):
    """Run multimodal parsing on all receipt images."""
    results = []

    image_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    receipt_files = [
        f for f in receipts_dir.iterdir() if f.suffix.lower() in image_extensions
    ]

    if not receipt_files:
        print(f"No receipt images found in {receipts_dir}")
        print("Add receipt images (jpg, png, etc.) to the receipts/ folder")
        return

    # Default to testing Sonnet and Haiku
    if models is None:
        models = ["claude-sonnet", "claude-haiku"]

    print(f"Found {len(receipt_files)} receipt images")
    print(f"Testing models: {models}")

    for receipt_file in sorted(receipt_files):
        # Show compression info
        orig_size = receipt_file.stat().st_size
        _, _, _, comp_size = load_and_compress_image(receipt_file)
        ratio = (1 - comp_size / orig_size) * 100
        print(f"\nProcessing: {receipt_file.name} ({orig_size/1024/1024:.1f}MB -> {comp_size/1024:.0f}KB, -{ratio:.0f}%)")

        for model_key in models:
            result = parse_receipt(receipt_file, model_key)
            results.append(result)

            if result.error:
                print(f"  {model_key}: Error - {result.error[:50]}...")
            else:
                cost_str = f"${result.cost_usd:.5f}" if result.cost_usd else "N/A"
                print(f"  {model_key}: {result.latency_ms:.0f}ms, {cost_str}")
                if result.parsed:
                    total_str = (
                        f"${result.parsed.total/100:.2f}"
                        if result.parsed.total
                        else "N/A"
                    )
                    print(f"    Total: {total_str}")
                    print(f"    Items: {len(result.parsed.items)}")

    # Save results
    output_file = output_dir / "multimodal_results.json"
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

    # Parse command line args for model selection
    models = None
    if len(sys.argv) > 1:
        models = sys.argv[1:]
        invalid = [m for m in models if m not in MODELS]
        if invalid:
            print(f"Unknown models: {invalid}")
            print(f"Available: {list(MODELS.keys())}")
            sys.exit(1)

    run_all_receipts(receipts_dir, output_dir, models)


if __name__ == "__main__":
    main()
