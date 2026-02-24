# ShipMe Project

This is a ShipMe-provisioned project. Your infrastructure is **already live**:
- GitHub repo: this workspace
- Supabase database: running (credentials in env vars below)
- Netlify site: deployed and auto-deploys on push to `main`

## Your Role

Help the user **customize and build out this app**. Infrastructure setup is complete — no need to create Supabase projects, Netlify sites, or configure OAuth providers. Just focus on building features.

## Project Details

Read `.shipme/project.json` for the project name, description, and stack.

## What's Already Here

A minimal Next.js + Supabase + Tailwind starter in `src/`:
- `src/app/layout.tsx` — Root layout
- `src/app/page.tsx` — Landing page (reads project.json)
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server Supabase client

Customize this existing app. Do NOT scaffold a new project from scratch.

## Credentials (already in env)

```
NEXT_PUBLIC_SUPABASE_URL      — your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — public anon key
SUPABASE_SERVICE_ROLE_KEY     — service role key (server-side only)
ANTHROPIC_API_KEY             — for Claude Code
```

## Development

```bash
npm run dev      # local dev server at http://localhost:3000
npm run build    # production build
git push         # triggers Netlify auto-deploy
```

## Common First Steps

1. Read `.shipme/project.json` to understand the project
2. Check `src/app/page.tsx` — customize the landing page
3. Add your first feature based on the project description
4. Run `npm run dev` to preview locally
5. Push to `main` to deploy automatically
