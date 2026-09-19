#!/bin/sh
# Run from /home/user/viberoom after transferring the source archive.
# Build first; the old service remains available until the replacement is ready.
set -eu
cd /home/user/viberoom
docker compose -f docker-compose.production.yml build
backup_dir=$(mktemp -d /home/user/viberoom-backup-XXXXXXXX)
chmod 700 "$backup_dir"
cp -p data/applications.json "$backup_dir/applications.json"
cp -p .env "$backup_dir/.env"
chmod 600 "$backup_dir/applications.json" "$backup_dir/.env"
docker image tag "$(docker inspect viberoom-viberoom-1 --format '{{.Image}}')" viberoom-before-security:latest
chmod 700 data
chmod 600 data/applications.json .env
docker compose -f docker-compose.production.yml up -d --no-build
printf 'Backup saved: %s\n' "$backup_dir"
docker compose -f docker-compose.production.yml ps
