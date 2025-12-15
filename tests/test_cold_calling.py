import pytest

from teaching_tools import cold_call_candidates


def test_cold_call_excludes_opt_out_by_default():
    roster = {"name": ["Ada", "Bert", "Cleo"], "excused": [False, True, False]}

    selected = cold_call_candidates(roster, sample_size=2, random_state=0)

    assert set(selected) == {"Ada", "Cleo"}


def test_cold_call_allows_opt_out_when_requested():
    roster = {"name": ["Ada", "Bert", "Cleo"], "excused": [False, True, False]}

    selected = cold_call_candidates(
        roster, include_excused=True, sample_size=3, random_state=1
    )

    assert set(selected) == {"Ada", "Bert", "Cleo"}


def test_invalid_columns_raise_error():
    roster = {"student": ["Ada"], "opt_out": [False]}

    with pytest.raises(ValueError):
        cold_call_candidates(roster)
