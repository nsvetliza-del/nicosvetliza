#!/bin/bash
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
clear
if ! command -v node >/dev/null 2>&1; then
  echo "Falta Node.js en esta Mac."
  read -n 1 -s -r -p "Tocá una tecla para cerrar..."
  exit 1
fi
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Falta ffmpeg en esta Mac (se instala con: brew install ffmpeg)."
  read -n 1 -s -r -p "Tocá una tecla para cerrar..."
  exit 1
fi
node scripts/subir/server.mjs
