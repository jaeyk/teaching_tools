from __future__ import annotations

import random
from typing import List, Sequence


def _extract_columns(roster: object, name_column: str, excused_column: str) -> tuple[List[str], List[bool]]:
    try:
        names: Sequence = roster[name_column]
        excused: Sequence = roster[excused_column]
    except Exception as exc:  # pragma: no cover - defensive guard
        raise ValueError(
            f"Roster is missing required column(s): {name_column}, {excused_column}"
        ) from exc

    if len(names) != len(excused):
        raise ValueError("Name and excused columns must be the same length")

    normalized_names = [str(name) for name in names]
    normalized_excused = [bool(flag) if flag is not None else False for flag in excused]
    return normalized_names, normalized_excused


def cold_call_candidates(
    roster: object,
    *,
    name_column: str = "name",
    excused_column: str = "excused",
    include_excused: bool = False,
    sample_size: int = 1,
    random_state: int | None = None,
) -> List[str]:
    """Return a random sample of students for cold calling.

    Parameters
    ----------
    roster:
        Pandas DataFrame with student names and a boolean flag for opting out.
    name_column:
        Column name containing student names.
    excused_column:
        Column name indicating whether a student is excused from cold calling.
    include_excused:
        If ``False`` (default), exclude excused students from the selection pool.
    sample_size:
        Number of students to return. If the sample size exceeds the pool size, all
        eligible students are returned in random order.
    random_state:
        Optional seed for reproducible sampling.

    Returns
    -------
    list of str
        Randomly selected student names.
    """
    if sample_size < 1:
        raise ValueError("sample_size must be at least 1")

    names, excused = _extract_columns(roster, name_column, excused_column)
    pool = [name for name, is_excused in zip(names, excused) if include_excused or not is_excused]

    if not pool:
        return []

    rng = random.Random(random_state)
    sample_count = min(sample_size, len(pool))
    return rng.sample(pool, k=sample_count)


__all__ = ["cold_call_candidates"]
