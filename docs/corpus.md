# Gimik — the corpus

The complete definition of the product as it ships next: what Gimik is, the
words it uses, how people reach each other, what every screen is for, and what
is cut. Approved before the UI is rebuilt against it. Everything here runs on
static data — the seeded catalog and seeded people — so every state can be seen
on a phone with or without the API.

## 1. What Gimik is

**A bucket list that gets you invited.**

You keep a list of somedays — activities you keep meaning to do. Wanting one
opens your interest to other people: everyone your visibility lets in can see
you want it, and invite you to do it together. That is the whole product.
Activity first, people second, always in that order — nobody browses people;
they browse somedays, and the people arrive through the somedays.

It is, lowkey, a dating app. It never says so. Simple like an Apple app to use;
exciting because every swipe right is a small bet that someone will answer it.

Philippines only. English only. The copy still resolves through one deck so
the wording stays reviewable in one place, but no second language ships.

## 2. Vocabulary

| Word | Means | Never say |
|---|---|---|
| **Someday** | An activity on your list without a date | want, item, card, activity (in UI) |
| **Keep / Pass** | The swipe decision on a someday | like, save, reject, swipe |
| **Invite** | Someone asking to do one of your somedays with you | match, request, like |
| **Duo / Group** | An invite for two, or for several | date, hangout |
| **Lock** | Giving a someday a date | schedule, book |
| **Plan** | A locked someday with its date, people, place, thread | event |
| **Record** | Somedays you've done | history, achievements |
| **Friend** | Mutual: requested and accepted | follower, connection |
| **Group** | A named set of people you joined; membership is not friendship | crew, team, circle |
| **Visibility** | Who a someday is open to: Just me · Friends · Groups · Everyone | privacy, ring |
| **Not now / Hide** | Declining an invite / never seeing that person's invites | unmatch, block, reject |
| **Lapse** | An invite reaching seven days unanswered | expire, timeout, ghost |

## 3. The journey

> **Want** a someday → be **seen** by the people it's open to → get **invited** → **talk** → **lock** a date → **do** it together → it joins your **record**.

Every screen either moves a someday one step along this line or shows where it
is on it. The tab bar reads left to right in this order.

## 4. People

There is no third category beyond friend, group member, and stranger: those are
the only three ways a person can stand in relation to you — mutual, shared
membership, or none. Everything below builds on that.

**Friends** are mutual. Adding someone from their profile sends a request;
they see it under Friends → Requests with *Accept* / *Not now*. Nobody is a
friend until both sides have said so.

**Groups** are membership. Create one, name it, share its link; whoever opens
the link is in. A group's members can invite you to any someday with *Groups*
visibility **whether or not you have friended them** — that is what joining a
group means.

**Visibility** has two axes, asked together the moment you keep a someday
(swipe right), in one small prompt on the card:

- **Open to** — who may see it and invite you: *Friends* · *Groups* ·
  *Everyone* (anyone in your city who wants it). Multi-select; *Just me* is
  none of them. Default *Friends*.
- **As** — the shape you'd do it in: *Duo* · *Group*. Multi-select; default both.

"Remember my choice" turns the prompt off; Settings holds the default and the
detail screen can change either axis later. Strangers can invite as Duo when
*Everyone* and *Duo* are both on — the person chose that, per someday. Report
and Hide exist from day one because of it.

**Invites** come as **Duo** or **Group**, chosen by the inviter. Accepting
opens a thread with that person (or group) and the someday pinned to it.

**Not now** declines one invite quietly; **Hide {name}** stops that person's
invites for good. Both reversible in Settings. Nobody is told they were
declined.

## 5. Messaging

Three kinds of thread, one screen:

- **Solo** — you and one person. Opened by accepting a duo invite, or from a
  friend's profile.
- **Group** — a group's members. Every group has one.
- **Plan** — the people in a locked plan. Created when the plan is locked; the
  plan card sits pinned at the top.

A thread can carry a someday, a date proposal, or a place as an attachment, so
"lock it" can happen inside the conversation. Inbox lives behind the envelope
in the Invites header and under Activity → Messages; unread count on both.

## 6. The five tabs

Discover · Activity · **Somedays** · Invites · Profile. Flat paper bar,
10px labels, the deck in the middle because deciding is the habit.

| Tab | Question | What is on it | Empty |
|---|---|---|---|
| **Discover** | *What could I want?* | Search, category chips, catalog grid, **+** in the header. No rails. | "Nothing matches — try a category." |
| **Activity** | *What's happening?* | **Locked** (soonest first, countdown) · **Waiting for a date** · **Done** (last 3 → Record) · **Messages** row with unread count | "Nothing moving yet. Keep a someday and it lands here." → Somedays |
| **Somedays** | *Is this one mine?* | **Gimik** wordmark left; undo + **filter** right. The deck: full-bleed card, swipe right keep / left pass, tap for detail. Nothing else. | "You've seen everything for now" → Discover |
| **Invites** | *Who wants to do this with me?* | §7. Envelope (inbox) in the header. Badge when new. | "No invites yet. Keep a few somedays that take company." → Somedays |
| **Profile** | *Who am I to them?* | §9. | Record empty: "Nothing finished yet." |

## 7. Invites

One row per person-and-someday, the someday first:

```
[avatar]  Dive a coral reef                              ›
          Ana Cruz ♀ · Group · Cebu City
```

