# gora-v2 — finalization plan

Closing the last gap between the built app and the corpus, then proving the
whole lifecycle on both phones. Backend v2 is written after, unintegrated.

## A. Frontend — done

1. **Toasts (sonner-native)** — one `<Toaster />` in the root layout, fired on
   every state mutation that would otherwise happen silently. Destructive
   *confirmations* stay as Alerts; toasts only ever report.
2. **English only** — the second language is cut (corpus §1, §14). The i18n
   layer stays as a typed copy deck so wording lives in one place;
   `resolveLanguage`, the locale preference and every `*Ja` export are gone.
3. **Corpus fixes** — three-page onboarding story; member-since and a real photo
   gallery on `person/[name]`; Discover empty state; Developer section behind
   `__DEV__`; photo action sheet on edit-profile; haptics on accept, lock and
   done; eight profile photos, not six; handle on the profile; tags and map
   below the fold on `want/[id]`; swipe-left *Not now* / *Hide* on invites.
4. **Invites lapse after seven days** (corpus §7) — derived from `created_at`
   in `src/lib/invites.ts`, so the badge, the opening sheet and the tab agree
   and nothing needs sweeping. Threads never lapse.
5. **One kit, one import surface** — `RowList`, `NavRow`, `CountBadge`,
   `PillButton`, `Tag`, `SwipeRow`, `StickyFooter`, `PhotoGallery`, `PeopleGrid`
   and `TopBar` replaced the patterns each screen used to hand-roll. Everything
   the corpus cut — rails, stats bento, buckets, the omni bar — is deleted.
6. **Green gate** — `tsc --noEmit` and `expo lint` clean; every referenced i18n
   key verified to resolve.

## B. On-device verification - done (vivo 10AC8H2WBT000GZ)

Metro over `adb reverse tcp:8081` + `tcp:9000`, week-in demo state, catalog
artwork served live from MinIO. Walked and screenshotted: deck, Invites
(including the swipe-to-reveal and the "16h left" caption), person profile,
own profile, Settings + Developer, Activity, someday detail, Lock. Four bugs
found on glass and fixed:

1. **Photo gallery fallback** left a half-height dead gap and sat under the
   status bar. It now clears the back button and stops - no photograph is a
   state, not a hole.
2. **An opened swipe row** fired the row's own action when tapped instead of
   closing. It is now its own close target while open.
3. **A someday in common** drew a chevron *and* an Ask pill. `SomedayRow` takes
   `chevron={false}` when something else in the row is the affordance.
4. **Unreachable artwork** rendered a permanent loading shimmer. `BrandedImage`
   takes a `fallback`, and the person gallery drops sources that 404 - which is
   what proved the initials fallback works against the live store, since
   `people/<id>-N.webp` is not seeded yet.

Not walked on the realme (TCAEV8OZU4IZ8P99), and the three demo states were not
each walked end to end - week-in only.

## C. Backend v2 (`gora-backend-v2`) — written, unintegrated

FastAPI + SQLAlchemy + Alembic, eight routers, schema mirroring the corpus.
The frontend now carries a typed client for all of it (`src/lib/api`) but does
not call it. See [integration.md](integration.md) for the seam, the one real
impedance mismatch, and the order to close it in.
