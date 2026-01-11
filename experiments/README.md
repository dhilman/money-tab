# Receipt OCR Experiments

Compare different approaches for extracting structured data from receipt images.

## Approaches Tested

1. **Multimodal LLM** (`run_multimodal.py`)
   - Send image directly to vision-capable LLMs
   - Models: Claude Sonnet, Claude Haiku, GPT-4o, GPT-4o-mini, Gemini Flash
   - Pros: Best accuracy, handles messy receipts well
   - Cons: Higher cost per image

2. **OCR + LLM** (`run_ocr_then_llm.py`)
   - Extract text with Tesseract or EasyOCR, then parse with LLM
   - Pros: Lower cost (text-only LLM calls)
   - Cons: OCR errors compound, loses spatial information

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# For Tesseract OCR (macOS)
brew install tesseract

# Set OpenRouter API key
export OPENROUTER_API_KEY=sk-or-...
```

## Usage

### 1. Add Receipt Images

Place receipt images in `receipts/` folder:
```
receipts/
├── receipt_01.jpg
├── receipt_02.png
└── ...
```

### 2. Run Experiments

```bash
# Test multimodal approach (default: Claude Sonnet + Haiku)
python run_multimodal.py

# Test specific models
python run_multimodal.py claude-sonnet gpt-4o gemini-flash

# Test OCR + LLM pipeline
python run_ocr_then_llm.py

# Compare results
python compare_results.py
```

### 3. Review Results

Results are saved to `outputs/`:
- `multimodal_results.json` - Vision model outputs
- `ocr_llm_results.json` - OCR + LLM outputs
- `comparison.json` - Side-by-side comparison

## Available Models

### Multimodal (Vision)
| Key | Model | Cost (input/output per 1M tokens) |
|-----|-------|-----------------------------------|
| `claude-sonnet` | Claude Sonnet 4 | $3.00 / $15.00 |
| `claude-haiku` | Claude 3.5 Haiku | $0.25 / $1.25 |
| `gpt-4o` | GPT-4o | $2.50 / $10.00 |
| `gpt-4o-mini` | GPT-4o Mini | $0.15 / $0.60 |
| `gemini-flash` | Gemini 2.0 Flash | $0.075 / $0.30 |

### Text-Only (for OCR pipeline)
| Key | Model | Cost (input/output per 1M tokens) |
|-----|-------|-----------------------------------|
| `claude-haiku` | Claude 3.5 Haiku | $0.25 / $1.25 |
| `gpt-4o-mini` | GPT-4o Mini | $0.15 / $0.60 |
| `gemini-flash` | Gemini 2.0 Flash | $0.075 / $0.30 |

## Output Schema

All approaches output the same `ReceiptParse` structure:

```python
{
    "merchant": "Store Name",
    "date": "2024-01-15",
    "currency_code": "USD",
    "total": 1234,           # cents ($12.34)
    "subtotal": 1100,        # cents
    "tax": 134,              # cents
    "tip": null,
    "service": null,
    "discount": null,
    "items": [
        {"name": "Item 1", "quantity": 2, "unit_price": 299, "total": 598},
        {"name": "Item 2", "quantity": 1, "unit_price": null, "total": 502}
    ]
}
```

All amounts are in **cents** (integers) to avoid floating-point precision issues.

## Evaluation Metrics

- **Total accuracy**: Did we get the total right?
- **Item count**: How many items detected vs actual?
- **Item accuracy**: % of items with correct name + price
- **Latency**: Time per receipt
- **Cost**: Estimated API cost per receipt

## Results Summary (2026-01-11)

Tested on 10 real receipt images (1.4MB - 5.3MB original size).
Images compressed to ~200-600KB (max 1920px, JPEG quality 85) before processing.

| Approach | Success Rate | Avg Latency | Avg Cost/Receipt | Avg Items | Notes |
|----------|--------------|-------------|------------------|-----------|-------|
| Gemini Flash | **100%** | 3.0s | $0.00026 | 4.9 | Fastest, cheapest, most items |
| Claude Sonnet | **100%** | 5.9s | $0.01003 | 4.1 | Best accuracy on complex receipts |
| GPT-4o-mini | **100%** | 6.6s | $0.00400 | 3.5 | Reliable middle ground |
| Claude Haiku | **100%** | 8.0s | $0.00077 | 3.2 | Cheapest Claude option |

### Key Findings

1. **Image compression is essential**: Without compression, Claude models fail on images >5MB. After compressing to <1MB, all models achieve 100% success rate.
2. **Accuracy varies by receipt**: Only 3/10 receipts had all 4 models agree on the total
3. **Cents conversion remains tricky**: Gemini sometimes multiplies by 100 twice ($22.85 → $2285.00)
4. **Japanese/complex receipts are hard**: IMG_4943 had wildly different totals across models ($60 to $9000)

### Totals Accuracy

| Receipt | Claude Sonnet | Claude Haiku | GPT-4o-mini | Gemini Flash | Agreement |
|---------|---------------|--------------|-------------|--------------|-----------|
| IMG_6449 | $27.84 | $27.84 | $27.84 | $27.84 | All agree |
| IMG_6656 | $217.80 | $217.80 | $217.80 | $217.80 | All agree |
| camphoto_959030623 | $15.17 | $15.17 | $15.17 | $15.17 | All agree |
| IMG_1780 | $138.82 | $13.82 | $138.82 | $138.82 | Haiku off |
| camphoto_341603450 | $11.25 | $11.25 | $100.00 | $11.25 | GPT wrong |
| IMG_8246 | $2.95 | $22.85 | $22.85 | $2285.00 | Mixed |
| IMG_6232 | $40.55 | $46.95 | $46.00 | $46.00 | Minor diff |
| IMG_6380 | $86.11 | $81.89 | $81.89 | $95.00 | Minor diff |
| IMG_1963 | $61.63 | $20.14 | $61.00 | $68.63 | Mixed |
| IMG_4943 | $771.00 | $1410.00 | $60.00 | $9000.00 | Major diff |

## Recommendation

Based on the results, the recommended approach for MoneyTab is:

### Production Strategy

1. **Always compress images** before sending to API (max 1920px, JPEG quality 85)
2. **Primary model**: Claude Sonnet
   - Best accuracy for complex receipts
   - Reasonable cost ($0.01/receipt)
   - Fast (5.9s avg)
3. **Budget option**: Gemini Flash
   - Fastest (3.0s) and cheapest ($0.00026/receipt)
   - Good accuracy on standard receipts
   - Requires validation for cents conversion

### Validation Strategy

Since models can disagree significantly, implement these safeguards:
- Allow user to confirm/edit the parsed total before saving
- Flag receipts where parsed total differs significantly from item sum
- Consider running 2 models and comparing for high-value receipts

### Implementation Notes

- Image preprocessing: resize to max 1920px, compress to JPEG quality 85
- Store original image + parsed JSON in attachments for audit trail
- Client-side resize before upload to reduce bandwidth and API costs
