# Stripe Gift Webhook Setup

This makes the gift list update when somebody pays through Stripe.

## 1. Create the Supabase table

Run this in Supabase SQL editor:

```sql
create table if not exists gift_payments (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  checkout_session_id text unique not null,
  payment_intent_id text,
  payment_link_id text,
  gift_id text not null,
  gift_action text not null default 'contribution',
  amount_total integer not null default 0,
  currency text not null default 'gbp',
  customer_email text,
  customer_name text,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```

## 2. Add Vercel environment variables

The RSVP setup should already have:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Add:

- `STRIPE_WEBHOOK_SECRET`

You get this from Stripe after creating the webhook endpoint.

## 3. Create the Stripe webhook

In Stripe, create a webhook endpoint:

```text
https://alanandnia.co.uk/api/stripe-gift-webhook
```

Listen for:

```text
checkout.session.completed
```

Then copy the webhook signing secret into Netlify as `STRIPE_WEBHOOK_SECRET`.

## 4. Add metadata to each Payment Link

Each Payment Link needs metadata so the webhook knows which gift to update.

| Payment link | `gift_id` | `gift_action` |
| --- | --- | --- |
| Test biscuit | `test-biscuit` | `full` |
| Whisky full gift | `whisky-research` | `full` |
| Whisky contribution | `whisky-research` | `contribution` |
| Staffa full gift | `staffa-adventure` | `full` |
| Staffa contribution | `staffa-adventure` | `contribution` |
| Loch Lomond full gift | `loch-lomond-boat-trip` | `full` |
| Loch Lomond contribution | `loch-lomond-boat-trip` | `contribution` |
| Wildlife safari full gift | `wildlife-sea-safari` | `full` |
| Wildlife safari contribution | `wildlife-sea-safari` | `contribution` |
| Honeymoon pot | `honeymoon-pot` | `contribution` |

After that, the public gift list reads:

```text
https://alanandnia.co.uk/api/gift-status
```

and shows how much has been contributed and how much is left.
