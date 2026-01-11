#!/usr/bin/env python3
"""
Export experiment results to CSV spreadsheet for verification.

Creates a detailed spreadsheet with per-receipt, per-model itemized outputs.
"""

import csv
import json
from pathlib import Path
from typing import Optional


def load_results(output_dir: Path) -> list:
    """Load multimodal results from JSON."""
    results_file = output_dir / "multimodal_results.json"
    if not results_file.exists():
        print(f"No results found at {results_file}")
        print("Run 'python run_multimodal.py' first")
        return []

    with open(results_file) as f:
        return json.load(f)


def format_cents(cents: Optional[int]) -> str:
    """Format cents as dollar string."""
    if cents is None:
        return ""
    return f"${cents / 100:.2f}"


def export_summary_csv(results: list, output_dir: Path):
    """Export summary CSV with one row per receipt+model."""
    output_file = output_dir / "results_summary.csv"

    with open(output_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Receipt",
            "Model",
            "Success",
            "Merchant",
            "Date",
            "Currency",
            "Total",
            "Subtotal",
            "Tax",
            "Tip",
            "Service",
            "Discount",
            "Item Count",
            "Latency (ms)",
            "Cost ($)",
            "Error",
        ])

        for r in results:
            parsed = r.get("parsed") or {}
            writer.writerow([
                Path(r["receipt_file"]).name,
                r["approach"].replace("multimodal_", ""),
                "Yes" if not r.get("error") else "No",
                parsed.get("merchant", ""),
                parsed.get("date", ""),
                parsed.get("currency_code", ""),
                format_cents(parsed.get("total")),
                format_cents(parsed.get("subtotal")),
                format_cents(parsed.get("tax")),
                format_cents(parsed.get("tip")),
                format_cents(parsed.get("service")),
                format_cents(parsed.get("discount")),
                len(parsed.get("items", [])),
                f"{r['latency_ms']:.0f}",
                f"{r.get('cost_usd', 0):.5f}" if r.get("cost_usd") else "",
                r.get("error", ""),
            ])

    print(f"Summary saved to: {output_file}")


def export_items_csv(results: list, output_dir: Path):
    """Export detailed items CSV with one row per item."""
    output_file = output_dir / "results_items.csv"

    with open(output_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Receipt",
            "Model",
            "Item #",
            "Item Name",
            "Quantity",
            "Unit Price",
            "Item Total",
        ])

        for r in results:
            if r.get("error"):
                continue

            parsed = r.get("parsed") or {}
            items = parsed.get("items", [])
            receipt_name = Path(r["receipt_file"]).name
            model_name = r["approach"].replace("multimodal_", "")

            if not items:
                # Write a row even if no items
                writer.writerow([
                    receipt_name,
                    model_name,
                    0,
                    "(no items parsed)",
                    "",
                    "",
                    "",
                ])
            else:
                for i, item in enumerate(items, 1):
                    writer.writerow([
                        receipt_name,
                        model_name,
                        i,
                        item.get("name", ""),
                        item.get("quantity", ""),
                        format_cents(item.get("unit_price")),
                        format_cents(item.get("total")),
                    ])

    print(f"Items saved to: {output_file}")


def export_pivot_csv(results: list, output_dir: Path):
    """Export pivot-style CSV with receipts as rows and models as columns."""
    output_file = output_dir / "results_pivot.csv"

    # Group results by receipt
    by_receipt = {}
    all_models = set()

    for r in results:
        receipt = Path(r["receipt_file"]).name
        model = r["approach"].replace("multimodal_", "")
        all_models.add(model)

        if receipt not in by_receipt:
            by_receipt[receipt] = {}

        parsed = r.get("parsed") or {}
        by_receipt[receipt][model] = {
            "total": format_cents(parsed.get("total")),
            "items": len(parsed.get("items", [])),
            "error": "ERR" if r.get("error") else "",
        }

    models = sorted(all_models)

    with open(output_file, "w", newline="") as f:
        writer = csv.writer(f)

        # Header row: Receipt, then Total and Items for each model
        header = ["Receipt"]
        for m in models:
            header.extend([f"{m} Total", f"{m} Items"])
        writer.writerow(header)

        # Data rows
        for receipt in sorted(by_receipt.keys()):
            row = [receipt]
            for m in models:
                data = by_receipt[receipt].get(m, {})
                row.append(data.get("total", "") or data.get("error", ""))
                row.append(data.get("items", ""))
            writer.writerow(row)

    print(f"Pivot saved to: {output_file}")


def main():
    script_dir = Path(__file__).parent
    output_dir = script_dir / "outputs"

    results = load_results(output_dir)
    if not results:
        return

    print(f"Loaded {len(results)} experiment results")
    print()

    export_summary_csv(results, output_dir)
    export_items_csv(results, output_dir)
    export_pivot_csv(results, output_dir)

    print()
    print("Open these CSV files in Excel/Google Sheets for verification.")


if __name__ == "__main__":
    main()
