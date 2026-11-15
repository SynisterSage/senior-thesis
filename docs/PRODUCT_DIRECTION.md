# TrailMark product direction

Updated November 13, 2026.

## Product in one sentence

**Nod captures the moment; TrailMark gives it place, context, and memory.**

TrailMark is not trying to become a complete hiking utility. It is a memory-focused trail experience built around a small, screenless physical companion. The phone app prepares the hiker, receives or creates marks, connects them to the trail, and helps the hiker reconstruct the experience later.

## Product hierarchy

1. **Nod is the differentiator.** Its value is a quiet, tactile, screenless way to mark something while the phone stays away.
2. **The map is the spatial record.** It confirms where a mark happened and provides useful trail context without taking over the experience.
3. **Reflection is the meaning-making layer.** The hiker explains the moment after the hike, before the app reveals too much context.
4. **The Nod page is the device relationship.** Pairing, connection, battery, customization, testing, and help belong there.

The app must remain usable without Nod. Phone-only marking is both an accessibility fallback and a useful comparison condition for thesis testing; it must not make the physical product feel unnecessary.

## Current MVP

The first complete prototype is one end-to-end experience for the Grand Prismatic Overlook trail:

```text
Choose trail → Prepare → Start hike → Mark with Nod or phone
→ Finish → Recall the moment → Reveal place → Read recap → Archive
```

The prototype should make these claims honestly:

- One press or tap represents one intended moment.
- A mark is only shown as saved after the app receives and stores it.
- The phone supplies location; Nod is not a standalone GPS or navigation device.
- Prepared trail content and Wizard-of-Oz states are labeled separately from working hardware behavior.

See [Nod interaction language](./NOD_INTERACTION_LANGUAGE.md) for the physical cue patterns and their matching UI behavior.

## What is already represented in the prototype

- A focused hike map for Grand Prismatic Overlook.
- A route with start and destination anchors.
- Sequential demo moments that follow the trail in order.
- A phone fallback for marking when Nod is unavailable or simulated.
- A compact connection/status strip at the top of the map.
- Nearby Yellowstone context points such as Excelsior Geyser, Midway Geyser Basin, Goose Lake, and Grand Prismatic Spring.
- Context cards with local NPS imagery and factual descriptions.
- Recenter and restrained zoom controls.
- A direction toward recall-first reflection, recap, and Archive.

These are prototype states, not proof that background Bluetooth, locked-phone capture, or outdoor location reliability is complete.

## Nod entry point on the trail map

The map should have one quiet Nod entry point: make the existing connection/status strip tappable.

The first sheet should be small and useful:

- Nod product visual.
- Connected, disconnected, or reconnecting state.
- Current session mark count.
- Battery or last-sync information once real hardware supports it.
- `Manage Nod` action leading to the dedicated Nod page.
- A clear phone-only fallback when Nod is unavailable.

Do not add a second large floating Nod control beside recenter and zoom. The map controls are for the map; the status strip is for the device relationship.

## Phased build direction

### Phase 1 — Make the Nod relationship visible

- Make the map status strip tappable.
- Add the compact Nod sheet and product visual.
- Define connected, disconnected, reconnecting, and phone-only states.
- Keep the sheet separate from the mark action.

### Phase 2 — Make capture feel physical

- Connect a real button event from a BLE development board or Nod prototype.
- Save time and phone location locally while the phone is locked.
- Return a confirmation cue only after the save succeeds.
- Show a restrained map response and `Nod marked` confirmation.
- Test duplicate presses, missing location, disconnects, and reconnects.

### Phase 3 — Build the Nod page

- Pair, replace, disconnect, and reconnect Nod.
- Show battery and last sync when available.
- Test the button.
- Explain attachment and how to find the button by touch.
- Add only meaningful customization: confirmation cue and press behavior if the hardware supports it.

### Phase 4 — Complete the memory loop

- Finish the recall-before-location reflection flow.
- Connect marked moments to photos or contextual trail imagery without manufacturing the user's memory.
- Build the recap and Archive around the hiker's own words.
- Test whether Nod makes marking less interruptive than phone capture.

### Phase 5 — Validate the object and exhibition flow

- Test the clip, gear attachment, and optional wrist loop.
- Test finding the button with sleeves, gloves, or poles.
- Run a short real walk and an indoor demonstration.
- Label every live, prepared, and simulated part honestly.
- Document what the physical interaction adds that phone-only marking does not.

## Product guardrails

### Keep

- One intentional physical action.
- Quiet confirmation.
- Phone away during the walk.
- Honest status when a mark or location is pending.
- Context that helps someone remember a place.
- Personal reflection instead of automatic interpretation.
- A useful phone-only path.

### Do not add to the MVP

- Turn-by-turn navigation.
- Wrong-turn or rescue features.
- Pace, fitness, or route-performance dashboards.
- Live trail-condition reporting.
- Social feeds, group coordination, or community badges.
- Automatic mood or memory classification.
- A large trail database before the core loop is tested.
- Multiple hardware modes that make the product difficult to understand.

The test for every new feature is: **Does this make the physical act of noticing, marking, or remembering better?** If not, it probably belongs outside TrailMark's MVP.

## Current open questions

- Does a Nod press feel meaningfully different from tapping the phone?
- Is the confirmation cue noticeable without becoming attention-seeking?
- Can someone find and use Nod without looking at it?
- What should survive a temporary connection loss?
- Does the map context help recall, or does it reveal too much too early?
- Does the Nod sheet make the device feel understandable without competing with the hike?
- What is the smallest customization that makes Nod feel personal?

## Definition of success for the MVP

Someone should be able to understand the relationship in one sentence:

> “I press Nod when something catches my attention, and TrailMark helps me find and remember it later.”

If the experience instead reads as “another hiking map with a gadget,” the product has lost focus.
