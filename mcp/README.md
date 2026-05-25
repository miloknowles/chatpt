# ChatPT MCP Server (HTTP / Serverless)

This MCP server now uses **Streamable HTTP** in **stateless mode**, so it can run as Vercel Functions out of the box.

## Endpoints

- `POST /api/mcp` (main MCP endpoint)
- `GET /api/health` (health check)

## Tools

- `auth_info`
- `update_user_metadata`
- `list_user_sessions`
- `create_user_session`
- `list_user_exercises`
- `create_user_exercise`
- `update_user_exercise`
- `delete_user_exercise`
- `log_user_exercise`
- `update_user_quality_status`
- `create_user_note`

Each tool uses bearer auth from the request header (`Authorization: Bearer <token>`). The server verifies the user with Supabase and relies on RLS owner policies.

### User metadata mutation design

- `update_user_metadata`: updates authenticated Supabase Auth user metadata. Currently accepts `displayName` and stores it as `display_name`.

### Exercise library mutation design

- `create_user_exercise`: adds an exercise record in `user_exercises`.
- `update_user_exercise`: updates only fields explicitly provided (`name`, `notes`, `imageUrl`, `videoUrl`, `tags`, `performance`).
- `delete_user_exercise`: hard-deletes a single exercise by `exerciseId`.
- All mutations are user-scoped (`user_id` + `id`) and enforced by both query filters and Supabase RLS owner policies.

## Environment variables

Create `.env` in `mcp/` (or configure these in Vercel project env vars):

```env
MCP_SUPABASE_URL=...
MCP_SUPABASE_PUBLISHABLE_KEY=...
```

Fallbacks also supported:

- `MCP_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Local env loading is automatic in the MCP server:

- Reads `mcp/.env.local` first, then `mcp/.env`
- Does not override variables already exported in the shell/process

## Run locally

### Option 1: Local Node HTTP server

```bash
cd mcp
cp .env.example .env
yarn install
yarn dev
```

Local URLs:

- `http://localhost:3334/mcp`
- `http://localhost:3334/health`

Set `MCP_PORT` to override `3334`.

### Option 2: Vercel local runtime

```bash
cd mcp
yarn install
yarn dev:vercel
```

This runs the same `/api/*` functions that production uses.

## Connect from Codex (local)

Use these steps to connect Codex to your local MCP server.

1. Start the MCP server:

```bash
cd /Users/miloknowles/code/chatpt/mcp
yarn install
yarn dev
```

2. Copy a bearer token from app settings:
   - Open `/training/settings` in your app.
   - Copy the value from **MCP Access Token**.

3. Export token in your shell:

```bash
export CHATPT_MCP_TOKEN='<paste-token>'
```

4. Register MCP server in Codex:

```bash
codex mcp add chatpt_local --url http://localhost:3334/mcp --bearer-token-env-var CHATPT_MCP_TOKEN
```

5. Confirm registration:

```bash
codex mcp get chatpt_local
```

If using Codex Desktop app, set GUI env too (so the app process can read the token):

```bash
launchctl setenv CHATPT_MCP_TOKEN "$CHATPT_MCP_TOKEN"
```

Then fully quit and reopen Codex.

### Local troubleshooting

- `MCP startup incomplete (failed: chatpt_local)`:
  - Confirm server is up: `curl -i http://localhost:3334/health`
  - Confirm token exists in shell: `echo ${#CHATPT_MCP_TOKEN}`
  - Re-copy a fresh token from `/training/settings` (access tokens can expire).
  - Re-export token and restart Codex.
- If you changed `~/.zshrc`, run `source ~/.zshrc` in the active shell.

## Deploy to Vercel (separate project)

1. Create a new Vercel project with **Root Directory = `mcp/`**.
2. Keep framework preset as **Other** (`framework: null` in `mcp/vercel.json`).
3. Add env vars:
   - `MCP_SUPABASE_URL`
   - `MCP_SUPABASE_PUBLISHABLE_KEY`
4. Deploy.

Production URLs:

- `https://<your-project>.vercel.app/api/mcp`
- `https://<your-project>.vercel.app/api/health`
