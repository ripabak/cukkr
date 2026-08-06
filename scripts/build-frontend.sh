#!/bin/bash
# ============================================================
# Build Cukkr frontend (Expo web) Docker image with the
# correct public URLs baked in.
#
# Usage:
#   ./scripts/build-frontend.sh [--tag cukkr-frontend:latest]
#
# Reads PUBLIC_* vars from the root .env (or environment).
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# Load root .env if present (does not override existing env vars)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

TAG="${1:-cukkr-frontend:latest}"

# Required public URLs — fail loudly if missing
PUBLIC_API_URL="${PUBLIC_API_URL:-}"
PUBLIC_AUTH_URL="${PUBLIC_AUTH_URL:-}"
PUBLIC_WEB_URL="${PUBLIC_WEB_URL:-}"
VAPID_PUBLIC_KEY="${VAPID_PUBLIC_KEY:-}"

missing=0
[ -z "$PUBLIC_API_URL" ] && { echo "❌ PUBLIC_API_URL is not set"; missing=1; }
[ -z "$PUBLIC_AUTH_URL" ] && { echo "❌ PUBLIC_AUTH_URL is not set"; missing=1; }
[ -z "$PUBLIC_WEB_URL" ] && { echo "❌ PUBLIC_WEB_URL is not set"; missing=1; }
[ -z "$VAPID_PUBLIC_KEY" ] && { echo "❌ VAPID_PUBLIC_KEY is not set"; missing=1; }
if [ "$missing" -eq 1 ]; then
  echo ""
  echo "Set them in the root .env file, e.g.:"
  echo "  PUBLIC_API_URL=https://api.cukkr.com"
  echo "  PUBLIC_AUTH_URL=https://api.cukkr.com/auth/api"
  echo "  PUBLIC_WEB_URL=https://cukkr.com"
  echo "  VAPID_PUBLIC_KEY=<your-vapid-public-key>"
  exit 1
fi

echo "🚀 Building $TAG"
echo "   API_URL : $PUBLIC_API_URL"
echo "   AUTH_URL: $PUBLIC_AUTH_URL"
echo "   WEB_URL : $PUBLIC_WEB_URL"

docker build ./cukkr-frontend \
  -t "$TAG" \
  --build-arg "EXPO_PUBLIC_ENV_CODE=production" \
  --build-arg "EXPO_PUBLIC_ENV_API_URL=$PUBLIC_API_URL" \
  --build-arg "EXPO_PUBLIC_ENV_AUTH_URL=$PUBLIC_AUTH_URL" \
  --build-arg "EXPO_PUBLIC_WEB_URL=$PUBLIC_WEB_URL" \
  --build-arg "EXPO_PUBLIC_VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY"

echo "✅ Done: $TAG"
echo "   Next: docker stop/rm the old frontend container, then run:"
echo "   docker run -d --name cukkr-frontend -p 8080:8080 $TAG"
