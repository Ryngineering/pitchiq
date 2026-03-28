# PitchIQ

A cricket prediction app built with React + Vite, backed by Supabase, and deployed on Vercel.

---

## Local Development

```bash
# Install dependencies
npm install

# Pull environment variables from Vercel (see Env Variables section below)
vercel env pull .env.local

# Start the dev server
npm run dev
```

---

## Vercel CLI — Complete Reference

### Installation & Login

```bash
# Install globally
npm i -g vercel

# Authenticate (opens browser)
vercel login

# Link this repo to a Vercel project (run once per machine)
vercel link
```

`vercel link` creates a `.vercel/` directory storing your org/project IDs. Commit `.vercel/project.json` if you want CI to use the same project without re-linking; add `.vercel/` to `.gitignore` otherwise.

---

### Deployments

#### Development / Preview

```bash
# Deploy to a unique preview URL (default — no flags needed)
vercel

# Deploy and open the URL in the browser automatically
vercel --confirm

# Deploy a specific branch / working tree
vercel --cwd /path/to/project
```

Every push to a non-main branch on GitHub also triggers an automatic preview deployment via the Vercel Git integration.

#### Production

```bash
# Deploy to production (maps to your primary domain)
vercel --prod

# Build locally first, then deploy the output directory
vercel build          # produces .vercel/output/
vercel deploy --prebuilt
```

#### Inspect & Promote

```bash
# List recent deployments
vercel ls

# Inspect a specific deployment
vercel inspect <deployment-url>

# Promote a preview deployment to production
vercel promote <deployment-url>

# Roll back production to previous deployment
vercel rollback
```

---

### Environment Variables

Vercel supports three environments: **development**, **preview**, and **production**.

#### Add a variable

```bash
# Interactive — prompts for value, environment, and visibility
vercel env add VARIABLE_NAME

# Non-interactive (pipe the value)
echo "my-value" | vercel env add VARIABLE_NAME production

# Add to multiple environments at once
echo "my-value" | vercel env add VARIABLE_NAME production preview development
```

#### Secrets / sensitive values

Vercel encrypts all env vars at rest. For extra safety, mark a variable as **sensitive** (write-only, never readable after saving) in the dashboard, or use the `--sensitive` flag if your CLI version supports it.

```bash
# Never commit secrets to .env or source code.
# Store them only in Vercel:
echo "super-secret-key" | vercel env add SECRET_KEY production
```

#### List & remove variables

```bash
# List all env vars for the project (values are masked)
vercel env ls

# Remove a variable from a specific environment
vercel env rm VARIABLE_NAME production
```

#### Pull variables to a local file

```bash
# Pulls development-environment variables into .env.local
vercel env pull .env.local

# .env.local is gitignored by default — never commit it
```

> **Rule of thumb:** Public build-time values use `VITE_` prefix (e.g. `VITE_SUPABASE_URL`). Server-side secrets must NOT use `VITE_` — they are never exposed to the browser.

---

### Project & Domain Management

```bash
# Show current project info
vercel project ls

# Add a custom domain
vercel domains add yourdomain.com

# List domains attached to the project
vercel domains ls

# Remove a domain
vercel domains rm yourdomain.com
```

---

### Logs

```bash
# Stream runtime logs for the latest production deployment
vercel logs <deployment-url>

# Follow logs in real time
vercel logs <deployment-url> --follow
```

---

### Useful Flags

| Flag | Effect |
|---|---|
| `--prod` | Deploy to production |
| `--confirm` / `-y` | Skip confirmation prompts |
| `--env KEY=value` | Override an env var for this deploy only |
| `--build-env KEY=value` | Override a build-time env var |
| `--regions iad1` | Pin the function region (e.g. `iad1` = US East) |
| `--no-wait` | Fire-and-forget deploy (returns immediately) |
| `--debug` | Verbose output for troubleshooting |
| `--cwd <path>` | Run as if executed from a different directory |

---

### Recommended Workflow

```
feature branch  →  git push  →  automatic preview deployment (Vercel Git integration)
                                         ↓  review & test on preview URL
main branch     →  vercel --prod        →  production
```

For hotfixes or manual releases, run `vercel --prod` directly from a clean working tree on `main`.

---

## Environment Variables Used in This Project

| Variable | Environment | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | all | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | all | Supabase anon/public key |
| `VITE_SUPABASE_REDIRECT_URL` | production | OAuth redirect URL (production domain) |

---

## Tech Stack

- **Frontend:** React 18 + Vite
- **Database / Auth:** Supabase (PostgreSQL + Row Level Security)
- **Deployment:** Vercel
- **Styling:** CSS custom properties (no framework)

---

## Vite Plugins

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) — uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) — uses [SWC](https://swc.rs/)
