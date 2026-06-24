### 1. Validación de Entrada Estricta con Pydantic v2

Pydantic v2 analiza y valida las cargas de datos HTTP de forma rápida. Para asegurar consistencia en el dominio y evitar datos corruptos, todos los esquemas heredan de `BaseModel` de Pydantic y declaran reglas estrictas.

---

### 2. Esquemas de Dominio de la Aplicación

#### A. Esquemas de Contratos e Ítems (`src/domain/schemas/contracts.py`)
```python
# src/domain/schemas/contracts.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

class ItemSummary(BaseModel):
    id: str = Field(..., description="ID autogenerado por base de datos")
    description: str = Field(..., min_length=3, description="Descripción del bien o servicio")
    quantity: float = Field(..., gt=0, description="Cantidad adquirida")
    unit_price: float = Field(..., gt=0, description="Costo unitario adjudicado")
    unspsc_code: str = Field(..., pattern=r"^\d{8}$", description="Código UNSPSC de 8 dígitos")

class ContractDetail(BaseModel):
    contract_id: str = Field(..., description="Código oficial del contrato de la DGCP")
    title: str = Field(..., min_length=5, description="Título descriptivo del contrato")
    supplier_rnc: str = Field(..., pattern=r"^\d{9}|\d{11}$", description="RNC de 9 o 11 dígitos")
    supplier_name: str = Field(..., description="Nombre comercial o razón social")
    amount_adjudicated: float = Field(..., gt=0, description="Monto total del contrato")
    date_signed: datetime = Field(..., description="Fecha de firma y formalización")
    items: List[ItemSummary] = Field(default=[], description="Lista de ítems comprados")
```

#### B. Esquemas de Anomalías y ML (`src/domain/schemas/anomalies.py`)
```python
# src/domain/schemas/anomalies.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

class AnomalyCard(BaseModel):
    id: str = Field(..., description="UUID único de la anomalía")
    ocid: str = Field(..., description="Identificador OCDS del proceso de compra")
    anomaly_score: float = Field(..., ge=-1.0, le=1.0, description="Puntaje de anomalía de Isolation Forest")
    red_flags: List[str] = Field(..., description="Lista de códigos de banderas rojas detectadas")
    description: str = Field(..., description="Explicación en lenguaje natural del veredicto")
    date_flagged: datetime
    resolved: bool
    reviewer: Optional[str] = None
    review_notes: Optional[str] = None

class MarkReviewedPayload(BaseModel):
    reviewed_by: str = Field(..., min_length=3, description="Nombre o usuario del auditor")
    audit_notes: str = Field(..., min_length=10, description="Notas de la auditoría manual")
```

---

### 3. Validadores Personalizados Cruzados (Cross-Field Validation)

Pydantic permite validar dependencias complejas entre campos mediante los decoradores `@field_validator` (campo individual) y `@model_validator` (validación cruzada sobre toda la estructura).

```python
# src/domain/schemas/contracts.py (Continuación)
from pydantic import model_validator

class ContractDateValidation(BaseModel):
    date_published: datetime = Field(..., description="Fecha de publicación de la oferta")
    date_signed: datetime = Field(..., description="Fecha de firma del contrato")

    @model_validator(mode="after")
    def validate_date_sequence(self) -> "ContractDateValidation":
        """Garantiza que la fecha de firma del contrato no sea anterior a su publicación."""
        if self.date_signed < self.date_published:
            raise ValueError("La fecha de firma (date_signed) no puede ser anterior a la fecha de publicación.")
        return self
```

Uso en la API:
```python
# Ejemplo de entrada en controlador
@router.post("/contracts/validate-dates")
async def check_dates(payload: ContractDateValidation):
    return {"status": "valido"}
```
