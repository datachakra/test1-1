# ShipMe Starter Template

This is a template repository for projects created with [ShipMe.dev](https://shipme.dev) - automated infrastructure provisioning via GitHub Codespaces.

## What's Inside

This template includes:

- **GitHub Codespace Configuration** - Pre-configured development environment
- **MCP (Model Context Protocol) Servers** - Infrastructure automation tools
  - GitHub MCP - Repository management
  - Supabase MCP - Database & authentication
  - Netlify MCP - Hosting & deployment
- **Claude Code Integration** - AI-powered DevOps assistant
- **Project Configuration** - Your project settings in `.shipme/project.json`

## Quick Start

### 1. Open in Codespace

Click the green "Code" button → "Codespaces" → "Create codespace on main"

Or use this direct link format:
```
https://github.com/codespaces/new?repo=YOUR_REPO_ID
```

### 2. Wait for Setup (2-3 minutes)

The Codespace will automatically:
- Install Node.js and dependencies
- Build MCP servers
- Set up Claude Code with infrastructure tools
- Display setup completion message

### 3. Authenticate Services

```bash
# Authenticate GitHub CLI
gh auth login

# Add Supabase & Netlify tokens as Codespace secrets:
# Settings → Secrets → New secret
# - SUPABASE_ACCESS_TOKEN (from https://supabase.com/dashboard/account/tokens)
# - NETLIFY_AUTH_TOKEN (from https://app.netlify.com/user/applications)
```

### 4. Start Provisioning

In the terminal, ask Claude Code to provision your infrastructure:

```
@claude Read my project configuration and provision the infrastructure
```

Claude will:
- Create your Supabase database
- Run database migrations
- Configure authentication (if needed)
- Deploy to Netlify
- Set up all environment variables

## What Gets Provisioned

Based on your stack configuration in `.shipme/project.json`:

### Database (Supabase)
- PostgreSQL database
- REST API automatically generated
- Real-time subscriptions
- Authentication system
- Row Level Security (RLS) policies

### Hosting (Netlify)
- CDN deployment
- Automatic HTTPS
- Environment variables
- Continuous deployment from Git

### Authentication (Optional)
- GitHub OAuth
- Google OAuth
- Email/password
- Magic links

## Project Structure

```
.
├── .devcontainer/
│   ├── devcontainer.json       # Codespace configuration
│   └── post-create.sh          # Setup script
├── .shipme/
│   ├── project.json            # Your project config (auto-generated)
│   └── claude-instructions.md  # Instructions for Claude Code
├── mcp-servers/                # Infrastructure automation tools
│   ├── github/                 # GitHub operations
│   ├── supabase/               # Database operations
│   ├── netlify/                # Deployment operations
│   └── shared/                 # Shared utilities
├── src/                        # Your application code (add your framework here)
└── README.md                   # This file
```

## Adding Your Application Code

This is a template - add your Next.js, React, or other framework code:

```bash
# For Next.js:
npx create-next-app@latest . --typescript --tailwind --app

# For Vite + React:
npm create vite@latest . -- --template react-ts

# Or copy your existing code
```

Make sure to update `package.json` with appropriate build scripts:
- `npm run build` - Should generate production build
- `npm start` - Should start production server

## Manual Steps

Some steps require manual action:

### GitHub OAuth App (if using GitHub auth)
1. Visit https://github.com/settings/developers
2. Click "New OAuth App"
3. Settings:
   - **Homepage URL**: Your Netlify URL
   - **Callback URL**: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret when prompted by Claude

### Custom Domain (optional)
1. Add domain in Netlify dashboard
2. Update DNS records
3. Update OAuth callback URLs

## Environment Variables

Claude automatically configures these in Netlify:

```bash
# Supabase (auto-configured)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Authentication (if configured)
GITHUB_ID=your_client_id
GITHUB_SECRET=your_client_secret

# Security
NEXTAUTH_SECRET=auto_generated_random_string
```

## Troubleshooting

### "MCP servers not found"
Run: `cd mcp-servers && npm run build`

### "Authentication failed"
- Check that tokens are set as Codespace secrets
- Verify tokens are not expired
- Run `gh auth status` to check GitHub auth

### "Supabase project creation slow"
- Normal - takes 30-60 seconds to provision
- Claude will wait automatically

### "Some environment variables not set"
- Some may fail silently on Netlify
- Manually verify in Netlify dashboard: Site Settings → Environment Variables

## What Happens During Provisioning

Claude Code will:

1. **Read Configuration** - Understand your project requirements
2. **Create Supabase Project** - ~1-2 minutes
3. **Run Migrations** - Set up database schema (~10 seconds)
4. **Configure Auth** - Set up OAuth providers (manual step)
5. **Build Application** - Create production build (~30-60 seconds)
6. **Create Netlify Site** - Set up hosting (~10 seconds)
7. **Set Environment Variables** - Configure all secrets (~20 seconds)
8. **Deploy** - Push to production (~2-5 minutes)

**Total time: 8-15 minutes**

## Architecture

```
GitHub Codespace
    ↓
Claude Code (AI orchestrator)
    ↓
MCP Servers (infrastructure tools)
    ↓
Cloud Services (Supabase, Netlify, etc.)
    ↓
Your Application (LIVE!)
```

## Support

- **ShipMe Documentation**: https://shipme.dev/docs
- **MCP Protocol**: https://modelcontextprotocol.io
- **Issues**: https://github.com/YOUR_ORG/shipme.dev/issues

## Created By

This project was created with [ShipMe.dev](https://shipme.dev) - Ship faster with AI-powered infrastructure automation.

## License

Your code, your license. ShipMe infrastructure code is MIT licensed.
