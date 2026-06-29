#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/alaeddine/Documents/Interface__Maths_2025_2026/Interface_Maths_2025_2026"
COMMIT_MSG="${1:-}"

# --- helpers ---------------------------------------------------------------
require_clean_conflicts() {
  if git diff --check >/dev/null 2>&1; then return; fi
  echo "✖ Unresolved conflict markers detected. Resolve them and re-run." >&2
  exit 2
}

ensure_gitignore_rules() {
  local -a patterns=(
    ".venv/"
    "*/.venv/"
    "node_modules/"
    "*/node_modules/"
    "site/dist/"
    "site/dist/assets/"
    "test-results/"
    "site/test-results/"
    "*.pyc"
    "__pycache__/"
  )
  local gitignore=".gitignore"
  [[ -f "$gitignore" ]] || touch "$gitignore"

  local updated=0
  for pattern in "${patterns[@]}"; do
    if ! grep -qxF "$pattern" "$gitignore"; then
      echo "$pattern" >> "$gitignore"
      updated=1
    fi
  done

  if [[ $updated -eq 1 ]]; then
    git add "$gitignore"
    echo "• .gitignore updated with missing safety rules."
  fi
}

resolve_python_bin() {
  local -a candidates=(
    "${REPO_DIR}/bin/python"
    "${REPO_DIR}/../bin/python"
    "${REPO_DIR}/../../bin/python"
    "$(command -v python3)"
    "$(command -v python)"
  )

  for candidate in "${candidates[@]}"; do
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  echo ""
  return 1
}

unstage_unwanted_artifacts() {
  local cleaned=0
  while IFS= read -r path; do
    case "$path" in
      *.pyc|*/__pycache__/*|__pycache__/*)
        ;;
      */.venv/*|.venv/*)
        ;;
      */node_modules/*|node_modules/*)
        ;;
      site/dist/*)
        ;;
      site/test-results/*|test-results/*)
        ;;
      *)
        continue
        ;;
    esac

    git restore --staged -- "$path" >/dev/null 2>&1 || git rm --cached -r -- "$path" >/dev/null 2>&1 || true
    echo "• Removed staged artefact: $path"
    cleaned=1
  done < <(git diff --cached --name-only)

  if [[ $cleaned -eq 1 ]]; then
    echo "• Staging cleaned from build artefacts and environments."
  fi
}

run_safety_checks() {
  echo "• Running lint (scripts/run_pylint.py)…"
  "$PYTHON_BIN" scripts/run_pylint.py >/tmp/run_pylint.log
  echo "  Lint OK (details: /tmp/run_pylint.log)."

  if [[ -f package-lock.json ]]; then
    echo "• Running npm audit --dry-run for sanity…"
    npm audit --dry-run >/tmp/npm_audit.log || true
  fi

  if [[ -f apps/backend/pytest.ini || -d apps/backend/tests ]]; then
    echo "• Running backend tests (pytest)…"
    "$PYTHON_BIN" -m pytest >/tmp/pytest.log
    echo "  Pytest OK (details: /tmp/pytest.log)."
  fi
}

stage_everything_clean() {
  git add .
  unstage_unwanted_artifacts
  require_clean_conflicts
  git status --short
}

prepare_commit_message() {
  if [[ -n "$COMMIT_MSG" ]]; then
    echo "$COMMIT_MSG"
  else
    printf "Enter commit message: "
    read -r msg
    if [[ -z "$msg" ]]; then
      echo "✖ Commit message required." >&2
      exit 3
    fi
    echo "$msg"
  fi
}

# --- main flow -------------------------------------------------------------
cd "$REPO_DIR"
echo "⇒ Working from: $(pwd)"

git rev-parse --is-inside-work-tree >/dev/null

PYTHON_BIN="$(resolve_python_bin)"
if [[ -z "$PYTHON_BIN" ]]; then
  echo "✖ Unable to locate a Python interpreter (looked for ./bin/python, ../bin/python, python3)." >&2
  exit 4
fi

require_clean_conflicts
ensure_gitignore_rules

echo "• Fetching latest origin state…"
git fetch --all --prune

if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  UPSTREAM_REF="$(git rev-parse --abbrev-ref --symbolic-full-name @{u})"
  echo "• Rebasing onto $UPSTREAM_REF…"
  git rebase --autostash "$UPSTREAM_REF"
else
  echo "• No upstream tracking branch configured; skipping rebase."
fi

stage_everything_clean

run_safety_checks

if git diff --cached --quiet; then
  echo "✔ Nothing new to commit. Exiting."
  exit 0
fi

COMMIT_MSG_FINAL="$(prepare_commit_message)"

echo "• Committing…"
git commit -m "$COMMIT_MSG_FINAL"

echo "• Pushing to origin…"
git push --set-upstream origin "$(git branch --show-current)"

echo "✔ Commit and push completed."
