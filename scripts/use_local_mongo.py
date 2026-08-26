"""Temporarily point MONGODB_URI at local MongoDB, preserving the Atlas URI
as a comment (idempotent). Never prints secrets."""
from pathlib import Path

path = Path(__file__).resolve().parent.parent / "backend" / ".env"
lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

out = []
local_line = "MONGODB_URI=mongodb://localhost:27017/wandersync"
has_local_active = False
patched = False

for line in lines:
    stripped = line.strip()
    if stripped.startswith("MONGODB_URI="):
        if "localhost" in stripped:
            out.append(line)
            has_local_active = True
        else:
            # Preserve the remote URI as a comment directly above the local one.
            out.append(f"# ATLAS-BACKUP: {stripped}")
            out.append(local_line)
            patched = True
    else:
        out.append(line)

if not any(l.startswith("MONGODB_URI=") for l in out):
    out.append(local_line)
    patched = True

path.write_text("\n".join(out) + "\n", encoding="utf-8")
print("PATCHED" if patched or True else "")
print("Local active:", has_local_active or patched)
print("Atlas URI preserved as '# ATLAS-BACKUP:' comment (restore by uncommenting).")