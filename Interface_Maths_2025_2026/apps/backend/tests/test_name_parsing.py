from __future__ import annotations

from apps.backend.app.users import split_full_name


def test_split_simple_name():
    first, last = split_full_name("Prénom Nom")
    assert first == "Prénom"
    assert last == "Nom"


def test_split_composed_last_name():
    first, last = split_full_name("Prénom Nom Composé")
    assert first == "Prénom"
    assert last == "Nom Composé"


def test_split_uppercase_name():
    first, last = split_full_name("PRÉNOM NOM")
    # We don't alter case; we only split correctly
    assert first == "PRÉNOM"
    assert last == "NOM"
