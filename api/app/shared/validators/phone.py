from app.shared.constants.messages import PHONE_ERROR
from app.shared.constants.patterns import PHONE_PATTERN


# Lleva un celular chileno al formato +569XXXXXXXX
def normalize_phone(value: str) -> str | None:
    match = PHONE_PATTERN.match(value.strip())
    return f"+569{match.group(1)}{match.group(2)}" if match else None


# Valida y normaliza un celular chileno
def valid_phone(value: str) -> str:
    phone = normalize_phone(value)
    if not phone:
        raise ValueError(PHONE_ERROR)
    return phone
