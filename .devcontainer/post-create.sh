#!/bin/bash

# ShipMe Post-Create Setup
# This script must ALWAYS exit 0 to prevent recovery mode.
# Individual step failures are logged but never stop the setup.

echo ""
echo "======================================================"
echo "  ShipMe Development Environment Setup"
echo "======================================================"
echo ""

# Step 1: Check project configuration
if [ ! -f ".shipme/project.json" ]; then
  echo "Warning: No project configuration found at .shipme/project.json"
  echo "This file should have been created by shipme.dev during repository creation."
  echo ""
fi

# Step 2: Install project dependencies (if any)
if [ -f "package.json" ]; then
  echo "[1/5] Installing project dependencies..."
  npm install 2>&1 || echo "  Warning: npm install had issues (non-critical)"
  echo "  Done."
else
  echo "[1/5] No package.json found, skipping dependency install."
fi

# Step 3: Build MCP servers (run in subshell so cd doesn't affect parent)
echo "[2/5] Building MCP servers..."
if [ -d "mcp-servers" ]; then
  (
    cd mcp-servers
    npm install 2>&1 || echo "  Warning: mcp-servers npm install had issues"
    npm run build 2>&1 || echo "  Warning: mcp-servers build had issues"
  )
  echo "  Done."
else
  echo "  Warning: mcp-servers directory not found, skipping."
fi

# Step 4: Install global tools
echo "[3/5] Installing global tools..."
npm install -g netlify-cli 2>&1 || echo "  Warning: netlify-cli install failed (non-critical)"
npm install -g supabase 2>&1 || echo "  Warning: supabase install failed (non-critical)"
echo "  Done."

# Step 5: Install Claude Code CLI
echo "[4/5] Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code 2>&1 || echo "  Warning: claude-code install failed"
echo "  Done."

# Pre-configure Claude Code to skip first-time onboarding (theme picker, login screen)
# This must happen AFTER Claude CLI install but BEFORE auto-launch-claude.sh runs
mkdir -p "$HOME/.claude"
cat > "$HOME/.claude.json" << 'CEOF'
{
  "hasCompletedOnboarding": true,
  "hasTrustDialogAccepted": true,
  "hasTrustDialogHooksAccepted": true
}
CEOF
echo "  Claude Code onboarding pre-configured."

# Step 6: Retrieve ALL credentials via provisioning token
echo "[5/5] Configuring credentials..."

