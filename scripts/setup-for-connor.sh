#!/bin/bash
# Run this once on Connor's MacBook to download the app and create a Desktop shortcut.
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Gaz444-lab/connor-school-hub/main/scripts/setup-for-connor.sh | bash
# Or after cloning:
#   bash scripts/setup-for-connor.sh

set -euo pipefail

REPO_URL="https://github.com/Gaz444-lab/connor-school-hub.git"
INSTALL_DIR="${HOME}/Documents/connor-school-hub"
DESKTOP="${HOME}/Desktop"

echo "📚 Setting up Connor's School Hub…"

if ! command -v git >/dev/null 2>&1; then
  echo "Git is required. Install Xcode Command Line Tools:"
  echo "  xcode-select --install"
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

chmod +x "${INSTALL_DIR}/Open School Hub.command" 2>/dev/null || true
chmod +x "${INSTALL_DIR}/scripts/"*.sh 2>/dev/null || true

# Desktop shortcut that always pulls latest then opens the app
SHORTCUT="${DESKTOP}/Connor School Hub.command"
cat > "$SHORTCUT" << EOF
#!/bin/bash
cd "${INSTALL_DIR}"
echo "Checking for updates…"
git pull --ff-only 2>/dev/null || true
exec bash "${INSTALL_DIR}/Open School Hub.command"
EOF
chmod +x "$SHORTCUT"

echo ""
echo "✅ Done!"
echo ""
echo "To open the app:"
echo "  • Double-click  \"Connor School Hub\"  on the Desktop"
echo "  • Or double-click  \"Open School Hub.command\"  in:"
echo "      ${INSTALL_DIR}"
echo ""
echo "The Desktop shortcut pulls the latest version from GitHub each time."
echo "First launch may ask macOS to allow Terminal — click Open / Allow."
echo ""
