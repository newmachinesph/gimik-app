# Gimik app design review

Date: 2026-09-18  
Scope: native `gimik-app`, including visual style and shared components.  
Direction: no formal design brief found; user requested review of the visual style as well as spacing.  
Review approach: design-review and Emil design-engineering skills, with the writing skill used for the report.

## Current spacing assessment, 2026-09-18

**Verdict: the app still has excessive inter-element spacing.** The keyboard fixes addressed overlap and extra lift, not the default spacing between ordinary fields and sections. Several shared components each add their own margin, so their combined spacing looks much larger than any one class suggests.

This assessment adds 11 fresh screenshots across seven routes on the attached Vivo V2205, Android 14. The phone reports 440 dpi and font scale 1.0; enlarged accessibility text isn't causing the gaps. Measurements below come from source layout points, not screenshot pixels. The existing 47-shot baseline follows later in this document. No application source, account data, or subscription settings changed during this assessment.

No formal brief exists. This pass follows the user's stated direction: assess visual style, reduce excessive gaps, preserve circular own-profile and bottom-menu avatars. The design-review skill's screenshot requirement uses the actual native Android app here, rather than browser breakpoints. iOS, tablet, and web layouts remain unverified.

### Highest-priority spacing fixes

| Priority | Current cause | Recommended change | Evidence |
| --- | --- | --- | --- |
| High | Default `Field` reserves an empty 18-point helper row, its 4-point margin, and 20 points below: 42 points before the next element, excluding focus wrappers. | Only allocate helper space when a hint/error exists; use 12–16 points between a field and the next field or inline action. Keep real validation messages and input touch heights. | `src/components/ui/input.tsx:174`, `:238`; [group form](screenshots/review-spacing-group-form-android-1080.png), [onboarding](screenshots/review-spacing-onboarding-android-1080.png). |
| High | `EmptyState` uses 56 points of padding on each side, plus 24 points between icon and title and 12 before body copy. Groups/Profile embed this full-page treatment inside an ordinary section. | Add a compact section variant with 16–24 points of vertical padding and an 8–12-point icon/text gap; keep the larger treatment only for standalone empty pages. | `src/components/ui/feedback.tsx:26`; [Groups](screenshots/review-spacing-groups-android-1080.png), [Profile record](screenshots/review-spacing-profile-record-android-1080.png). |
| Medium | `Section` always adds 32 points below it. `SectionHead` adds 16 below itself even when there's no section body. In Settings, the empty Hidden people section therefore leaves 48 points before Account. | Use a 24-point group gap and remove the unused heading-to-body gap for header-only sections. Let one component own each boundary. | `src/components/ui/screen.tsx:200`, `src/components/ui/section.tsx:25`, `src/app/settings.tsx:107`; [Settings](screenshots/review-spacing-settings-android-1080.png). |
| Medium | Only the three Edit Profile fields request compact spacing; the same About you / Work / Education fields during onboarding retain the 42-point default. | Make ordinary form spacing consistent across both routes, then apply it to sign-in, reset, groups, Journal, create-someday, and the bill-note form. | `src/app/edit-profile.tsx:121`, `src/app/onboarding.tsx:326`; [Edit Profile](screenshots/review-spacing-edit-profile-top-android-1080.png), [onboarding](screenshots/review-spacing-onboarding-android-1080.png). |

The field problem reaches 16 of the 19 `Field` usages in user-facing routes. Not every usage has an empty helper: the birthday input has an actual hint, which must remain visible. Fix the default centrally, then retest every caller instead of applying separate margin overrides.

### What not to compress blindly

Edit Profile's picker rows already form a readable, consistent list; [the scrolled view](screenshots/review-spacing-edit-profile-fields-android-1080.png) does not show the empty-helper defect between these rows. Their two-line labels and touch area serve a purpose.

