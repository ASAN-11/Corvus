#!/bin/sh
cd "$(dirname "$0")/.." || exit 1
command -v python3 >/dev/null || { echo "Python 3 required"; exit 1; }
command -v ollama >/dev/null || echo "Note: ollama not on PATH (fine if it runs elsewhere)"
exec python3 server/server.py
