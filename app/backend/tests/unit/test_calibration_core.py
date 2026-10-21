import pytest

from src.services.calibration_core import (
    FRAGMENTATION_GRID,
    ZSCORE_GRID,
    best_threshold,
    evaluate_grid,
    evaluate_threshold,
)


def test_evaluate_threshold_perfect_precision_and_recall():
    reviews = [(4.0, "CONFIRMED"), (3.0, "CONFIRMED"), (1.0, "DISMISSED")]

    metrics = evaluate_threshold(reviews, 2.5)

    assert metrics["tp"] == 2
    assert metrics["fp"] == 0
    assert metrics["fn"] == 0
    assert metrics["precision"] == 1.0
    assert metrics["recall"] == 1.0
    assert metrics["f1"] == 1.0


def test_evaluate_threshold_counts_false_positives():
    reviews = [
        (3.5, "CONFIRMED"),
        (3.0, "DISMISSED"),
        (2.8, "DISMISSED"),
        (1.2, "CONFIRMED"),
    ]

    metrics = evaluate_threshold(reviews, 2.5)

    assert metrics["tp"] == 1
    assert metrics["fp"] == 2
    assert metrics["fn"] == 1
    assert metrics["precision"] == pytest.approx(1 / 3)
    assert metrics["recall"] == pytest.approx(0.5)
    assert metrics["f1"] == pytest.approx(0.4)


def test_best_threshold_prefers_highest_f1_and_lowest_on_tie():
    # F1=0.8 se alcanza tanto en 0.5 como en 1.0: el empate resuelve al menor.
    reviews = [(1.0, "CONFIRMED"), (2.0, "CONFIRMED"), (3.0, "DISMISSED")]
    assert best_threshold(reviews, ZSCORE_GRID) == 0.5

    tie_reviews = [(1.0, "CONFIRMED"), (3.0, "CONFIRMED"), (3.0, "DISMISSED")]
    assert best_threshold(tie_reviews, [0.5, 1.0, 4.0]) == 0.5

    assert best_threshold([], ZSCORE_GRID) is None
    assert len(evaluate_grid(reviews, FRAGMENTATION_GRID)) == len(FRAGMENTATION_GRID)
