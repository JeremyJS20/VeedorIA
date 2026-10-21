"""Lógica pura de calibración del motor de detección.

Una sola implementación de las fórmulas TP/FP/FN y de las rejillas de
umbrales, compartida por el CLI (`src.cli.tune_detection`) y por la consola
administrativa (`AdminCalibrationService`). Sin acceso a base de datos ni
efectos secundarios: recibe pares `(score, status)` y devuelve métricas.
"""

ZSCORE_GRID: list[float] = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
DEVIATION_GRID: list[float] = [25, 50, 75, 100, 125, 150]
FRAGMENTATION_GRID: list[float] = [
    3_000_000,
    5_000_000,
    7_000_000,
    8_000_000,
    10_000_000,
    12_000_000,
]

CONFIRMED = "CONFIRMED"
DISMISSED = "DISMISSED"

Review = tuple[float, str]


def evaluate_threshold(reviews: list[Review], threshold: float) -> dict:
    """Matriz de confusión de un umbral sobre los dictámenes disponibles.

    Un hallazgo se considera "levantado" por el umbral cuando su score es
    mayor o igual al umbral. `tp` = levantado y confirmado, `fp` = levantado
    y descartado, `fn` = no levantado pero confirmado.
    """
    tp = sum(1 for score, status in reviews if score >= threshold and status == CONFIRMED)
    fp = sum(1 for score, status in reviews if score >= threshold and status == DISMISSED)
    fn = sum(1 for score, status in reviews if score < threshold and status == CONFIRMED)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    return {
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "threshold": threshold,
    }


def evaluate_grid(reviews: list[Review], grid: list[float]) -> list[dict]:
    """Evalúa cada umbral de la rejilla en orden ascendente."""
    return [evaluate_threshold(reviews, threshold) for threshold in grid]


def best_threshold(reviews: list[Review], grid: list[float]) -> float | None:
    """Umbral de mayor F1; en empate gana el menor umbral (menos falsos positivos)."""
    if not reviews or not grid:
        return None
    results = sorted(evaluate_grid(reviews, grid), key=lambda item: item["threshold"])
    # `max` devuelve la primera coincidencia, por eso el orden ascendente
    # garantiza que un empate de F1 resuelva al umbral más bajo.
    best = max(results, key=lambda item: item["f1"])
    return float(best["threshold"])
