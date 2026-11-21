from fastapi import FastAPI

from app.accounts.router import router as auth_router
from app.centers.router import router as centers_router
from app.errors import register_error_handlers


def create_app() -> FastAPI:
    application = FastAPI(redirect_slashes=False)
    register_error_handlers(application)
    application.include_router(auth_router)
    application.include_router(centers_router)

    @application.get("/api/health/")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