# Always attempt provisioning token redemption (even if some env vars are set)
# This delivers: Anthropic API key, Supabase token, Netlify token, GitHub token
if [ -f ".shipme/project.json" ]; then
  PROVISIONING_TOKEN=$(node -e "
    try {
      const c = JSON.parse(require('fs').readFileSync('.shipme/project.json', 'utf8'));
      if (c.provisioningToken) process.stdout.write(c.provisioningToken);
    } catch(e) {}
  " 2>/dev/null)

  if [ -n "$PROVISIONING_TOKEN" ]; then
    echo "  Redeeming provisioning token from ShipMe..."
    RESPONSE=$(curl -s -X POST https://shipme.dev/api/provisioning-token/redeem \
      -H "Content-Type: application/json" \
      -d "{\"token\": \"$PROVISIONING_TOKEN\"}")

    # Parse ALL tokens from the response
    API_KEY=$(node -e "try{const r=JSON.parse(process.argv[1]);if(r.anthropic_api_key)process.stdout.write(r.anthropic_api_key)}catch(e){}" "$RESPONSE" 2>/dev/null)
    SB_TOKEN=$(node -e "try{const r=JSON.parse(process.argv[1]);if(r.supabase_access_token)process.stdout.write(r.supabase_access_token)}catch(e){}" "$RESPONSE" 2>/dev/null)
    SB_ORG_ID=$(node -e "try{const r=JSON.parse(process.argv[1]);if(r.supabase_org_id)process.stdout.write(r.supabase_org_id)}catch(e){}" "$RESPONSE" 2>/dev/null)
    NF_TOKEN=$(node -e "try{const r=JSON.parse(process.argv[1]);if(r.netlify_auth_token)process.stdout.write(r.netlify_auth_token)}catch(e){}" "$RESPONSE" 2>/dev/null)
    GH_TOKEN=$(node -e "try{const r=JSON.parse(process.argv[1]);if(r.github_token)process.stdout.write(r.github_token)}catch(e){}" "$RESPONSE" 2>/dev/null)

    if [ -n "$API_KEY" ]; then
      # Build env file with all available tokens
      : > ~/.shipme-env  # Clear/create the file

      echo "export ANTHROPIC_API_KEY=$API_KEY" >> ~/.shipme-env
      [ -n "$SB_TOKEN" ] && echo "export SUPABASE_ACCESS_TOKEN=$SB_TOKEN" >> ~/.shipme-env
      [ -n "$SB_ORG_ID" ] && echo "export SUPABASE_ORG_ID=$SB_ORG_ID" >> ~/.shipme-env
      [ -n "$NF_TOKEN" ] && echo "export NETLIFY_AUTH_TOKEN=$NF_TOKEN" >> ~/.shipme-env
      [ -n "$GH_TOKEN" ] && echo "export GITHUB_TOKEN=$GH_TOKEN" >> ~/.shipme-env

      # Also persist to bashrc for interactive sessions
      cat ~/.shipme-env >> ~/.bashrc
      cat ~/.shipme-env >> ~/.profile

      # Export for current process
      source ~/.shipme-env

      echo "  Credentials configured:"
      echo "    ANTHROPIC_API_KEY: set"
      [ -n "$SB_TOKEN" ] && echo "    SUPABASE_ACCESS_TOKEN: set" || echo "    SUPABASE_ACCESS_TOKEN: not provided"
      [ -n "$SB_ORG_ID" ] && echo "    SUPABASE_ORG_ID: set ($SB_ORG_ID)" || echo "    SUPABASE_ORG_ID: not provided"
      [ -n "$NF_TOKEN" ] && echo "    NETLIFY_AUTH_TOKEN: set" || echo "    NETLIFY_AUTH_TOKEN: not provided"
      [ -n "$GH_TOKEN" ] && echo "    GITHUB_TOKEN: set" || echo "    GITHUB_TOKEN: not provided"

      # Remove the provisioning token from project.json (security cleanup)
      node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('.shipme/project.json', 'utf8'));
        delete config.provisioningToken;
        fs.writeFileSync('.shipme/project.json', JSON.stringify(config, null, 2));
      " 2>/dev/null
      git add .shipme/project.json 2>/dev/null
      git commit -m "Remove provisioning token (redeemed)" --no-verify 2>/dev/null || true
    else
      echo "  Token redemption failed. Response: $RESPONSE"
    fi
  else
    echo "  No provisioning token in project.json."
  fi
else
  echo "  No project config found."
fi

# Fallback: check if credentials are set via Codespace secrets
[ -z "$ANTHROPIC_API_KEY" ] && echo "  Warning: ANTHROPIC_API_KEY not set. Claude Code won't auto-launch."
[ -z "$SUPABASE_ACCESS_TOKEN" ] && echo "  Warning: SUPABASE_ACCESS_TOKEN not set. Supabase provisioning will be skipped."
[ -z "$NETLIFY_AUTH_TOKEN" ] && echo "  Warning: NETLIFY_AUTH_TOKEN not set. Netlify provisioning will be skipped."

echo ""
echo "======================================================"
echo "  Setup Complete!"
echo "======================================================"
echo ""
echo "  Claude Code will auto-launch when the terminal opens"
echo "  and begin infrastructure provisioning automatically."
echo ""
echo "======================================================"
echo ""

# Display project info if available
if [ -f ".shipme/project.json" ]; then
  echo "Project Configuration:"
  cat .shipme/project.json
  echo ""
fi

# CRITICAL: Always exit 0 to prevent Codespace recovery mode
exit 0
