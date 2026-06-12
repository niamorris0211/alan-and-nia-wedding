# Photo Upload Storage Setup

The photo pages can now use private Supabase Storage from localhost and,
after deployment, from the wedding website.

## One-time Supabase setup

1. In Supabase Storage, create a **private** bucket named `wedding-photos`.
2. Set the bucket file size limit to 50 MB.
3. In the Supabase SQL editor, run:

```sql
create table if not exists public.wedding_photo_uploads (
  id uuid primary key,
  storage_path text unique not null,
  original_name text not null,
  uploader_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_at timestamptz not null default now(),
  completed boolean not null default false
);

alter table public.wedding_photo_uploads enable row level security;
```

No public table or storage policies are needed. All privileged actions use the
server-only Supabase service role key.

## Local Supabase testing

Create `.env.local` in the project root:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PHOTO_STORAGE_BUCKET=wedding-photos
PHOTO_ADMIN_PASSWORD=choose-a-long-private-password
```

Then run `npm run dev` and open:

- Upload: `http://localhost:8000/photos`
- Shared gallery: `http://localhost:8000/photos-gallery`
- Admin: `http://localhost:8000/photos-admin`

Localhost uses Supabase by default. To test the old computer-only fallback,
use `/photos?storage=local` and `/photos-admin?storage=local`.

## Before deployment

Add the same four variables to the Vercel project environment. Never place the
service role key in browser JavaScript or commit `.env.local`.

## Production TODO

1. Add rate limiting and bot protection before sharing the upload URL widely.
2. Add moderation/reporting controls for the public shared gallery.
3. Consider malware scanning and file-signature validation.
4. Decide how long original uploads should be retained.
5. Review whether 50 MB per video is sufficient.
6. Add a background ZIP export if one-click bulk downloads are required for a
   very large gallery. Individual private downloads already work on phones and
   laptops.
