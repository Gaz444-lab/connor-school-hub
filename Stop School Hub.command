#!/bin/zsh
cd "$(dirname "$0")"
PID_FILE=".server.pid"
PORT=8765

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    echo "Stopped School Hub (PID $PID)"
  fi
  rm -f "$PID_FILE"
fi

if lsof -ti :$PORT >/dev/null 2>&1; then
  lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
  echo "Cleared port $PORT"
fi

echo "School Hub stopped."
sleep 2
