from datetime import date, datetime
from zoneinfo import ZoneInfo

SANTIAGO = ZoneInfo("America/Santiago")


def local_now() -> datetime:
    return datetime.now(SANTIAGO).replace(tzinfo=None, microsecond=0)


def local_today() -> date:
    return local_now().date()
