#!/bin/bash

# ShipMe Credential Setup Wizard
# This script helps users configure their credentials interactively

set -e

CREDENTIALS_FILE="$HOME/.shipme/credentials.env"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║           ShipMe Credential Setup Wizard                     ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${YELLOW}This wizard will help you configure credentials for infrastructure provisioning.${NC}"
echo -e "${YELLOW}You can skip any credential and set it up later when needed.${NC}"
echo ""

# Create credentials directory
mkdir -p "$HOME/.shipme"

# Check if credentials file exists
if [ -f "$CREDENTIALS_FILE" ]; then
  echo -e "${GREEN}✓ Existing credentials found${NC}"
  echo ""
  read -p "Do you want to reconfigure? (y/N): " reconfigure
  if [[ ! $reconfigure =~ ^[Yy]$ ]]; then
    echo "Keeping existing credentials."
    exit 0
  fi
  echo ""
fi

# GitHub Authentication
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}1. GitHub Authentication${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "GitHub CLI will handle authentication automatically."
echo "This is used for creating repositories and managing Codespaces."
echo ""
read -p "Authenticate with GitHub now? (Y/n): " github_auth
if [[ ! $github_auth =~ ^[Nn]$ ]]; then
  echo "Running: gh auth login"
  gh auth login
  GITHUB_TOKEN=$(gh auth token)
  echo "GITHUB_TOKEN=$GITHUB_TOKEN" >> "$CREDENTIALS_FILE"
  echo -e "${GREEN}✓ GitHub authentication complete${NC}"
else
  echo "⊘ Skipped GitHub authentication"
fi

echo ""
echo ""

# Supabase Credentials
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}2. Supabase Credentials${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Supabase credentials are used for database provisioning."
echo ""
echo -e "Get your credentials from: ${YELLOW}https://supabase.com/dashboard/account/tokens${NC}"
echo ""
read -p "Do you want to configure Supabase now? (y/N): " supabase_config
if [[ $supabase_config =~ ^[Yy]$ ]]; then
  echo ""
  read -p "Enter Supabase Access Token: " -s supabase_token
  echo ""
  if [ -n "$supabase_token" ]; then
    echo "SUPABASE_ACCESS_TOKEN=$supabase_token" >> "$CREDENTIALS_FILE"
    echo -e "${GREEN}✓ Supabase access token saved${NC}"
  fi

  echo ""
  read -p "Enter Supabase Organization ID (optional): " supabase_org
  if [ -n "$supabase_org" ]; then
    echo "SUPABASE_ORG_ID=$supabase_org" >> "$CREDENTIALS_FILE"
    echo -e "${GREEN}✓ Supabase organization ID saved${NC}"
  fi
else
  echo "⊘ Skipped Supabase configuration"
fi

echo ""
echo ""

# Netlify Credentials
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}3. Netlify Credentials${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Netlify credentials are used for site deployment."
echo ""
echo -e "Get your token from: ${YELLOW}https://app.netlify.com/user/applications${NC}"
echo ""
read -p "Do you want to configure Netlify now? (y/N): " netlify_config
if [[ $netlify_config =~ ^[Yy]$ ]]; then
  echo ""
  read -p "Enter Netlify Auth Token: " -s netlify_token
  echo ""
  if [ -n "$netlify_token" ]; then
    echo "NETLIFY_AUTH_TOKEN=$netlify_token" >> "$CREDENTIALS_FILE"
    echo -e "${GREEN}✓ Netlify auth token saved${NC}"
  fi
else
  echo "⊘ Skipped Netlify configuration"
fi

echo ""
echo ""

# Secure the credentials file
chmod 600 "$CREDENTIALS_FILE"

# Summary
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Setup Complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Credentials saved to: ${YELLOW}$CREDENTIALS_FILE${NC}"
echo ""
echo -e "${GREEN}You can now start provisioning infrastructure!${NC}"
echo ""
echo "To reconfigure later, run:"
echo -e "  ${YELLOW}bash .devcontainer/setup-credentials.sh${NC}"
echo ""
echo "To load credentials in your current shell:"
echo -e "  ${YELLOW}source ~/.shipme/credentials.env${NC}"
echo ""
