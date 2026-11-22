from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.errors.exceptions import DomainError


# Traduce un error de Pydantic a un mensaje en espanol
def _message(error: dict) -> str:
    ctx = error.get("ctx") or {}
    match error["type"]:
        case "missing":
            return "Este campo es obligatorio."
        case "string_too_long":
            return f"Asegúrate de que este campo no tenga más de {ctx.get('max_length')} caracteres."
        case "string_too_short":
            return f"Asegúrate de que este campo tenga al menos {ctx.get('min_length')} caracteres."
        case "greater_than_equal":
            return f"Asegúrate de que este valor sea mayor o igual a {ctx.get('ge')}."
        case "less_than_equal":
            return f"Asegúrate de que este valor sea menor o igual a {ctx.get('le')}."
        case "int_parsing" | "int_type":
            return "Se requiere un número entero válido."
        case "literal_error" | "enum":
            return "Selecciona una opción válida."
        case "url_parsing" | "url_type":
            return "Ingresa una URL válida."
        case "value_error":
            return error["msg"].removeprefix("Value error, ")
        case _:
            return "Valor inválido."


# Obtiene el nombre del campo con error
def _field(error: dict) -> str:
    names = [part for part in error["loc"] if isinstance(part, str)]
    if names and names[-1] != "body":
        return names[-1]
    return "non_field_errors"


# Responde los errores de validacion agrupados por campo
async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    body: dict[str, list[str]] = {}
    for error in exc.errors():
        body.setdefault(_field(error), []).append(_message(error))
    return JSONResponse(body, status_code=400)


# Responde un error de negocio con su codigo
async def domain_handler(request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)


# Registra los manejadores de errores en la app
def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, validation_handler)
    app.add_exception_handler(DomainError, domain_handler)
