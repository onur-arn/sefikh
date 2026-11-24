#!/usr/bin/env bash
# Sauvegarde quotidienne : base + fichiers envoyés, conservées 14 jours (cron de l'utilisateur sefikh).
set -euo pipefail
D=/srv/sefikh/backups; T=$(date +%F)
PGPASSWORD=$(cat /srv/sefikh/.db-password) pg_dump -h 127.0.0.1 -U sefikh -Fc sefikh > "$D/db-$T.dump"
tar -czf "$D/storage-$T.tar.gz" -C /srv/sefikh storage
find "$D" -type f -mtime +14 -delete
