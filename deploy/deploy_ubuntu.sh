#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/srv/educrm"
PYTHON_BIN="${PYTHON_BIN:-python3}"
NODE_BIN="${NODE_BIN:-node}"
NPM_BIN="${NPM_BIN:-npm}"

echo "[1/8] Preparing directories"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

echo "[2/8] Syncing project into $APP_DIR"
rsync -av --delete \
  --exclude ".git" \
  --exclude ".venv" \
  --exclude "venv" \
  --exclude "venv313" \
  --exclude "node_modules" \
  --exclude "dist" \
  --exclude "db.sqlite3" \
  --exclude "db_local.sqlite3" \
  --exclude ".env" \
  --exclude ".idea" \
  --exclude ".tmp" \
  --exclude "._*" \
  ./ "$APP_DIR"/

cd "$APP_DIR"

echo "[3/8] Installing system packages"
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx python3-venv build-essential libpq-dev

echo "[4/8] Building Python environment"
$PYTHON_BIN -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "[5/8] Building frontend"
rm -rf node_modules frontend-dist
$NPM_BIN install
$NPM_BIN run build
mv dist frontend-dist

echo "[6/8] Running Django deployment tasks"
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check --deploy

echo "[7/8] Installing systemd service"
sudo cp deploy/educrm.service /etc/systemd/system/educrm.service
sudo systemctl daemon-reload
sudo systemctl enable educrm
sudo systemctl restart educrm

echo "[8/8] Installing nginx site"
sudo cp deploy/educrm-nginx.conf /etc/nginx/sites-available/educrm
sudo ln -sf /etc/nginx/sites-available/educrm /etc/nginx/sites-enabled/educrm
sudo nginx -t
sudo systemctl reload nginx

echo "Deployment scaffold completed."
