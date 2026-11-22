import pytest

from app.shared.validators.rut import check_digit, format_rut, normalize_rut


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("12.345.678-5", "12.345.678-5"),
        ("12345678-5", "12.345.678-5"),
        ("123456785", "12.345.678-5"),
        (" 12.345.678-5 ", "12.345.678-5"),
        ("10.000.013-k", "10.000.013-K"),
        ("1.000.000-9", "1.000.000-9"),
    ],
)
def test_rut_is_normalized(raw, expected):
    assert normalize_rut(raw) == expected


@pytest.mark.parametrize("raw", ["1-8", "abc", "12.345.678-9", "", "١٢٣٤٥٦٧٨-5", "1-9", "999.999-K"])
def test_invalid_rut(raw):
    assert normalize_rut(raw) is None


def test_check_digit_and_format():
    assert check_digit(12345678) == "5"
    assert format_rut(12345678) == "12.345.678-5"
