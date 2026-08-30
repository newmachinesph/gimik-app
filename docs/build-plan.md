# gora-v2 — build plan

Fresh Expo SDK 57 + expo-router project, built 100% against `docs/corpus.md`
on flat JSON data. No API until every screen and state exists. Checked on the
two attached phones (vivo `10AC8H2WBT000GZ`, realme `TCAEV8OZU4IZ8P99`) after
every phase via Metro + `adb reverse tcp:8081`.

## Constraints

- **Polish bar: Bumble.** Nothing ships half-styled. Every list has an empty,
  a one, and a many state. Every tap has press feedback. Motion is short.
- **Type scale is mobile**: display 28 · title 24 · heading 18 · body 15 ·
  label 13 · caption 12 · eyebrow 11 (Geist; Instrument Serif italic for the
  one "Someday" wordmark moment). No 36px anything.
- **Radius 4** on rectangles; circles stay circles. Flat paper tab bar.
- **Latest mobile UI elements**: native bottom sheets (gesture-driven), haptics
  on keep/pass, pull-to-refresh where a list can change, skeletons over
  spinners, safe-area aware everywhere, edge-to-edge on Android.
- **Flat JSON** in `src/data/*.json`: catalog (≈80 somedays with bundled
  480px WebP artwork), people (gender, age, city, bio, bundled photos), demo
  states (fresh / a-week-in / veteran). `Settings → Developer` switches state.
- Reuse v1's proven kit where it is already right: tokens, `Txt`, `Card`,
  `Chip`, buttons, `GoraIcon`, `BrandedImage`, `ScrollingTitle`,
  `DecideDeck`, `TabBar`, `ProgressRing`, `Avatar`. Port, then re-scale.

## Phases

1. **Foundation** — deps, tokens, fonts, global css, `Txt` scale, kit port,
   tab shell with five tabs and placeholder screens.
2. **Data** — JSON catalog + rendered artwork, people, demo states, the
   `useDemo()` store (zustand, persisted) with keep/pass/lock/done/friends/
   groups/invites/threads reducers.
3. **Somedays** — deck, keep prompt (Open to / As), filter sheet, undo,
   resurface cards, empty state.
4. **Detail** — `want/[id]` to corpus §10; visibility chips; who's in.
5. **Invites** — rows, Not now / Hide, badge; person profile (§8) with photos.
6. **Friends & groups** — requests/accept, groups list, create, detail,
   invite link screen.
7. **Messaging** — inbox, thread (solo/group/plan), attachments.
8. **Plan flow** — lock (date, who), plan (people, place, split, thread),
   done, journal, record.
9. **Activity** — locked / waiting / done / messages.
10. **Profile & Settings** — photos (8), edit, city picker, completeness,
    settings, developer switch.
11. **Onboarding** — welcome, story, account, name/birthday/gender, photo,
    city, interests, starter picks → deck.
12. **Opening sheet** — news on open/foreground.
13. **Walkthrough** — all three demo states on both phones; fix everything.

Each phase ends green (`tsc`, lint) and photographed on a phone.
