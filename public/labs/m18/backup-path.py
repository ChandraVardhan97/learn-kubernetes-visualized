#!/usr/bin/env python3
"""Resolve private runtime outputs, never into this checkout's published assets."""
import os
from pathlib import Path
import stat
import sys
import tempfile


def main():
    module = sys.argv[1] if len(sys.argv) == 2 else ''
    artifacts = {'m18': ('kv-lab.db', 'recovery.kubeconfig', 'etcdutl'),
                 'm20': ('orders.csv', 'orders.restored-before-replacement.bin', 'orders.restored-after-replacement.bin')}
    if module not in artifacts:
        raise ValueError('Usage: python3 backup-path.py m18|m20')
    os.umask(0o077)
    uid = os.getuid()
    roots = set()
    for origin in (Path(__file__).resolve().parent, Path.cwd().resolve()):
        for parent in (origin, *origin.parents):
            if (parent / 'src/data/labs.ts').is_file() and (parent / 'package.json').is_file():
                roots.add(parent.resolve())
    override = os.environ.get('KV_LAB_BACKUP_DIR')
    default_base = Path(tempfile.gettempdir()) / ('kubernetes-visualized-' + str(uid))
    destination = Path(override).expanduser() if override else default_base / module
    destination = destination.resolve()
    forbidden = [(root / name).resolve() for root in roots for name in ('public', 'dist')]

    def reject_published(candidate):
        resolved = candidate.resolve()
        if any(resolved == directory or directory in resolved.parents for directory in forbidden):
            raise ValueError('Refusing runtime output inside published public/dist assets: ' + str(resolved))

    reject_published(destination)
    for name in artifacts[module]:
        target = destination / name
        reject_published(target)
        if target.is_symlink():
            raise ValueError('Refusing symlink artifact destination: ' + str(target))
        if target.exists() and (not target.is_file() or target.stat().st_uid != uid):
            raise ValueError('Refusing an artifact not owned by this user: ' + str(target))
    # A default shared temp prefix must itself belong to this user and be private.
    directories = [default_base, destination] if not override else [destination]
    for directory in directories:
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        details = directory.stat()
        if not stat.S_ISDIR(details.st_mode) or details.st_uid != uid or stat.S_IMODE(details.st_mode) & 0o077:
            raise ValueError('Backup directory must belong to this user with mode 0700: ' + str(directory))
    print(destination)


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, ValueError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(2)
