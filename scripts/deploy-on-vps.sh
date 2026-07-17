#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-$HOME/ReWear}"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
NODE_MAJOR_VERSION="${NODE_MAJOR_VERSION:-24}"

if [[ ! -d "$APP_DIR" || ! -f "$APP_DIR/package.json" ]]; then
  echo "The application directory is missing or does not contain package.json: $APP_DIR" >&2
  exit 1
fi

if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "nvm was not found at $NVM_DIR/nvm.sh" >&2
  exit 1
fi

source "$NVM_DIR/nvm.sh"
nvm use "$NODE_MAJOR_VERSION" >/dev/null

cd "$APP_DIR"

npm install --global pnpm@11.9.0 --no-audit --no-fund
pnpm install --frozen-lockfile
pnpm run build

sudo -n /usr/bin/systemctl restart rewear
sudo -n /usr/bin/systemctl is-active rewear
