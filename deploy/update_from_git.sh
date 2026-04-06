#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/educrm}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

if [ ! -d .git ]; then
  echo "This directory is not a git repository: $APP_DIR" >&2
  exit 1
fi

echo "[1/7] Updating source from git"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[2/7] Updating Python dependencies"
. .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "[3/7] Updating frontend dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[4/7] Building frontend"
npm run build
rm -rf frontend-dist
mv dist frontend-dist

echo "[5/7] Applying Django changes"
python manage.py migrate
python manage.py collectstatic --noinput

echo "[6/7] Restarting services"
sudo systemctl restart educrm
sudo systemctl reload nginx

echo "[7/7] Done"
echo "Server updated from branch: $BRANCH"