The About you input itself has a 112-point multiline minimum (`src/components/ui/input.tsx:202`). Its unused interior can look like another gap when the bio occupies one line. Consider a smaller initial height for short bios with room to grow, but don't reduce the Journal text area globally.

[Forgot password](screenshots/review-spacing-forgot-android-1080.png) puts its action in a pinned footer. The large empty middle comes from that layout choice, not a giant input margin. For a single-field task, an inline button 16 points below the field would keep the action closer; don't accomplish this by deleting bottom safe-area protection.

[Create someday](screenshots/review-spacing-create-android-1080.png) has no results or action yet because the field is empty. Blank space after its last element isn't an inter-element spacing defect. With the [keyboard open](screenshots/review-spacing-create-keyboard-android-1080.png), the field stays in place above it instead of being needlessly raised.

Preserve the circular profile and bottom-menu avatars, completion ring, existing text contrast, focus outlines, and control hit areas. Keep keyboard clearance separate from ordinary form spacing; the latest keyboard adjustment has 121 passing tests, but this assessment did not rerun them.

### Suggested spacing rules

Use the existing 4/8/12/16/24-point values from `src/lib/tokens.ts:53`: 4–8 between label and input, 12–16 between related controls or an inline action, 24 between groups. These are proposed layout rules, not changes already applied. Larger empty areas should have a specific purpose, such as a hero photo or a standalone empty screen.

Implementation order: correct `Field` helper spacing first, then compact embedded empty states, then section-boundary ownership. Check both keyboard states after each change. A global reduction of every margin would make touch controls cramped without addressing the duplicated spacing.

### Screenshots captured for this reassessment

| Screenshot | State and observation |
| --- | --- |
| [Groups](screenshots/review-spacing-groups-android-1080.png) | Empty section separates its message from New group excessively. |
| [Group form](screenshots/review-spacing-group-form-android-1080.png) | Empty illustration correctly disappears while creating; the field-to-Create gap remains. |
| [Onboarding](screenshots/review-spacing-onboarding-android-1080.png) | Default field spacing makes related inputs look like separate sections. |
| [Edit Profile, top](screenshots/review-spacing-edit-profile-top-android-1080.png) | Compact fields improve external spacing; the short bio still occupies a tall box. |
| [Edit Profile, fields](screenshots/review-spacing-edit-profile-fields-android-1080.png) | Picker rows keep consistent two-line spacing. |
| [Profile](screenshots/review-spacing-profile-android-1080.png) | Circular avatars render correctly; the oversized Record empty state starts below the fold. |
| [Profile record](screenshots/review-spacing-profile-record-android-1080.png) | Section heading and empty-state illustration have excessive separation. |
| [Settings](screenshots/review-spacing-settings-android-1080.png) | Header-only Hidden people section leaves a redundant gap before Account. |
| [Forgot password](screenshots/review-spacing-forgot-android-1080.png) | Pinned footer, not helper spacing, causes the large field-to-action distance. |
| [Create, keyboard open](screenshots/review-spacing-create-keyboard-android-1080.png) | Focused input remains visible without unnecessary lift. |
| [Create, keyboard closed](screenshots/review-spacing-create-android-1080.png) | Empty space follows the last element; no second control exists yet. |

## Earlier implementation follow-up

After the baseline review, the user requested keyboard-safe input layouts and changed the profile-avatar direction to a circle with a profile-completion border. Those requests supersede the square-profile recommendation below.

Implemented a shared keyboard-aware scroll area and keyboard-following footer, plus keyboard handling in chat, onboarding, and modal sheets. The date-planning form now uses the shared scroll area. Main-profile and profile-tab avatars are circular, with a ring driven by the existing completeness calculation; photos are not rewritten or cropped in storage.

| Before | After | Why |
| --- | --- | --- |
| Chat composer and profile Save could sit behind the keyboard | Keyboard-aware layouts lift controls and scroll focused fields | Keep the typed value and action visible |
| Empty group illustration remained above the open creation form | Hide that empty section while creating | Keep Name and Create together |
| Square own-profile avatar and tab underline | Circular avatar with a proportional completion ring | Follow the user's updated direction |

