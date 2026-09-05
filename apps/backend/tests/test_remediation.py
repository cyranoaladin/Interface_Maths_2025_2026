"""Run production-mode regression checks without changing pytest's process state."""
from pathlib import Path
import subprocess
import sys


def test_remediation_in_isolated_process():
    scenario = Path(__file__).parent / "support" / "remediation_scenarios.py"
    result = subprocess.run(
        [sys.executable, str(scenario)],
        cwd=Path(__file__).resolve().parents[1],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=120,
        check=False,
    )
    assert result.returncode == 0, result.stdout
