from __future__ import annotations

import random
from typing import List, Sequence, Tuple


def _prepare_roster(names: Sequence[str]) -> List[str]:
    return [str(name) for name in names if str(name).strip()]


def match_peer_reviews(
    participants: Sequence[str], *, random_state: int | None = None
) -> List[Tuple[str, str]]:
    """Pair participants for a peer review exchange.

    Names can represent individuals or groups. Each participant is assigned a
    single review target in a round-robin cycle, ensuring everyone both reviews
    and is reviewed once.
    """

    cleaned = _prepare_roster(participants)
    if len(cleaned) < 2:
        return []

    rng = random.Random(random_state)
    shuffled = cleaned.copy()
    rng.shuffle(shuffled)

    return [(shuffled[i], shuffled[(i + 1) % len(shuffled)]) for i in range(len(shuffled))]


__all__ = ["match_peer_reviews"]
