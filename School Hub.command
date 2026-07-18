#!/bin/zsh
# Double-click to start Connor's School Hub (same idea as AccountHub.command)
cd "$(dirname "$0")"
./launch.sh
echo ""
echo "School Hub is running. Leave this window open while Connor uses the app."
echo "To stop later: double-click Stop School Hub.command"
echo ""
read -r "?Press Enter to close this window… "
