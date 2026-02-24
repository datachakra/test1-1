#!/bin/bash

# ShipMe: Welcome script — runs via postAttachCommand in a visible terminal.
# Infrastructure (Supabase, Netlify, GitHub repo) is already provisioned by shipme.dev.
# This script just welcomes you and offers to start Claude Code interactively.

# Source environment (credentials set by post-create.sh)
if [ -f "$HOME/.shipme-env" ]; then
  source "$HOME/.shipme-env"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║            Welcome to your ShipMe project            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Show project info if available
if [ -f ".shipme/project.json" ]; then
  PROJECT_NAME=$(node -e "try{const p=require('./.shipme/project.json');console.log(p.name||'')}catch{}" 2>/dev/null)
  if [ -n "$PROJECT_NAME" ]; then
    echo "  Project: $PROJECT_NAME"
    echo ""
  fi
fi

echo "  Your infrastructure is already live:"
echo ""
echo "  • GitHub repo:   this workspace"
echo "  • Supabase:      connected (see NEXT_PUBLIC_SUPABASE_URL)"
echo "  • Netlify:       deployed (check your Netlify dashboard)"
echo ""
echo "  Start developing:"
echo ""
echo "    npm run dev    — local dev server"
echo "    claude         — interactive Claude Code session"
echo ""
echo "══════════════════════════════════════════════════════"
echo ""

# Verify API key is available
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "  Note: ANTHROPIC_API_KEY is not set."
  echo "  To use Claude Code: export ANTHROPIC_API_KEY=sk-ant-..."
  echo ""
  exit 0
fi

# Verify Claude Code CLI is installed
if ! command -v claude &>/dev/null; then
  echo "  Installing Claude Code CLI..."
  npm install -g @anthropic-ai/claude-code 2>&1 | tail -1
  echo ""
fi

# Launch Claude Code interactively
exec claude
