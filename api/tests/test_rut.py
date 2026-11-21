import pytest

from app.scheduling.rut import check_digit, format_rut, normalize_rut


@pytest.mark.parametrize("raw", ["12.345.678-5", "12345678-5", "123456785", " 12.345.678-5 "])
def test_rut_is_normalized(raw):
    assert normalize_rut(raw) == "12.345.678-5"


def test_rut_with_k():
    assert normalize_rut("10.000.013-k") == "10.000.013-K"


@pytest.mark.parametrize("raw", ["1-8", "abc", "12.345.678-9", "", "١٢٣٤٥٦٧٨-5"])
def test_invalid_rut(raw):
    assert normalize_rut(raw) is None


def test_check_digit_and_format():
    assert check_digit(12345678) == "5"
    assert format_rut(12345678) == "12.345.678-5"
