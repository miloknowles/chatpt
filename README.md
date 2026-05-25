# Physical Therapy & Strength Training App

Project planning and product direction live in the brainstorming document:

- [docs/brainstorming.md](docs/brainstorming.md)

## Email provider

Authentication emails (OTP / magic link flow) are sent using **Resend** via Supabase Custom SMTP.

## Deployment (Vercel)

This repo is a monorepo-style layout where the Next.js app lives in `app/`.

If Vercel is misconfigured as a static site, deploys can fail with:

`No Output Directory named "public" found after the Build completed.`

Root cause: Vercel was expecting a static `public` output instead of building the Next.js app in `app/`.

Fix:

1. Set framework to `Next.js`.
2. Remove any `Output Directory` override set to `public`.
3. Use a root `vercel.json` so build/install run in `app/`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "cd app && yarn install --immutable",
  "buildCommand": "cd app && yarn build"
}
```
