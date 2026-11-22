from fastapi import APIRouter

from app.scheduling.api import appointments, public_booking

router = APIRouter()
router.include_router(appointments.router)
router.include_router(public_booking.router)
