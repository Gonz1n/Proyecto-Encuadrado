import re

CONTACT_PHONE = re.compile(r"^\+?[0-9][0-9 -]{6,18}$")
