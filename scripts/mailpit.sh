#!/usr/bin/env bash
set -euo pipefail

# Arranca Mailpit para desarrollo local sin necesidad de Docker.
# La primera vez descarga el binario oficial en la caché del usuario.
#
# Uso:
#   ./scripts/mailpit.sh
#
# Variables opcionales:
#   MAILPIT_VERSION=v1.34.0
#   MAILPIT_SMTP_PORT=1025
#   MAILPIT_UI_PORT=8025

VERSION="${MAILPIT_VERSION:-v1.34.0}"
SMTP_PORT="${MAILPIT_SMTP_PORT:-1025}"
UI_PORT="${MAILPIT_UI_PORT:-8025}"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/carhealth-mailpit"
BINARY="$CACHE_DIR/mailpit"

if [[ ! -x "$BINARY" ]]; then
  case "$(uname -m)" in
    x86_64 | amd64) ASSET="mailpit-linux-amd64.tar.gz" ;;
    aarch64 | arm64) ASSET="mailpit-linux-arm64.tar.gz" ;;
    *)
      echo "Arquitectura no soportada: $(uname -m)" >&2
      echo "Descarga Mailpit manualmente desde https://github.com/axllent/mailpit/releases" >&2
      exit 1
      ;;
  esac

  command -v curl >/dev/null || {
    echo "Falta curl para descargar Mailpit." >&2
    exit 1
  }

  mkdir -p "$CACHE_DIR"
  TEMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$TEMP_DIR"' EXIT

  echo "Descargando Mailpit $VERSION..."
  curl -fsSL \
    "https://github.com/axllent/mailpit/releases/download/$VERSION/$ASSET" \
    | tar -xz -C "$TEMP_DIR" mailpit
  install -m 755 "$TEMP_DIR/mailpit" "$BINARY"
  trap - EXIT
  rm -rf "$TEMP_DIR"
fi

echo "Mailpit: http://127.0.0.1:$UI_PORT"
echo "SMTP:    127.0.0.1:$SMTP_PORT"
echo "Pulsa Ctrl+C para detenerlo."

exec "$BINARY" \
  --listen "127.0.0.1:$UI_PORT" \
  --smtp "127.0.0.1:$SMTP_PORT"
