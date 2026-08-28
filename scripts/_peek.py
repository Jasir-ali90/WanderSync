"""Print a file with line numbers. Usage: peek.py <path> [start] [end]"""
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")


def main():
    args = sys.argv[1:]
    if not args:
        print("usage: peek.py <path> [start] [end]")
        return
    start = int(args[1]) - 1 if len(args) > 1 else 0
    end = int(args[2]) if len(args) > 2 else 10**9
    try:
        lines = io.open(args[0], encoding="utf-8").readlines()
    except FileNotFoundError:
        print(f"MISSING: {args[0]}")
        return
    for i in range(start, min(end, len(lines))):
        print(f"{i+1}: {lines[i].rstrip()}")


if __name__ == "__main__":
    main()
