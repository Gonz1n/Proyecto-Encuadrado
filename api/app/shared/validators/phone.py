from app.shared.constants.messages import PHONE_ERROR
from app.shared.constants.patterns import PHONE_PATTERN


def normalize_phone(value: str) -> str | None:
    match = PHONE_PATTERN.match(value.strip())
    return f"+569{match.group(1)}{match.group(2)}" if match else None


def valid_phone(value: str) -> str:
    phone = normalize_phone(value)
    if not phone:
        raise ValueError(PHONE_ERROR)
    return phone
