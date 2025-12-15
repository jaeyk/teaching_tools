from __future__ import annotations

import math
import random
from typing import List, Sequence


def _prepare_roster(names: Sequence[str]) -> List[str]:
    cleaned = [str(name) for name in names if str(name).strip()]
    if not cleaned:
        return []
    return cleaned


def _calculate_team_count(name_count: int, team_count: int | None, group_size: int | None) -> int:
    if team_count is None and group_size is None:
        raise ValueError("Provide either team_count or group_size.")
    if team_count is not None and team_count < 1:
        raise ValueError("team_count must be at least 1")
    if group_size is not None and group_size < 1:
        raise ValueError("group_size must be at least 1")

    if team_count is None:
        return math.ceil(name_count / group_size) if name_count else 0

    if group_size is None:
        return min(team_count, name_count)

    expected = math.ceil(name_count / group_size)
    if expected != team_count:
        raise ValueError("team_count and group_size describe different groupings")
    return min(team_count, name_count)


def make_breakout_groups(
    names: Sequence[str],
    *,
    team_count: int | None = None,
    group_size: int | None = None,
    random_state: int | None = None,
) -> List[List[str]]:
    """Create breakout groups from a list of student names.

    Provide either the desired number of teams or a target group size. If both are
    provided, they must describe the same grouping plan.

    Parameters
    ----------
    names:
        Sequence of participant names.
    team_count:
        Desired number of groups.
    group_size:
        Desired number of students per group.
    random_state:
        Optional seed for deterministic shuffling.

    Returns
    -------
    list of list of str
        Shuffled names divided into groups.
    """
    cleaned_names = _prepare_roster(names)
    if not cleaned_names:
        return []

    groups_needed = _calculate_team_count(len(cleaned_names), team_count, group_size)
    if groups_needed == 0:
        return []

    rng = random.Random(random_state)
    shuffled = cleaned_names.copy()
    rng.shuffle(shuffled)

    base_size, remainder = divmod(len(shuffled), groups_needed)
    group_sizes = [base_size + 1 if i < remainder else base_size for i in range(groups_needed)]

    groups: List[List[str]] = []
    cursor = 0
    for size in group_sizes:
        groups.append(shuffled[cursor : cursor + size])
        cursor += size
    return groups


__all__ = ["make_breakout_groups"]
