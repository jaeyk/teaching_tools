from __future__ import annotations

import math
import random
import re
from dataclasses import dataclass
from typing import Iterable, List, Sequence


@dataclass(frozen=True)
class _StudentPreferences:
    name: str
    preferences: frozenset[str]


def _extract_columns(roster: object, name_column: str, preference_column: str) -> tuple[List[str], List[str]]:
    try:
        names: Sequence = roster[name_column]
        preferences: Sequence = roster[preference_column]
    except Exception as exc:  # pragma: no cover - defensive guard
        raise ValueError(
            f"Roster is missing required column(s): {name_column}, {preference_column}"
        ) from exc

    if len(names) != len(preferences):
        raise ValueError("Name and preference columns must be the same length")

    normalized_names = [str(name) for name in names]
    normalized_preferences = ["" if pref is None else str(pref) for pref in preferences]
    return normalized_names, normalized_preferences


def _calculate_group_count(student_count: int, team_count: int | None, group_size: int | None) -> int:
    if team_count is None and group_size is None:
        raise ValueError("Provide either team_count or group_size.")
    if team_count is not None and team_count < 1:
        raise ValueError("team_count must be at least 1")
    if group_size is not None and group_size < 1:
        raise ValueError("group_size must be at least 1")

    if team_count is None:
        return math.ceil(student_count / group_size) if student_count else 0

    if group_size is None:
        return min(team_count, student_count)

    expected = math.ceil(student_count / group_size)
    if expected != team_count:
        raise ValueError("team_count and group_size describe different groupings")
    return min(team_count, student_count)


def _normalize_delimiters(delimiters: str | Iterable[str]) -> tuple[str, ...]:
    if isinstance(delimiters, str):
        return (delimiters,)
    return tuple(delimiters)


def _parse_preferences(raw: str, *, delimiters: tuple[str, ...]) -> frozenset[str]:
    if not raw.strip():
        return frozenset()

    if not delimiters:
        return frozenset({raw.strip().casefold()})

    pattern = "|".join(re.escape(delimiter) for delimiter in delimiters)
    parts = [part.strip() for part in re.split(pattern, raw) if part.strip()]
    return frozenset(part.casefold() for part in parts)


def _jaccard_similarity(left: frozenset[str], right: frozenset[str]) -> float:
    if not left and not right:
        return 0.0
    union = left | right
    if not union:
        return 0.0
    return len(left & right) / len(union)


def form_preference_groups(
    roster: object,
    *,
    name_column: str = "name",
    preference_column: str = "preferences",
    team_count: int | None = None,
    group_size: int | None = None,
    preference_delimiters: str | Iterable[str] = ",",
    random_state: int | None = None,
) -> List[List[str]]:
    """Group students by similarity in stated project preferences.

    This routine uses a greedy similarity-based strategy: it picks a student,
    then fills their group with the most similar remaining classmates based on
    Jaccard similarity over the stated preference sets.

    Parameters
    ----------
    roster:
        Pandas DataFrame or mapping with name and preference columns.
    name_column:
        Column containing student names.
    preference_column:
        Column containing preference strings (1-3 entries per student).
    team_count:
        Desired number of groups.
    group_size:
        Target size of each group.
    preference_delimiters:
        Delimiter or delimiters used to split preference strings. Defaults to
        comma.
    random_state:
        Optional seed for reproducible tie-breaking.

    Returns
    -------
    list of list of str
        Grouped student names.
    """
    names, preferences = _extract_columns(roster, name_column, preference_column)
    delimiters = _normalize_delimiters(preference_delimiters)

    students: List[_StudentPreferences] = []
    for name, preference in zip(names, preferences):
        cleaned_name = str(name).strip()
        if not cleaned_name:
            continue
        parsed_preferences = _parse_preferences(preference, delimiters=delimiters)
        students.append(_StudentPreferences(cleaned_name, parsed_preferences))

    if not students:
        return []

    groups_needed = _calculate_group_count(len(students), team_count, group_size)
    if groups_needed == 0:
        return []

    base_size, remainder = divmod(len(students), groups_needed)
    group_sizes = [base_size + 1 if i < remainder else base_size for i in range(groups_needed)]

    similarity_matrix = [
        [
            _jaccard_similarity(students[i].preferences, students[j].preferences)
            for j in range(len(students))
        ]
        for i in range(len(students))
    ]

    rng = random.Random(random_state)
    remaining = list(range(len(students)))
    rng.shuffle(remaining)

    groups: List[List[str]] = []
    for size in group_sizes:
        if not remaining:
            break
        anchor = remaining.pop(0)
        group_indices = [anchor]
        while len(group_indices) < size and remaining:
            best_index = None
            best_score = -1.0
            for candidate in remaining:
                score = sum(similarity_matrix[candidate][member] for member in group_indices) / len(
                    group_indices
                )
                if score > best_score:
                    best_score = score
                    best_index = candidate
            group_indices.append(best_index)
            remaining.remove(best_index)
        groups.append([students[index].name for index in group_indices])

    return groups


__all__ = ["form_preference_groups"]
