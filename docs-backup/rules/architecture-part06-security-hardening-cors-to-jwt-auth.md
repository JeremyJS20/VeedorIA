### 1. Hash de Contraseñas Seguras (`src/utils/security.py`)

No guardamos contraseñas en texto plano en la base de datos. Utilizamos la librería `bcrypt` de forma directa para realizar hashing irreversible con salado automático, evitando dependencias obsoletas como passlib.

```python
# src/utils/security.py
import bcrypt

def hash_password(password: str) -> str:
    """Genera una firma segura bcrypt a partir de la contraseña."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña provista coincide con el hash almacenado."""
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)
```

---

### 2. Generación y Firma de Tokens JWT (`src/utils/security.py` Continuación)

Utilizamos JSON Web Tokens (JWT) firmados digitalmente con la librería `PyJWT` para autenticar las peticiones del frontend sin almacenar sesiones en memoria.

```python
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import jwt
from src.config import settings

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token JWT firmado digitalmente con fecha de expiración."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt
```

---

### 3. Autenticación de Peticiones y Guardianes de Ruta (Dependencies)

Exponemos un inyector asíncrono para verificar el token JWT enviado en la cabecera `Authorization: Bearer <token>` de la solicitud HTTP. Si el token es inválido o expiró, lanzamos una excepción `AuthenticationError` que la API mapeará a un código HTTP 401.

```python
# src/presentation/dependencies.py (Continuación)
from typing import Annotated, Any
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from src.config import settings
from src.infrastructure.database import get_db
from src.models.auth import User
from src.utils.exceptions import AuthenticationError, AuthorizationError

# Define el endpoint para la extracción del token del header HTTP
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """Verifica la validez del token JWT y retorna la entidad de usuario activa."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise AuthenticationError("Token inválido: falta correo de usuario.")
    except jwt.PyJWTError:
        raise AuthenticationError("Fallo al decodificar token de acceso o expirado.")
        
    statement = select(User).where(User.email == email)
    result = await db.execute(statement)
    user = result.scalar_one_or_none()
    if user is None:
        raise AuthenticationError("Usuario no encontrado en la base de datos.")
    return user

class RoleChecker:
    """Clase validadora para asegurar roles de negocio requeridos (RBAC)."""
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Annotated[User, Depends(get_current_user)]):
        if current_user.role not in self.allowed_roles:
            raise AuthorizationError(
                message=f"Permiso denegado. Se requiere rol: {', '.join(self.allowed_roles)}"
            )
```

Uso de guardián de rol en endpoint:
```python
# Permite restringir el acceso únicamente a administradores o auditores
@router.post("/anomalies/resolve", dependencies=[Depends(RoleChecker(["ADMIN", "AUDITOR"]))])
async def resolve_flag():
    pass
```
