"""Errores y códigos de dominio de la consola de administración.

Los servicios (`admin_support_service`, `admin_sync_service`,
`admin_calibration_service`, `admin_audit_service`) lanzan `AdminOpsError`
con uno de estos códigos; la capa de presentación los traduce a respuestas
HTTP. Nunca se lanza `HTTPException` desde un servicio.
"""

FORBIDDEN_ADMIN = "FORBIDDEN_ADMIN"
FORBIDDEN_CONFIG_EDIT = "FORBIDDEN_CONFIG_EDIT"
SYNC_ALREADY_RUNNING = "SYNC_ALREADY_RUNNING"
DETECTION_ALREADY_RUNNING = "DETECTION_ALREADY_RUNNING"
QUEUE_UNAVAILABLE = "QUEUE_UNAVAILABLE"
TICKET_NOT_FOUND = "TICKET_NOT_FOUND"
TICKET_CLOSED = "TICKET_CLOSED"
INVALID_DATE_RANGE = "INVALID_DATE_RANGE"
EXPORT_TOO_LARGE = "EXPORT_TOO_LARGE"
VALIDATION_ERROR = "VALIDATION_ERROR"
CODE_GENERATION_FAILED = "CODE_GENERATION_FAILED"


class AdminOpsError(Exception):
    """Error de dominio de operaciones administrativas."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)