Device checks used unsaved QA text, without sending messages, creating groups, saving profiles, or requesting password-reset emails. Verified screenshots: [Edit Profile](screenshots/review-after-edit-profile-android-1080.png), [onboarding Education](screenshots/review-after-onboarding-education-android-1080.png), [attachment place sheet](screenshots/review-after-attachment-place-android-1080.png), and [forgot password](screenshots/review-after-forgot-android-1080.png). The sign-in password field was focused and its accessibility bounds were above the keyboard, but the device returned an empty screenshot; this is not counted as visually verified.

The final Android release build is installed on the attached phone. [Group creation](screenshots/review-after-group-create-android-1080.png) now hides the empty illustration and keeps Name and Create above the keyboard. [Chat](screenshots/review-after-chat-android-1080.png) keeps typed text and Send above the keyboard without the extra bottom-safe-area gap. [Profile](screenshots/review-profile-ring-android-1080.png) shows circular own-profile and tab avatars with a completion ring matching the displayed 67% on this QA account.

The release build and 116 automated tests pass. TypeScript passes. Lint reports no errors and five existing import-order warnings in test files. iOS and web keyboard behavior have not been device-tested. Discover reported a connection error during final testing, preventing the final activity-specific Journal and date-planning checks. A separate health probe was blocked by the execution policy, so the connection failure's cause is not established. App source changes have not been committed, pushed, or published to an app store.

The remaining baseline findings below are not all fixed. In particular, generic field helper spacing, social-photo wiring, destructive-action contrast, and premature success messages remain follow-up work. The design skills guided reuse of the current visual tokens and a shared keyboard implementation rather than unrelated redesign changes.

## Baseline summary

Keep the warm paper background, dark text, deep-orange primary actions, and activity photography. The original square-avatar recommendation has been superseded for the own-profile avatar and tab indicator. The app needs consistent spacing rules and working keyboard layouts before more decorative changes.

The gap above **Save entry** comes from the shared `Field`: even without a hint or error, it adds an 18-point helper row, 4-point top margin, and 20-point bottom margin. Those 42 points sit outside the input itself; focus-ring wrappers add further separation. Earlier compact spacing changes reached Edit Profile but not the other forms.

The baseline was read-only; implementation followed the user's subsequent keyboard and avatar requests as recorded above. No form submissions, new groups, or messages were made during these review and layout checks. Normal navigation can still update read/seen state. Screenshots use QA accounts.

## Evidence and limits

Inspected all 26 user-facing route files, plus the root redirect and two layouts. Captured 47 screenshots on the attached Vivo V2205, Android 14, at 1080 × 2408 physical pixels. Device screenshots establish the observations below; source inspection identifies shared causes. Native layout points are not screenshot pixels.

Onboarding form screenshots came from direct step previews, not a new registration. Group details have only missing-group visual coverage; valid populated groups, incoming-invite sheets, and submission failure states remain code-reviewed. No iOS, tablet, desktop/web, large-font, landscape, or TalkBack pass took place. This is not a claim that every function or state passes.

The native-device capture replaces the design-review skill's browser viewport procedure for this pass. The right-edge gray handle and Android navigation bar belong to the phone, not Gimik.

## Must fix

### M1. Keyboard covers controls on Android

Confirmed in [group creation](screenshots/review-group-create-keyboard-android-1080.png), [Edit Profile](screenshots/review-edit-profile-keyboard-android-1080.png), and [chat](screenshots/review-chat-keyboard-android-1080.png).

Group creation leaves almost all of the focused name field and its Create button under the keyboard. Edit Profile keeps the focused Education field visible in the tested scrolled position, but its pinned Save button disappears. Chat is worse: both the message composer and Send button stay behind the keyboard. A second chat capture after a two-second settling period reproduced it; the accessibility bounds still placed the composer at y=2138–2259, below the keyboard's top edge.

