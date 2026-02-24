# Credentials Setup Guide

## Overview

ShipMe uses an **interactive credential setup** approach. Instead of requiring all credentials upfront when creating the Codespace, you can configure them **after the Codespace starts** using a simple wizard.

## Why This Approach?

- ✅ **Skip the hassle**: No need to gather all tokens before starting
- ✅ **Configure when ready**: Set up credentials only when you need them
- ✅ **Secure storage**: Credentials stored locally in your Codespace (never committed to git)
- ✅ **Easy reconfiguration**: Re-run the wizard anytime to update credentials

## Getting Started

### Step 1: Launch Your Codespace

When you click "Create Codespace" on GitHub, **you don't need to fill in any secrets**. Just click "Create codespace" and wait for it to start.

### Step 2: Run the Setup Wizard

Once your Codespace is ready, open the terminal and run:

```bash
bash .devcontainer/setup-credentials.sh
```

This interactive wizard will guide you through configuring:

1. **GitHub Authentication** (uses `gh auth login` - fully automated)
2. **Supabase Credentials** (optional - for database provisioning)
3. **Netlify Credentials** (optional - for site deployment)

### Step 3: Start Provisioning

After credentials are configured, Claude Code can automatically provision your infrastructure using the MCP servers.

## What Credentials Do I Need?

### GitHub (Required)

- **What**: GitHub Personal Access Token
- **Used for**: Creating repositories, managing Codespaces
- **How to get**: Automatically configured via `gh auth login`
- **Required permissions**: `repo`, `read:user`

### Supabase (Optional)

- **What**: Supabase Management API Token
- **Used for**: Creating Supabase projects, running migrations
- **How to get**: [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
- **Optional**: Organization ID (defaults to your first organization)

### Netlify (Optional)

- **What**: Netlify Personal Access Token
- **Used for**: Creating sites, deploying applications
- **How to get**: [https://app.netlify.com/user/applications](https://app.netlify.com/user/applications)
- **Required permissions**: Full access

## FAQ

### Do I need all credentials immediately?

No! You can skip any credential during setup and configure it later when you're ready to use that service.

### Where are credentials stored?

Credentials are stored securely in `~/.shipme/credentials.env` inside your Codespace. This file is:
- **Local only** (never committed to git)
- **Permissions**: 600 (readable only by you)
- **Temporary**: Exists only while the Codespace is running

### How do I update credentials?

Simply re-run the setup wizard:

```bash
bash .devcontainer/setup-credentials.sh
```

### Can I check which credentials are configured?

Yes! Run:

```bash
bash .devcontainer/check-credentials.sh
```

This will show you which credentials are configured and which are missing.

### How do I use credentials in my shell?

Load them into your current shell session:

```bash
source ~/.shipme/credentials.env
```

Now environment variables like `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, etc. are available.

## Security Best Practices

1. ✅ **Never commit** `.shipme/credentials.env` to git (already in `.gitignore`)
2. ✅ **Use personal tokens** with minimal required permissions
3. ✅ **Revoke tokens** when no longer needed
4. ✅ **Delete Codespace** when done to remove all stored credentials

## Troubleshooting

### "Permission denied" when running setup script

Make the script executable:

```bash
chmod +x .devcontainer/setup-credentials.sh
```

### "gh: command not found"

GitHub CLI should be pre-installed. If not, restart your Codespace.

### MCP servers not finding credentials

Make sure to load credentials before using MCP tools:

```bash
source ~/.shipme/credentials.env
```

Or add this to your `~/.bashrc`:

```bash
if [ -f ~/.shipme/credentials.env ]; then
  source ~/.shipme/credentials.env
fi
```

## Alternative: Pre-Configure Secrets (Advanced)

If you prefer to pre-configure secrets (for automation or team use), you can still add them as Codespace secrets:

1. Go to your repository settings
2. Navigate to Secrets → Codespaces
3. Add the following secrets:
   - `GITHUB_TOKEN`
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_ORG_ID`
   - `NETLIFY_AUTH_TOKEN`

These will be automatically available as environment variables in your Codespace.

## Need Help?

If you encounter issues with credential setup, please:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Security Best Practices](#security-best-practices)
3. Open an issue on GitHub with details about your setup

---

**Next Steps**: After configuring credentials, you're ready to provision infrastructure! Type `@claude help` to get started.
