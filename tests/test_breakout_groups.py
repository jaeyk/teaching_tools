from teaching_tools import make_breakout_groups


def test_groups_follow_team_count():
    names = ["Ada", "Bert", "Cleo", "Deepak", "Evan", "Fatima"]

    groups = make_breakout_groups(names, team_count=3, random_state=1)

    assert len(groups) == 3
    assert sorted(len(g) for g in groups) == [2, 2, 2]


def test_groups_follow_group_size():
    names = ["Ada", "Bert", "Cleo", "Deepak", "Evan", "Fatima", "Gus"]

    groups = make_breakout_groups(names, group_size=3, random_state=2)

    assert len(groups) == 3
    assert sorted(len(g) for g in groups) == [2, 2, 3]
    flattened = [name for group in groups for name in group]
    assert sorted(flattened) == sorted(names)


def test_mismatched_configuration_raises_error():
    names = ["Ada", "Bert", "Cleo", "Deepak"]

    try:
        make_breakout_groups(names, team_count=2, group_size=1)
    except ValueError:
        pass
    else:
        raise AssertionError("Expected ValueError for mismatched parameters")