Source: `src/components/ui/screen.tsx:43` limits keyboard lift to iOS; `src/app/messages/[id].tsx:62` also supplies keyboard-avoidance behavior only on iOS. Both assume Android window resizing handles the layout, which this installed build does not demonstrate. `src/app/groups/index.tsx:74` autofocuses a field below a large empty state.

Investigate the installed Android window/edge-to-edge behavior alongside the shared screen layout. Keep the focused input and its action above the keyboard, scroll lower fields into view, and collapse the group empty-state illustration while creating. Do not blindly apply both resizing and manual keyboard height, which can double the offset on other devices.

### M2. Active orange text lacks sufficient contrast

[Settings](screenshots/review-settings-bottom-android-1080.png) uses bright orange for Delete account. `src/components/ui/row.tsx:130` selects `text-brand-orange` for danger rows; `CountBadge` at line 37 uses paper-colored text on the same orange.

Calculated from `src/lib/colors.js`:

| Pair | Contrast ratio |
| --- | --- |
| Bright orange #FF5C24 / paper #FBF7F0 | 2.89:1 |
| Deep orange #C63D0B / paper | 4.83:1 |
| Danger #A83D2C / paper | 5.84:1 |
| Muted ink #6B6259 / paper | 5.59:1 |

Use the existing danger token for destructive labels, and deep orange or a dark foreground for count badges. Bright orange can remain decorative. These active text pairs fall below the 4.5:1 ordinary-text benchmark; disabled controls have different requirements. See [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). This token calculation is not a full accessibility certification.

### M3. Some screens announce success before the request succeeds

Code-confirmed; failure paths were not induced against production.

`src/app/interests.tsx:19` calls `update`, shows “saved,” and goes back without awaiting the result. `src/app/city.tsx:46` does the same for location/hometown. `src/app/plan/[id].tsx:45` announces completion and navigates immediately after `markDone`. Similar call patterns occur in friend-request actions.

Await the action result, prevent repeated submissions while pending, and retain the current screen/input on failure. Edit Profile's main save already uses an awaited result; use that behavior consistently.

`src/app/forgot.tsx:24` also presents success after any caught request error. Keep the same response for registered and unregistered addresses, but give a retryable connection error when no request reaches the server. Account privacy does not require pretending an offline request succeeded.

## Should fix

### S1. Remove empty helper space from ordinary fields

Confirmed in [Journal](screenshots/review-journal-android-1080.png), [group creation](screenshots/review-group-create-android-1080.png), and [onboarding account](screenshots/review-onboarding-account-android-1080.png).

`src/components/ui/input.tsx:174` applies `mb-5`; line 238 reserves the helper row even when no helper exists. `src/app/journal/[id].tsx:58` uses this default. Source search found 19 Field instances, with only the three Edit Profile fields explicitly compact.

Affected routes include sign-in, forgot/reset password, onboarding, create-someday, groups, Journal, and the plan's conditional bill-note field. Fix the shared default, then inspect each layout; actual hints and validation messages still need room. Keep field touch heights unchanged.

Use 12–16 points between a form field and its next action, and about 24 points between distinct groups as a starting rule. These are proposed design values, not measurements of every existing screen. A pinned bottom action on Forgot or onboarding intentionally has a larger gap; it is not the same defect as an inline Save entry button.

### S2. Social avatars ignore available profile photos

[Friends](screenshots/review-friends-android-1080.png), [chat](screenshots/review-chat-android-1080.png), and [plan](screenshots/review-plan-android-1080.png) show initials. The same QA person has a photo on the [person page](screenshots/review-person-android-1080.png); own-profile and tab photos also render.

Callers pass a name but no source: `src/app/friends.tsx:39`, `src/app/messages/index.tsx:38`, `src/app/messages/[id].tsx:74`, `src/components/people-grid.tsx:32`, `src/components/invite-row.tsx:27`, and `src/components/invite-sheet.tsx:40`. `NavRow` already accepts `avatarPhoto` at `src/components/ui/row.tsx:78`.

