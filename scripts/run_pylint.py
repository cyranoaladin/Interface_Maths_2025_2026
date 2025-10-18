#!/usr/bin/env python
"""Helper to run pylint with the correct PYTHONPATH for the backend."""
from __future__ import annotations

import logging
import os
import shlex
import sys
from pathlib import Path

from pylint.lint import Run

_LOGGER = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[1]
BACKEND_PATH = ROOT / "apps" / "backend"
EXTRA_PATHS = [str(ROOT), str(BACKEND_PATH)]
RCFILE = ROOT / ".pylintrc"

# Ensure repository modules import the same way as in runtime.
for path in reversed(EXTRA_PATHS):
    if path not in sys.path:
        sys.path.insert(0, path)

DEFAULT_TARGETS = [
    str(BACKEND_PATH / "app"),
    str(BACKEND_PATH / "tests"),
]


def split_cmd(value: str) -> list[str]:
    """Split shell-like arguments if the string is non-empty."""
    return shlex.split(value)


def _update_pythonpath() -> None:
    pythonpath_parts = EXTRA_PATHS.copy()
    current_pythonpath = os.environ.get("PYTHONPATH")
    if current_pythonpath:
        pythonpath_parts.append(current_pythonpath)
    os.environ["PYTHONPATH"] = os.pathsep.join(pythonpath_parts)


def main(argv: list[str] | None = None) -> int:
    os.chdir(ROOT)
    _update_pythonpath()

    env_args = os.environ.get("PYLINT_ARGS")
    extra_args = split_cmd(env_args) if env_args else []

    args = argv if argv is not None else sys.argv[1:]
    has_positional = False
    sentinel_encountered = False
    for value in args:
        if sentinel_encountered:
            has_positional = True
            break
        if value == "--":
            sentinel_encountered = True
            continue
        if not value.startswith("-"):
            has_positional = True
            break

    targets = [] if has_positional else DEFAULT_TARGETS
    cli_args = ["--jobs=1", f"--rcfile={RCFILE}"] + extra_args + args + targets

    _LOGGER.info("Running pylint with extra paths: %s", EXTRA_PATHS)
    _LOGGER.debug("Pylint arguments: %s", cli_args)

    Run(cli_args)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
