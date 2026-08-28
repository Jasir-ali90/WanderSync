"""Print the last lines of a test-result log (quoting-proof)."""
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
path = sys.argv[1] if len(sys.argv) > 1 else "ai_test_results.txt"
count = int(sys.argv[2]) if len(sys.argv) > 2 else 6
lines = io.open(path, encoding="utf-8", errors="replace").read().splitlines()
for line in lines[-count:]:
    print(line)
