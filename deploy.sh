#!/bin/bash
# Deploy Spelling Land to https://spelling-land.pages.dev (Cloudflare Pages project "spelling-land", public, no Access gate).
# Credentials come from ~/.bash_profile (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID), same as slides-site.
# Usage: ./deploy.sh            -> production
#        ./deploy.sh preview    -> https://preview.spelling-land.pages.dev
cd "$(dirname "$0")" || exit 1
# source credentials before enabling -e: the profile has commands that return non-zero
set -a; . ~/.bash_profile >/dev/null 2>&1; set +a
set -e
BRANCH="${1:-main}"
npx --yes wrangler@latest pages deploy public --project-name=spelling-land --branch "$BRANCH" --commit-dirty=true
