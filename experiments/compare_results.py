#!/usr/bin/env python3
"""
Compare results across different OCR approaches.

Loads results from multimodal and OCR+LLM experiments and generates
a comparison report.
"""

import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional

from schema import ExperimentResult


def load_results(output_dir: Path) -> List[ExperimentResult]:
    """Load all experiment results from output directory."""
    results = []

    for json_file in output_dir.glob("*_results.json"):
        with open(json_file) as f:
            data = json.load(f)
            for item in data:
                results.append(ExperimentResult(**item))

    return results


def group_by_receipt(results: List[ExperimentResult]) -> Dict[str, List[ExperimentResult]]:
    """Group results by receipt file."""
    grouped = defaultdict(list)
    for result in results:
        # Normalize path to just filename
        filename = Path(result.receipt_file).name
        grouped[filename].append(result)
    return dict(grouped)


def calculate_stats(results: List[ExperimentResult]) -> dict:
    """Calculate aggregate statistics for a set of results."""
    successful = [r for r in results if r.parsed is not None]
    failed = [r for r in results if r.error is not None]

    if not results:
        return {}

    stats = {
        "total_runs": len(results),
        "successful": len(successful),
        "failed": len(failed),
        "success_rate": len(successful) / len(results) * 100 if results else 0,
    }

    if successful:
        latencies = [r.latency_ms for r in successful]
        costs = [r.cost_usd for r in successful if r.cost_usd is not None]

        stats["avg_latency_ms"] = sum(latencies) / len(latencies)
        stats["min_latency_ms"] = min(latencies)
        stats["max_latency_ms"] = max(latencies)

        if costs:
            stats["avg_cost_usd"] = sum(costs) / len(costs)
            stats["total_cost_usd"] = sum(costs)

        # Count how many got a total value
        with_total = [r for r in successful if r.parsed and r.parsed.total]
        stats["parsed_total_count"] = len(with_total)

        # Count items parsed
        item_counts = [
            len(r.parsed.items) for r in successful if r.parsed and r.parsed.items
        ]
        if item_counts:
            stats["avg_items_parsed"] = sum(item_counts) / len(item_counts)
            stats["max_items_parsed"] = max(item_counts)

    return stats


def compare_totals(results: List[ExperimentResult]) -> Dict[str, Optional[int]]:
    """Compare total amounts across approaches for same receipt."""
    totals = {}
    for result in results:
        if result.parsed and result.parsed.total:
            totals[result.approach] = result.parsed.total
    return totals


def generate_report(results: List[ExperimentResult], output_dir: Path):
    """Generate comparison report."""
    # Group by approach
    by_approach = defaultdict(list)
    for result in results:
        by_approach[result.approach].append(result)

    # Calculate stats per approach
    approach_stats = {}
    for approach, approach_results in by_approach.items():
        approach_stats[approach] = calculate_stats(approach_results)

    # Group by receipt to compare across approaches
    by_receipt = group_by_receipt(results)
    receipt_comparisons = {}
    for receipt, receipt_results in by_receipt.items():
        receipt_comparisons[receipt] = {
            "totals": compare_totals(receipt_results),
            "approaches_run": [r.approach for r in receipt_results],
        }

    # Build report
    report = {
        "summary": {
            "total_experiments": len(results),
            "unique_receipts": len(by_receipt),
            "approaches_tested": list(by_approach.keys()),
        },
        "by_approach": approach_stats,
        "by_receipt": receipt_comparisons,
    }

    # Save report
    output_file = output_dir / "comparison.json"
    with open(output_file, "w") as f:
        json.dump(report, f, indent=2, default=str)

    # Print summary
    print("=" * 60)
    print("RECEIPT OCR EXPERIMENT COMPARISON")
    print("=" * 60)
    print(f"\nTotal experiments: {len(results)}")
    print(f"Unique receipts: {len(by_receipt)}")
    print(f"Approaches tested: {len(by_approach)}")

    print("\n" + "-" * 60)
    print("RESULTS BY APPROACH")
    print("-" * 60)

    # Sort approaches for consistent display
    for approach in sorted(approach_stats.keys()):
        stats = approach_stats[approach]
        print(f"\n{approach}:")
        print(f"  Success rate: {stats.get('success_rate', 0):.1f}%")
        print(f"  Avg latency: {stats.get('avg_latency_ms', 0):.0f}ms")
        if "avg_cost_usd" in stats:
            print(f"  Avg cost: ${stats['avg_cost_usd']:.5f}")
        print(f"  Parsed total: {stats.get('parsed_total_count', 0)}/{stats.get('successful', 0)}")
        if "avg_items_parsed" in stats:
            print(f"  Avg items: {stats['avg_items_parsed']:.1f}")

    print("\n" + "-" * 60)
    print("TOTAL COMPARISON BY RECEIPT")
    print("-" * 60)

    for receipt, comparison in receipt_comparisons.items():
        totals = comparison["totals"]
        if totals:
            print(f"\n{receipt}:")
            for approach, total in sorted(totals.items()):
                print(f"  {approach}: ${total/100:.2f}")

            # Check if all totals match
            unique_totals = set(totals.values())
            if len(unique_totals) == 1:
                print("  [All approaches agree]")
            else:
                print("  [MISMATCH - approaches disagree]")

    print(f"\nFull report saved to: {output_file}")


def main():
    script_dir = Path(__file__).parent
    output_dir = script_dir / "outputs"

    if not output_dir.exists():
        print(f"No outputs directory found at {output_dir}")
        print("Run experiments first:")
        print("  python run_multimodal.py")
        print("  python run_ocr_then_llm.py")
        return

    results = load_results(output_dir)

    if not results:
        print("No experiment results found in outputs/")
        print("Run experiments first")
        return

    generate_report(results, output_dir)


if __name__ == "__main__":
    main()
