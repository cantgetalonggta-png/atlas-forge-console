"""CLI helper wrapping backend import."""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from app.importers import import_github, parse_github_ref  # type: ignore


async def main(ref: str) -> None:
    parsed = parse_github_ref(ref)
    if not parsed:
        raise SystemExit("usage: github_import.py owner/repo")
    print(await import_github(*parsed))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else ""))
