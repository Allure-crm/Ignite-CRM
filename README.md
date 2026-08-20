# Universal Creative CRM

A white-label creative production board (briefs → editing → review → launch, with a UGC branch). Built to be duplicated per brand: edit one config file, deploy, done.

## How it works

The whole product is driven by `src/brand.config.js`:

- **Identity** — brand name, tagline, accent colors, storage key
- **Team** — users with roles (strategist, editor, designer, ugc_manager, media_buyer)
- **Lists** — personas, awareness stages, content types, pages, landing pages
- **Workflow** — statuses, the allowed transitions between them, and which lanes each role sees in "My Queue"
- **Field labels** — rename anything ("Facebook Page" → "Ad Account", "UGC Assets" → "Creator Content", etc.)

Everything in the lists/team/brand sections can also be edited at runtime from **Manage Lists** in the app; those edits are stored as overrides on top of the config defaults.

Brief names are auto-generated: `TY_Jun_2_PersonaA_TOF_Static_PDP` (strategist abbr, month, brief #, persona, stage, type, landing page).

## Run locally

```bash
npm install
npm run dev
```

## Deploy a new brand (5 minutes)

1. Duplicate this folder (or the GitHub repo).
2. Edit `src/brand.config.js` — name, colors, team, personas, pages. Give it a unique `storageKey`.
3. Push to GitHub and import into [Vercel](https://vercel.com/new). The repo root is a Vite app (`package.json` + `vite.config.js` + `vercel.json`), so Vercel should detect the **Vite** preset automatically. Or run `npm run build` and deploy the `dist/` folder (Netlify, Cloudflare Pages, etc.).

That's it — the app now runs in **localStorage mode**: zero setup, but each person's browser keeps its own data.

## Enable team sync (Supabase)

localStorage mode means your editor and your media buyer each see their *own* copy of the board. For a real shared board the app needs a Supabase project **and** a production rebuild after the keys are available.

### Option A — add Supabase from the Vercel dashboard (Marketplace)

1. In the Vercel project, add the **Supabase** integration / storage resource.
2. Confirm env vars exist for **Production**. Marketplace usually injects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and often `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `POSTGRES_URL`). That is enough — you do not have to also create `VITE_SUPABASE_*` copies.
3. Redeploy. The production build maps those names into the Vite client bundle, and if `POSTGRES_URL` is present it also applies `supabase/schema.sql` (the `briefs` and `settings` tables).
4. Open the CRM, pick a teammate, and check the sidebar: **Data: Supabase (team sync)**. If it still says **this browser only**, the last production build did not see those env vars — redeploy after they are saved.

### Option B — paste keys yourself

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste `supabase/schema.sql`, run it.
3. Copy the Project URL and publishable/anon key into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`). For production, add the same names in Vercel → Project → Settings → Environment Variables, then redeploy.

The password sign-in is **not** Supabase. It is remembered on each device only. Teammate switching is also per browser. Only briefs, lists, and intake sync through Supabase.

Treat the deployed URL as internal. The anon key is a public client key with open row policies in `schema.sql`.

## Workflow reference

```
Scripting ──Submit for Review──► Script Review (CFO)
    │                              │              │
    │                          Approve      Request Revision (+ comments)
    │                              │              ▼
    │                              │        Script Revision ──Resubmit──► (Script Review)
    │                              ▼
    │                    Assigned to Editor ──Assign to Editor──► Needs Editing ──Submit──► Needs Review
    │                                                              ▲                         │         │
    └─Request UGC Content                                          │                     Approve   Request Revision
          ▼                                                        │                         │         ▼
   UGC Content Needed ──Submit──► UGC Review                       │                         │   Needs Revision ──Resubmit──► (Needs Review)
                                   │      │                        │                         ▼
                            Approve UGC  Request Revision          │                    Ready to Launch ──Mark as Launched──► Launched
                                   │      ▼                        │
                                   │   UGC Revision ──Resubmit──► (UGC Review)
                                   └──► UGC Approved ──Send to Editor──► (Needs Editing)
```

**Role queues** (what each role sees under "My Queue"):

| Role | Lanes |
|---|---|
| Creative Strategist | Scripting, Assigned to Editor, Needs Review, UGC Content Review, UGC Content Revision |
| CFO | Script Review (plus the rest of the board) |
| Video Editor | Needs Editing, Needs Revision |
| Media Buyer | Ready to Launch |

To change the workflow itself (add a status, change who approves), edit `statuses`, `transitions`, and `roles` in `src/brand.config.js` — the UI renders entirely from that definition.
