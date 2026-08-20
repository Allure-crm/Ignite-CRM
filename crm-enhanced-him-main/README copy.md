# Universal Creative CRM

A white-label creative production board (briefs → editing → review → launch, with a UGC branch). Built to be duplicated per brand: edit one config file, deploy, done.

## How it works

The whole product is driven by `src/brand.config.js`:

- **Identity** — brand name, tagline, accent colors, storage key
- **Team** — users with roles (strategist, editor, designer, ugc_manager, media_buyer)
- **Lists** — personas, awareness stages, content types, pages, landing pages
- **Workflow** — the 10 statuses, the allowed transitions between them, and which lanes each role sees in "My Queue"
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
3. Push to GitHub and import into [Vercel](https://vercel.com/new) (framework preset: Vite). Or run `npm run build` and drag the `dist/` folder into Netlify.

That's it — the app now runs in **localStorage mode**: zero setup, but each person's browser keeps its own data.

## Enable team sync (Supabase, ~10 minutes per brand)

localStorage mode means your editor and your media buyer each see their *own* copy of the board. For a real shared board:

1. Create a free project at [supabase.com](https://supabase.com) (one project per brand).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, run it.
3. In **Project Settings → API**, copy the Project URL and the `anon` public key.
4. Paste both into the `supabase` section of `src/brand.config.js`.
5. Redeploy.

The board is now shared and updates in realtime for everyone. Note: the anon key gates access — treat the deployed URL as internal and don't post it publicly. If you need real authentication later, Supabase Auth can be added on top.

## Workflow reference

```
Scripting ──Send to Editor──────────► Needs Editing ──Submit──► Needs Review
    │                                      ▲                   │         │
    └─Request UGC Content                  │               Approve   Request Revision
          ▼                                │                   │         ▼
   UGC Content Needed ──Submit──► UGC Review                   │   Needs Revision ──Resubmit──► (Needs Review)
                                   │      │                    ▼
                            Approve UGC  Request Revision   Ready to Launch ──Mark as Launched──► Launched
                                   │      ▼
                                   │   UGC Revision ──Resubmit──► (UGC Review)
                                   └──► UGC Approved ──Send to Editor──► (Needs Editing)
```

**Role queues** (what each role sees under "My Queue"):

| Role | Lanes |
|---|---|
| Strategist | Scripting, Needs Review, UGC Content Review |
| Editor / Designer | Needs Editing, Needs Revision |
| UGC Manager | UGC Content Needed, UGC Content Approved, UGC Content Revision |
| Media Buyer | Ready to Launch |

To change the workflow itself (add a status, change who approves), edit `statuses`, `transitions`, and `roles` in `src/brand.config.js` — the UI renders entirely from that definition.
