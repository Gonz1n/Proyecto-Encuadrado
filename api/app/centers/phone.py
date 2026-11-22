import re

PHONE_PATTERN = re.compile(r"^(?:\+?56)?\s?9\s?([0-9]{4})\s?([0-9]{4})$")
PHONE_ERROR = "Ingresa un celular chileno válido"


def normalize_phone(value: str) -> str | None:
    match = PHONE_PATTERN.match(value.strip())
    return f"+569{match.group(1)}{match.group(2)}" if match else None


def valid_phone(value: str) -> str:
    phone = normalize_phone(value)
    if not phone:
        raise ValueError(PHONE_ERROR)
    return phone
