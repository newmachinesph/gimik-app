# gora-v2 — the API, wired

The app runs against Gimik API v2. Signing in fills the store from the server,
every mutation is written through, and two phones signed in as two people see
each other's messages. What follows is how it hangs together, then what is
still missing.

## Running it

```bash
# Backend: Postgres, MinIO (the 522 catalogue images), API on :8100
cd gora-backend-v2 && docker compose up -d
docker compose exec api python scripts/seed.py          # catalogue rows
docker compose exec api python scripts/seed_world.py    # the cast + one account

# Frontend
cd gora-v2 && npx expo start
adb -s <device> reverse tcp:8081 tcp:8081   # Metro
adb -s <device> reverse tcp:8100 tcp:8100   # API
adb -s <device> reverse tcp:9000 tcp:9000   # object store
```

Sign in as `bea@gimik.ph` / `gimik-demo-1234`, or as any of the cast
(`mara@`, `jon@`, `ana@`, `theo@`, `noor@`, `kaz@`, `ivy@`, `ren@`, `dani@`)
with the same password.

## How the seam works

**The store never learned about UUIDs.** It keys people by name and somedays by
the app's own id, because that is the vocabulary the corpus is written in and
widening it would have touched all twenty-three screens to say nothing new.
Instead the boundary translates:

| Module | Job |
|---|---|
| `lib/api/schema.ts` | The wire shapes, transcribed from `app/schemas.py` |
| `lib/api/client.ts` | Bearer auth, single-flight refresh, typed errors, 15s deadline |
| `lib/api/endpoints.ts` | One function per route |
| `lib/api/directory.ts` | name ↔ uuid, slug ↔ uuid, plan and thread ids |
| `lib/api/mapping.ts` | DTOs → store shapes (pure; 20 unit tests) |
| `lib/api/sync.ts` | `hydrateFromApi()` — seven parallel requests, one store write |
| `lib/api/session.ts` | Sign in / up / out, and cold-start restore |
| `lib/actions.ts` | What screens call: optimistic store write, then the server |
| `lib/registry.ts` | People and somedays the server knows and this build does not |

Two lookups were made server-aware rather than replaced, so no screen had to
change: `PERSON_BY_NAME.get` and `WANT_BY_ID.get` consult the registry after
the bundled data. That is what lets an account reference a someday outside the
bundled sample, or a person who is not one of the seeded nine.

**Writes are optimistic and self-correcting.** `lib/actions.ts` applies every
change to the store immediately - the app has always felt instant and a round
trip is a bad trade - then tells the server. A rejected write does not try to
invert itself; it refetches and says so. Guessing the inverse of a half-applied
change is how stores go quietly wrong.

## Verified on two phones

vivo (`10AC8H2WBT000GZ`) signed in as Bea, realme (`TCAEV8OZU4IZ8P99`) as Mara,
both against the same stack:

- Sign-in: `POST /auth/login` then seven parallel hydration calls, all 200.
- Cold start restores the session from the stored token with no re-login.
- Each account sees its own world - Bea 13 kept, Mara 28 - with real catalogue
  artwork from MinIO.
- The seven-day lapse renders end to end: the 152-hour-old seeded invite shows
  "16h left" in orange, and only that one.
- Mara typed a message on the realme; `POST /threads/{id}/messages` returned
  201; it appears on Bea's phone as unread, top of her inbox, timestamped 2m.
- Opening a thread writes the read receipt (`POST /threads/{id}/read`, 204).

Two crashes were found this way and fixed:

1. **Fabric mount crash** on the transition into the hydrated app - the opening
   sheet mounted a Modal while the router was still swapping trees, and the
   renderer tried to attach a view the outgoing surface had not released. The
   sheet now waits for the transition to settle.
2. **`removeClippedSubviews`** on the Discover grid: a legacy optimisation that
   detaches views Fabric still owns. Removed; the windowing props are the lazy
   loading and always were.

## Measured

- API, warm, on the loopback: `/catalog` (522 rows) 24ms, `/threads` 30ms,
  everything else under 25ms.
- Cold start, debug build, ~10.1s to first frame. That number is Metro shipping
  the bundle over USB on every launch, not the app: a release build embeds it.
  It has not been measured in release.

## Services

