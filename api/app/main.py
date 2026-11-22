from fastapi import FastAPI

from app.accounts.api.router import router as auth_router
from app.centers.api.router import router as centers_router
from app.core.errors.handlers import register_error_handlers
from app.scheduling.api.router import router as scheduling_router


# Crea la app con sus rutas y manejadores de errores
def create_app() -> FastAPI:
    application = FastAPI(redirect_slashes=False)
    register_error_handlers(application)
    application.include_router(auth_router)
    application.include_router(centers_router)
    application.include_router(scheduling_router)

    # Indica que el servicio esta funcionando
    @application.get("/api/health/")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
