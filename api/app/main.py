from fastapi import FastAPI

from app.accounts.router import router as auth_router
from app.centers.router import router as centers_router
from app.errors import register_error_handlers
from app.scheduling.private_router import router as private_router
from app.scheduling.public_router import router as public_router


def create_app() -> FastAPI:
    application = FastAPI(redirect_slashes=False)
    register_error_handlers(application)
    application.include_router(auth_router)
    application.include_router(centers_router)
    application.include_router(private_router)
    application.include_router(public_router)

    @application.get("/api/health/")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