Resolve photos by stable person identity, pass them consistently, and retain initials only as fallback. The user subsequently requested a circular own-profile avatar with a completion ring, implemented in the follow-up above. Other avatar usages retain their existing shape. This is a rendering-data issue, not evidence that the R2 move lost photos.

### S3. Empty states consume too much space inside sections

[Groups](screenshots/review-groups-android-1080.png) combines a Yours/0 heading, a large empty illustration, explanatory copy, and another action section. Starting the form leaves all of that above the field.

`src/components/ui/feedback.tsx:26` applies `py-14` (56 points on each side). `Section` adds `mb-8` in `src/components/ui/screen.tsx`. Full-page emptiness and a small empty section need separate variants. Keep the large version for standalone empty screens; use a short inline message and nearby action for Groups/Profile record sections.

### S4. Invalid invitation looks valid

Opening a deliberately invalid token produces [“You are invited / Groups / Join”](screenshots/review-join-invalid-android-1080.png) with an enabled Join button. No Join action was taken.

`src/app/join/[token].tsx:28` checks only whether the token string exists. Its group name lookup searches already-loaded memberships, so a new invitation cannot reliably identify the destination.

Add a read-only invitation preview/validation state before enabling Join. Show the group name for a valid link and an expired/invalid state otherwise; never imply that a nonempty token proves an invitation exists.

### S5. Completed activity has conflicting states across screens

The QA Aquarium activity appears as done in [Journal](screenshots/review-journal-android-1080.png) and [activity detail](screenshots/review-want-android-1080.png), but the [plan](screenshots/review-plan-android-1080.png) still offers “We did it.” The [duo chat](screenshots/review-chat-android-1080.png) says there is no date.

`src/app/plan/[id].tsx:55` always renders the completion action. `src/app/messages/[id].tsx:46` resolves a plan only for plan-kind threads, even though a duo thread can pin the same activity. `src/app/want/[id].tsx` uses the same no-note fallback regardless of completed status.

Derive the displayed status from the activity's current state and associated plan. Completed views should lead to the journal or explicitly offer planning another occurrence.

### S6. Somedays relies on an undisclosed gesture

The [deck](screenshots/review-somedays-android-1080.png) has no visible Keep/Pass controls or swipe instruction. `src/components/decide-deck.tsx:205` supplies accessibility actions, which is useful, but a sighted first-time user still has to discover the gesture.

Provide compact labeled Keep/Pass controls or a clear first-use hint plus a non-gesture alternative. Keep image-led browsing; do not add a permanent instructional paragraph over the photo. TalkBack behavior still needs device testing.

### S7. Onboarding makes selectable items look disabled

[Starter picks](screenshots/review-onboarding-picks-android-1080.png) renders every unselected activity at 0.55 opacity in `src/app/onboarding.tsx`. They are interactive, but the styling matches unavailable controls.

Keep unselected cards fully readable; use a selected border/check indicator. The [account step](screenshots/review-onboarding-account-android-1080.png) also displays a disabled Apple button without an explanation when Google is available. Hide unsupported choices on this platform or label their availability explicitly.

The photo preview switches from a square placeholder to a 200 × 250 image at `src/app/onboarding.tsx:303` (source-confirmed, selected-photo state not exercised). Use a square primary-avatar preview to match the requested avatar shape; retain portrait photos only where a gallery deliberately needs them.

### S8. Filter icon has inconsistent behavior

The Somedays filter icon opens a [category sheet](screenshots/review-category-sheet-android-1080.png). The same filter-style control on [Discover](screenshots/review-discover-ready-android-1080.png) clears the query/category via `src/app/(tabs)/discover.tsx` instead of opening a selector.

Use an explicit Clear/Reset control for resetting, or make both filter icons open their respective options. A familiar icon should not silently mean the opposite operation on another tab.

