import re

RUT_PATTERN = re.compile(r"^([0-9]{7,8})-?([0-9K])$")
PHONE_PATTERN = re.compile(r"^(?:\+?56)?\s?9\s?([0-9]{4})\s?([0-9]{4})$")
