#!/bin/bash

# Check if credentials are configured
# Exit code 0 = configured, 1 = missing

CREDENTIALS_FILE="$HOME/.shipme/credentials.env"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

if [ ! -f "$CREDENTIALS_FILE" ]; then
  echo -e "${YELLOW}⚠️  Credentials not configured yet${NC}"
  echo ""
  echo "To set up credentials, run:"
  echo -e "  ${GREEN}bash .devcontainer/setup-credentials.sh${NC}"
  echo ""
  exit 1
fi

# Load credentials
source "$CREDENTIALS_FILE"

# Check which credentials are missing
MISSING=()

if [ -z "$GITHUB_TOKEN" ]; then
  MISSING+=("GitHub")
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  MISSING+=("Supabase")
fi

if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
  MISSING+=("Netlify")
fi

if [ ${#MISSING[@]} -eq 0 ]; then
  echo -e "${GREEN}✓ All credentials configured${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Missing credentials: ${MISSING[*]}${NC}"
  echo ""
  echo "To configure, run:"
  echo -e "  ${GREEN}bash .devcontainer/setup-credentials.sh${NC}"
  echo ""
  exit 1
fi