## Could improve

### Visual style and component rules

The palette suits a social activity app. Its strongest screen is loaded Discover, where different activity photos carry the content and the cream background stays quiet. Avoid a wholesale rebrand.

The implementation mixes rectangular primary controls with a pill-shaped Complete profile action, pill tags, and circular icon buttons. Circles for icon-only controls are reasonable; the primary-action exception makes Profile feel like a separate design. Define shapes by role rather than applying one radius to everything.

Typography has a clear heading hierarchy, but repeated uppercase field labels and explanatory text can make routine forms feel heavier than necessary. `src/components/ui/txt.tsx` currently uses 15-point body text despite a comment discussing larger body sizes. Evaluate a 16-point body baseline with larger-font testing; do not shrink text to solve spacing.

The Profile tab retains an orange completion underline even when Discover is selected. Move that progress cue onto Profile or distinguish it clearly from navigation selection. Keep the selected tab state dominant.

### Proposed changes, not applied

| Before | After | Why |
| --- | --- | --- |
| Empty helper row plus 20-point margin after ordinary fields | Helper only when needed; shared 12–16-point field/action gap | Reconnect Save entry with its input without shrinking controls |
| Keyboard covers group input, chat composer, and pinned Save | Keyboard-aware viewport with focused-field scrolling and visible action | Users need to see what they type and how to submit it |
| 56-point empty-state padding inside an ordinary section | Compact inline empty variant; full-page variant only where appropriate | Avoid stacking decorative space above the next task |
| Initials despite an available profile photo | Photo-aware square avatars with initials fallback | Recognize the same person across screens |
| Bright orange used for active small text and destructive labels | Deep orange for text/badges; danger token for destructive actions | Improve legibility and distinguish destructive actions |
| Pill-shaped Profile CTA among rectangular primary buttons | Shared primary action shape; pills reserved for tags if desired | Make action types predictable |
| Dimmed but selectable onboarding cards | Full-opacity cards with selected border/check | Separate “not selected” from “disabled” |
| No visible deck decision controls | Compact Keep/Pass controls or equivalent discoverable alternative | Make the main interaction understandable |
| Blank journal body rendered above the date | Render body only when present, then compact date padding | Remove the dead caption line in photo-only entries |
| Inactive Profile tab has progress underline | Progress on profile page, or a non-selection-shaped indicator | Avoid suggesting two active tabs |

The photo-only Journal issue comes from the unconditional body text node at `src/app/journal/[id].tsx:66`; see the empty area above the photo entry's date in the Journal screenshot.

## What works well

Activity images are distinct in the inspected Discover grid; the catalog count is 2000. The root storage verification also retained all 2000 catalog objects. That does not mean every image received a visual relevance review.

Square own-profile avatars and the activity grid provide a useful starting point. Shared RowList separators, clear input focus rings, and the category/religion sheets look consistent on this phone. Journal's focused text field and inline Save entry remain visible with the keyboard open; the keyboard defect does not affect every layout equally.

Muted ink on paper has adequate token contrast. Primary deep-orange actions already use a stronger contrast pair than the bright-orange accent, so a palette replacement is unnecessary.

## Route coverage

“Viewed” means the listed screen/state was captured and inspected, not that its submissions passed.

