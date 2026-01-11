"""
Shared schema for receipt OCR experiments.

All amounts are in cents (integer) to avoid floating point issues.
"""

from typing import List, Optional, Union

from pydantic import BaseModel, Field


class ReceiptItem(BaseModel):
    """A single line item on a receipt."""

    name: str = Field(description="Item name/description")
    quantity: Optional[int] = Field(default=None, description="Quantity if specified")
    unit_price: Optional[int] = Field(
        default=None, description="Price per unit in cents"
    )
    total: int = Field(description="Total price for this item in cents")


class ReceiptParse(BaseModel):
    """Parsed receipt data from OCR."""

    merchant: Optional[str] = Field(default=None, description="Store/merchant name")
    date: Optional[str] = Field(default=None, description="Transaction date (ISO format)")
    currency_code: Optional[str] = Field(
        default=None, description="ISO 4217 currency code (e.g., USD, EUR)"
    )

    # Amounts in cents
    total: Optional[int] = Field(default=None, description="Total amount in cents")
    subtotal: Optional[int] = Field(
        default=None, description="Subtotal before tax/tip in cents"
    )
    tax: Optional[int] = Field(default=None, description="Tax amount in cents")
    tip: Optional[int] = Field(default=None, description="Tip amount in cents")
    service: Optional[int] = Field(
        default=None, description="Service charge in cents"
    )
    discount: Optional[int] = Field(
        default=None, description="Discount amount in cents (positive value)"
    )

    items: List[ReceiptItem] = Field(
        default_factory=list, description="Line items on the receipt"
    )

    raw_text: Optional[str] = Field(
        default=None, description="Raw OCR text for debugging"
    )


class ExperimentResult(BaseModel):
    """Result from running an OCR experiment on a single receipt."""

    receipt_file: str = Field(description="Path to the receipt image")
    approach: str = Field(
        description="OCR approach used (multimodal, ocr_then_llm, dedicated_api)"
    )
    parsed: Optional[ReceiptParse] = Field(
        default=None, description="Parsed receipt data"
    )
    error: Optional[str] = Field(default=None, description="Error message if failed")
    latency_ms: float = Field(description="Time taken in milliseconds")
    cost_usd: Optional[float] = Field(
        default=None, description="Estimated cost in USD"
    )


class ComparisonReport(BaseModel):
    """Comparison of results across approaches."""

    receipt_file: str
    ground_truth: Optional[ReceiptParse] = Field(
        default=None, description="Manually verified ground truth"
    )
    results: List[ExperimentResult]

    # Accuracy metrics per approach
    total_accuracy: dict = Field(
        default_factory=dict, description="Whether total was correct per approach"
    )
    items_accuracy: dict = Field(
        default_factory=dict, description="Percentage of items correctly parsed"
    )
