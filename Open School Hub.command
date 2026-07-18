#!/bin/bash
# Double-click this on a Mac to open Connor's School Hub in the browser.
# Works from a local clone of the repo (same folder as index.html).

set -e
cd "$(dirname "$0")"

PORT=8765
URL="http://127.0.0.1:${PORT}/"

# Prefer Python (preinstalled on macOS)
if command -v python3 >/dev/null 2>&1; then
  # Open browser after a short delay so the server is up
  (sleep 0.6 && open "$URL") &
  echo "Connor's School Hub is running at $URL"
  echo "Leave this window open while you use the app."
  echo "Press Ctrl+C to stop."
  exec python3 -m http.server "$PORT"
fi

# Fallback: open the HTML file directly (still works; some browsers prefer a server)
open "index.html"
echo "Opened index.html (no local server — python3 was not found)."
read -r -p "Press Enter to close…"
