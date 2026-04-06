#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import socket
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from zipfile import ZIP_DEFLATED, ZipFile


def resolve_database_path(app_dir: Path) -> Path:
    database_url = os.environ.get("DATABASE_URL", "sqlite:///db.sqlite3")
    parsed = urlparse(database_url)
    if parsed.scheme != "sqlite":
        raise SystemExit(
            "This backup script currently supports SQLite only. "
            "For PostgreSQL, use pg_dump and archive the dump file."
        )

    sqlite_path = parsed.path or ""
    if parsed.netloc:
        sqlite_path = f"{parsed.netloc}{sqlite_path}"
    sqlite_path = sqlite_path.lstrip("/") or "db.sqlite3"
    db_path = Path(sqlite_path)
    if not db_path.is_absolute():
        db_path = app_dir / db_path
    return db_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a timestamped zip backup of EduCRM data.")
    parser.add_argument(
        "--app-dir",
        default="/srv/educrm",
        help="Application directory containing .env and the SQLite database.",
    )
    parser.add_argument(
        "--output-dir",
        default="backups",
        help="Directory where backup zip files will be written.",
    )
    parser.add_argument(
        "--include-env",
        action="store_true",
        help="Include a copy of .env in the zip archive.",
    )
    args = parser.parse_args()

    app_dir = Path(args.app_dir).resolve()
    output_dir = Path(args.output_dir)
    if not output_dir.is_absolute():
        output_dir = (app_dir / output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    env_path = app_dir / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key, value)

    db_path = resolve_database_path(app_dir)
    if not db_path.exists():
        raise SystemExit(f"Database file not found: {db_path}")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    archive_path = output_dir / f"educrm-backup-{timestamp}.zip"

    manifest = {
        "created_at_utc": timestamp,
        "hostname": socket.gethostname(),
        "database_file": db_path.name,
        "database_size_bytes": db_path.stat().st_size,
    }

    with ZipFile(archive_path, "w", compression=ZIP_DEFLATED) as archive:
        archive.write(db_path, arcname=db_path.name)
        archive.writestr("manifest.json", json.dumps(manifest, indent=2) + "\n")
        if args.include_env and env_path.exists():
            archive.write(env_path, arcname=".env")

    print(archive_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
