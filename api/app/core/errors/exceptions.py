from fastapi.exceptions import RequestValidationError


class DomainError(Exception):
    # Guarda el codigo HTTP y el mensaje
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


# Crea un error de validacion para un campo
def field_error(field: str, message: str) -> RequestValidationError:
    return RequestValidationError(
        [{"type": "value_error", "loc": ("body", field), "msg": message, "input": None}]
    )
