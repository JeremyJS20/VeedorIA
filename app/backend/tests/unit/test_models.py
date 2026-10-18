import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.contract import Contract
from src.models.institution import Institution
from src.models.process import Process
from src.models.supplier import Supplier


class TestInstitutionConstraints:
    async def test_unique_dgcp_id(self, db_session: AsyncSession):
        inst1 = Institution(dgcp_id="001", name="Ministerio")
        db_session.add(inst1)
        await db_session.commit()

        inst2 = Institution(dgcp_id="001", name="Otro")
        db_session.add(inst2)
        with pytest.raises(IntegrityError):
            await db_session.commit()
        await db_session.rollback()


class TestSupplierConstraints:
    async def test_unique_rnc(self, db_session: AsyncSession):
        sup1 = Supplier(rnc="123456789", registered_name="Empresa 1")
        db_session.add(sup1)
        await db_session.commit()

        sup2 = Supplier(rnc="123456789", registered_name="Empresa 2")
        db_session.add(sup2)
        with pytest.raises(IntegrityError):
            await db_session.commit()
        await db_session.rollback()


class TestProcessConstraints:
    async def test_unique_dgcp_code(self, db_session: AsyncSession):
        proc1 = Process(dgcp_code="P001", title="Proc 1")
        db_session.add(proc1)
        await db_session.commit()

        proc2 = Process(dgcp_code="P001", title="Proc 2")
        db_session.add(proc2)
        with pytest.raises(IntegrityError):
            await db_session.commit()
        await db_session.rollback()


class TestContractConstraints:
    async def test_unique_contract_id_process_id(self, db_session: AsyncSession):
        proc1 = Process(dgcp_code="P001", title="Proc 1")
        db_session.add(proc1)
        await db_session.commit()

        ct1 = Contract(contract_id="CT-001", process_id=proc1.id)
        db_session.add(ct1)
        await db_session.commit()

        ct2 = Contract(contract_id="CT-001", process_id=proc1.id)
        db_session.add(ct2)
        with pytest.raises(IntegrityError):
            await db_session.commit()
        await db_session.rollback()

    async def test_same_contract_different_process_allowed(self, db_session: AsyncSession):
        proc1 = Process(dgcp_code="P001", title="Proc 1")
        proc2 = Process(dgcp_code="P002", title="Proc 2")
        db_session.add_all([proc1, proc2])
        await db_session.commit()

        ct1 = Contract(contract_id="CT-001", process_id=proc1.id)
        ct2 = Contract(contract_id="CT-001", process_id=proc2.id)
        db_session.add_all([ct1, ct2])
        await db_session.commit()

        stmt = select(Contract).where(Contract.contract_id == "CT-001")
        result = await db_session.execute(stmt)
        contracts = result.scalars().all()
        assert len(contracts) == 2



