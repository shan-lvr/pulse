#!/usr/bin/env bash
# Deploy the Pulse site to S3 + CloudFront.
#
# Required tools: npm, aws (configured)
# Override via env vars:
#   BUCKET              S3 bucket name             (default: pulse-site-shan-lvr)
#   DISTRIBUTION_ID     CloudFront distribution id (default: E12WD9U3MLQZJB)
#   REGION              AWS region                 (default: us-east-1)
#   SKIP_BUILD=1        Skip `npm run build`
#   SKIP_INVALIDATION=1 Skip CloudFront invalidation
set -euo pipefail

BUCKET="${BUCKET:-pulse-site-shan-lvr}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-E12WD9U3MLQZJB}"
REGION="${REGION:-us-east-1}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT"

log() { printf '\033[1;36m[deploy]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[deploy] %s\033[0m\n' "$*" >&2; exit 1; }

command -v aws >/dev/null || die "aws CLI not found"
command -v npm >/dev/null || die "npm not found"
aws sts get-caller-identity >/dev/null 2>&1 || die "AWS credentials not configured"

if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  log "building (npm run build)"
  npm run build
else
  log "SKIP_BUILD=1 — reusing existing dist/"
fi

[[ -d dist && -f dist/index.html ]] || die "dist/ missing or incomplete — run a build first"

log "syncing immutable assets → s3://$BUCKET"
aws s3 sync dist/ "s3://$BUCKET/" \
  --region "$REGION" \
  --exclude "index.html" \
  --cache-control "public, max-age=31536000, immutable" \
  --delete

log "uploading index.html (no-cache) → s3://$BUCKET"
aws s3 cp dist/index.html "s3://$BUCKET/index.html" \
  --region "$REGION" \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html; charset=utf-8"

if [[ "${SKIP_INVALIDATION:-}" != "1" ]]; then
  # Invalidate everything: hashed assets are safe (URLs change per build)
  # but stable-named files in public/ (SVGs, mp3s) reuse the same URL
  # with long immutable cache, so a wildcard is the only way to ensure
  # in-place edits to those files actually reach clients.
  log "creating CloudFront invalidation for /*"
  INVALIDATION_ID="$(
    aws cloudfront create-invalidation \
      --distribution-id "$DISTRIBUTION_ID" \
      --paths "/*" \
      --query 'Invalidation.Id' \
      --output text
  )"
  log "invalidation created: $INVALIDATION_ID"
else
  log "SKIP_INVALIDATION=1 — skipping"
fi

DOMAIN="$(
  aws cloudfront get-distribution \
    --id "$DISTRIBUTION_ID" \
    --query 'Distribution.DomainName' \
    --output text
)"

log "done → https://$DOMAIN/"
