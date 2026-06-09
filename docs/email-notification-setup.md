# Email Notification Setup

RSVP and gift notifications are sent server-side through Resend. Formspree and
FormSubmit are no longer used.

## 1. Verify a sending domain

1. Create or sign in to a Resend account.
2. Add a sending subdomain such as `notifications.alanandnia.co.uk`.
3. Add the SPF and DKIM records shown by Resend to the domain's DNS.
4. Wait for the domain to show as verified.

Using a sending subdomain keeps these transactional emails separate from other
mail sent from `alanandnia.co.uk`.

## 2. Create a Resend API key

Create an API key in Resend and keep it private. It belongs in deployment
environment variables, never in `rsvp-config.js` or committed source code.

## 3. Add Vercel environment variables

Add these to the Vercel project for Production and Preview:

```text
RESEND_API_KEY=re_...
NOTIFICATION_EMAIL_FROM=Nia & Alan <wedding@notifications.alanandnia.co.uk>
NOTIFICATION_EMAIL_TO=niamorris0211@hotmail.co.uk
```

Optional overrides:

```text
RSVP_NOTIFICATION_EMAIL_TO=niamorris0211@hotmail.co.uk
GIFT_NOTIFICATION_EMAIL_TO=niamorris0211@hotmail.co.uk
```

The existing variables are still required:

```text
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

Redeploy after adding or changing environment variables. Vercel only applies
environment-variable changes to new deployments.

## 4. Production behavior

- RSVP success requires both a successful Supabase upsert and acceptance by
  Resend.
- Gift selections collected before Stripe are emailed through the first-party
  `/api/submit-gift-note` endpoint.
- Confirmed gift payments are emailed by the signed Stripe webhook.
- Resend idempotency keys prevent duplicate notifications during retries.
- If a gift email cannot be accepted, the webhook returns an error so Stripe
  retries it instead of silently treating the notification as complete.

## 5. Verify

1. Submit a test RSVP and confirm it appears in Supabase and in the Resend email
   log.
2. Complete the one-penny Stripe test gift.
3. Confirm the payment appears in `gift_payments`.
4. Confirm both the gift selection and confirmed payment emails appear in the
   Resend email log and arrive at the notification address.
