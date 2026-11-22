from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

_hasher = PasswordHash.recommended()


# Genera el hash de una contrasena
def hash_password(raw: str) -> str:
    return _hasher.hash(raw)


# Compara una contrasena con su hash
def verify_password(raw: str, hashed: str) -> bool:
    try:
        return _hasher.verify(raw, hashed)
    except UnknownHashError:
        return False
