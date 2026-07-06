import asyncio
import logging
import sys
from collections import defaultdict

import numpy as np
from sqlalchemy import text
from sqlmodel import select

from src.infrastructure.database import async_session_maker, engine
from src.models.anomaly import Anomaly
from src.models.detection_config import DetectionConfig
from src.services.anomaly_service import (
    FRAGMENTATION_THRESHOLD_DOP,
    IF_CONTAMINATION,
    MIN_DEVIATION_PCT,
    ZSCORE_THRESHOLD,
)

logger = logging.getLogger("veedoria.cli.tune_detection")


def _calc_pr(reviews: list[tuple[float, str]], threshold: float) -> dict:
    tp = sum(1 for s, st in reviews if s >= threshold and st == "CONFIRMED")
    fp = sum(1 for s, st in reviews if s >= threshold and st == "DISMISSED")
    fn = sum(1 for s, st in reviews if s < threshold and st == "CONFIRMED")
    precision = tp / (tp + fp) if (tp + fp) else 0
    recall = tp / (tp + fn) if (tp + fn) else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
    return {"tp": tp, "fp": fp, "fn": fn, "precision": precision, "recall": recall, "f1": f1, "threshold": threshold}


async def _apply_config(key: str, value: float, current: float) -> None:
    if value == current:
        logger.info("  → threshold unchanged (%s = %s), skipping write", key, value)
        return
    async with async_session_maker() as session:
        existing = await session.get(DetectionConfig, key)
        if existing:
            existing.value = value
        else:
            session.add(DetectionConfig(key=key, value=value))
        await session.commit()
    logger.info("  → WROTE %s = %s (was %s)", key, value, current)


async def analyze_price(apply: bool = False) -> None:
    result = await _get_reviews("PRICE_ANOMALY")
    if not result:
        logger.info("No price anomaly reviews yet")
        return
    reviews = result

    scores = [abs(s) for s, _ in reviews]
    logger.info("Price | scores range: %.2f – %.2f, median: %.2f", min(scores), max(scores), np.median(scores))

    confirmed_scores = [abs(s) for s, st in reviews if st == "CONFIRMED"]
    dismissed_scores = [abs(s) for s, st in reviews if st == "DISMISSED"]
    if confirmed_scores:
        logger.info("Price | CONFIRMED scores: median=%.2f, min=%.2f, max=%.2f", np.median(confirmed_scores), min(confirmed_scores), max(confirmed_scores))
    if dismissed_scores:
        logger.info("Price | DISMISSED scores: median=%.2f, min=%.2f, max=%.2f", np.median(dismissed_scores), min(dismissed_scores), max(dismissed_scores))

    thresholds = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
    best = max((_calc_pr(reviews, t) for t in thresholds), key=lambda x: x["f1"])
    logger.info("Price | Best z-score threshold: %.1f (precision=%.0f%%, recall=%.0f%%, f1=%.2f)",
                best["threshold"], best["precision"] * 100, best["recall"] * 100, best["f1"])
    if best["threshold"] != ZSCORE_THRESHOLD:
        logger.info("Price | RECOMMEND: change ZSCORE_THRESHOLD from %.1f → %.1f", ZSCORE_THRESHOLD, best["threshold"])
        if apply:
            await _apply_config("price_zscore_threshold", best["threshold"], ZSCORE_THRESHOLD)

    dev_pcts = [float(s) for s, _ in reviews]
    thresholds_dev = [25, 50, 75, 100, 125, 150]
    best_dev = max((_calc_pr(list(zip(dev_pcts, [st for _, st in reviews])), t) for t in thresholds_dev), key=lambda x: x["f1"])
    logger.info("Price | Best deviation %% threshold: %.0f%% (precision=%.0f%%, recall=%.0f%%, f1=%.2f)",
                best_dev["threshold"], best_dev["precision"] * 100, best_dev["recall"] * 100, best_dev["f1"])
    if best_dev["threshold"] != MIN_DEVIATION_PCT:
        logger.info("Price | RECOMMEND: change MIN_DEVIATION_PCT from %.0f%% → %.0f%%", MIN_DEVIATION_PCT, best_dev["threshold"])
        if apply:
            await _apply_config("price_min_deviation_pct", best_dev["threshold"], MIN_DEVIATION_PCT)


