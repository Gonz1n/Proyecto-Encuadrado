from fastapi import FastAPI

from app.errors import register_error_handlers


def create_app() -> FastAPI:
    application = FastAPI(redirect_slashes=False)
    register_error_handlers(application)

    @application.get("/api/health/")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
