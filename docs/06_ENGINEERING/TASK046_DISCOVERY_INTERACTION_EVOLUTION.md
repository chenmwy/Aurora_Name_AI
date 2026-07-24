---
Document:

TASK046_DISCOVERY_INTERACTION_EVOLUTION

Title:

Discovery Interaction Evolution — Example Name as Preference Signal

Tier:

Engineering

Status:

Draft

Version:

0.1.0

Owner:

NameAI Engineering

Purpose:

Document the evolution of Namora Discovery interaction design discovered
during Alpha 1 validation.

The goal is to record how user preference discovery should move from
abstract parameter selection toward interaction with concrete examples.

Depends On:

TASK045_DISCOVERY_RUNTIME_ARCHITECTURE
TASK045_DISCOVERY_INTEGRATION_ARCHITECTURE
TASK045_NAMORA_DISCOVERY_INTEGRATION_ARCHITECTURE
TASK046 Phase 1 First Discovery Integration

Related Documents:

CURRENT_STATE
NAMING_DISCOVERY_SYSTEM
UI_FOUNDATION

Last Updated:

2026-07-25
---

# Discovery Interaction Evolution — Example Name as Preference Signal

## Status

Draft — documentation only

This document does not authorize implementation.

It records an interaction-model evolution identified during Discovery Alpha 1
validation.

---

# 1. Background

During Alpha 1 validation, Discovery could successfully present exploration
directions. Users, however, often identified with **concrete example names**
inside those directions rather than with the abstract direction itself.

A user may not know whether they want:

- modern
- classical
- futuristic

but they can immediately recognize:

- "灵智"
- "启迅"
- "Lumi"

as something closer to their intention.

Abstract direction labels illuminate a search region. Concrete names make
preference visible.

This observation does not invalidate Direction Cards. It reframes them:

Direction Cards open space.

Example names resolve preference.

---

# 2. Core Principle

**Concrete objects reveal user preference better than abstract descriptions.**

A Direction Card provides broad exploration space.

An Example Name provides a high-resolution preference signal.

| Concept | Role |
|---|---|
| **Direction Card** | Exploration region; broad semantic area; search space illumination |
| **Example Name** | Preference sampling point; focused exploration signal; potential name anchor |

Users often struggle to map internal taste onto abstract parameters.

They can still point at a concrete object and say: “closer to this.”

Namora Discovery should treat that pointing as primary preference evidence.

---

# 3. Exploration Model

New exploration hierarchy:

```
Direction Card
    ↓
Example Names
    ↓
User Selection
    ↓
Name Reference / Inspiration Set
    ↓
Refinement or Generation
```

Selecting an example name does **not** necessarily mean final confirmation.

It means:

> This object is close to the user's current interest area.

The selection is a preference sample, not a commitment to a final name.

Downstream Discovery actions (refine / generate / ask / present) should treat
selected examples as signals that shape the next exploration step.

---

# 4. Example Name Interaction

Future interaction model:

When the user clicks an example name:

**Do NOT immediately submit.**

Instead:

- add the name into Input Draft
- allow the user to add comments
- allow multiple names to be selected
- wait for user submission

### Examples

User selects:

`灵智`

then writes:

> 我喜欢这个名字

Or user selects:

`灵智` `启迅`

then writes:

> 我喜欢这种感觉，但是希望更年轻一些

Click remains draft-only.

Commit happens only on explicit submit.

This preserves Conversation ownership of submit lifecycle and keeps Discovery
as the decision authority after committed facts arrive.

---

# 5. Inspiration Set Concept

## Inspiration Set

Definition:

A collection of example names selected by the user to represent the desired
exploration area.

Example:

```json
{
  "inspirationSet": [
    "灵智",
    "启迅"
  ]
}
```

Multiple selected examples provide richer information than a single anchor.

They can reveal:

- semantic preference
- naming structure preference
- emotional preference
- cultural preference
- phonetic preference

A single Name Anchor remains useful for focused refinement.

An Inspiration Set is useful when the user is still shaping a taste region
rather than committing to one reference object.

Both concepts can coexist in future DiscoveryState without collapsing into
one another.

---

# 6. Relationship with Slider

Sliders are not removed.

Their role changes.

### Before

Slider = primary preference input

### Future

Slider = AI understanding calibration tool

Example:

AI:

> I understand you prefer warm modern names.

User:

> More futuristic.

The slider becomes a **correction mechanism** instead of an
**exploration mechanism**.

Exploration should happen through concrete objects and examples.

Sliders should tune the system’s interpretation of what those objects imply.

---

# 7. Relationship with Discovery Runtime

Do not change current architecture in this document’s scope.

Current ownership remains:

| Concern | Owner |
|---|---|
| Exploration decisions | Discovery Runtime |
| Message / submit lifecycle | Conversation Runtime |
| Presentation rendering | Interactive Presentation Runtime |
| Draft input before submit | Input Runtime |

### Future event possibilities

- `ExampleNameSelected`
- or `NameReferenceAdded`

These would represent committed example-name facts after submit, not click-time
mutations.

### Potential future DiscoveryState extension

```json
{
  "anchors": [],
  "inspirationSet": [],
  "preferences": []
}
```

Do not implement in this task.

Any future implementation must preserve:

- click = draft only
- submit = committed Discovery fact
- Discovery Runtime decides next action

---

# 8. Relationship with Taste Signature

Example Name interaction can become a major source of future Taste Signature
data.

User preference should be learned from:

- selected examples
- rejected examples
- repeated patterns
- refinement requests

Not only from explicit text.

Text remains valuable commentary.

Concrete object interaction provides denser, more reliable taste evidence.

Over time, Inspiration Set selections and refinements around them should feed
Taste Signature formation more strongly than abstract self-description alone.

---

# 9. Non-goals

This document does **NOT** authorize:

- runtime modification
- new event implementation
- UI changes
- database changes
- AI prompt changes

It is an architecture draft capturing Alpha 1 interaction insights only.

---

# 10. Future Evolution Direction

Namora Discovery should evolve from:

```
Question → Answer
```

toward:

```
Explore → Select → Refine → Understand
```

The system should learn the user's taste through interaction with meaningful
objects.

Direction Cards illuminate space.

Example names sample preference.

Inspiration Sets accumulate taste evidence.

Refinement and generation respond to that evidence.

Understanding emerges from the loop — not from forcing users to name their
taste in abstract parameters first.
