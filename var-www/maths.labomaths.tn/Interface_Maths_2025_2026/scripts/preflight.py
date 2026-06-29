import importlib, sys
mods = ["app.main", "app.users", "app.routers.auth", "app.routers.groups"]
try:
    for m in mods:
        importlib.import_module(m)
        print(f"[OK] {m}")
    print("Preflight imports: OK")
except Exception as e:
    print(f"[FAIL] Preflight: {e}", file=sys.stderr)
    raise