Line 1: the someday, two lines max, scrolling if longer. Line 2: name, gender
mark (from their profile, never guessed), Duo/Group, city — one plain caption,
no pills. Tap avatar → their profile. Tap row → the invite, up close, where
*Accept* lives: accepting opens a thread with someone who may be a stranger,
and that is not a thing to do by brushing a list. Swipe left → *Not now* ·
*Hide {name}*.

**Invites lapse after seven days.** An invite is a question about a weekend, so
it stops being one after a week: it leaves the tab, the badge and the opening
sheet. Nothing is deleted — the invite keeps its status and its place in
history. Letting one lapse is the quietest way to say no, and as with *Not now*
the sender is never told which it was. Time remaining is shown only inside the
last 48 hours: a clock that runs all week is pressure, not information.

**Threads never lapse.** A thread carries the someday and is where the plan gets
made, so killing it at 72 hours would delete the workspace rather than a stalled
chat. A silent one simply sinks in the inbox and reads *No reply yet*.

## 8. A person's profile — `person/[name]`

Photos first — up to eight, served from the media store at
`people/<id>-N.webp`, the first being the avatar everywhere. Someone with no
portrait in the store falls back to their initials rather than a broken frame,
which is the state the seeded world is in until the backend seed fills it —
then name,
age, gender mark, city, a one-line bio, member since. **Add friend** (→ *Requested*
→ *Friends*); **Message** once friends. **Somedays in common** — each opens the
shared detail. **Their somedays** — the rest, each with a Keep heart. Primary:
**Plan something together** → `lock/[id]` on the first someday in common.

## 9. Your profile

Cog top-right → Settings. Your first photo in a completeness ring; name; age;
handle; **city**; a one-line bio; a small **Complete profile** chip naming the
next step (photo → name → city → bio → three somedays → first lock).

**Edit profile**: up to **eight photos**, the first is your face everywhere;
name, bio, and **city** are changeable any time (city from the Philippine list
only — Gimik is Philippines-only, and city is how *Everyone* finds you).
**Birthday and gender are set once at sign-up and cannot be changed**; age is
derived from birthday. Then
**Friends · N** and **Groups · N** rows. Then **Record** — one number, one
list. No stats bento, no buckets.

## 10. The someday detail — `want/[id]`

The only place a someday is fully described; every card opens it.

1. Photo full-bleed; back and heart over it; no title bar.
2. Title; one line of context: category · place scope.
3. **State line**, exactly one: *Locked · Sat 14 Sep* / *Kept, no date* / *Not on your list*.
4. **Open to**: Just me · Friends · Groups · Everyone.
5. **Who's in**: avatars of people holding it, each → their profile. "Plan it with {name}" when any can invite; "You're the first" when none.
6. Primary button, one of: *Keep this* / *Lock a date* / *Open plan* / *Open journal*.
7. Below the fold: the note, and the map if the someday is placed. (No tag
   row: nothing in the catalogue, the authored wants or the API carries tags,
   and a section that can never fill is worse than one that does not exist.)

Never a control for a state the someday is not in. No Want/Need/Goal pills.

## 11. The plan flow

Entered from the detail, an Activity row, a thread, or a person's profile —
always the same screens in the same order:

`lock/[id]` (date, who) → `plan/[id]` (date, people, place, split, thread) →
mark done → `journal` (photo, note) → Record.

`calendar`, `map/[id]`, `place/[id]`, `split/[id]` are steps inside the plan,
not destinations.

## 12. The opening sheet

On open and on every return to the foreground, if there is news: new invites,
friend requests, unread threads, a plan within 24 hours. Same row layout as
Invites; rows tap through; dismiss marks everything shown as seen. Never twice.

## 13. Onboarding

Welcome → three-page story → account → **name, birthday, gender** (fixed
after this) → **first photo** → **city** → interests (search, emoji chips,
skip) → starter picks → the deck, picks already kept. First reopen has news.

## 14. Cut

Japanese as a second language · Buckets · **Want/Need/Goal kinds** (all three
apply to any someday, so the label said nothing) · Founding-member paywall ·
System dev screen · Discover rails · Profile stats bento.

**Resurface stays**, as deck cards: a someday kept 90 days without a date
comes back through the deck with a *Still want this?* stamp — right keeps it,
left lets it go. No separate screen.

## 15. Static data

The seeded world is the data. Seeded people gain `gender` and `city`; some
send requests, invites and messages. Seeded invites carry real timestamps, so a demo state left on a phone for a
fortnight lapses the same way a real one would. Settings → Developer
(dev builds only):
**Demo state** — *fresh* / *a week in* (12 kept, 2 locked, 1 done, 6 invites,
2 requests, 1 group, 3 threads) / *veteran* — and **Reset**.

## 16. Visual system

4px radius on every rectangular surface; circles stay circles. One orange
primary per screen. Titles clamp to two lines and scroll. Flat paper tab bar.
No shadows — hairlines and surface. Photos do the exciting; chrome stays quiet.

## 17. Rebuild

A fresh Expo project (`gora-v2`, latest SDK) built screen by screen against
this document, on static data, checked on both phones at every step. The API
is wired last, behind the same gateway seam the current app already has.

Order: shell + tabs + design tokens → catalog + deck → detail → Invites +
person profile → friends + groups → messaging → plan flow → Activity →
Profile + Settings → onboarding → opening sheet → demo states → API.

## 18. Open questions

- Age on profiles — show it (dating-app norm) or not (bucket-list norm)?
- "Everyone" visibility: same city, or same province?
- Group owners who can remove members, or is leaving the only exit?
