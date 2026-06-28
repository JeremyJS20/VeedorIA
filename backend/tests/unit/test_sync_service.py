from datetime import UTC, datetime

from src.services.sync_service import (
    map_contract_from_json,
    map_item_from_xlsx,
    map_supplier_from_xlsx,
    parse_date,
)


class TestParseDate:
    def test_none(self):
        assert parse_date(None) is None

    def test_empty_string(self):
        assert parse_date("") is None

    def test_iso_format_with_ms(self):
        result = parse_date("2024-01-15T14:30:00.000Z")
        assert result == datetime(2024, 1, 15, 14, 30, 0, tzinfo=UTC)

    def test_iso_format_with_7_digit_fractional(self):
        result = parse_date("2026-06-03T19:57:57.6377488Z")
        assert result == datetime(2026, 6, 3, 19, 57, 57, 637748, tzinfo=UTC)

    def test_iso_format_without_ms(self):
        result = parse_date("2024-06-01T10:00:00Z")
        assert result == datetime(2024, 6, 1, 10, 0, 0, tzinfo=UTC)

    def test_date_only(self):
        result = parse_date("2024-03-20")
        assert result == datetime(2024, 3, 20, tzinfo=UTC)

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


class TestMapItemFromXlsx:
    def test_full(self):
        row = (
            "911-2026-00009",           # CODIGO_CONTRATO
            "911-DAF-CD-2026-0001",     # CODIGO_PROCESO
            "32000000",                  # FAMILIA_UNSPSC
            "32101500",                  # CLASE_UNSPSC
            "32101505",                  # SUBCLASE_UNSPSC (unspsc_code)
            "1-01-01-001",              # CUENTA_PRESUPUESTARIA
            "Laptop HP ProBook 450",    # DESCRIPCION_ARTICULO
            450000.0,                    # COSTO_TOTAL
            "UNIDAD",                    # DESCRIPCION (unit)
            10.0,                        # SEMESTRE (quantity proxy)
            45000.0,                     # PRECIO_UNITARIO
        )
        mapped = map_item_from_xlsx(row)
        assert mapped["contract_code"] == "911-2026-00009"
        assert mapped["process_code"] == "911-DAF-CD-2026-0001"
        assert mapped["unspsc_family"] == "32000000"
        assert mapped["unspsc_class"] == "32101500"
        assert mapped["unspsc_code"] == "32101505"
        assert mapped["budget_account"] == "1-01-01-001"
        assert mapped["description"] == "Laptop HP ProBook 450"
        assert mapped["total_amount"] == 450000.0
        assert mapped["unit"] == "UNIDAD"
        assert mapped["quantity"] == 10.0
        assert mapped["unit_price"] == 45000.0

    def test_partial_row(self):
        row = ("911-2026-00009", "PROC-001", None, None, None, None, "Item description", 1000.0, "UNIDAD", 5.0, None)
        mapped = map_item_from_xlsx(row)
        assert mapped["contract_code"] == "911-2026-00009"
        assert mapped["description"] == "Item description"
        assert mapped["total_amount"] == 1000.0
        assert mapped["unit_price"] is None
        assert mapped["unit"] == "UNIDAD"
        assert mapped["quantity"] == 5.0


class TestMapSupplierFromXlsx:
    def test_full(self):
        row = tuple(range(50))  # Simulates 50-column row
        mapped = map_supplier_from_xlsx(row)
        assert mapped["numero_documento"] == "2"
        assert mapped["nombre"] == "1"
        assert mapped["nombre_comercial"] == "39"
        assert mapped["telefono"] == "32"
        assert mapped["correo_electronico"] == "34"
        assert mapped["direccion"] == "35"

    def test_short_row(self):
        row = (None, "Empresa SRL", "123456789")
        mapped = map_supplier_from_xlsx(row)
        assert mapped["numero_documento"] == "123456789"
        assert mapped["nombre"] == "Empresa SRL"
        assert mapped["nombre_comercial"] is None
        assert mapped["telefono"] is None