async def analyze_fragmentation(apply: bool = False) -> None:
    result = await _get_reviews("FRAGMENTATION")
    if not result:
        logger.info("No fragmentation anomaly reviews yet")
        return

    confirmed_amt = [a for a, st in result if st == "CONFIRMED"]
    dismissed_amt = [a for a, st in result if st == "DISMISSED"]
    if confirmed_amt:
        logger.info("Frag | CONFIRMED amounts: median=RD$ %.0f, min=RD$ %.0f, max=RD$ %.0f",
                    np.median(confirmed_amt), min(confirmed_amt), max(confirmed_amt))
    if dismissed_amt:
        logger.info("Frag | DISMISSED amounts: median=RD$ %.0f, min=RD$ %.0f, max=RD$ %.0f",
                    np.median(dismissed_amt), min(dismissed_amt), max(dismissed_amt))

    thresholds_dop = [3_000_000, 5_000_000, 7_000_000, 8_000_000, 10_000_000, 12_000_000]
    best = max((_calc_pr(result, t) for t in thresholds_dop), key=lambda x: x["f1"])
    logger.info("Frag | Best DOP threshold: RD$ %.0f (precision=%.0f%%, recall=%.0f%%, f1=%.2f)",
                best["threshold"], best["precision"] * 100, best["recall"] * 100, best["f1"])
    if best["threshold"] != FRAGMENTATION_THRESHOLD_DOP:
        logger.info("Frag | RECOMMEND: change FRAGMENTATION_THRESHOLD_DOP from RD$ %.0f → RD$ %.0f",
                    FRAGMENTATION_THRESHOLD_DOP, best["threshold"])
        if apply:
            await _apply_config("fragmentation_threshold_dop", best["threshold"], FRAGMENTATION_THRESHOLD_DOP)


async def overview() -> None:
    async with async_session_maker() as session:
        stmt = select(Anomaly)
        rows = (await session.execute(stmt)).scalars().all()

    if not rows:
        logger.info("No anomalies in database")
        return

    by_type = defaultdict(list)
    for a in rows:
        by_type[a.anomaly_type].append(a)

    for typ, items in sorted(by_type.items()):
        severities = [a.severity for a in items]
        reviewed = sum(1 for a in items if a.status in ("CONFIRMED", "DISMISSED"))
        logger.info("── %s ──", typ)
        logger.info("  Total: %d | Reviewed: %d | Pending: %d", len(items), reviewed, len(items) - reviewed)
        logger.info("  Severity: median=%.2f, min=%.2f, max=%.2f", np.median(severities), min(severities), max(severities))

        if typ == "COLLUSION":
            by_tier = defaultdict(list)
            by_signals = defaultdict(list)
            for a in items:
                by_tier[a.confidence or "BAJA"].append(a.severity)
                by_signals[a.signals_count].append(a.severity)

            for tier in ("ALTA", "MEDIA", "BAJA"):
                vals = by_tier.get(tier, [])
                if not vals:
                    continue
                logger.info("  %s: %d anomalías (severity med=%.2f)", tier, len(vals), np.median(vals))

            logger.info("  Distribution by signals_count:")
            for cnt in sorted(by_signals):
                vals = by_signals[cnt]
                confirmed = sum(1 for a in items if a.signals_count == cnt and a.status == "CONFIRMED")
                logger.info("    %d señal(es): %d anomalías (%d confirmadas)", cnt, len(vals), confirmed)


async def analyze_collusion() -> None:
    result = await _get_reviews("COLLUSION")
    if not result:
        logger.info("No collusion anomaly reviews yet")
        return

    by_tier: dict[str, list[str]] = {"ALTA": [], "MEDIA": [], "BAJA": []}
    for _score, _status, tier in result:
        by_tier.setdefault(tier, []).append(_status)

    for tier in ("ALTA", "MEDIA", "BAJA"):
        items = by_tier.get(tier, [])
        if not items:
            continue
        n = len(items)
        n_confirmed = sum(1 for s in items if s == "CONFIRMED")
        rate = n_confirmed / n * 100
        logger.info("Collusion | %s: %d anomalies, %.0f%% confirmed (%d/%d)", tier, n, rate, n_confirmed, n)


async def _get_reviews(anomaly_type: str) -> list:
    async with async_session_maker() as session:
        stmt = select(Anomaly).where(
            Anomaly.anomaly_type == anomaly_type,
            Anomaly.status.in_(["CONFIRMED", "DISMISSED"]),
        )
        rows = (await session.execute(stmt)).scalars().all()

    results = []
    for a in rows:
        if anomaly_type == "COLLUSION":
            results.append((a.score or a.severity, a.status, a.confidence or "BAJA"))
        elif anomaly_type == "FRAGMENTATION":
            results.append((a.amount or 0, a.status))
        else:
            results.append((a.score or 0, a.status))
    return results


async def main() -> None:
    apply = "--apply" in sys.argv

    class _FlushingHandler(logging.StreamHandler):
        def emit(self, record):
            super().emit(record)
            self.flush()

    _handler = _FlushingHandler()
    _handler.setFormatter(logging.Formatter("%(asctime)s | %(name)s | %(levelname)s | %(message)s", datefmt="%H:%M:%S"))
    logging.basicConfig(level=logging.INFO, handlers=[_handler])

    if apply:
        logger.info("── APPLY MODE: thresholds will be written to detection_config ──")

    await overview()
    await analyze_price(apply=apply)
    await analyze_fragmentation(apply=apply)
    await analyze_collusion()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
