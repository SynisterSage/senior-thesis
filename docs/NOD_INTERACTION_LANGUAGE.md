# Nod interaction language

Nod has one job during a walk: help someone notice and keep a moment without reaching for their phone.

**Physical action:** press Nod when something catches your attention.

**Digital response:** TrailMark attaches that press to time and place, then helps the person revisit it later.

Nod is not a screenless navigation device, fitness tracker, or notification surface. Its haptics should be quiet, sparse, and meaningful.

## The core physical ritual

```text
Something catches my attention
        ↓
I press Nod without looking at my phone
        ↓
Nod confirms with two short pulses
        ↓
TrailMark saves a moment at the current trail location
        ↓
Later, TrailMark asks me to remember before revealing the place
```

One press remains Nod's only MVP input. Haptic patterns are feedback from Nod, not gestures people need to learn or commands they must respond to.

## Haptic cues

| Cue | Physical experience | What it means | TrailMark UI behavior | MVP status |
| --- | --- | --- | --- | --- |
| Notice | One soft, brief pulse | “There may be something worth taking in here.” | Nothing needs to interrupt the walk. If the phone is open, the map can quietly animate the prepared trail point. The later reflection prompt can be tied to this part of the trail. | Prepared/Wizard-of-Oz cue |
| Saved | Two short, clear pulses after a press | “Your moment is safely kept.” | Update the Nod mark count, add the moment marker, and show a brief `Moment saved` confirmation. Do not open a sheet or demand a note. | Required physical interaction |
| Return | A slower paired pulse near a place the hiker previously marked | “You have been here before.” | Do not reveal the old note on the walk. On recap, TrailMark can connect both points in the story. | Future; needs reliable location logic |
| Finish | One longer, gentler pulse | “This walk is complete.” | The map moves into the finish/revisit state. The recap is available when the person chooses to open it. | Prepared demo cue |

The patterns need to feel different through touch, but there should be only a few. The confirmation pattern is the one someone must recognize; Notice and Finish are ambient invitations, not instructions.

## During-walk UI contract

The physical object leads. The phone should support it without stealing attention.

### When Nod gives a Notice cue

- Nod buzzes once at a prepared, meaningful point on the trail.
- No phone notification, modal, or forced question appears.
- If the hike map is already open, a nearby context point can gain a soft pulse; it must not open its sheet automatically.
- The hiker may press Nod, ignore the cue, or keep walking. All three are valid.

### When someone presses Nod

- Nod gives the Saved pattern only after TrailMark receives and stores the mark.
- The map gets one restrained response: a point blooms into place and the mark count increments.
- A short `Moment saved` status can appear and fade. It must not cover the map controls or require dismissal.
- If the save fails, Nod must not give the success pattern. The app should instead show the honest pending/error state in the Nod status strip.

### When the walk finishes

- Nod gives the Finish pattern once.
- TrailMark offers the recap, but does not force someone to reflect at the trailhead.
- The first recap step asks what they remember before showing the exact location and prepared context.

## How the haptics make the app feel complete

Each cue has a visible consequence in TrailMark, even if the physical prototype is simulated during the thesis demo.

| Physical moment | Small live-map response | Later story response |
| --- | --- | --- |
| Notice cue | A prepared trail point has a quiet pulse when the map is open. | A place-specific reflection question can appear during revisit. |
| Nod press | New marker blooms; Nod count updates. | The marker becomes a numbered story moment with the person's words. |
| Return cue | No immediate content reveal. | The recap can show a gentle “you came back through here” connection only when the route supports it. |
| Finish cue | Finish state replaces active hike controls. | The story preview begins with the route, start, finish, and kept moments. |

This keeps the app's animation meaningful: it is evidence of a physical act, not decoration.

## What to demonstrate in the thesis prototype

For the indoor Wizard-of-Oz demo, show only three cues:

1. **Notice** at one prepared location.
2. **Saved** when the visitor presses Nod.
3. **Finish** when the prepared walk ends.

The demo script can be honest:

> “In this prototype, the prepared trail triggers the Notice and Finish cues. The Nod press is the interaction being tested: it saves a moment to TrailMark.”

If using a microcontroller and haptic motor, the physical prototype should only need a button, vibration motor, and a way to send/receive the prepared cue. If hardware is not connected, the same haptics can be performed by the facilitator while the app shows the matching prepared state.

## Deliberate non-features

Do not use Nod haptics for:

- Turn-by-turn directions or wrong-turn alerts.
- Distance, pace, calories, elevation, or performance goals.
- Constant points-of-interest alerts.
- Social likes, streaks, badges, or group coordination.
- Interpreting someone's mood or deciding what should matter to them.

The test remains simple: **does this cue help a person notice, mark, or remember a moment better?** If not, it does not belong on Nod.

## Questions to test

- Does one Notice pulse feel inviting, or does it feel like an interruption?
- Can someone tell Saved from Notice while walking and without looking down?
- Does delayed reflection make the physical press feel more meaningful than a phone pin?
- How few cues can create a complete feeling of hardware-to-app continuity?
