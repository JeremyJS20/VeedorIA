import hashlib
import logging
import re
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.models.auth import (
    AppUser,
    PasswordResetToken,
    Permission,
    Role,
    RolePermission,
    Tenant,
)
from src.models.contract import Contract
from src.models.institution import Institution
from src.models.supplier import Supplier

logger = logging.getLogger("veedoria.services.auth")

JWT_EXPIRATION_SECONDS = 28800

PLAN_LEVELS: dict[str, int] = {
    "ALL": 0,
    "B2B_PYME": 10,
    "B2B_CORPORATE": 20,
    "B2G_BASIC": 30,
    "B2G_PREMIUM": 40,
    "B2G_ENTERPRISE": 50,
    "PLATFORM_GLOBAL": 100,
}

SAA_PLANS_CATALOG = [
    {
        "codigo": "B2G_BASIC",
        "segmento": "B2G",
        "nombre": "Plan B2G Básico",
        "alcance": "Institucional (1 entidad pública)",
        "capacidades": [
            "Consola institucional acotada a su entidad",
            "Detección de fraccionamiento y concentración de proveedores",
            "Reportes de transparencia institucional",
        ],
    },
    {
        "codigo": "B2G_PREMIUM",
        "segmento": "B2G",
        "nombre": "Plan B2G Premium",
        "alcance": "Institucional + IA Forense",
        "capacidades": [
            "Todo lo del Plan B2G Básico",
            "Detección estadística avanzada de sobreprecios unitarios",
            "Grafos relacionales de colusión (4 señales)",
        ],
    },
    {
        "codigo": "B2G_ENTERPRISE",
        "segmento": "B2G",
        "nombre": "Plan B2G Enterprise",
        "alcance": "Entes Rectores / Ministerios Complejos",
        "capacidades": [
            "Todo lo del Plan B2G Premium",
            "Ejecución bajo demanda de motores de detección",
            "Calibración de umbrales y auditoría en tiempo real",
        ],
    },
    {
        "codigo": "B2B_PYME",
        "segmento": "B2B",
        "nombre": "Plan B2B Pyme",
        "alcance": "Proveedor RPE (hasta 3 categorías UNSPSC)",
        "capacidades": [
            "Seguimiento de hasta 3 categorías UNSPSC",
            "Historial de precios adjudicados de 12 meses",
        ],
    },
    {
        "codigo": "B2B_CORPORATE",
        "segmento": "B2B",
        "nombre": "Plan B2B Corporativo",
        "alcance": "Proveedor RPE (Categorías ilimitadas)",
        "capacidades": [
            "Seguimiento ilimitado de categorías UNSPSC",
            "Benchmarking competitivo de precios y adjudicaciones",
        ],
    },
    {
        "codigo": "PLATFORM_GLOBAL",
        "segmento": "PLATFORM",
        "nombre": "Administración General de Plataforma",
        "alcance": "Alcance Nacional",
        "capacidades": [
            "Administración general de organizaciones suscriptoras, planes, roles y usuarios",
            "Control de sincronización de datos DGCP y calibración de detección",
        ],
    },
]


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except Exception:
        return False


def validate_password_strength(password: str) -> bool:
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True


def _hash_reset_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


PLAN_CLEAN_LABELS: dict[str, str] = {
    "PLATFORM_GLOBAL": "Administración General",
    "B2G_ENTERPRISE": "Plan Institucional Rector",
    "B2G_PREMIUM": "Plan Institucional Avanzado",
    "B2G_BASIC": "Plan Institucional Básico",
    "B2B_CORPORATE": "Plan Proveedor Corporativo",
    "B2B_PYME": "Plan Proveedor Pyme",
}

TENANT_TYPE_LABELS: dict[str, str] = {
    "PLATFORM": "Administración General",
    "GOV_OVERSIGHT": "Órgano Rector",
    "GOV_INSTITUTION": "Institución Pública",
    "B2B_SUPPLIER": "Empresa Proveedora del Estado",
}


def _is_permission_allowed_by_plan(perm_min_plan: str, tenant_plan: str) -> bool:
    if perm_min_plan == "ALL" or tenant_plan == "PLATFORM_GLOBAL":
        return True
    if perm_min_plan.startswith("B2B_"):
        if tenant_plan.startswith("B2B_"):
            return PLAN_LEVELS.get(tenant_plan, 0) >= PLAN_LEVELS.get(perm_min_plan, 0)
        return tenant_plan == "B2G_ENTERPRISE"
    if perm_min_plan.startswith("B2G_"):
        if tenant_plan.startswith("B2G_"):
            return PLAN_LEVELS.get(tenant_plan, 0) >= PLAN_LEVELS.get(perm_min_plan, 0)
        return False
    return PLAN_LEVELS.get(tenant_plan, 0) >= PLAN_LEVELS.get(perm_min_plan, 100)


class AuthDomainError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

