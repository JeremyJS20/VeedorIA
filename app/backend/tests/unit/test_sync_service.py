from datetime import datetime

from src.services.sync_service import (
    map_contract_from_json,
    parse_date,
)


class TestParseDate:
    def test_none(self):
        assert parse_date(None) is None

    def test_empty_string(self):
        assert parse_date("") is None

    def test_iso_format_with_ms(self):
        result = parse_date("2024-01-15T14:30:00.000Z")
        assert result == datetime(2024, 1, 15, 14, 30, 0)

    def test_iso_format_with_7_digit_fractional(self):
        result = parse_date("2026-06-03T19:57:57.6377488Z")
        assert result == datetime(2026, 6, 3, 19, 57, 57, 637748)

    def test_iso_format_without_ms(self):
        result = parse_date("2024-06-01T10:00:00Z")
        assert result == datetime(2024, 6, 1, 10, 0, 0)

    def test_date_only(self):
        result = parse_date("2024-03-20")
        assert result == datetime(2024, 3, 20)

    def test_unrecognized_format(self):
        assert parse_date("not-a-date") is None



class TestMapContractFromJson:
    def test_full(self):
        raw = {
            "codigo_contrato": "INFOTEP-2026-00806",
            "valor_contratado": 500000.0,
            "razon_social": "Empresa SRL",
            "divisa": "DOP",
            "descripcion": "Consultoría legal",
            "estado_adjudicacion": "Adjudicado",
            "fecha_creacion_contrato": "2026-01-15T00:00:00Z",
            "fecha_adjudicacion": "2026-02-01T00:00:00Z",
            "estado_contrato": "Vigente",
            "rpe": "RPE-001",
        }
        mapped = map_contract_from_json(raw)
        assert mapped["contract_id"] == "INFOTEP-2026-00806"
        assert mapped["amount_adjudicated"] == 500000.0
        assert mapped["supplier_name"] == "Empresa SRL"
        assert mapped["currency"] == "DOP"
        assert mapped["object_description"] == "Consultoría legal"
        assert mapped["adjudication_status"] == "Adjudicado"
        assert mapped["status"] == "Vigente"
        assert mapped["rpe"] == "RPE-001"

    def test_minimal(self):
        raw = {"codigo_contrato": "CT-001"}
        mapped = map_contract_from_json(raw)
        assert mapped["contract_id"] == "CT-001"
        assert mapped["amount_adjudicated"] is None
        assert mapped["supplier_name"] is None

    def test_empty_fields(self):
        raw = {
            "codigo_contrato": "CT-001",
            "razon_social": None,
            "divisa": None,
            "descripcion": None,
            "estado_adjudicacion": None,
            "rpe": None,
        }
        mapped = map_contract_from_json(raw)
        assert mapped["supplier_name"] is None
        assert mapped["currency"] is None
        assert mapped["object_description"] is None

