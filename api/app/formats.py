from datetime import datetime, time
from typing import Annotated, Any

from pydantic import AfterValidator, BeforeValidator, PlainSerializer

MINUTE_FORMAT = "%Y-%m-%dT%H:%M"
HOUR_MINUTE_FORMAT = "%H:%M"


def _parser(fmt: str, kind: type, message: str):
    def parse(value: Any) -> Any:
        if isinstance(value, str):
            try:
                parsed = datetime.strptime(value, fmt)
            except ValueError:
                raise ValueError(message) from None
            return parsed.time() if kind is time else parsed
        return value

    return parse


Minute = Annotated[
    datetime,
    BeforeValidator(_parser(MINUTE_FORMAT, datetime, "Formato de fecha y hora inválido. Usa AAAA-MM-DDTHH:MM.")),
    PlainSerializer(lambda v: v.strftime(MINUTE_FORMAT), return_type=str, when_used="json"),
]

HourMinute = Annotated[
    time,
    BeforeValidator(_parser(HOUR_MINUTE_FORMAT, time, "Formato de hora inválido. Usa HH:MM.")),
    PlainSerializer(lambda v: v.strftime(HOUR_MINUTE_FORMAT), return_type=str, when_used="json"),
]


def _not_blank(value: str) -> str:
    if not value:
        raise ValueError("Este campo no puede estar en blanco.")
    return value


NotBlank = AfterValidator(_not_blank)
