from enum import StrEnum


class Role(StrEnum):
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


ROLE_LABELS: dict[Role, str] = {
    Role.ADMIN: "Administrador",
    Role.MEMBER: "Profesional",
    Role.VIEWER: "Solo lectura",
}
