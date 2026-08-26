"""Print .env KEYS ONLY (never values) to diagnose configuration."""
from pathlib import Path

path = Path(__file__).resolve().parent.parent / "backend" / ".env"
if not path.exists():
    print("backend/.env DOES NOT EXIST")
    raise SystemExit(0)

print("backend/.env exists. Keys:")
for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        continue
    key, _, value = line.partition("=")
    state = "SET" if value.strip() else "EMPTY"
    extra = ""
    key_l = key.strip().upper()
    if "URI" in key_l and state == "SET":
        # Show only the scheme + host, never credentials.
        v = value.strip()
        scheme = v.split("://")[0] + "://" if "://" in v else "?"
        host = v.split("@")[-1].split("/")[0]
        has_creds = "@" in v
        extra = f"  (scheme={scheme}, host={host}, creds={'yes' if has_creds else 'NO'})"
    print(f"  {key.strip()} = {state}{extra}")