| Route | Visual coverage | Remaining limits |
| --- | --- | --- |
| welcome | Welcome screen | No sign-up submission |
| onboarding | Story first page; account, profile, photo, city, about, interests, picks previews | Remaining story pages and successful new registration not exercised |
| sign-in | Empty form | No auth attempt in this pass |
| forgot | Empty form | Delivery and error states code-only |
| reset | Manual reset form | No reset submission |
| (tabs)/discover | Loading and loaded grid | All pages/categories not visually exhausted |
| (tabs)/activity | Existing QA activity | Empty variant code-only |
| (tabs)/home | Deck and category sheet | No Keep/Pass state writes |
| (tabs)/invites | Empty state | Incoming invite/accept/decline code-only |
| (tabs)/profile | Populated QA profile | Long-content variants not exercised |
| want/[id] | Completed QA activity | Other states code-reviewed |
| person/[name] | Existing QA person's profile | Report/hide actions not submitted |
| lock/[id] | Date selection screen | No date changes |
| plan/[id] | Existing plan | Split edits/completion not submitted |
| journal/[id] | Existing entries, photo, empty composer, keyboard | No entry submission |
| create | Empty form and keyboard | Search-result/create submissions not exercised |
| messages/index | Existing conversation list | Empty list code-only |
| messages/[id] | Existing duo chat, keyboard, attachment sheet | No messages/attachments sent |
| friends | Existing QA friend | Request actions code-only |
| groups/index | Empty list and create form, keyboard | No group created |
| groups/[id] | Missing-group state | Populated detail code-only |
| join/[token] | Invalid-token presentation | No Join attempt; valid invitation untested |
| settings | Upper/lower sections | No preferences, sign-out, or destructive actions changed |
| edit-profile | Upper/lower form, keyboard, religion sheet | No profile submissions; language sheet avoided because dismiss calls update |
| interests | Existing interest selection | No Save |
| city | List and keyboard | No location selected |

Root `index.tsx`, root layout, and tab layout were also inspected. Dark mode remains unverified: `app.json` declares automatic interface style while the current palette is fixed and root status bar uses dark icons. The welcome/photo screens need a route-appropriate status-bar treatment. Reduced-motion handling exists for scrolling titles; gesture/sheet behavior and screen-reader traversal need a separate device pass.

## Suggested implementation order

1. Correct Android keyboard layout, then repeat group creation, chat, Edit Profile, sign-in, and onboarding on the device.
2. Fix shared Field spacing and compact empty states; verify hints, errors, multiline fields, and footer clearance.
3. Wire social avatar photos and correct status/success handling.
4. Apply contrast and shape rules, then check large text and a second screen size.

After implementation, run type checking, lint, and the existing automated tests, followed by a new screenshot pass. A successful test suite alone cannot establish visual correctness.

## Separate storage follow-up completed

The previously authorized R2 folder migration finished during this review. Bucket root now contains only `catalog/` and `users/`; no loose root objects remain. Cleanup removed exactly three legacy copies after the signed-URL grace period, preserving the three destination copies. Database legacy references are zero; the catalog retains 2000 objects.

Folder organization does not establish privacy. The existing public CDN access remains unchanged, so Journal's “Private, unless you share it” promise still needs a separate access-control review. No bucket permission changes were made in this pass.

## Screenshots captured

All files below are native Android captures at 1080 × 2408 physical pixels, saved under `screenshots/`.

