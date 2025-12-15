import pytest

from teaching_tools.peer_review import match_peer_reviews


def test_match_peer_reviews_makes_cycle():
    participants = ["Team 1", "Team 2", "Team 3", "Team 4"]
    matches = match_peer_reviews(participants, random_state=3)

    assert matches == [
        ("Team 4", "Team 1"),
        ("Team 1", "Team 3"),
        ("Team 3", "Team 2"),
        ("Team 2", "Team 4"),
    ]


def test_match_peer_reviews_returns_empty_for_small_roster():
    assert match_peer_reviews([]) == []
    assert match_peer_reviews(["Solo"]) == []


def test_match_peer_reviews_strips_blank_entries():
    participants = [" ", "Alpha", "", "Beta"]
    matches = match_peer_reviews(participants, random_state=1)
    assert matches == [("Beta", "Alpha"), ("Alpha", "Beta")]