| Service | State | Notes |
|---|---|---|
| **Realtime** (Ably) | Wired, both ends | `POST /realtime/token` mints a TokenRequest signed here with stdlib HMAC - no SDK, no round trip. Scoped to the caller's own user channel and the threads they are actually in, subscribe/presence/history only, 1h TTL. Verified: Ably accepted the signature and issued a token. Sending a message publishes to the thread channel and to each recipient. **History is not permitted on the current key** - enable it in the Ably dashboard if replay is wanted. |
| **Rate limiting** (Upstash) | Wired | Fixed window over the REST API, one round trip per request. **Fails open**: a limiter that is itself broken must not take the API down, so an Upstash error logs and allows. Sign-in 10/5min, sign-up 5/hour, social writes 60/min, everything else 300/min. Verified: attempt 11 returns 429 with `Retry-After`. |
| **Email** (mailpit) | Wired | smtplib on a background task, never awaited - an account must not fail to exist because a relay was slow. Welcome mail on register. Mailpit UI on :8025. |
| **Media** (S3) | Backend ready, client unused | Already correct before this round: boto3, SigV4, path-style addressing, `region=auto`, and a separate signing client so URLs are signed against the host the phone can resolve. **Moving to R2 is four environment variables and no code.** Photo cap raised 6 -> 8 to match the app. The client still stores local `file://` URIs; `presign` -> PUT -> `claimPhoto` is written and uncalled. |

## Signup

Onboarding now creates the account. It registers at the end of the *profile*
step rather than at the end of onboarding: name, birthday and gender are the
last required fields, and a taken email should be discovered before someone has
picked twelve somedays. Every step after that writes straight through.

Verified on the vivo: `POST /auth/register` 201 followed by full hydration, and
the welcome email in mailpit. Google and Apple are disabled rather than faked -
without OAuth client ids they cannot sign anyone in, and a button that skips the
form while pretending to authenticate is worse than one that waits.

## Realtime, both ends

`lib/api/realtime.ts` opens one Ably connection for the signed-in person,
authenticating through `authCallback` so the SDK re-fetches a token whenever
one expires. It subscribes to `user:{id}` and treats every event as *something
changed, go and look* rather than as data to trust: a known thread refetches
itself, anything else triggers a full hydration. A dropped or duplicated event
therefore costs a request, never a wrong screen.

Verified on two phones: Mara sent from the realme, and the API log shows Bea's
device issuing `GET /threads/{id}` immediately afterwards - the push arriving
and being acted on, without a restart and regardless of which screen she was
on. The connection is opened by the tab shell and closed on sign-out; demo
builds never connect.

## A recurring Fabric crash, finally understood

The surface kept dying with *"child already has a parent"* at seemingly random
moments. The cause was `BottomSheet` and `KeepPrompt` rendering
`<Modal visible={false}>`: a hidden Modal still creates its native container,
so most screens were holding an extra surface open, and Fabric would sometimes
try to re-parent one during a navigation transition. Both now return `null`
until they are wanted. Zero crashes on either phone since.

## Account lifecycle

| Flow | Route | Notes |
|---|---|---|
| Sign up | `POST /auth/register` | From onboarding's profile step. Welcome mail on a background task. |
| Sign in | `POST /auth/login` | 10 attempts per 5 minutes, per IP. |
| Forgotten password | `POST /auth/password/forgot` | **Always 204**, known address or not: any other answer is an account-existence oracle. Emails a `gimik://reset?token=` deep link plus the raw code, because a link that will not fire should not strand someone who is locked out. |
| Reset | `POST /auth/password/reset` | 30-minute single-purpose token, checked by its `type` claim so an access or refresh token cannot be spent here. Succeeding signs them straight in. |
| Delete | `DELETE /auth/me` | **Actually deletes.** Every table hanging off a user is `ON DELETE CASCADE`; the object store is swept by hand first, because a deleted account that leaves its photographs behind has not been deleted. |

The previous build's Delete account signed you out and kept everything, while
the confirmation promised the opposite. That is now true rather than aspirational.

## Photographs

Three steps, and the middle one deliberately avoids this API: the server signs
a URL, the phone PUTs the bytes straight at MinIO, and only then does the server
hear the object exists. Streaming images through the API would double the
bandwidth and put a request timeout between a person and their own face.

`expo-file-system`'s `uploadAsync` rather than fetch-plus-blob: a presigned PUT
wants raw bytes, and reading a `file://` URI into a blob in React Native is the
sort of thing that works on exactly one platform. Adding a photo is optimistic -
the local URI appears at once and is swapped for the served URL on success, or
removed on failure.

## Monitoring

Sentry on both sides, off unless a DSN is set. `send_default_pii` is false in
both: this app carries people's messages, cities and plans, and the useful part
of a report is the stack and the route, never the payload. The app's error
boundary now reports as well as recovers.

## What is still not done


- **No media upload from the client.** Backend is ready; the app still stores
  local URIs for profile and journal photos.
- **No password reset.** The mail service has the template shape for it; there
  is no token flow.
- **No crash reporting.**
- **Write paths beyond messaging are unexercised on a device.** Invite-accept,
  lock, mark-done and journal compile, are wired through `lib/actions.ts`, and
  have not been walked against the API on a phone.
- **Rate limits are unqualified by route cost.** A 300/min general bucket is
  generous for a phone and would not stop a determined scraper of `/catalog`.
