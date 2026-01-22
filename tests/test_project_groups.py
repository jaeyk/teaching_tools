from teaching_tools import form_preference_groups


def test_groups_by_similarity():
    roster = {
        "name": ["Ava", "Blake", "Cory", "Drew"],
        "prefs": [
            "Health, Policy",
            "Health",
            "Environment",
            "Environment, Climate",
        ],
    }

    groups = form_preference_groups(
        roster,
        preference_column="prefs",
        group_size=2,
        random_state=4,
    )

    assert {frozenset(group) for group in groups} == {
        frozenset({"Ava", "Blake"}),
        frozenset({"Cory", "Drew"}),
    }


def test_custom_delimiter():
    roster = {
        "name": ["A", "B", "C"],
        "prefs": [
            "Urban / Housing",
            "Urban",
            "Housing",
        ],
    }

    groups = form_preference_groups(
        roster,
        preference_column="prefs",
        team_count=2,
        preference_delimiters="/",
        random_state=5,
    )

    assert {frozenset(group) for group in groups} == {
        frozenset({"A", "B"}),
        frozenset({"C"}),
    }
