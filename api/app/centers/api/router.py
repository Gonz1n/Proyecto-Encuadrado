from fastapi import APIRouter

from app.centers.api import center, closures, members, public, services

router = APIRouter()
router.include_router(center.router)
router.include_router(services.router)
router.include_router(members.router)
router.include_router(closures.router)
router.include_router(public.router)
