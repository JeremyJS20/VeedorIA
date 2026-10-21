from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.audit_log import AuditLog
from src.services.health_monitor_service import (
    HEALTH_ENTITY_TYPE,
    HealthMonitorService,
)


def _components(**statuses: str) -> list[dict]:
    return [
        {
            "key": key,
            "label": key,
            "status": status,
            "detail": f"{key} {status}",
            "latency_ms": 1,
        }
        for key, status in statuses.items()
    ]


def _set_components(service: HealthMonitorService, components: list[dict]) -> None:
    """Sustituye los probes: se prueba la transición, no el probe."""

    async def _fake_components() -> list[dict]:
        return components

    service._components = _fake_components  # type: ignore[method-assign]


def _service(db: AsyncSession, components: list[dict]) -> HealthMonitorService:
    service = HealthMonitorService(db)
    _set_components(service, components)
    return service


async def _count_events(db: AsyncSession) -> int:
    stmt = (
        select(func.count())
        .select_from(AuditLog)
        .where(AuditLog.entity_type == HEALTH_ENTITY_TYPE)
    )
    return int((await db.execute(stmt)).scalar() or 0)


class TestHealthMonitorTransitions:
    async def test_first_healthy_reading_records_nothing(self, db_session: AsyncSession):
        """Un arranque sano no es una transición: no debe llenar la bitácora."""
        service = _service(db_session, _components(api="OK", database="OK"))

        assert await service.evaluate_and_record() is None
        assert await _count_events(db_session) == 0
        assert await service.last_transition() is None

    async def test_first_degraded_reading_alerts(self, db_session: AsyncSession):
        """Si la plataforma ya viene degradada, hay que avisar aunque no haya previo."""
        service = _service(db_session, _components(api="OK", worker="DOWN"))

        event = await service.evaluate_and_record()

        assert event is not None
        assert event["action"] == "HEALTH_DEGRADED"
        assert event["previous"] is None
        assert event["status"] == "DOWN"
        assert [item["key"] for item in event["failing"]] == ["worker"]

    async def test_worst_status_wins(self, db_session: AsyncSession):
        """`DOWN` gana sobre `DEGRADED` y sobre `OK`."""
        service = _service(
            db_session, _components(api="OK", database="DEGRADED", worker="DOWN")
        )

        event = await service.evaluate_and_record()

        assert event is not None
        assert event["status"] == "DOWN"
        assert sorted(item["key"] for item in event["failing"]) == [
            "database",
            "worker",
        ]

    async def test_same_status_does_not_repeat(self, db_session: AsyncSession):
        """El job corre cada 5 minutos: sin esto la bitácora sería ruido puro."""
        service = _service(db_session, _components(api="OK", worker="DOWN"))

        first = await service.evaluate_and_record()
        second = await service.evaluate_and_record()

        assert first is not None
        assert second is None
        assert await _count_events(db_session) == 1

    async def test_recovery_is_recorded(self, db_session: AsyncSession):
        service = _service(db_session, _components(api="OK", worker="DOWN"))
        assert await service.evaluate_and_record() is not None

        _set_components(service, _components(api="OK", worker="OK"))
        event = await service.evaluate_and_record()

        assert event is not None
        assert event["action"] == "HEALTH_RECOVERED"
        assert event["previous"] == "DOWN"
        assert event["status"] == "OK"
        assert event["failing"] == []
        assert await _count_events(db_session) == 2

    async def test_transition_between_bad_states_is_recorded(
        self, db_session: AsyncSession
    ):
        """Pasar de `DEGRADED` a `DOWN` empeora: también es una transición."""
        service = _service(db_session, _components(api="OK", database="DEGRADED"))
        assert await service.evaluate_and_record() is not None

        _set_components(service, _components(api="OK", database="DOWN"))
        event = await service.evaluate_and_record()

        assert event is not None
        assert event["action"] == "HEALTH_DEGRADED"
        assert event["previous"] == "DEGRADED"
        assert event["status"] == "DOWN"

    async def test_event_is_recorded_as_system_not_as_a_user(
        self, db_session: AsyncSession
    ):
        """El evento no debe atribuirse a una persona (ni tocar la FK `user.id`)."""
        service = _service(db_session, _components(worker="DOWN"))

        await service.evaluate_and_record()

        row = (
            (
                await db_session.execute(
                    select(AuditLog).where(AuditLog.entity_type == HEALTH_ENTITY_TYPE)
                )
            )
            .scalars()
            .one()
        )
        assert row.user_id is None
        assert row.action_type == "HEALTH_DEGRADED"
        assert row.entity_id == "services"
        assert row.new_value["status"] == "DOWN"


class TestLastTransition:
    async def test_returns_the_most_recent(self, db_session: AsyncSession):
        service = _service(db_session, _components(worker="DOWN"))
        await service.evaluate_and_record()

        _set_components(service, _components(worker="OK"))
        await service.evaluate_and_record()

        transition = await service.last_transition()

        assert transition is not None
        assert transition["action"] == "HEALTH_RECOVERED"
        assert transition["status"] == "OK"
        assert transition["previous"] == "DOWN"
        assert transition["timestamp"] is not None

    async def test_none_when_there_is_no_history(self, db_session: AsyncSession):
        service = HealthMonitorService(db_session)

        assert await service.last_transition() is None
