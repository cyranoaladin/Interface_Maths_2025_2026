from pathlib import Path

import pytest

from app.tree import build_tree


def test_build_tree_extracts_html_and_titles(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    # Arrange: create nested dirs and files
    base = tmp_path / "EDS_premiere" / "Calcul_litteral"
    (base / "SubA").mkdir(parents=True)
    (base / "SubB").mkdir(parents=True)

    html_index = "<html><head><title>Fiche CL</title></head><body></body></html>"
    html_a = "<html><head><title>Page A</title></head><body></body></html>"
    html_b = "<html><head><title>Ex B</title></head><body></body></html>"

    (base / "index.html").write_text(html_index, encoding="utf-8")
    (base / "SubA" / "page.htm").write_text(html_a, encoding="utf-8")
    (base / "SubA" / "doc.txt").write_text("ignore me", encoding="utf-8")
    (base / "SubB" / "ex.html").write_text(html_b, encoding="utf-8")

    # Act: build tree from tmp root
    root_dir = tmp_path
    tree = build_tree(str(root_dir))

    # Assert: root is dir and contains EDS_premiere
    assert tree.type == "dir"
    ep = next(c for c in tree.children if getattr(c, "name", None) == "EDS_premiere")
    cl = next(c for c in ep.children if getattr(c, "name", None) == "Calcul_litteral")

    # Files and titles
    index = next(c for c in cl.children if getattr(c, "type", None) == "file" and c.name == "index.html")
    assert index.title == "Fiche CL"
    assert index.url.endswith("/EDS_premiere/Calcul_litteral/index.html")

    suba = next(c for c in cl.children if getattr(c, "type", None) == "dir" and c.name == "SubA")
    pagea = next(c for c in suba.children if getattr(c, "type", None) == "file" and c.name == "page.htm")
    assert pagea.title == "Page A"

    subb = next(c for c in cl.children if getattr(c, "type", None) == "dir" and c.name == "SubB")
    exb = next(c for c in subb.children if getattr(c, "type", None) == "file" and c.name == "ex.html")
    assert exb.title == "Ex B"


def test_non_html_files_are_filtered(tmp_path: Path):
    (tmp_path / "a").mkdir()
    (tmp_path / "a" / "x.md").write_text("nope", encoding="utf-8")
    (tmp_path / "a" / "x.html").write_text("<html></html>", encoding="utf-8")

    tree = build_tree(str(tmp_path))
    a = next(c for c in tree.children if getattr(c, "name", None) == "a")
    assert all(getattr(n, "type", None) != "file" or n.name.endswith(".html") for n in a.children)

