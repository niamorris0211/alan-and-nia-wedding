# Supabase RSVP Setup

Run this in the Supabase SQL editor:

```sql
create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_slug text unique not null,
  household_name text not null,
  invite_type text not null default 'day',
  attending_guests jsonb not null default '[]'::jsonb,
  not_attending_guests jsonb not null default '[]'::jsonb,
  breakfast_attending jsonb not null default '[]'::jsonb,
  breakfast_not_attending jsonb not null default '[]'::jsonb,
  breakfast_dietary_requirements text not null default '',
  dietary_requirements text not null default '',
  song_request text not null default '',
  optional_note text not null default '',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```

The Vercel RSVP endpoint stores each household by `guest_slug`. If a household
submits again, its existing RSVP is updated.