async def ensure_auth_seed(db: AsyncSession) -> None:
    clean_roles = {
        "PLATFORM_ADMIN": (
            "Administrador General (NexoDigital)",
            "Administración general de la plataforma, organizaciones suscriptoras, planes y usuarios.",
        ),
        "TENANT_ADMIN": (
            "Administrador Organizacional",
            "Administración de usuarios y supervisión dentro de su propia institución o empresa.",
        ),
        "AUDITOR": (
            "Auditor Institucional",
            "Inspección preventiva de hallazgos, emisión de dictámenes y análisis de procesos.",
        ),
        "PROVEEDOR": (
            "Analista de Licitaciones",
            "Consulta de adjudicaciones, comparativa de precios por rubro y oportunidades.",
        ),
    }
    clean_perms = {
        "ANOMALY_READ": "Visualizar bandeja de hallazgos y métricas de auditoría",
        "FRAGMENTATION_VIEW": "Analizar alertas de fraccionamiento y línea de tiempo institucional",
        "PRICE_AI_VIEW": "Inspeccionar análisis estadístico de sobreprecios unitarios",
        "COLLUSION_VIEW": "Explorar grafos relacionales de colusión entre oferentes",
        "ANOMALY_REVIEW": "Emitir dictámenes de confirmación o descarte motivado",
        "PROCESS_READ": "Consultar expedientes de contratación, contratos e ítems adjudicados",
        "DETECTION_RUN": "Disparar corrida manual de los 4 motores de detección",
        "AI_CALIBRATE": "Calibrar umbrales de precisión del motor estadístico",
        "SYNC_TRIGGER": "Ejecutar sincronización de datos con el portal de la DGCP",
        "B2B_ANALYTICS": "Acceder a inteligencia de precios por rubro e historial de proveedor",
        "USER_ADMIN": "Gestionar cuentas de usuarios, bloqueos y enlaces de recuperación",
        "TENANT_MANAGE": "Registrar organizaciones suscriptoras y administrar planes de servicio",
        "ROLE_VIEW": "Consultar catálogo de roles, permisos y matriz de planes de servicio",
    }

    existing_roles = (await db.execute(select(func.count(Role.id)))).scalar() or 0
    if existing_roles > 0:
        db_roles = (await db.execute(select(Role))).scalars().all()
        changed = False
        for r in db_roles:
            if r.codigo in clean_roles:
                new_name, new_desc = clean_roles[r.codigo]
                if r.nombre != new_name or r.descripcion != new_desc:
                    r.nombre = new_name
                    r.descripcion = new_desc
                    changed = True
        db_perms = (await db.execute(select(Permission))).scalars().all()
        for p in db_perms:
            if p.codigo in clean_perms and p.descripcion != clean_perms[p.codigo]:
                p.descripcion = clean_perms[p.codigo]
                changed = True
        ta_role = next((r for r in db_roles if r.codigo == "TENANT_ADMIN"), None)
        b2b_perm = next((p for p in db_perms if p.codigo == "B2B_ANALYTICS"), None)
        if ta_role and b2b_perm and ta_role.id and b2b_perm.id:
            existing_rp = (
                await db.execute(
                    select(RolePermission).where(
                        RolePermission.role_id == ta_role.id,
                        RolePermission.permission_id == b2b_perm.id,
                    )
                )
            ).scalar_one_or_none()
            if not existing_rp:
                db.add(RolePermission(role_id=ta_role.id, permission_id=b2b_perm.id))
                changed = True
        role_view_perm = next((p for p in db_perms if p.codigo == "ROLE_VIEW"), None)
        if role_view_perm and role_view_perm.plan_minimo != "PLATFORM_GLOBAL":
            role_view_perm.plan_minimo = "PLATFORM_GLOBAL"
            changed = True
        non_admin_role_ids = [
            r.id for r in db_roles if r.codigo in ("TENANT_ADMIN", "AUDITOR", "PROVEEDOR") and r.id is not None
        ]
        if role_view_perm and role_view_perm.id and non_admin_role_ids:
            stale_rps = (
                await db.execute(
                    select(RolePermission).where(
                        RolePermission.permission_id == role_view_perm.id,
                        RolePermission.role_id.in_(non_admin_role_ids),
                    )
                )
            ).scalars().all()
            for srp in stale_rps:
                await db.delete(srp)
                changed = True
        if changed:
            await db.commit()
        return

    logger.info("Seeding Multi-Tenant RBAC tables (roles, permissions, tenants, users)...")

    roles_data = [
        Role(
            codigo="PLATFORM_ADMIN",
            nombre="Administrador Global (NexoDigital)",
            descripcion="Gobierno general de la plataforma, organizaciones suscriptoras, planes y usuarios.",
            es_sistema=True,
            estado="ACTIVO",
        ),
        Role(
            codigo="TENANT_ADMIN",
            nombre="Administrador Organizacional",
            descripcion="Administración de usuarios y auditoría dentro de su propia institución o empresa.",
            es_sistema=True,
            estado="ACTIVO",
        ),
        Role(
            codigo="AUDITOR",
            nombre="Auditor Institucional",
            descripcion="Inspección forense de hallazgos, emisión de dictámenes y análisis de procesos.",
            es_sistema=True,
            estado="ACTIVO",
        ),
        Role(
            codigo="PROVEEDOR",
            nombre="Analista de Licitaciones",
            descripcion="Consulta de adjudicaciones, benchmarking de precios UNSPSC y oportunidades.",
            es_sistema=True,
            estado="ACTIVO",
        ),
    ]
    for r in roles_data:
        db.add(r)
    await db.flush()

    roles_by_code = {r.codigo: r for r in roles_data}

    perms_data = [
        Permission(codigo="ANOMALY_READ", modulo="AUDITORIA", plan_minimo="ALL", descripcion="Visualizar bandeja de hallazgos y métricas de auditoría"),
        Permission(codigo="FRAGMENTATION_VIEW", modulo="AUDITORIA", plan_minimo="B2G_BASIC", descripcion="Analizar alertas de fraccionamiento y línea de tiempo institucional"),
        Permission(codigo="PRICE_AI_VIEW", modulo="AUDITORIA", plan_minimo="B2G_PREMIUM", descripcion="Inspeccionar análisis estadístico de sobreprecios unitarios"),
        Permission(codigo="COLLUSION_VIEW", modulo="AUDITORIA", plan_minimo="B2G_PREMIUM", descripcion="Explorar grafos relacionales de colusión entre oferentes"),
        Permission(codigo="ANOMALY_REVIEW", modulo="AUDITORIA", plan_minimo="B2G_BASIC", descripcion="Emitir dictámenes de confirmación o descarte motivado"),
        Permission(codigo="PROCESS_READ", modulo="PROCESOS", plan_minimo="ALL", descripcion="Consultar expedientes de contratación, contratos e ítems adjudicados"),
        Permission(codigo="DETECTION_RUN", modulo="DETECCION", plan_minimo="B2G_ENTERPRISE", descripcion="Disparar corrida manual de los 4 motores de detección"),
        Permission(codigo="AI_CALIBRATE", modulo="DETECCION", plan_minimo="B2G_ENTERPRISE", descripcion="Calibrar umbrales de precisión del motor híbrido"),
        Permission(codigo="SYNC_TRIGGER", modulo="PROCESOS", plan_minimo="PLATFORM_GLOBAL", descripcion="Ejecutar sincronización de datos con el portal de la DGCP"),
        Permission(codigo="B2B_ANALYTICS", modulo="PROVEEDORES", plan_minimo="B2B_PYME", descripcion="Acceder a inteligencia de precios UNSPSC e historial de proveedor"),
        Permission(codigo="USER_ADMIN", modulo="SEGURIDAD", plan_minimo="ALL", descripcion="Gestionar cuentas de usuarios, bloqueos y enlaces de recuperación"),
        Permission(codigo="TENANT_MANAGE", modulo="SEGURIDAD", plan_minimo="PLATFORM_GLOBAL", descripcion="Registrar organizaciones suscriptoras y administrar planes de servicio"),
        Permission(codigo="ROLE_VIEW", modulo="SEGURIDAD", plan_minimo="ALL", descripcion="Consultar catálogo de roles, permisos y matriz de planes de servicio"),
    ]
    for p in perms_data:
        db.add(p)
    await db.flush()

    perms_by_code = {p.codigo: p for p in perms_data}

    role_perm_mapping: dict[str, list[str]] = {
        "PLATFORM_ADMIN": list(perms_by_code.keys()),
        "TENANT_ADMIN": [
            "ANOMALY_READ",
            "FRAGMENTATION_VIEW",
            "PRICE_AI_VIEW",
            "COLLUSION_VIEW",
            "ANOMALY_REVIEW",
            "PROCESS_READ",
            "DETECTION_RUN",
            "B2B_ANALYTICS",
            "USER_ADMIN",
        ],
        "AUDITOR": [
            "ANOMALY_READ",
            "FRAGMENTATION_VIEW",
            "PRICE_AI_VIEW",
            "COLLUSION_VIEW",
            "ANOMALY_REVIEW",
            "PROCESS_READ",
            "DETECTION_RUN",
        ],
        "PROVEEDOR": [
            "ANOMALY_READ",
            "PROCESS_READ",
            "B2B_ANALYTICS",
        ],
    }

    for r_code, p_codes in role_perm_mapping.items():
        role_obj = roles_by_code[r_code]
        for p_code in p_codes:
            perm_obj = perms_by_code[p_code]
            if role_obj.id is not None and perm_obj.id is not None:
                db.add(RolePermission(role_id=role_obj.id, permission_id=perm_obj.id))

    mopc_row = (
        await db.execute(
            select(Institution.id).where(Institution.name.ilike("%Obras P%")).limit(1)
        )
    ).first()
    minerd_row = (
        await db.execute(
            select(Institution.id).where(Institution.name.ilike("%Ministerio de Educaci%")).limit(1)
        )
    ).first()

    mopc_id = int(mopc_row[0]) if mopc_row else 5
    minerd_id = int(minerd_row[0]) if minerd_row else 88

    tenants_data = [
        Tenant(
            codigo="NEXODIGITAL",
            nombre="NexoDigital Solutions, S.R.L. (Administración Global)",
            tipo="PLATFORM",
            plan_tier="PLATFORM_GLOBAL",
            institution_id=None,
            supplier_rpe=None,
            max_categorias_unspsc=9999,
            estado="ACTIVO",
        ),
        Tenant(
            codigo="DGCP-OVERSIGHT",
            nombre="Dirección General de Contrataciones Públicas (DGCP)",
            tipo="GOV_OVERSIGHT",
            plan_tier="B2G_ENTERPRISE",
            institution_id=None,
            supplier_rpe=None,
            max_categorias_unspsc=9999,
            estado="ACTIVO",
        ),
        Tenant(
            codigo="MOPC-B2G",
            nombre="Ministerio de Obras Públicas y Comunicaciones (MOPC)",
            tipo="GOV_INSTITUTION",
            plan_tier="B2G_PREMIUM",
            institution_id=mopc_id,
            supplier_rpe=None,
            max_categorias_unspsc=9999,
            estado="ACTIVO",
        ),
        Tenant(
            codigo="MINERD-B2G",
            nombre="Ministerio de Educación (MINERD)",
            tipo="GOV_INSTITUTION",
            plan_tier="B2G_BASIC",
            institution_id=minerd_id,
            supplier_rpe=None,
            max_categorias_unspsc=9999,
            estado="ACTIVO",
        ),
        Tenant(
            codigo="CONSTRUCTORA-B2B",
            nombre="Constructora & Suministros del Caribe, S.R.L.",
            tipo="B2B_SUPPLIER",
            plan_tier="B2B_CORPORATE",
            institution_id=None,
            supplier_rpe="132993",
            max_categorias_unspsc=9999,
            estado="ACTIVO",
        ),
    ]
    for t in tenants_data:
        db.add(t)
    await db.flush()

    tenants_by_code = {t.codigo: t for t in tenants_data}
    default_pw_hash = hash_password("VeedorIA2026!")

    seed_users = [
        AppUser(
            tenant_id=tenants_by_code["NEXODIGITAL"].id or 1,
            role_id=roles_by_code["PLATFORM_ADMIN"].id or 1,
            nombre="Jeremy Michel Solano Frías",
            correo="admin@veedoria.gob.do",
            password_hash=default_pw_hash,
            cargo="Presidente / CEO · NexoDigital",
            estado="ACTIVO",
        ),
        AppUser(
            tenant_id=tenants_by_code["DGCP-OVERSIGHT"].id or 2,
            role_id=roles_by_code["AUDITOR"].id or 3,
            nombre="Carlos Mendizábal",
            correo="auditor@dgcp.gob.do",
            password_hash=default_pw_hash,
            cargo="Auditor Forense Nacional · DGCP",
            estado="ACTIVO",
        ),
        AppUser(
            tenant_id=tenants_by_code["MOPC-B2G"].id or 3,
            role_id=roles_by_code["AUDITOR"].id or 3,
            nombre="Ing. Roberto Méndez",
            correo="auditor@mopc.gob.do",
            password_hash=default_pw_hash,
            cargo="Auditor Interno de Compras · MOPC",
            estado="ACTIVO",
        ),
        AppUser(
            tenant_id=tenants_by_code["MOPC-B2G"].id or 3,
            role_id=roles_by_code["TENANT_ADMIN"].id or 2,
            nombre="Lic. Laura Castellanos",
            correo="admin@mopc.gob.do",
            password_hash=default_pw_hash,
            cargo="Directora de Cumplimiento · MOPC",
            estado="ACTIVO",
        ),
        AppUser(
            tenant_id=tenants_by_code["MINERD-B2G"].id or 4,
            role_id=roles_by_code["AUDITOR"].id or 3,
            nombre="Lic. Patricia Gómez",
            correo="auditor@minerd.gob.do",
            password_hash=default_pw_hash,
            cargo="Analista de Control Preventivo · MINERD",
            estado="ACTIVO",
        ),
        AppUser(
            tenant_id=tenants_by_code["CONSTRUCTORA-B2B"].id or 5,
            role_id=roles_by_code["PROVEEDOR"].id or 4,
            nombre="Ing. Héctor Valenzuela",
            correo="proveedor@constructora.do",
            password_hash=default_pw_hash,
            cargo="Gerente de Licitaciones · RPE 132993",
            estado="ACTIVO",
        ),
    ]
    for u in seed_users:
        db.add(u)

    await db.commit()
    logger.info("Multi-Tenant RBAC seed completed (5 tenants, 4 roles, 6 users).")

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _build_user_payload(self, user: AppUser, role: Role, tenant: Tenant) -> dict:
        stmt = (
            select(Permission.codigo, Permission.plan_minimo)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role.id)
        )
        rows = (await self.db.execute(stmt)).all()
        effective_perms = [
            r.codigo
            for r in rows
            if _is_permission_allowed_by_plan(r.plan_minimo, tenant.plan_tier)
        ]
        role_perms_all = [r.codigo for r in rows]

        now = datetime.now(UTC)
        is_locked = bool(
            user.bloqueado_hasta
            and (
                user.bloqueado_hasta.replace(tzinfo=UTC)
                if user.bloqueado_hasta.tzinfo is None
                else user.bloqueado_hasta
            )
            > now
        )

        return {
            "id": user.id,
            "nombre": user.nombre,
            "correo": user.correo,
            "cargo": user.cargo or role.nombre,
            "estado": user.estado,
            "intentos_fallidos": user.intentos_fallidos,
            "bloqueado": is_locked,
            "bloqueado_hasta": user.bloqueado_hasta.isoformat() if user.bloqueado_hasta else None,
            "ultimo_acceso_at": user.ultimo_acceso_at.isoformat() if user.ultimo_acceso_at else None,
            "rol": {
                "id": role.id,
                "codigo": role.codigo,
                "nombre": role.nombre,
                "descripcion": role.descripcion,
            },
            "tenant": {
                "id": tenant.id,
                "codigo": tenant.codigo,
                "nombre": tenant.nombre,
                "tipo": tenant.tipo,
                "plan_tier": tenant.plan_tier,
                "institution_id": tenant.institution_id,
                "supplier_rpe": tenant.supplier_rpe,
                "max_categorias_unspsc": tenant.max_categorias_unspsc,
                "estado": tenant.estado,
            },
            "permisos": effective_perms,
            "permisos_rol": role_perms_all,
        }

    def _encode_jwt(self, user_payload: dict) -> str:
        now = datetime.now(UTC)
        exp = now + timedelta(seconds=JWT_EXPIRATION_SECONDS)
        claims = {
            "sub": str(user_payload["id"]),
            "email": user_payload["correo"],
            "rol": user_payload["rol"]["codigo"],
            "tenant_id": user_payload["tenant"]["id"],
            "tenant_type": user_payload["tenant"]["tipo"],
            "plan_tier": user_payload["tenant"]["plan_tier"],
            "institution_id": user_payload["tenant"]["institution_id"],
            "supplier_rpe": user_payload["tenant"]["supplier_rpe"],
            "permisos": user_payload["permisos"],
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
        }
        return jwt.encode(claims, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    async def login(self, correo: str, password: str) -> dict:
        email_clean = correo.strip().lower()
        stmt = (
            select(AppUser, Role, Tenant)
            .join(Role, AppUser.role_id == Role.id)
            .join(Tenant, AppUser.tenant_id == Tenant.id)
            .where(func.lower(AppUser.correo) == email_clean)
        )
        row = (await self.db.execute(stmt)).first()
        if not row:
            raise AuthDomainError(
                "INVALID_CREDENTIALS",
                "Correo institucional o contraseña incorrectos.",
                status_code=401,
            )

        user, role, tenant = row
        now = datetime.now(UTC)

        if user.bloqueado_hasta is not None:
            lock_until = (
                user.bloqueado_hasta.replace(tzinfo=UTC)
                if user.bloqueado_hasta.tzinfo is None
                else user.bloqueado_hasta
            )
            if lock_until > now:
                raise AuthDomainError(
                    "ACCOUNT_LOCKED",
                    "Cuenta bloqueada temporalmente por 15 minutos debido a 5 intentos fallidos consecutivos.",
                    status_code=429,
                )
            else:
                user.intentos_fallidos = 0
                user.bloqueado_hasta = None

        if not verify_password(password, user.password_hash):
            user.intentos_fallidos = (user.intentos_fallidos or 0) + 1
            user.updated_at = now
            if user.intentos_fallidos >= 5:
                user.bloqueado_hasta = now + timedelta(minutes=15)
                await self.db.commit()
                raise AuthDomainError(
                    "ACCOUNT_LOCKED",
                    "Cuenta bloqueada temporalmente por 15 minutos debido a 5 intentos fallidos consecutivos.",
                    status_code=429,
                )
            await self.db.commit()
            raise AuthDomainError(
                "INVALID_CREDENTIALS",
                "Correo institucional o contraseña incorrectos.",
                status_code=401,
            )

        if user.estado != "ACTIVO" or role.estado != "ACTIVO" or tenant.estado != "ACTIVO":
            raise AuthDomainError(
                "USER_OR_TENANT_INACTIVE",
                "Su cuenta institucional o la suscripción de su organización se encuentra inactiva. Contacte al administrador.",
                status_code=403,
            )

        user.intentos_fallidos = 0
        user.bloqueado_hasta = None
        user.ultimo_acceso_at = now
        user.updated_at = now
        await self.db.commit()
        await self.db.refresh(user)

        user_payload = await self._build_user_payload(user, role, tenant)
        access_token = self._encode_jwt(user_payload)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": JWT_EXPIRATION_SECONDS,
            "user": user_payload,
        }

    async def get_user_from_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm],
            )
            user_id = int(payload["sub"])
        except Exception as exc:
            raise AuthDomainError(
                "UNAUTHORIZED",
                "Sesión inválida o expirada. Inicie sesión nuevamente.",
                status_code=401,
            ) from exc

        stmt = (
            select(AppUser, Role, Tenant)
            .join(Role, AppUser.role_id == Role.id)
            .join(Tenant, AppUser.tenant_id == Tenant.id)
            .where(AppUser.id == user_id)
        )
        row = (await self.db.execute(stmt)).first()
        if not row:
            raise AuthDomainError(
                "UNAUTHORIZED",
                "Usuario no encontrado.",
                status_code=401,
            )

        user, role, tenant = row
        if user.estado != "ACTIVO" or tenant.estado != "ACTIVO":
            raise AuthDomainError(
                "USER_OR_TENANT_INACTIVE",
                "Su cuenta o la suscripción de su organización ha sido desactivada.",
                status_code=403,
            )

        return await self._build_user_payload(user, role, tenant)

    async def request_password_reset(self, correo: str) -> dict:
        email_clean = correo.strip().lower()
        neutral_msg = "Si el correo ingresado coincide con una cuenta activa, recibirá un enlace para restablecer su contraseña en breve."
        stmt = select(AppUser).where(func.lower(AppUser.correo) == email_clean)
        user = (await self.db.execute(stmt)).scalar_one_or_none()

        if not user or user.estado != "ACTIVO":
            return {"message": neutral_msg, "reset_url_preview": None}

        now = datetime.now(UTC)
        recent_stmt = (
            select(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.utilizado == False,  # noqa: E712
            )
            .order_by(desc(PasswordResetToken.created_at))
            .limit(1)
        )
        recent_tok = (await self.db.execute(recent_stmt)).scalar_one_or_none()
        if recent_tok and recent_tok.created_at:
            created_utc = (
                recent_tok.created_at.replace(tzinfo=UTC)
                if recent_tok.created_at.tzinfo is None
                else recent_tok.created_at
            )
            if (now - created_utc).total_seconds() < 120:
                raise AuthDomainError(
                    "RATE_LIMIT_EXCEEDED",
                    "Ya se emitió un enlace recientemente. Espere 2 minutos antes de solicitar otro.",
                    status_code=429,
                )

        raw_token = secrets.token_hex(32)
        token_hash = _hash_reset_token(raw_token)
        reset_record = PasswordResetToken(
            token_hash=token_hash,
            user_id=user.id or 0,
            expira_at=now + timedelta(minutes=15),
            utilizado=False,
        )
        self.db.add(reset_record)
        await self.db.commit()

        reset_url = f"/restablecer-contrasena?token={raw_token}"
        logger.info("Password reset link generated for %s -> %s", user.correo, reset_url)
        return {
            "message": neutral_msg,
            "reset_url_preview": reset_url,
        }

    async def reset_password(self, raw_token: str, nueva_password: str, confirmar_password: str) -> dict:
        if nueva_password != confirmar_password:
            raise AuthDomainError(
                "PASSWORD_MISMATCH",
                "La nueva contraseña y su confirmación no coinciden.",
                status_code=422,
            )
        if not validate_password_strength(nueva_password):
            raise AuthDomainError(
                "PASSWORD_POLICY_VIOLATION",
                "La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula y al menos un número.",
                status_code=422,
            )

        token_hash = _hash_reset_token(raw_token.strip())
        stmt = select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        reset_rec = (await self.db.execute(stmt)).scalar_one_or_none()
        now = datetime.now(UTC)

        if not reset_rec or reset_rec.utilizado:
            raise AuthDomainError(
                "INVALID_OR_EXPIRED_RESET_TOKEN",
                "El enlace de recuperación es inválido o ya fue utilizado. Solicite un nuevo enlace.",
                status_code=400,
            )

        exp_utc = (
            reset_rec.expira_at.replace(tzinfo=UTC)
            if reset_rec.expira_at.tzinfo is None
            else reset_rec.expira_at
        )
        if now > exp_utc:
            raise AuthDomainError(
                "INVALID_OR_EXPIRED_RESET_TOKEN",
                "El enlace de recuperación ha expirado (validez máxima de 15 minutos). Solicite un nuevo enlace.",
                status_code=400,
            )

        user_stmt = select(AppUser).where(AppUser.id == reset_rec.user_id)
        user = (await self.db.execute(user_stmt)).scalar_one_or_none()
        if not user:
            raise AuthDomainError(
                "INVALID_OR_EXPIRED_RESET_TOKEN",
                "Usuario asociado no encontrado.",
                status_code=400,
            )

        user.password_hash = hash_password(nueva_password)
        user.intentos_fallidos = 0
        user.bloqueado_hasta = None
        user.updated_at = now
        reset_rec.utilizado = True
        await self.db.commit()

        return {
            "success": True,
            "message": "Contraseña restablecida exitosamente. Ya puede iniciar sesión con su nueva clave.",
        }

    async def change_password(
        self,
        user_id: int,
        password_actual: str,
        nueva_password: str,
        confirmar_password: str,
    ) -> dict:
        stmt = select(AppUser).where(AppUser.id == user_id)
        user = (await self.db.execute(stmt)).scalar_one_or_none()
        if not user:
            raise AuthDomainError("UNAUTHORIZED", "Usuario no encontrado.", status_code=401)

        if not verify_password(password_actual, user.password_hash):
            raise AuthDomainError(
                "CURRENT_PASSWORD_INCORRECT",
                "La contraseña actual ingresada no es correcta.",
                status_code=400,
            )

        if nueva_password != confirmar_password:
            raise AuthDomainError(
                "NEW_PASSWORD_INVALID",
                "La nueva contraseña y su confirmación no coinciden.",
                status_code=422,
            )

        if not validate_password_strength(nueva_password):
            raise AuthDomainError(
                "NEW_PASSWORD_INVALID",
                "La nueva contraseña debe tener mínimo 8 caracteres, al menos una mayúscula y un número.",
                status_code=422,
            )

        if verify_password(nueva_password, user.password_hash):
            raise AuthDomainError(
                "NEW_PASSWORD_INVALID",
                "La nueva contraseña debe ser diferente a la contraseña actual.",
                status_code=422,
            )

        user.password_hash = hash_password(nueva_password)
        user.updated_at = datetime.now(UTC)
        await self.db.commit()

        return {
            "success": True,
            "message": "Contraseña actualizada exitosamente.",
        }
    async def list_users(self, current_user: dict) -> list[dict]:
        stmt = (
            select(AppUser, Role, Tenant)
            .join(Role, AppUser.role_id == Role.id)
            .join(Tenant, AppUser.tenant_id == Tenant.id)
            .order_by(AppUser.id)
        )
        if current_user["rol"]["codigo"] != "PLATFORM_ADMIN":
            stmt = stmt.where(AppUser.tenant_id == current_user["tenant"]["id"])

        rows = (await self.db.execute(stmt)).all()
        result = []
        for u, r, t in rows:
            result.append(await self._build_user_payload(u, r, t))
        return result

    async def create_user(self, current_user: dict, data: dict) -> dict:
        correo = str(data.get("correo", "")).strip().lower()
        nombre = str(data.get("nombre", "")).strip()
        password = str(data.get("password", ""))
        cargo = data.get("cargo")
        role_id = int(data.get("role_id", 0))
        tenant_id = int(data.get("tenant_id") or current_user["tenant"]["id"])

        if current_user["rol"]["codigo"] != "PLATFORM_ADMIN":
            if tenant_id != current_user["tenant"]["id"]:
                raise AuthDomainError(
                    "CROSS_TENANT_FORBIDDEN",
                    "Solo puede registrar usuarios dentro de su propia organización (Tenant).",
                    status_code=403,
                )

        if not correo or not nombre:
            raise AuthDomainError("VALIDATION_ERROR", "Nombre y correo institucional son obligatorios.", status_code=422)

        if not validate_password_strength(password):
            raise AuthDomainError(
                "WEAK_PASSWORD",
                "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.",
                status_code=422,
            )

        dup = (
            await self.db.execute(select(AppUser).where(func.lower(AppUser.correo) == correo))
        ).scalar_one_or_none()
        if dup:
            raise AuthDomainError(
                "USER_DUPLICATE_EMAIL",
                "El correo institucional ya se encuentra registrado por otro usuario.",
                status_code=409,
            )

        role = (await self.db.execute(select(Role).where(Role.id == role_id))).scalar_one_or_none()
        if not role or role.estado != "ACTIVO":
            raise AuthDomainError("ROLE_NOT_FOUND", "El rol seleccionado no existe o está inactivo.", status_code=404)

        if current_user["rol"]["codigo"] != "PLATFORM_ADMIN" and role.codigo == "PLATFORM_ADMIN":
            raise AuthDomainError(
                "FORBIDDEN_ROLE_ASSIGNMENT",
                "No tiene privilegios para asignar el rol de Administrador Global.",
                status_code=403,
            )

        tenant = (await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
        if not tenant:
            raise AuthDomainError("TENANT_NOT_FOUND", "La organización seleccionada no existe.", status_code=404)

        new_user = AppUser(
            tenant_id=tenant.id or tenant_id,
            role_id=role.id or role_id,
            nombre=nombre,
            correo=correo,
            password_hash=hash_password(password),
            cargo=cargo,
            estado="ACTIVO",
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)

        return await self._build_user_payload(new_user, role, tenant)

    async def update_user(self, current_user: dict, target_user_id: int, data: dict) -> dict:
        stmt = select(AppUser).where(AppUser.id == target_user_id)
        user = (await self.db.execute(stmt)).scalar_one_or_none()
        if not user:
            raise AuthDomainError("USER_NOT_FOUND", "Usuario no encontrado.", status_code=404)

        if current_user["rol"]["codigo"] != "PLATFORM_ADMIN" and user.tenant_id != current_user["tenant"]["id"]:
            raise AuthDomainError(
                "CROSS_TENANT_FORBIDDEN",
                "No puede modificar usuarios pertenecientes a otra organización.",
                status_code=403,
            )

        if user.id == current_user["id"]:
            new_estado = data.get("estado")
            new_role_id = data.get("role_id")
            if new_estado and new_estado != "ACTIVO":
                raise AuthDomainError(
                    "CANNOT_DEACTIVATE_SELF_ADMIN",
                    "No puede desactivar su propia cuenta de administrador.",
                    status_code=400,
                )
            if new_role_id and int(new_role_id) != user.role_id:
                raise AuthDomainError(
                    "CANNOT_DEACTIVATE_SELF_ADMIN",
                    "No puede degradar su propio rol administrativo.",
                    status_code=400,
                )

        if "nombre" in data and data["nombre"]:
            user.nombre = str(data["nombre"]).strip()
        if "cargo" in data:
            user.cargo = data["cargo"]
        if "estado" in data and data["estado"] in ("ACTIVO", "INACTIVO"):
            user.estado = data["estado"]
        if "role_id" in data and data["role_id"]:
            user.role_id = int(data["role_id"])
        if "tenant_id" in data and data["tenant_id"] and current_user["rol"]["codigo"] == "PLATFORM_ADMIN":
            user.tenant_id = int(data["tenant_id"])

        user.updated_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(user)

        role = (await self.db.execute(select(Role).where(Role.id == user.role_id))).scalar_one()
        tenant = (await self.db.execute(select(Tenant).where(Tenant.id == user.tenant_id))).scalar_one()
        return await self._build_user_payload(user, role, tenant)

    async def unlock_user(self, current_user: dict, target_user_id: int) -> dict:
        user = (await self.db.execute(select(AppUser).where(AppUser.id == target_user_id))).scalar_one_or_none()
        if not user:
            raise AuthDomainError("USER_NOT_FOUND", "Usuario no encontrado.", status_code=404)

        if current_user["rol"]["codigo"] != "PLATFORM_ADMIN" and user.tenant_id != current_user["tenant"]["id"]:
            raise AuthDomainError("CROSS_TENANT_FORBIDDEN", "Acceso denegado a otro tenant.", status_code=403)

        user.intentos_fallidos = 0
        user.bloqueado_hasta = None
        user.updated_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(user)

        role = (await self.db.execute(select(Role).where(Role.id == user.role_id))).scalar_one()
        tenant = (await self.db.execute(select(Tenant).where(Tenant.id == user.tenant_id))).scalar_one()
        return await self._build_user_payload(user, role, tenant)

    async def generate_manual_reset_link(self, current_user: dict, target_user_id: int) -> dict:
        user = (await self.db.execute(select(AppUser).where(AppUser.id == target_user_id))).scalar_one_or_none()
        if not user:
            raise AuthDomainError("USER_NOT_FOUND", "Usuario no encontrado.", status_code=404)

        if current_user["rol"]["codigo"] != "PLATFORM_ADMIN" and user.tenant_id != current_user["tenant"]["id"]:
            raise AuthDomainError("CROSS_TENANT_FORBIDDEN", "Acceso denegado a otro tenant.", status_code=403)

        raw_token = secrets.token_hex(32)
        token_hash = _hash_reset_token(raw_token)
        now = datetime.now(UTC)
        reset_rec = PasswordResetToken(
            token_hash=token_hash,
            user_id=user.id or target_user_id,
            expira_at=now + timedelta(minutes=15),
            utilizado=False,
        )
        self.db.add(reset_rec)
        await self.db.commit()

        return {
            "user_id": user.id,
            "correo": user.correo,
            "reset_url": f"/restablecer-contrasena?token={raw_token}",
            "expira_en_minutos": 15,
        }

    async def list_tenants(self, current_user: dict) -> list[dict]:
        stmt = select(Tenant).order_by(Tenant.id)
        if current_user["rol"]["codigo"] != "PLATFORM_ADMIN":
            stmt = stmt.where(Tenant.id == current_user["tenant"]["id"])
        tenants = (await self.db.execute(stmt)).scalars().all()

        counts_stmt = select(AppUser.tenant_id, func.count(AppUser.id)).group_by(AppUser.tenant_id)
        counts_map = {r[0]: int(r[1]) for r in (await self.db.execute(counts_stmt)).all()}

        return [
            {
                "id": t.id,
                "codigo": t.codigo,
                "nombre": t.nombre,
                "tipo": t.tipo,
                "plan_tier": t.plan_tier,
                "institution_id": t.institution_id,
                "supplier_rpe": t.supplier_rpe,
                "max_categorias_unspsc": t.max_categorias_unspsc,
                "estado": t.estado,
                "usuarios_count": counts_map.get(t.id or 0, 0),
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tenants
        ]

    async def search_directory(self, tipo: str, q: str = "") -> list[dict]:
        query_str = (q or "").strip()
        if tipo in ("GOV_INSTITUTION", "GOV_OVERSIGHT"):
            stmt = select(Institution.id, Institution.dgcp_id, Institution.name)
            if query_str:
                stmt = stmt.where(Institution.name.ilike(f"%{query_str}%"))
            stmt = stmt.order_by(Institution.name.asc()).limit(10)
            rows = (await self.db.execute(stmt)).all()
            return [
                {
                    "key": f"inst-{r.id}",
                    "nombre": r.name,
                    "identificador": f"Unidad de Compra #{r.dgcp_id}",
                    "institution_id": r.id,
                    "supplier_rpe": None,
                }
                for r in rows
            ]
        else:
            stmt = (
                select(Contract.rpe, func.max(Contract.supplier_name).label("supplier_name"))
                .where(Contract.rpe.is_not(None), Contract.supplier_name.is_not(None))
            )
            if query_str:
                stmt = stmt.where(
                    (Contract.supplier_name.ilike(f"%{query_str}%"))
                    | (Contract.rpe.ilike(f"%{query_str}%"))
                )
            stmt = stmt.group_by(Contract.rpe).order_by(func.max(Contract.supplier_name).asc()).limit(10)
            rows = (await self.db.execute(stmt)).all()
            results = [
                {
                    "key": f"sup-{r.rpe}",
                    "nombre": r.supplier_name,
                    "identificador": f"RPE #{r.rpe}",
                    "institution_id": None,
                    "supplier_rpe": str(r.rpe),
                }
                for r in rows
                if r.rpe and r.supplier_name
            ]
            if len(results) < 6:
                s_stmt = select(Supplier.rnc, Supplier.registered_name).where(
                    Supplier.registered_name.is_not(None)
                )
                if query_str:
                    s_stmt = s_stmt.where(
                        (Supplier.registered_name.ilike(f"%{query_str}%"))
                        | (Supplier.rnc.ilike(f"%{query_str}%"))
                    )
                s_stmt = s_stmt.order_by(Supplier.registered_name.asc()).limit(6)
                s_rows = (await self.db.execute(s_stmt)).all()
                seen_names = {item["nombre"].upper() for item in results}
                for sr in s_rows:
                    if sr.registered_name and sr.registered_name.upper() not in seen_names:
                        results.append(
                            {
                                "key": f"rnc-{sr.rnc}",
                                "nombre": sr.registered_name,
                                "identificador": f"RNC {sr.rnc}",
                                "institution_id": None,
                                "supplier_rpe": str(sr.rnc),
                            }
                        )
            return results[:10]

    def _generate_tenant_code(self, nombre: str, tipo: str) -> str:
        stop_words = {"DE", "DEL", "LA", "LAS", "EL", "LOS", "Y", "E", "EN", "PARA", "SRL", "SA", "SAS", "EIRL"}
        words = [w for w in re.findall(r"[A-Za-z0-9]+", nombre.upper()) if w not in stop_words]
        if not words:
            base = "ORG"
        elif len(words) == 1:
            base = words[0][:10]
        else:
            acronym = "".join(w[0] for w in words[:5])
            base = acronym if len(acronym) >= 3 else words[0][:8]
        suffix = "B2B" if tipo == "B2B_SUPPLIER" else "GOB"
        return f"{base}-{suffix}"

    async def create_tenant(self, current_user: dict, data: dict) -> dict:
        if current_user["rol"]["codigo"] != "PLATFORM_ADMIN":
            raise AuthDomainError(
                "FORBIDDEN_INSUFFICIENT_ROLE",
                "Solo el Administrador General puede registrar nuevas organizaciones.",
                status_code=403,
            )

        nombre = str(data.get("nombre", "")).strip()
        tipo = str(data.get("tipo", "GOV_INSTITUTION"))
        plan_tier = str(data.get("plan_tier", "B2G_BASIC"))
        institution_id = int(data["institution_id"]) if data.get("institution_id") else None
        supplier_rpe = str(data["supplier_rpe"]).strip() if data.get("supplier_rpe") else None
        max_cat = 3 if plan_tier == "B2B_PYME" else 9999

        if not nombre:
            raise AuthDomainError("VALIDATION_ERROR", "El nombre de la organización es obligatorio.", status_code=422)

        raw_code = str(data.get("codigo") or "").strip().upper()
        codigo = raw_code if raw_code else self._generate_tenant_code(nombre, tipo)

        dup = (await self.db.execute(select(Tenant).where(Tenant.codigo == codigo))).scalar_one_or_none()
        if dup:
            codigo = f"{codigo}-{secrets.token_hex(2).upper()}" 

        t = Tenant(
            codigo=codigo,
            nombre=nombre,
            tipo=tipo,
            plan_tier=plan_tier,
            institution_id=institution_id,
            supplier_rpe=supplier_rpe,
            max_categorias_unspsc=max_cat,
            estado="ACTIVO",
        )
        self.db.add(t)
        await self.db.commit()
        await self.db.refresh(t)

        return {
            "id": t.id,
            "codigo": t.codigo,
            "nombre": t.nombre,
            "tipo": t.tipo,
            "plan_tier": t.plan_tier,
            "institution_id": t.institution_id,
            "supplier_rpe": t.supplier_rpe,
            "max_categorias_unspsc": t.max_categorias_unspsc,
            "estado": t.estado,
            "usuarios_count": 0,
        }

    async def update_tenant(self, current_user: dict, tenant_id: int, data: dict) -> dict:
        if current_user["rol"]["codigo"] != "PLATFORM_ADMIN":
            raise AuthDomainError(
                "FORBIDDEN_INSUFFICIENT_ROLE",
                "Solo el Administrador Global puede modificar el plan SaaS o estado de un Tenant.",
                status_code=403,
            )

        t = (await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
        if not t:
            raise AuthDomainError("TENANT_NOT_FOUND", "Organización no encontrada.", status_code=404)

        if "nombre" in data and data["nombre"]:
            t.nombre = str(data["nombre"]).strip()
        if "plan_tier" in data and data["plan_tier"]:
            t.plan_tier = str(data["plan_tier"])
            t.max_categorias_unspsc = 3 if t.plan_tier == "B2B_PYME" else 9999
        if "estado" in data and data["estado"] in ("ACTIVO", "INACTIVO"):
            if t.codigo == "NEXODIGITAL" and data["estado"] != "ACTIVO":
                raise AuthDomainError("CANNOT_DISABLE_PLATFORM_TENANT", "No se puede desactivar el tenant principal de la plataforma.", status_code=400)
            t.estado = data["estado"]
        if "institution_id" in data:
            t.institution_id = int(data["institution_id"]) if data["institution_id"] else None
        if "supplier_rpe" in data:
            t.supplier_rpe = str(data["supplier_rpe"]).strip() if data["supplier_rpe"] else None

        t.updated_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(t)

        cnt = (
            await self.db.execute(select(func.count(AppUser.id)).where(AppUser.tenant_id == t.id))
        ).scalar() or 0

        return {
            "id": t.id,
            "codigo": t.codigo,
            "nombre": t.nombre,
            "tipo": t.tipo,
            "plan_tier": t.plan_tier,
            "institution_id": t.institution_id,
            "supplier_rpe": t.supplier_rpe,
            "max_categorias_unspsc": t.max_categorias_unspsc,
            "estado": t.estado,
            "usuarios_count": int(cnt),
        }

    async def get_roles_and_permissions_matrix(self) -> dict:
        roles = (await self.db.execute(select(Role).order_by(Role.id))).scalars().all()
        perms = (await self.db.execute(select(Permission).order_by(Permission.id))).scalars().all()
        rp_rows = (await self.db.execute(select(RolePermission))).scalars().all()
        user_counts = {
            r[0]: int(r[1])
            for r in (
                await self.db.execute(select(AppUser.role_id, func.count(AppUser.id)).group_by(AppUser.role_id))
            ).all()
        }

        perm_by_id = {p.id: p.codigo for p in perms}
        role_perms_map: dict[int, list[str]] = {r.id or 0: [] for r in roles}
        for rp in rp_rows:
            if rp.role_id in role_perms_map and rp.permission_id in perm_by_id:
                role_perms_map[rp.role_id].append(perm_by_id[rp.permission_id])

        return {
            "roles": [
                {
                    "id": r.id,
                    "codigo": r.codigo,
                    "nombre": r.nombre,
                    "descripcion": r.descripcion,
                    "es_sistema": r.es_sistema,
                    "estado": r.estado,
                    "usuarios_count": user_counts.get(r.id or 0, 0),
                    "permisos": role_perms_map.get(r.id or 0, []),
                }
                for r in roles
            ],
            "permisos": [
                {
                    "id": p.id,
                    "codigo": p.codigo,
                    "modulo": p.modulo,
                    "plan_minimo": p.plan_minimo,
                    "descripcion": p.descripcion,
                }
                for p in perms
            ],
            "planes_saas": SAA_PLANS_CATALOG,
        }


    async def get_invitation_info(self, code: str) -> dict:
        clean_code = (code or "").strip().upper()
        if not clean_code:
            raise AuthDomainError(
                "INVITATION_CODE_INVALID",
                "El código de invitación ingresado no es válido o ha expirado.",
                status_code=404,
            )
        stmt = select(Tenant).where(func.upper(Tenant.codigo) == clean_code)
        tenant = (await self.db.execute(stmt)).scalar_one_or_none()
        if not tenant or tenant.estado != "ACTIVO":
            raise AuthDomainError(
                "INVITATION_CODE_INVALID",
                "El código de invitación ingresado no es válido o ha expirado.",
                status_code=404,
            )

        if tenant.tipo in ("PLATFORM", "GOV_OVERSIGHT"):
            alcance = "Alcance Nacional"
        elif tenant.tipo == "B2B_SUPPLIER":
            alcance = f"Proveedor RPE #{tenant.supplier_rpe}" if tenant.supplier_rpe else tenant.nombre
        else:
            alcance = tenant.nombre

        rol_asignado = (
            "Analista de Licitaciones"
            if tenant.tipo == "B2B_SUPPLIER"
            else "Auditor Institucional"
        )

        return {
            "codigo": tenant.codigo,
            "nombre": tenant.nombre,
            "tipo": tenant.tipo,
            "tipo_etiqueta": TENANT_TYPE_LABELS.get(tenant.tipo, "Organización Suscrita"),
            "plan_tier": tenant.plan_tier,
            "plan_etiqueta": PLAN_CLEAN_LABELS.get(tenant.plan_tier, tenant.plan_tier),
            "alcance": alcance,
            "rol_asignado": rol_asignado,
            "estado": tenant.estado,
        }

    async def search_public_suppliers(self, q: str = "", limit: int = 12) -> list[dict]:
        query_str = (q or "").strip()
        safe_limit = max(1, min(int(limit or 12), 25))
        stmt = (
            select(
                Contract.rpe,
                func.max(Contract.supplier_name).label("supplier_name"),
                func.count(Contract.id).label("total_contratos"),
                func.coalesce(func.sum(Contract.amount_adjudicated), 0.0).label("monto_total"),
            )
            .where(Contract.rpe.is_not(None), Contract.supplier_name.is_not(None))
        )
        if query_str:
            stmt = stmt.where(
                (Contract.supplier_name.ilike(f"%{query_str}%"))
                | (Contract.rpe.ilike(f"%{query_str}%"))
            )
        stmt = (
            stmt.group_by(Contract.rpe)
            .order_by(desc(func.count(Contract.id)), func.max(Contract.supplier_name).asc())
            .limit(safe_limit)
        )
        rows = (await self.db.execute(stmt)).all()
        results: list[dict] = []
        for r in rows:
            if not r.rpe or not r.supplier_name:
                continue
            results.append(
                {
                    "rpe": str(r.rpe),
                    "nombre": str(r.supplier_name),
                    "rnc": None,
                    "clasificacion": "Proveedor del Estado (DGCP)",
                    "total_contratos": int(r.total_contratos or 0),
                    "monto_total": float(r.monto_total or 0.0),
                }
            )

        if len(results) < safe_limit:
            rem = safe_limit - len(results)
            s_stmt = select(
                Supplier.rnc,
                Supplier.registered_name,
                Supplier.classification,
            ).where(Supplier.registered_name.is_not(None))
            if query_str:
                s_stmt = s_stmt.where(
                    (Supplier.registered_name.ilike(f"%{query_str}%"))
                    | (Supplier.rnc.ilike(f"%{query_str}%"))
                )
            s_stmt = s_stmt.order_by(Supplier.registered_name.asc()).limit(rem)
            s_rows = (await self.db.execute(s_stmt)).all()
            seen = {item["nombre"].upper() for item in results}
            for sr in s_rows:
                if sr.registered_name and sr.registered_name.upper() not in seen:
                    results.append(
                        {
                            "rpe": str(sr.rnc),
                            "nombre": str(sr.registered_name),
                            "rnc": str(sr.rnc),
                            "clasificacion": sr.classification or "Registro Mercantil / DGCP",
                            "total_contratos": 0,
                            "monto_total": 0.0,
                        }
                    )
        return results

    async def register_account(self, data: dict) -> dict:
        modo = str(data.get("modo") or "INVITATION").strip().upper()
        nombre = str(data.get("nombre") or "").strip()
        correo = str(data.get("correo") or "").strip().lower()
        password = str(data.get("password") or "")
        cargo = str(data.get("cargo") or "").strip() or None

        if not nombre or len(nombre) < 2:
            raise AuthDomainError(
                "VALIDATION_ERROR",
                "El nombre completo es obligatorio.",
                status_code=422,
            )
        if not correo or "@" not in correo:
            raise AuthDomainError(
                "VALIDATION_ERROR",
                "Ingrese un correo institucional o corporativo válido.",
                status_code=422,
            )
        if not validate_password_strength(password):
            raise AuthDomainError(
                "PASSWORD_POLICY_VIOLATION",
                "La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número.",
                status_code=422,
            )

        dup = (
            await self.db.execute(select(AppUser).where(func.lower(AppUser.correo) == correo))
        ).scalar_one_or_none()
        if dup:
            raise AuthDomainError(
                "EMAIL_ALREADY_REGISTERED",
                "El correo ingresado ya se encuentra registrado en la plataforma.",
                status_code=409,
            )

        if modo == "INVITATION":
            raw_code = str(data.get("codigo_invitacion") or "").strip().upper()
            if not raw_code:
                raise AuthDomainError(
                    "INVITATION_CODE_INVALID",
                    "Debe proporcionar un código de invitación válido.",
                    status_code=404,
                )
            tenant = (
                await self.db.execute(select(Tenant).where(func.upper(Tenant.codigo) == raw_code))
            ).scalar_one_or_none()
            if not tenant or tenant.estado != "ACTIVO":
                raise AuthDomainError(
                    "INVITATION_CODE_INVALID",
                    "El código de invitación ingresado no es válido o ha expirado.",
                    status_code=404,
                )
            existing_tenant_users = (
                await self.db.execute(
                    select(func.count(AppUser.id)).where(AppUser.tenant_id == tenant.id)
                )
            ).scalar() or 0
            if existing_tenant_users == 0:
                target_role_code = "TENANT_ADMIN"
            else:
                target_role_code = "PROVEEDOR" if tenant.tipo == "B2B_SUPPLIER" else "AUDITOR"
            role = (
                await self.db.execute(select(Role).where(Role.codigo == target_role_code))
            ).scalar_one_or_none()
            if not role:
                role = (await self.db.execute(select(Role).order_by(Role.id))).scalars().first()
        elif modo == "NEW_COMPANY":
            empresa_nombre = str(data.get("empresa_nombre") or "").strip()
            if len(empresa_nombre) < 3:
                raise AuthDomainError(
                    "VALIDATION_ERROR",
                    "El nombre de la empresa proveedora es obligatorio.",
                    status_code=422,
                )
            plan_tier = str(data.get("plan_tier") or "B2B_PYME").strip().upper()
            if plan_tier not in ("B2B_PYME", "B2B_CORPORATE"):
                plan_tier = "B2B_PYME"

            empresa_rpe = str(data.get("empresa_rpe") or "").strip() or None
            empresa_rnc = str(data.get("empresa_rnc") or "").strip() or None
            effective_rpe = empresa_rpe or empresa_rnc or f"RPE-{secrets.token_hex(3).upper()}"

            if empresa_rnc:
                existing_sup = (
                    await self.db.execute(select(Supplier).where(Supplier.rnc == empresa_rnc))
                ).scalar_one_or_none()
                if not existing_sup:
                    self.db.add(
                        Supplier(
                            rnc=empresa_rnc[:20],
                            registered_name=empresa_nombre[:255],
                            classification="Proveedor Registrado",
                        )
                    )

            codigo = self._generate_tenant_code(empresa_nombre, "B2B_SUPPLIER")
            dup_tenant = (
                await self.db.execute(select(Tenant).where(Tenant.codigo == codigo))
            ).scalar_one_or_none()
            if dup_tenant:
                codigo = f"{codigo}-{secrets.token_hex(2).upper()}"

            tenant = Tenant(
                codigo=codigo,
                nombre=empresa_nombre,
                tipo="B2B_SUPPLIER",
                plan_tier=plan_tier,
                institution_id=None,
                supplier_rpe=effective_rpe,
                max_categorias_unspsc=3 if plan_tier == "B2B_PYME" else 9999,
                estado="ACTIVO",
            )
            self.db.add(tenant)
            await self.db.flush()

            role = (
                await self.db.execute(select(Role).where(Role.codigo == "TENANT_ADMIN"))
            ).scalar_one_or_none()
            if not role:
                role = (
                    await self.db.execute(select(Role).where(Role.codigo == "PROVEEDOR"))
                ).scalar_one_or_none()
        else:
            raise AuthDomainError(
                "VALIDATION_ERROR",
                "Modo de registro no soportado.",
                status_code=422,
            )

        now = datetime.now(UTC)
        new_user = AppUser(
            tenant_id=int(tenant.id or 0),
            role_id=int(role.id or 0),
            nombre=nombre,
            correo=correo,
            password_hash=hash_password(password),
            cargo=cargo or role.nombre,
            estado="ACTIVO",
            intentos_fallidos=0,
            ultimo_acceso_at=now,
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        await self.db.refresh(tenant)

        user_payload = await self._build_user_payload(new_user, role, tenant)
        access_token = self._encode_jwt(user_payload)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": JWT_EXPIRATION_SECONDS,
            "user": user_payload,
        }
