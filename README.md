# Gimik App

The mobile app for [Gimik](https://gimik.app) (formerly "Gora"), which turns "we should do that sometime" into a date on the calendar. You keep "somedays" you want to do, see which friends want the same ones, and lock a plan with a date. Built with Expo and React Native for iOS and Android.

## Part of Gimik

| Repo | What it is |
|---|---|
| [gimik-app](https://github.com/newmachinesph/gimik-app) | Mobile app (this repo) |
| [gimik-backend](https://github.com/newmachinesph/gimik-backend) | FastAPI API |
| [gimik-site](https://github.com/newmachinesph/gimik-site) | Next.js marketing site |

## Features

Based on the routes in `src/app/`:

- Account: welcome, sign-in (including Apple and Google), password forgot/reset, onboarding, interests and city selection.
- Home: a swipe deck of somedays (keep or pass, with undo).
- Discover: browse and search the activity catalog.
- Create your own someday and set who can see it.
- Someday detail (`want/[id]`), people who want the same thing, and person profiles.
- Invites, and locking a plan with a date (`lock/[id]`, `plan/[id]`).
- Journal entries for completed plans.
- Messages (threads) with realtime delivery via Ably.
- Friends, groups, and invite links (`join/[token]`).
- Activity feed, profile, edit profile, settings.
- Plus subscription screen (RevenueCat).
- Push notifications, English strings via i18next.

## Tech stack

- Expo SDK 57 (`expo ~57.0`), React Native 0.86, React 19.2, React Compiler and typed routes enabled
- Expo Router (file-based routing in `src/app/`)
- TypeScript, NativeWind (Tailwind), Zustand, Reanimated, Gesture Handler
- Sentry (`@sentry/react-native`), RevenueCat (`react-native-purchases`), Ably
- Vitest for unit tests, ESLint via `expo lint`

## Getting started

### Prerequisites

- Node.js and npm
- Android Studio (emulator and `adb`) and/or Xcode (macOS) for native dev builds
- A running [gimik-backend](https://github.com/newmachinesph/gimik-backend) if you want real data (see below)

The app uses native modules (Sentry, RevenueCat, Apple/Google sign-in), so it needs a development build rather than Expo Go.

### Install

```sh
npm install
```

### Environment variables

Set these as `EXPO_PUBLIC_*` variables (for example in a local `.env`, which is git-ignored, or in an EAS build profile). Values are never committed.

| Name | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the Gimik API (gimik-backend). |
| `EXPO_PUBLIC_CATALOG_URL` | Base URL for catalog artwork. |
| `EXPO_PUBLIC_MEDIA_URL` | Base URL for user media. |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Sign-In web client ID. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google Sign-In iOS client ID. |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat public SDK key (Android). |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat public SDK key (iOS). |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for error reporting. |

With no API URL configured the app runs on bundled demo data.

### Run against a local gimik-backend

1. Start the backend (Postgres, object storage, API on port 8100) following the gimik-backend README, typically `docker compose up -d`, then seed it. The seed scripts in gimik-backend (`scripts/seed.py`, `scripts/seed_world.py`) create a local development seed world and accounts; see `scripts/seed_world.py` for the credentials. These exist only in your local database.
2. Point the app at it: `EXPO_PUBLIC_API_URL=http://localhost:8100`.
3. On an Android device over USB, forward the ports (re-run after reboot or unplug):

   ```sh
   adb reverse tcp:8100 tcp:8100   # API
   adb reverse tcp:9000 tcp:9000   # object storage (artwork)
   adb reverse tcp:8081 tcp:8081   # Metro
   ```

4. Build and install a development build, then start Metro:

   ```sh
   npm run android      # or: npm run ios
   npx expo start --dev-client
   ```

A debug build serves JS from Metro, so Metro must be running. Release builds block cleartext HTTP, so they cannot talk to a plain `http://localhost` backend. If the screen disagrees with what the API returns, restart with `npx expo start --clear`.

## Scripts

| Script | Command |
|---|---|
| `npm start` | `expo start` |
| `npm run android` | `expo run:android` |
| `npm run ios` | `expo run:ios` |
| `npm run web` | `expo start --web` |
| `npm run lint` | `expo lint` |
| `npm test` | `vitest run` |
| `npm run test:watch` | `vitest` |
| `npm run reset-project` | `node ./scripts/reset-project.js` (Expo template helper) |

## Builds with EAS

Build profiles in `eas.json`:

- `development`: development client, internal distribution.
- `preview`: internal distribution, Android APK.
- `screenshots`: unsigned iOS simulator build used for App Store screenshots.
- `production`: store builds (Android app bundle), with auto-incrementing build numbers.

```sh
npx eas-cli build --profile <profile> --platform <android|ios>
```

Secrets belong in EAS environment variables, not in the repo.

## Testing

- Unit tests: Vitest, colocated as `*.test.ts` under `src/lib/` (API client, mapping, sync, session, billing, and others). Run with `npm test`.
- End-to-end: Maestro flows in `.maestro/` (`app-preview.yml`, `app-store.yml`) capture App Store screenshots; EAS workflows are in `.eas/workflows/`. See [.maestro/README.md](.maestro/README.md).

## Project layout

```
src/app/         Expo Router routes (tabs, auth, plans, messages, groups, ...)
src/components/  Screen-level components; ui/ holds shared primitives
src/lib/         State, actions, feed/browse logic, billing, monitoring
src/lib/api/     API client, endpoints, schema, mapping, session, sync, realtime
src/i18n/        i18next setup and locale strings
src/data/        Bundled demo data
plugins/         Expo config plugins
assets/          Images and icons
docs/            Design and integration notes
.maestro/        Maestro flows
.eas/            EAS workflows
```

## Docs

- [docs/integration.md](docs/integration.md): how the app is wired to the API
- [docs/build-plan.md](docs/build-plan.md)
- [docs/finalize-plan.md](docs/finalize-plan.md)
- [docs/corpus.md](docs/corpus.md)
- [docs/qa-2026-09-18.md](docs/qa-2026-09-18.md)

## License

MIT. See [LICENSE](LICENSE).
