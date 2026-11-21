import re

RUT_PATTERN = re.compile(r"^([0-9]{1,8})-?([0-9K])$")


def check_digit(number: int) -> str:
    total, factor = 0, 2
    for digit in reversed(str(number)):
        total += int(digit) * factor
        factor = 2 if factor == 7 else factor + 1
    rest = 11 - total % 11
    return {11: "0", 10: "K"}.get(rest, str(rest))


def format_rut(number: int) -> str:
    return f"{number:,}".replace(",", ".") + f"-{check_digit(number)}"


def normalize_rut(value: str) -> str | None:
    match = RUT_PATTERN.match(value.strip().upper().replace(".", "").replace(" ", ""))
    if not match or check_digit(int(match.group(1))) != match.group(2):
        return None
    return format_rut(int(match.group(1)))
