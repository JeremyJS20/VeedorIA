### 1. Estándar de Respuesta HTTP (Envelope Pattern)

Para simplificar el consumo de datos y la gestión de errores en el cliente (React), el backend envuelve todas las respuestas exitosas en un objeto con la clave `data` y las respuestas erróneas en un esquema con la clave `error`.

```python
# src/domain/types.py
from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    """Estructura de respuesta exitosa unificada."""
    success: bool = Field(default=True, description="Operación exitosa")
    data: Optional[T] = Field(default=None, description="Carga de datos")
    message: Optional[str] = Field(default=None, description="Mensaje informativo")

class ValidationErrorDetail(BaseModel):
    """Detalle de validación de un campo."""
    field: str = Field(..., description="Nombre del parámetro o campo JSON")
    issue: str = Field(..., description="Descripción detallada del error")
    type: str = Field(..., description="Tipo interno de error en Pydantic")

class ApiErrorResponse(BaseModel):
    """Estructura de respuesta ante fallos del sistema o validación."""
    success: bool = Field(default=False, description="Operación fallida")
    error: str = Field(..., description="Descripción del error principal")
    details: Optional[List[ValidationErrorDetail]] = Field(
        default=None, 
        description="Lista de errores de campos individuales"
    )
```

---

### 2. Clase de Excepciones del Negocio (`src/utils/exceptions.py`)

Definimos una clase de excepción base `AppError` para manejar errores del negocio (ej. fondos insuficientes, registro duplicado, credenciales inválidas). Esto nos permite lanzar excepciones legibles en la capa de servicios que son atrapadas y estructuradas por un interceptor global.

```python
# src/utils/exceptions.py
class AppError(Exception):
    """Clase base para todas las excepciones controladas del negocio."""
    def __init__(self, message: str, status_code: int = 400, details: Any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details

class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso no encontrado", details: Any = None):
        super().__init__(message, status_code=404, details=details)

class AuthorizationError(AppError):
    def __init__(self, message: str = "No autorizado para realizar esta acción", details: Any = None):
        super().__init__(message, status_code=403, details=details)

class AuthenticationError(AppError):
    def __init__(self, message: str = "Credenciales incorrectas", details: Any = None):
        super().__init__(message, status_code=401, details=details)
```

---

### 3. Registro de Interceptores de Excepciones (`src/presentation/main.py`)

Registramos manejadores globales en FastAPI para interceptar `AppError` y devolver respuestas HTTP estructuradas con el código correspondiente y el formato `ApiErrorResponse`.

```python
# Registro en src/presentation/main.py
from fastapi import Request
from fastapi.responses import JSONResponse
from src.utils.exceptions import AppError
from src.domain.types import ApiErrorResponse

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    """Atrapa errores controlados del negocio y los envía en formato estándar JSON."""
    response_body = ApiErrorResponse(
        success=False,
        error=exc.message,
        details=exc.details
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=response_body.model_dump()
    )
```
