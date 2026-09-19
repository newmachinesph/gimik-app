# Gimik iPhone screenshots

These flows capture the real release-mode iOS UI on an iPhone 13 Pro Max
(1284 x 2778). They do not publish an update or submit a build to either store.

The `screenshots` EAS profile inherits the production app configuration, but
produces an unsigned simulator build and never increments the production build
number. The Maestro job reads credentials from the **preview** EAS environment:

- `MAESTRO_SCREENSHOT_EMAIL` (secret)
- `MAESTRO_SCREENSHOT_PASSWORD` (secret)

Use only the dedicated `gimik-screenshots-…@example.com` fixture account. The
preparation script refuses a personal account. Demo keeps are friends-only;
the seeded plan, conversation and journal belong to the fixture accounts.
The workflow does not create users or seed production data on each run.
The setup runs immediately after checkout, before EAS selects the simulator.
The Maestro worker uses the latest macOS image rather than its older default.

Build and capture:

```sh
npx eas-cli@latest workflow:run .eas/workflows/ios-screenshots.yml
```

Capture again without rebuilding:

```sh
npx eas-cli@latest workflow:run .eas/workflows/ios-screenshots-existing.yml --input build_id=SIMULATOR_BUILD_ID
```

Download the **Maestro Test Results** artifact from the completed workflow.
The six named PNGs are the candidate App Store images; inspect each for loaded
artwork, readable text, correct dimensions, and absence of keyboards or alerts
before uploading. A passing flow is not a visual approval.

Keep the artifact private: Maestro diagnostic output can include test inputs.
Do not publish logs or credentials alongside the six selected images.

The iOS simulator workflow uses EAS build/compute credits. It has no automatic
push or schedule trigger. The separate interactive EAS Simulator product is
not required.

## App preview footage

Record native iOS video clips from the same simulator build:

```sh
npx eas-cli@latest workflow:run .eas/workflows/ios-preview-existing.yml --input build_id=SIMULATOR_BUILD_ID
```

The preview flow starts recording only after login and prompt dismissal. Its
bounded editorial holds give viewers time to read each screen; the flow checks
screen readiness separately. It records real scrolling and the Open plan action.
The four `preview-*.mp4` files are inside the private Maestro Test Results archive.
No login footage belongs in a public preview.

The sibling `gimik-app-store/render_preview.py` edits these native recordings into
a 27-second, 886 × 1920 portrait H.264 movie. It adds brief captions, a sign-in/demo
disclosure and silent stereo AAC, without changing the app UI or adding music.
Review the entire result and verify its media properties before any store upload.
