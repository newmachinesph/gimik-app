# Where things stand — overnight session, 5 Sep 2026

Everything below is running or committed. Read the **Blocked** section first: one
thing needs your hands, and it is the only thing that does.

---

## Blocked on you: the phone is locked

The app **built, installed and launched** on the RMX3636. The JS bundle runs,
Sentry initialises, there are no crashes in logcat. I could not see a single
screen, because the phone is on a secure lock screen (`isKeyguardShowing=true`,
`locksettings get-disabled` → `false`) and I have no way past a PIN.

So: **no UI on the device has been visually verified.** Everything else has been
verified against the real stack over HTTP. Treat the app's screens as "built and
loading cleanly", not as "seen working".

To pick it up:

```bash
cd ~/OneDrive/Desktop/gora-backend-v2 && docker compose up -d     # if not already up
cd ~/OneDrive/Desktop/gora-v2
adb reverse tcp:8100 tcp:8100 && adb reverse tcp:9000 tcp:9000 && adb reverse tcp:8081 tcp:8081
npx expo start --dev-client
```

Then unlock the phone and open Gora. Sign in as `bea@gora.ph` / `gora-demo-1234`,
or register fresh to see onboarding and a cold-start deck.

Two things worth knowing:

- **Metro must be running.** This is a debug build, so the JS is served, not
  embedded. I deliberately did not build a release APK: `usesCleartextTraffic`
  is set only in the debug manifest, so a release build would block plain HTTP
  to `localhost:8100` and every call would fail. That default is correct for
  production and not worth weakening for a local test.
- **`adb reverse` is how the phone reaches the backend**, so it needs the cable.
  It does not survive a reboot or an unplug — re-run the three commands above.

---

## What the deck does now, and what happens when it runs out

You asked for a mechanism and an algorithm. `GET /feed` ranks; `GET /catalog`
browses. They are deliberately different: the deck is showing you something you
did not ask for, so it ranks; browse is for finding a thing you already have in
mind, so it stays alphabetical and pages.

The ranking blends four signals (`gora-backend-v2/app/services/feed.py` explains
each and why it is weighted as it is):

| Signal | What it is | Weight |
|---|---|---|
| Taste | Smoothed keep-rate per category and subcategory | 1.0 |
| Social | Friends who kept it — the thing that turns a wish into an invite | 0.8 |
| Interest | Word overlap with the interests picked at onboarding | 0.45 |
| Popularity | Log-damped global keeps, a cold-start floor only | 0.35 |
| Exploration | Deterministic per-person, per-day jitter | 0.25 |

A greedy pass then charges for repetition, so a page is a spread rather than
nine variations of one afternoon.

**Running out** is handled in tiers rather than by looping:

1. `catalog` — the 2,522 seeded activities you have not decided on.
2. `community` — somedays *other people wrote*, and only where the author's own
   keep is opened wide enough to include you (friend, group peer, same city). It
   reuses the visibility rule the rest of the app already enforces.
3. `second_look` — passes older than 30 days, flagged so the card can admit it is
   a repeat. Keeps are never resurfaced; those are already on your list.
4. `exhausted: true` — said honestly, so the client shows an end state and a
   prompt to write your own, instead of silently reshuffling rejects.

Measured on the live stack: after 36 swipes a person's deck goes from roughly a
ninth on-taste to **55–100%**, with no card ever offered twice.

---

## What was built

**Catalog.** The 2,000-activity export is seeded — rows from its SQLite catalog,
artwork into MinIO at `catalog/<slug>.webp`. With the original 522 that is
**2,522 activities, every one with a picture**. The seeder
(`scripts/seed_activities.py`) is idempotent and resumable; re-running it moves
only what is missing.

**One vocabulary.** The two catalogs arrived with two taxonomies — eighteen
categories over one shelf, half of them synonyms. `app/taxonomy.py` and
`src/lib/taxonomy.ts` make the export's nine canonical and fold the older
one-word names into them. Both seeders apply it on the way in.

**People can write their own somedays.** `POST /somedays` creates one, keeps it,
and applies visibility in one act. The create screen's own empty state used to
say *"Custom somedays arrive with the server"*; they have arrived. This is also
what makes the `community` pool above non-empty — before it was dead code.

**The app talks to the API.** The deck and the browse grid now read from the
server, with search and paging server-side. Demo builds are untouched and still
work with no API configured.

---

## Three bugs worth knowing about

Each was found by running the thing rather than reading it.

1. **The diversity pass was overruling people's stated preferences.** A person
   who kept six food cards and passed six water ones got an exact
   food/water/food/water alternation — the repetition penalties summed to more
   than the taste gap they competed with. Caught by a test that now pins the
   behaviour; weights came down from 0.35/0.22 to 0.18/0.12.

2. **Writes against unregistered ids vanished silently.** Twelve call sites read
   `if (id) sync(...)`, so a someday the directory had not heard of was written
   to the store and never to the server — indistinguishable from success until
   the next sign-in. It shipped in two places: onboarding's twelve starter picks
   (the strongest signal a new account ever produces) and the person screen.
   Both fixed at the source; the pattern itself now reports instead of vanishing.

3. **The person screen showed invented data under real names.** It listed
   bundled somedays for real accounts from a hand-authored table of who wants
   what. It now asks `GET /people/{handle}`, which already filters by the
   holder's visibility.

---

## Verification

| | |
|---|---|
| Backend tests | **52 passed** (16 new, covering the feed) |
| Frontend tests | **58 passed** (2 new) |
| Live multi-user simulation | **28 checks passed** |
| `ruff check app scripts tests` | clean |
| `tsc --noEmit` | clean |
| `eslint` | 0 errors (5 pre-existing warnings) |
| i18n key check | clean, no dead keys |

The simulation (`scripts/simulate.py`) is the interesting one. It signs up four
people with four different tastes and runs the whole loop over HTTP against
Postgres and MinIO: swiping, befriending, inviting, talking, locking a plan,
finishing it, and uploading a photo through a presigned PUT. Sign-up is rate
limited, so clear the window before a repeat run:

```bash
docker exec gora-backend-v2-redis-1 redis-cli FLUSHALL
cd ~/OneDrive/Desktop/gora-backend-v2 && ./.venv/Scripts/python.exe scripts/simulate.py
```

---

## What I would not call production-ready yet

Being straight about the gaps, in the order I would close them:

- **No screen has been looked at.** See Blocked, above. This is the big one.
- **Roughly fifteen screens still read bundled data** — messages, plan, journal,
  lock, groups, activity. Most hydrate through `sync.ts` and are probably fine;
  I verified and fixed the two that provably were not (person, onboarding)
  rather than assuming about the rest.
- **The new hooks have no tests.** `useDeck`, `useBrowse` and `usePerson` are
  covered only indirectly. The suite is node-environment and pure-layer by
  design, so testing them means adding a React testing stack — an architectural
  call I did not want to make while you were asleep.
- **Nothing is deployed.** Fly.io + Neon is still the plan; the Dockerfile and
  `config.py` are both ready for it.
- **Scale boundary in the feed.** Candidates are scored in Python, which is
  right at 2,522 rows and wrong at 200,000. `CANDIDATE_LIMIT` bounds it and
  `feed.py` documents where the line is.

---

## Commits

**gora-backend-v2**: `fe76689` rank the catalog · `8847ab3` the four-person
simulation · `799893e` write your own somedays · `8a953dd` ruff

**gora-v2**: `53d3098` deck and grid from the API · `4d47962` acceptInvite
contract · `eb285e9` the create screen can create · `b74e711` real people's real
somedays · `e95ba49` stop dropping writes silently
