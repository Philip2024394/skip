# Deploy Edge Functions to Supabase (2dateme.com)

The live app at **2dateme.com** uses the Supabase project **grxaajpzwsmtpuewquag**. Edge Functions must be deployed to this project so paid features (Super Like, WhatsApp unlock, Plus One, VIP, etc.) work.

## Prerequisites

- **Supabase CLI**: Use via `npx` (no global install needed).
- **One-time login**: You must be logged in to Supabase CLI.

## Step 0 — Log in (one time)

```bash
npx supabase login
```

This opens a browser to get an access token. If you use CI or a script, set `SUPABASE_ACCESS_TOKEN` instead.

---

## Step 1 — Link to the project

From the **project root** (where `supabase/functions` lives):

```bash
npx supabase link --project-ref grxaajpzwsmtpuewquag
```

When prompted, enter your **database password** (from Supabase Dashboard → Project Settings → Database).

---

## Step 2 — Set production secrets

Secrets (Stripe keys, etc.) are read from `supabase/functions/.env`:

```bash
npx supabase secrets set --env-file supabase/functions/.env
```

Ensure `supabase/functions/.env` contains at least:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_WHATSAPP` (optional if hardcoded in create-payment)

---

## Step 3 — Deploy all Edge Functions

```bash
npx supabase functions deploy
```

This deploys every function in `supabase/functions/`, including:

- `purchase-feature` — Super Like, Boost, Verified, Incognito, Spotlight, Plus One
- `purchase-subscription` — VIP
- `create-payment` — WhatsApp unlock ($1.99)
- `verify-payment` — Stripe webhook + payment confirmation
- `cancel-subscription` — VIP cancellation
- `activate-feature-native` — Android RevenueCat
- `activate-incognito` / `activate-spotlight` — post-checkout activation
- `delete-account` — account deletion
- `fetch-og-image` — OG image for links
- `auth-email-hook` — auth emails (if used)

---

## Step 4 — Confirm

```bash
npx supabase functions list
```

You should see all functions with a **Deployed** status and the project ref **grxaajpzwsmtpuewquag**.

---

## Quick copy-paste (after login)

```bash
npx supabase link --project-ref grxaajpzwsmtpuewquag
npx supabase secrets set --env-file supabase/functions/.env
npx supabase functions deploy
npx supabase functions list
```

After this, 2dateme.com will call the Edge Functions on the correct project and paid features should work.
