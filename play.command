#!/bin/bash
# Double-click me (Mac) to play your game.
# I start a tiny local server and open your browser — then just play.
# Close this window (or press Ctrl+C) to stop.
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  exec python3 play.py
elif command -v python >/dev/null 2>&1; then
  exec python play.py
else
  echo "Python isn't installed. Get it from https://www.python.org/downloads/"
  echo "then double-click me again."
  read -n 1 -s -r -p "Press any key to close..."
fi
