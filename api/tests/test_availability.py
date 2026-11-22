from datetime import date, datetime, time, timedelta

import pytest
from fastapi.exceptions import RequestValidationError

from app import clock
from app.scheduling import repository
from app.scheduling.availability import (
    booking_window,
    days_with_slots,
    ensure_in_window,
    free_slots,
    slots_for_day,
)

D = date(2026, 12, 1)


def at(h, m=0, day=D):
    return datetime.combine(day, time(h, m))


@pytest.mark.parametrize(
    "busy,not_before,expected",
    [
        ([], None, [at(9), at(9, 30), at(10), at(10, 30), at(11)]),
        ([(at(10), at(11))], None, [at(9), at(11)]),
        ([], at(10), [at(10, 30), at(11)]),
    ],
)
def test_free_slots_of_an_hour_long_service(busy, not_before, expected):
    assert free_slots(D, time(9), time(12), 60, busy, not_before=not_before) == expected


def test_slot_may_start_when_previous_ends():
    assert at(10) in free_slots(D, time(9), time(12), 30, [(at(9, 30), at(10))])


def test_last_slot_must_fit_before_closing():
    assert free_slots(D, time(9), time(12), 50, [])[-1] == at(11)


def test_window_starts_tomorrow_for_patients_or_includes_today():
    assert booking_window(D) == (date(2026, 12, 2), date(2026, 12, 31))
    assert booking_window(D, include_today=True) == (D, date(2026, 12, 31))


@pytest.fixture
def setup(membership_factory, service_factory):
    professional = membership_factory()
    service = service_factory(center=professional.center, duration_minutes=60)
    return professional, service


NOW = datetime(2026, 11, 30, 8, 0)


def test_cancelled_appointments_do_not_block(session, setup, appointment_factory):
    professional, service = setup
    appointment_factory(professional, service, at(10), status="cancelled")
    assert at(10) in slots_for_day(session, professional, service, D, NOW)


def test_confirmed_appointments_block(session, setup, appointment_factory):
    professional, service = setup
    appointment_factory(professional, service, at(10))
    slots = slots_for_day(session, professional, service, D, NOW)
    assert at(10) not in slots and at(9, 30) not in slots and at(11) in slots


def test_exclude_id_ignores_that_appointment(session, setup, appointment_factory):
    professional, service = setup
    appointment = appointment_factory(professional, service, at(10))
    slots = slots_for_day(session, professional, service, D, NOW, exclude_id=appointment.id)
    assert at(10) in slots


def test_days_with_slots_skips_fully_booked_days(session, setup, appointment_factory):
    professional, service = setup
    professional.center.opening_time = time(9)
    professional.center.closing_time = time(10)
    session.flush()
    appointment_factory(professional, service, at(9))
    days = days_with_slots(session, professional, service, D, date(2026, 12, 3), NOW)
    assert days == [date(2026, 12, 2), date(2026, 12, 3)]


def test_closed_weekday_offers_no_slots(session, setup):
    professional, service = setup
    professional.center.open_days = [0, 2, 3, 4, 5, 6]
    session.flush()
    assert D.weekday() == 1
    assert slots_for_day(session, professional, service, D, NOW) == []
    days = days_with_slots(session, professional, service, D, date(2026, 12, 3), NOW)
    assert days == [date(2026, 12, 2), date(2026, 12, 3)]


def test_new_center_is_open_every_day(setup):
    professional, _ = setup
    assert professional.center.open_days == [0, 1, 2, 3, 4, 5, 6]


def test_busy_ranges_cover_every_center_of_the_user(session, membership_factory, service_factory, appointment_factory):
    first = membership_factory()
    second = membership_factory(user=first.user)
    other_service = service_factory(center=second.center, duration_minutes=60)
    appointment_factory(second, other_service, at(10))
    assert repository.busy_ranges(session, first, D, D) == [(at(10), at(11))]


def test_days_with_slots_runs_one_busy_query(session, setup, appointment_factory, capture_sql):
    professional, service = setup
    appointment_factory(professional, service, at(10))
    with capture_sql() as statements:
        days_with_slots(session, professional, service, D, date(2026, 12, 10), NOW)
    assert len([s for s in statements if "FROM appointments" in s]) == 1


@pytest.mark.parametrize(
    "offset,include_today,ok",
    [(0, False, False), (0, True, True), (1, False, True), (30, False, True), (31, False, False), (-1, True, False)],
)
def test_ensure_in_window(monkeypatch, offset, include_today, ok):
    monkeypatch.setattr(clock, "local_today", lambda: D)
    day = D + timedelta(days=offset)
    if ok:
        ensure_in_window(day, include_today, "start")
        return
    with pytest.raises(RequestValidationError) as info:
        ensure_in_window(day, include_today, "start")
    error = info.value.errors()[0]
    assert error["loc"] == ("body", "start")
    assert error["msg"] == "La fecha está fuera del período de reserva"


def test_closed_day_offers_no_slots(session, setup, closure_factory):
    professional, service = setup
    closure_factory(professional.center, D)
    assert slots_for_day(session, professional, service, D, NOW) == []
    assert slots_for_day(session, professional, service, date(2026, 12, 2), NOW)


def test_days_with_slots_skips_closed_days(session, setup, closure_factory):
    professional, service = setup
    closure_factory(professional.center, date(2026, 12, 2))
    days = days_with_slots(session, professional, service, D, date(2026, 12, 3), NOW)
    assert days == [D, date(2026, 12, 3)]


def lunch_setup(membership_factory, service_factory, minutes):
    professional = membership_factory()
    center = professional.center
    center.lunch_start, center.lunch_end = time(13, 0), time(14, 0)
    return professional, service_factory(center=center, duration_minutes=minutes)


def test_lunch_blocks_slots(session, membership_factory, service_factory):
    professional, service = lunch_setup(membership_factory, service_factory, 30)
    slots = slots_for_day(session, professional, service, D, NOW)
    assert at(13) not in slots and at(13, 30) not in slots
    assert at(12, 30) in slots and at(14) in slots


def test_lunch_blocks_overlapping_service(session, membership_factory, service_factory):
    professional, service = lunch_setup(membership_factory, service_factory, 60)
    slots = slots_for_day(session, professional, service, D, NOW)
    assert at(12, 30) not in slots
    assert at(12) in slots


def test_center_without_lunch_unchanged(session, setup):
    professional, service = setup
    assert at(13) in slots_for_day(session, professional, service, D, NOW)


def test_days_with_slots_applies_lunch(session, membership_factory, service_factory):
    professional, service = lunch_setup(membership_factory, service_factory, 60)
    professional.center.opening_time = time(13, 0)
    professional.center.closing_time = time(14, 0)
    assert days_with_slots(session, professional, service, D, D, NOW) == []


def test_days_with_slots_runs_one_closure_query(session, setup, closure_factory, capture_sql):
    professional, service = setup
    closure_factory(professional.center, D)
    with capture_sql() as statements:
        days_with_slots(session, professional, service, D, date(2026, 12, 10), NOW)
    assert len([s for s in statements if "center_closures" in s]) == 1
