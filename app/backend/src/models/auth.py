from datetime import UTC, datetime
from typing import ClassVar

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(UTC)


class Tenant(SQLModel, table=True):
    __tablename__: ClassVar[str] = "tenant"

    id: int | None = Field(default=None, primary_key=True)
    codigo: str = Field(unique=True, index=True, max_length=40)
    nombre: str = Field(max_length=180)
    tipo: str = Field(default="GOV_INSTITUTION", max_length=30)
    plan_tier: str = Field(default="B2G_BASIC", max_length=30)
    institution_id: int | None = Field(default=None, index=True)
    supplier_rpe: str | None = Field(default=None, max_length=50)
    max_categorias_unspsc: int = Field(default=3)
    estado: str = Field(default="ACTIVO", max_length=15)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, default=_utcnow),
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow),
    )


class Role(SQLModel, table=True):
    __tablename__: ClassVar[str] = "role"

    id: int | None = Field(default=None, primary_key=True)
    codigo: str = Field(unique=True, index=True, max_length=30)
    nombre: str = Field(max_length=100)
    descripcion: str = Field(max_length=255)
    es_sistema: bool = Field(default=True)
    estado: str = Field(default="ACTIVO", max_length=15)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, default=_utcnow),
    )


class Permission(SQLModel, table=True):
    __tablename__: ClassVar[str] = "permission"

    id: int | None = Field(default=None, primary_key=True)
    codigo: str = Field(unique=True, index=True, max_length=50)
    modulo: str = Field(max_length=30, index=True)
    plan_minimo: str = Field(default="ALL", max_length=30)
    descripcion: str = Field(max_length=255)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, default=_utcnow),
    )


class RolePermission(SQLModel, table=True):
    __tablename__: ClassVar[str] = "role_permission"

    role_id: int = Field(foreign_key="role.id", primary_key=True)
    permission_id: int = Field(foreign_key="permission.id", primary_key=True)
    assigned_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, default=_utcnow),
    )


class AppUser(SQLModel, table=True):
    __tablename__: ClassVar[str] = "app_user"

    id: int | None = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenant.id", index=True)
    role_id: int = Field(foreign_key="role.id", index=True)
    nombre: str = Field(max_length=140)
    correo: str = Field(unique=True, index=True, max_length=160)
    password_hash: str = Field(max_length=255)
    cargo: str | None = Field(default=None, max_length=120)
    estado: str = Field(default="ACTIVO", max_length=15)
    intentos_fallidos: int = Field(default=0)
    bloqueado_hasta: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    ultimo_acceso_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, default=_utcnow),
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow),
    )


class PasswordResetToken(SQLModel, table=True):
    __tablename__: ClassVar[str] = "password_reset_token"

    id: int | None = Field(default=None, primary_key=True)
    token_hash: str = Field(unique=True, index=True, max_length=64)
    user_id: int = Field(foreign_key="app_user.id", index=True)
    expira_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    utilizado: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, default=_utcnow),
    )