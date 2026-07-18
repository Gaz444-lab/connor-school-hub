#!/bin/bash
# One-time setup on Connor's MacBook (same pattern as AccountHub).
# After Xcode CLT / git is installed:
#
#   curl -fsSL https://raw.githubusercontent.com/Gaz444-lab/connor-school-hub/main/scripts/setup-for-connor.sh | bash
#
set -euo pipefail

REPO_URL="https://github.com/Gaz444-lab/connor-school-hub.git"
INSTALL_DIR="${HOME}/Documents/connor-school-hub"
DESKTOP="${HOME}/Desktop"

echo ""
echo "📚 Setting up Connor's School Hub (Fish Hoek High · Gr 10)…"
echo ""

if ! command -v git >/dev/null 2>&1; then
  echo "Git is required. Finish Xcode Command Line Tools first, then re-run:"
  echo "  xcode-select --install"
  echo "  curl -fsSL https://raw.githubusercontent.com/Gaz444-lab/connor-school-hub/main/scripts/setup-for-connor.sh | bash"
  exit 1
fi

if [ -d "${INSTALL_DIR}/.git" ]; then
  echo "Already installed — updating…"
  git -C "$INSTALL_DIR" pull --ff-only
else
  echo "Downloading to ${INSTALL_DIR}…"
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
chmod +x *.command launch.sh scripts/*.sh 2>/dev/null || true

# Desktop: Open
cat > "${DESKTOP}/School Hub.command" << EOF
#!/bin/zsh
cd "${INSTALL_DIR}"
exec "${INSTALL_DIR}/School Hub.command"
EOF

# Desktop: Update
cat > "${DESKTOP}/Update School Hub.command" << EOF
#!/bin/zsh
cd "${INSTALL_DIR}"
exec "${INSTALL_DIR}/Update School Hub.command"
EOF

chmod +x "${DESKTOP}/School Hub.command" "${DESKTOP}/Update School Hub.command"

# Remove old shortcut name if present
rm -f "${DESKTOP}/Connor School Hub.command" 2>/dev/null || true

echo ""
echo "✅ Done!"
echo ""
echo "On Connor's Desktop:"
echo "  • School Hub.command          — open the app every day"
echo "  • Update School Hub.command   — after Dad pushes updates"
echo ""
echo "App folder: ${INSTALL_DIR}"
echo "Web backup: https://gaz444-lab.github.io/connor-school-hub/"
echo ""
echo "First open may ask macOS to allow Terminal — click Open."
echo ""