| Screenshot | State |
| --- | --- |
| [review-activity-android-1080.png](screenshots/review-activity-android-1080.png) | activity |
| [review-category-sheet-android-1080.png](screenshots/review-category-sheet-android-1080.png) | category sheet |
| [review-chat-android-1080.png](screenshots/review-chat-android-1080.png) | chat |
| [review-chat-attach-android-1080.png](screenshots/review-chat-attach-android-1080.png) | chat attach |
| [review-chat-keyboard-android-1080.png](screenshots/review-chat-keyboard-android-1080.png) | chat keyboard |
| [review-city-android-1080.png](screenshots/review-city-android-1080.png) | city |
| [review-city-keyboard-android-1080.png](screenshots/review-city-keyboard-android-1080.png) | city keyboard |
| [review-create-android-1080.png](screenshots/review-create-android-1080.png) | create |
| [review-create-keyboard-android-1080.png](screenshots/review-create-keyboard-android-1080.png) | create keyboard |
| [review-discover-android-1080.png](screenshots/review-discover-android-1080.png) | discover |
| [review-discover-loaded-android-1080.png](screenshots/review-discover-loaded-android-1080.png) | discover loaded |
| [review-discover-ready-android-1080.png](screenshots/review-discover-ready-android-1080.png) | discover ready |
| [review-edit-profile-fields-android-1080.png](screenshots/review-edit-profile-fields-android-1080.png) | edit profile fields |
| [review-edit-profile-keyboard-android-1080.png](screenshots/review-edit-profile-keyboard-android-1080.png) | edit profile keyboard |
| [review-edit-profile-top-android-1080.png](screenshots/review-edit-profile-top-android-1080.png) | edit profile top |
| [review-forgot-android-1080.png](screenshots/review-forgot-android-1080.png) | forgot |
| [review-friends-android-1080.png](screenshots/review-friends-android-1080.png) | friends |
| [review-group-create-android-1080.png](screenshots/review-group-create-android-1080.png) | group create |
| [review-group-create-keyboard-android-1080.png](screenshots/review-group-create-keyboard-android-1080.png) | group create keyboard |
| [review-group-missing-android-1080.png](screenshots/review-group-missing-android-1080.png) | group missing |
| [review-groups-android-1080.png](screenshots/review-groups-android-1080.png) | groups |
| [review-interests-android-1080.png](screenshots/review-interests-android-1080.png) | interests |
| [review-invites-android-1080.png](screenshots/review-invites-android-1080.png) | invites |
| [review-join-invalid-android-1080.png](screenshots/review-join-invalid-android-1080.png) | join invalid |
| [review-journal-android-1080.png](screenshots/review-journal-android-1080.png) | journal |
| [review-journal-keyboard-android-1080.png](screenshots/review-journal-keyboard-android-1080.png) | journal keyboard |
| [review-lock-android-1080.png](screenshots/review-lock-android-1080.png) | lock |
| [review-messages-android-1080.png](screenshots/review-messages-android-1080.png) | messages |
| [review-onboarding-about-android-1080.png](screenshots/review-onboarding-about-android-1080.png) | onboarding about |
| [review-onboarding-account-android-1080.png](screenshots/review-onboarding-account-android-1080.png) | onboarding account |
| [review-onboarding-android-1080.png](screenshots/review-onboarding-android-1080.png) | onboarding |
| [review-onboarding-city-android-1080.png](screenshots/review-onboarding-city-android-1080.png) | onboarding city |
| [review-onboarding-interests-android-1080.png](screenshots/review-onboarding-interests-android-1080.png) | onboarding interests |
| [review-onboarding-photo-android-1080.png](screenshots/review-onboarding-photo-android-1080.png) | onboarding photo |
| [review-onboarding-picks-android-1080.png](screenshots/review-onboarding-picks-android-1080.png) | onboarding picks |
| [review-onboarding-profile-android-1080.png](screenshots/review-onboarding-profile-android-1080.png) | onboarding profile |
| [review-person-android-1080.png](screenshots/review-person-android-1080.png) | person |
| [review-plan-android-1080.png](screenshots/review-plan-android-1080.png) | plan |
| [review-profile-android-1080.png](screenshots/review-profile-android-1080.png) | profile |
| [review-religion-sheet-android-1080.png](screenshots/review-religion-sheet-android-1080.png) | religion sheet |
| [review-reset-android-1080.png](screenshots/review-reset-android-1080.png) | reset |
| [review-settings-bottom-android-1080.png](screenshots/review-settings-bottom-android-1080.png) | settings bottom |
| [review-settings-top-android-1080.png](screenshots/review-settings-top-android-1080.png) | settings top |
| [review-sign-in-android-1080.png](screenshots/review-sign-in-android-1080.png) | sign in |
| [review-somedays-android-1080.png](screenshots/review-somedays-android-1080.png) | somedays |
| [review-want-android-1080.png](screenshots/review-want-android-1080.png) | want |
| [review-welcome-android-1080.png](screenshots/review-welcome-android-1080.png) | welcome |
