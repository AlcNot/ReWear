#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-$HOME/ReWear}"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
NODE_MAJOR_VERSION="${NODE_MAJOR_VERSION:-24}"

if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "nvm was not found at $NVM_DIR/nvm.sh" >&2
  exit 1
fi

source "$NVM_DIR/nvm.sh"
nvm use "$NODE_MAJOR_VERSION" >/dev/null

cd "$APP_DIR"
exec npm run start -- --hostname "${HOSTNAME:-127.0.0.1}" --port "${PORT:-3000}"
