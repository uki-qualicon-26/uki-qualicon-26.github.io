# UKI Qualicon 2026: one link for the quiz and the workshop

**https://uki-qualicon-26.github.io/** is the single link to share.

1. Participants register **once** here with their name and IBM email.
2. They take the **Bob quiz** (`/quiz/`).
3. The **hands-on workshop** (`/workshop/`) unlocks when the quiz is submitted. Progress is saved against the same registration.

| Path | Repo | Purpose |
|---|---|---|
| `/` | this repo | Register once, then Quiz and Workshop cards |
| `/quiz/` | [`uki-qualicon-26/quiz`](https://github.com/uki-qualicon-26/quiz) | Timed quiz, leaderboard, big screen, host controls, SQL |
| `/workshop/` | [`uki-qualicon-26/workshop`](https://github.com/uki-qualicon-26/workshop) | Step-by-step guide (Path A Jira MCP, Path B repo fallback) |

All three share one browser session (`localStorage`, same origin) and one Supabase database. The database schema and the stakeholder report live in the quiz repo (`supabase/schema.sql`, `supabase/stakeholder_report.sql`).

## Security notes
- Only the Supabase **publishable** key is in `config.js`. Never add a secret key, `service_role` key or database password.
- The workshop is gated twice: in the browser, and on the server (`workshop_save` rejects anyone who has not submitted the quiz).
- Keep `config.js` and `assets/api.js` identical in all three repos.

After a change, refresh the `?v=` stamps in `index.html` (GitHub Pages caches for about 10 minutes). Do not edit the sites while participants have them open.
