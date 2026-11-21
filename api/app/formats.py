from datetime import datetime, time
from typing import Annotated, Any

from pydantic import BeforeValidator, PlainSerializer

MINUTE_FORMAT = "%Y-%m-%dT%H:%M"
HOUR_MINUTE_FORMAT = "%H:%M"


def _parser(fmt: str, kind: type):
    def parse(value: Any) -> Any:
        if isinstance(value, str):
            parsed = datetime.strptime(value, fmt)
            return parsed.time() if kind is time else parsed
        return value

    return parse


Minute = Annotated[
    datetime,
    BeforeValidator(_parser(MINUTE_FORMAT, datetime)),
    PlainSerializer(lambda v: v.strftime(MINUTE_FORMAT), return_type=str, when_used="json"),
]

HourMinute = Annotated[
    time,
    BeforeValidator(_parser(HOUR_MINUTE_FORMAT, time)),
    PlainSerializer(lambda v: v.strftime(HOUR_MINUTE_FORMAT), return_type=str, when_used="json"),
]
