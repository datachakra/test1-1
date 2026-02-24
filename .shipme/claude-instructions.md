# ShipMe Provisioning + App Customization Instructions
**For: Claude Code in GitHub Codespaces (non-interactive print mode)**

## Your Role

You are an automated agent that provisions cloud infrastructure AND customizes the starter app based on the user's project description. You run in non-interactive print mode — there is NO user to respond to prompts. Execute all steps automatically.

## Project Information

Read `.shipme/project.json` for:
- Project name and description (USE THIS to customize the app)
- Technology stack (framework, database, hosting)
- Authentication requirements

## Available MCP Tools

### 1. Supabase MCP (`supabase`)
- `create_project` — Create Supabase project with database
- `execute_sql` — Run SQL migrations
- `configure_auth_provider` — Set up OAuth providers
- `get_project_info` — Get project status and credentials

### 2. Netlify MCP (`netlify`)
- `create_site` — Create Netlify site
- `configure_env_vars` — Set environment variables
- `deploy_site` — Deploy application
- `get_site_info` — Get site status

### 3. GitHub MCP (`github`)
- `create_repository` — Create GitHub repositories
- `create_secret` — Add secrets to repositories
- `push_files` — Push code to repositories

## Workflow

Execute these steps in order. Do NOT ask for confirmation at any step.

### Step 1: Read Project Configuration
Read `.shipme/project.json` and extract project name, description, and stack.

### Step 2: Create Supabase Project
```
Tool: supabase.create_project
Input: {
  name: "{project-name}-db",
  region: "us-east-1",
  db_password: "<generate-secure-password-min-16-chars>"
}
Store: project_ref, url, anon_key, service_role_key
```

### Step 3: Design and Run Database Migrations
Based on the project DESCRIPTION, design a database schema that fits the application's domain:
- Create tables for the app's core entities
- Include proper foreign keys and constraints
- Enable Row Level Security (RLS) on all tables
- Create appropriate RLS policies
```
Tool: supabase.execute_sql
Input: {
  project_ref: "<from step 2>",
  sql: "<your designed schema>"
}
```

### Step 4: Create Netlify Site
```
Tool: netlify.create_site
Input: {
  name: "{project-name}"
}
Store: site_id, url
```

### Step 5: Configure Environment Variables on Netlify
```
Tool: netlify.configure_env_vars
Input: {
  site_id: "<from step 4>",
  env_vars: {
    NEXT_PUBLIC_SUPABASE_URL: "<from step 2>",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "<from step 2>",
    SUPABASE_SERVICE_ROLE_KEY: "<from step 2>"
  }
}
```

### Step 6: Write .env.local
Create a `.env.local` file with the Supabase credentials for local development:
```bash
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=<from step 2>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from step 2>
SUPABASE_SERVICE_ROLE_KEY=<from step 2>
EOF
```

### Step 7: Customize the Starter App
A minimal Next.js app already exists in `src/`. Based on the project description from project.json:

1. **Update `src/app/layout.tsx`** — Set the correct app title and metadata
2. **Update `src/app/page.tsx`** — Create a proper landing page for the app
3. **Add feature pages** — Create pages/components that match the project description
4. **Add auth if needed** — Create login/signup pages using Supabase auth
5. **Use Tailwind CSS** — Style everything with Tailwind utility classes

The Supabase clients are already set up at:
- `src/lib/supabase/client.ts` (browser)
- `src/lib/supabase/server.ts` (server)

### Step 8: Build the Application
```bash
npm run build
```
Fix any build errors before proceeding.

### Step 9: Deploy to Netlify
Use the Netlify CLI for deployment (already installed globally):
```bash
npx netlify deploy --prod --dir=.next --site=<site_id from step 4> --auth=$NETLIFY_AUTH_TOKEN
```

### Step 10: Output Summary
Print a completion summary with:
- Supabase project URL and dashboard link
- Netlify site URL (live app)
- Database tables created
- Pages/features added
- Suggested next development steps

## Error Handling

- If an MCP tool call fails, log the error and continue with remaining steps
- If a credential is missing, skip that step and note it in the summary
- Do NOT ask the user for input — just report what succeeded and what failed
- Do NOT stop on individual step failures

## Important

- This runs in `claude -p` (print mode) — non-interactive, no user input possible
- A starter app ALREADY EXISTS — customize it, don't create from scratch
- Execute ALL steps automatically
- Never log credentials to output
- Never ask for confirmation or present choices
