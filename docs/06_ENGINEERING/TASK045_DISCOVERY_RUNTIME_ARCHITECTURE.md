---
Document:

TASK045_DISCOVERY_RUNTIME_ARCHITECTURE

Title:

Discovery Runtime Foundation — Architecture Draft

Tier:

Engineering

Status:

Draft

Version:

0.1.1

Owner:

NameAI Engineering

Purpose:

Define the architecture for Discovery Runtime so Namora can move from
conversation-response driven interaction to exploration-state driven
discovery, without changing runtime ownership boundaries established by
TASK039–TASK044.

Depends On:

CURRENT_STATE
NAMING_DISCOVERY_SYSTEM
UI_FOUNDATION
LAYOUT_SYSTEM

Related Documents:

ORCHESTRATOR
NAMORA_ANCHOR_SYSTEM
NANA_BEHAVIOR_MODEL
SESSION_LIFECYCLE

Last Updated:

2026-07-22
---

# Discovery Runtime Foundation

## Architecture Draft — Phase 1

Status:

Draft — design only

Revision:

Phase 1 Revision A

This document is an architecture proposal.

It does not authorize implementation.

It must not be treated as a runtime contract until a later task freezes it.

---

# 1. Purpose

TASK045 introduces Discovery Runtime as the exploration decision layer for
Namora.

The goal is to transform Namora from:

conversation response driven

into:

exploration state driven

Discovery Runtime answers one question:

Given the current user exploration state, what should Namora do next?

Possible outcomes:

- ask for missing information
- present choices
- present name candidates
- refine around an existing anchor
- continue exploration without empty confirmation dialogue

Discovery Runtime does not replace Conversation Runtime, Presentation Runtime,
Input Runtime, or Name Candidate Interaction Runtime.

It sits beside those systems as the owner of exploration meaning, event
processing, and next-step selection.

Discovery Runtime is an event-driven exploration state machine:

```
DiscoveryEvent
    |
    v
Discovery Runtime
    |
    v
Update DiscoveryState
    |
    v
Resolve DiscoveryAction
```

---

# 2. Problem Statement

## 2.1 Completed interaction foundation

Namora already has a verified interaction stack:

```
Input Runtime
        |
        v
Conversation Runtime
        |
        v
Response Provider
        |
        v
Conversation Runtime
        |
        +--> Speech Bubble Runtime
        |
        +--> Interactive Presentation Runtime
                |
                +-- Choice Presentation
                |
                +-- Name Candidate Presentation
```

TASK044 introduced:

- Direction selection through Choice Presentation
- Name Candidate Presentation
- Name Anchor Draft
- Constraint awareness
- Outside Constraint Exploration
- Conversation presentation routing
- Async `submitUserText()` contract

## 2.2 Current limitation

After the user submits a Name Anchor, Conversation Runtime still tends to
produce generic acknowledgement replies.

Examples of undesired output:

- 收到了
- 明白了
- 好的
- 我记住了
- 我们继续吧

These messages do not advance exploration.

Automatic exploration continuation was intentionally deferred in TASK044.

## 2.3 Architectural gap

The system can:

- collect user text
- collect structured selections
- render presentations
- store a Name Anchor Draft

The system cannot yet:

- maintain a durable exploration state across turns
- process exploration events into state transitions
- decide the next exploration action from that state
- distinguish chat acknowledgement from discovery progression
- keep Speech Bubble explanatory rather than workflow-controlling

Discovery Runtime closes that gap.

---

# 3. Discovery State Model

## 3.1 Principle

DiscoveryState is the single source of truth for exploration progress.

It is not chat history.

It is not presentation UI state.

It is not input draft state.

It is the semantic memory of where the user is in Naming Discovery.

DiscoveryState must change only through DiscoveryEvent processing.

Scattered setter methods that mutate exploration state outside the event model
are not allowed.

## 3.2 Conceptual shape

```
DiscoveryState = {
  phase,
  target,
  constraints,
  anchors,
  preferences,
  history,
  readiness
}
```

Exact field names may evolve during implementation tasks.

The meaning of each field is frozen conceptually below.

## 3.3 phase

`phase` describes the current exploration stage.

Initial recommended values:

| Phase | Meaning |
|---|---|
| `understanding` | Target or intent is incomplete |
| `direction-selection` | User is choosing or refining naming directions |
| `name-exploration` | User is reviewing name candidates |
| `name-refinement` | User has an anchor and is exploring around it |

Phase transitions are decided by Discovery Runtime after event processing.

They are not decided by Presentation Renderer or Speech Bubble content.

## 3.4 target

`target` describes what is being named.

Examples:

- brand
- product
- person
- pet
- podcast
- game

Target may remain partially unknown during early turns.

Missing target information is a valid reason for an `ask` action.

## 3.5 constraints

`constraints` define the active generation space.

They must support:

```
constraints = {
  allowedDirections: [...],
  excludedDirections: [...]
}
```

Rules:

1. Allowed directions remain eligible for main generation.
2. Excluded directions are removed from the main generation space.
3. Excluded directions are not low-weight preferences.
4. Outside Constraint Exploration may reference excluded directions for
   contrast, without restoring them to allowedDirections.

This preserves the TASK044 Outside Constraint Exploration contract:

Selecting an outside candidate does not re-enable an excluded direction.

## 3.6 anchors

`anchors` store concrete user-selected references.

Initial anchor type:

Name Anchor

Example:

```
{
  name: "Lumi",
  origin: "inside-constraint",
  sourceDirectionId: "modern",
  candidateId: "name-lumi"
}
```

Rules:

1. Name Anchor Draft may exist in Input Runtime before submit.
2. Discovery Runtime owns committed exploration anchors after a NameSelected
   event is processed.
3. Multiple future anchor types may appear later, but Phase 1 focuses on Name
   Anchor only.

## 3.7 preferences

`preferences` accumulate softer user leanings.

Examples:

- modern
- elegant
- powerful
- minimal
- warmer
- stronger rhythm

Preferences are not hard exclusions.

They influence ranking and refinement language.

They do not replace constraints.

## 3.8 history

`history` records the exploration path as processed DiscoveryEvents.

It is not Conversation message history.

Example history entries:

- DirectionSelected: modern
- NameSelected: Lumi
- UserPreferenceAdded: stronger feeling
- CandidateRejected: Luno

History exists so Discovery Runtime can explain progression and avoid
repeating already resolved questions.

## 3.9 readiness

`readiness` is a derived view of whether Discovery Runtime has enough
information to proceed.

Conceptual examples:

| Ready for | Condition |
|---|---|
| Direction presentation | Target understood enough |
| Name candidate presentation | At least one allowed direction exists |
| Automatic refine | Name Anchor committed and request is clear enough |
| Ask | Critical information missing |

Exact readiness rules belong to a later implementation task.

---

# 4. Exploration Event Model

## 4.1 Principle

Discovery Runtime must not mutate DiscoveryState through scattered methods.

Instead:

User actions and system observations become Events.

An Event:

- describes what happened
- contains a payload
- causes a DiscoveryState transition
- may lead to a DiscoveryAction

Discovery Runtime is therefore an event-driven exploration state machine.

## 4.2 DiscoveryEvent shape

```
DiscoveryEvent = {
  type,
  payload,
  timestamp
}
```

`type` identifies the event category.

`payload` carries the structured facts required for state transition.

`timestamp` records when the event was observed by Discovery Runtime.

Exact transport format may differ in implementation, but the conceptual
contract remains:

No silent state mutation without an event.

## 4.3 Initial event categories

### DirectionSelected

Meaning:

User accepted an exploration direction.

Payload:

```
{
  directionId,
  label,
  weight
}
```

Expected state effects:

- update allowed / weighted direction preferences
- move toward or remain in `direction-selection` / later phases as appropriate
- append history entry

### NameSelected

Meaning:

User selected a Name Anchor.

Payload:

```
{
  candidateId,
  name,
  origin,
  sourceDirectionId
}
```

Expected state effects:

- commit Name Anchor
- preserve origin metadata
- preserve sourceDirectionId
- do not restore excluded directions when origin is outside-constraint
- typically move phase to `name-exploration` or `name-refinement`
- append history entry

### UserPreferenceAdded

Meaning:

User added a new constraint or preference.

Payload:

```
{
  preferenceType,
  value
}
```

Expected state effects:

- update preferences and/or constraints according to preferenceType
- append history entry
- may trigger refine / generate / present depending on readiness

### CandidateRejected

Meaning:

User rejected a candidate.

Payload:

```
{
  candidateId,
  reason
}
```

Expected state effects:

- record rejection in history
- may reduce attractiveness of similar candidates
- may trigger generate / refine without restoring excluded directions

### UserInputReceived

Meaning:

User provided additional exploration information as free text.

Payload:

```
{
  text
}
```

Expected state effects:

- interpret exploration-relevant content
- update target / preferences / readiness when possible
- append history entry
- resolve next DiscoveryAction

Additional event types may be added later.

Phase 1 Revision A freezes only the categories above as the initial set.

## 4.4 State transition model

Canonical processing flow:

```
Event
 ↓
Discovery Runtime
 ↓
Update DiscoveryState
 ↓
Resolve DiscoveryAction
```

Example:

```
NameSelected
 ↓
Add Name Anchor
 ↓
Update phase:
name-exploration
 ↓
Resolve DiscoveryAction:
{
  type: "refine",
  reason: "expand-selected-name",
  payload: { ... }
}
```

Rules:

1. Conversation Runtime may observe user submits and emit or forward
   exploration-relevant DiscoveryEvents.
2. Discovery Runtime is the only authority that applies those events to
   DiscoveryState.
3. DiscoveryAction is derived after state transition, not before.
4. Presentation and Speech Bubble execute actions; they do not invent events
   that redefine exploration ownership.

## 4.5 Event ownership boundary

Events describe exploration facts.

They are not chat messages.

They are not presentation render instructions.

They are not input draft mutations.

Mapping example:

| User-facing action | Owning interaction runtime | DiscoveryEvent |
|---|---|---|
| Confirm direction choice | Interactive Presentation Runtime → Conversation Runtime | DirectionSelected |
| Click name candidate then submit | Name Candidate + Input → Conversation Runtime | NameSelected |
| Free-text submit | Input Runtime → Conversation Runtime | UserInputReceived |
| Reject candidate | future interaction path → Conversation Runtime | CandidateRejected |

Discovery Runtime consumes the event.

It does not own the original UI gesture.

---

# 5. Action Model

## 5.1 Principle

Discovery Runtime emits DiscoveryAction.

Other runtimes execute the action through their own ownership boundaries.

Discovery Runtime decides.

It does not render.

It does not send chat messages directly.

It does not call providers as a general chatbot.

## 5.2 DiscoveryAction shape

```
DiscoveryAction = {
  type,
  reason,
  payload
}
```

`type` defines what kind of next step should occur.

`reason` explains why that step was chosen.

`payload` carries the data required by the executor.

## 5.3 Action reason

`reason` is mandatory in the architecture model.

It exists for:

- debugging
- observability
- explaining system decisions
- future AI behavior analysis

`reason` is not user-facing copy by default.

It is a machine-readable decision label.

Examples:

```
{
  type: "present",
  reason: "expand-selected-name",
  payload: {
    presentationType: "name-candidate"
  }
}
```

```
{
  type: "ask",
  reason: "missing-naming-target",
  payload: {
    missingField: "target"
  }
}
```

```
{
  type: "refine",
  reason: "anchor-committed-continue-exploration",
  payload: {
    anchorName: "Lumi"
  }
}
```

```
{
  type: "generate",
  reason: "direction-space-ready",
  payload: {
    allowedDirections: ["modern"]
  }
}
```

Without `reason`, DiscoveryAction is incomplete for architecture review and
later observability.

## 5.4 Action types

Recommended `type` values for Phase 1:

| Type | Meaning |
|---|---|
| `ask` | Request missing information required to continue |
| `present` | Ask Presentation Runtime to show a structured surface |
| `refine` | Explore around a selected anchor |
| `generate` | Request new candidates under current constraints |

## 5.5 ask

Used when exploration cannot safely continue.

Examples:

- What is being named is still unknown
- Target type is ambiguous
- Direction space is empty and cannot be inferred

`ask` must produce a purposeful Speech Bubble explanation or question.

It must not produce empty confirmation.

## 5.6 present

Used when structured interaction is the next step.

Examples:

- present Choice Presentation for directions
- present Name Candidate Presentation for candidates

Discovery Runtime specifies presentation intent.

Interactive Presentation Runtime owns lifecycle and rendering.

## 5.7 refine

Used when a Name Anchor already exists and the next step is local exploration.

Examples:

- stronger variants of Lumi
- softer variants of Lumi
- same direction family with different rhythm

Refine is exploration around a reference, not unconstrained generation.

## 5.8 generate

Used when Discovery Runtime needs a new candidate set under current
constraints and preferences.

Discovery Runtime requests generation.

It does not own name generation algorithms.

A Response Provider / future Discovery Generator service may fulfill the
request.

## 5.9 Action selection policy

After an event updates DiscoveryState, Discovery Runtime should prefer:

1. `ask` if critical information is missing
2. `present` if the user must choose among structured options
3. `refine` if a Name Anchor is active and the turn is about that anchor
4. `generate` if new candidates are needed and enough state exists

When information is sufficient, Discovery Runtime must not ask the user to
"continue."

It should automatically choose the next exploration action and attach a clear
`reason`.

---

# 6. Runtime Ownership

## 6.1 Ownership summary

Discovery Runtime owns:

- exploration state
- event processing
- action decision

Discovery Runtime does NOT own:

- messages
- user input
- rendering
- provider communication

## 6.2 Ownership table

| Concern | Owner |
|---|---|
| Exploration state | Discovery Runtime |
| DiscoveryEvent processing | Discovery Runtime |
| Next exploration action | Discovery Runtime |
| Conversation messages | Conversation Runtime |
| Submit lifecycle / provider round-trip | Conversation Runtime |
| Speech Bubble short dialogue | Speech Bubble Runtime |
| Presentation lifecycle / rendering | Interactive Presentation Runtime |
| Choice interaction | Interactive Presentation Runtime |
| Name Candidate selection interaction | Name Candidate Interaction Runtime |
| Input text / Name Anchor Draft before submit | Input Runtime |
| Layout / layers / visual placement | Layout + UI Layers |
| Name generation service | Response Provider / future generator |

## 6.3 Canonical ownership relationship

```
User Event
    |
    v
Conversation Runtime
    |
    v
Discovery Runtime
    |
    v
Discovery Action
    |
    +--> Presentation Runtime
    |
    +--> Conversation Runtime
```

Meaning:

1. User-facing interaction enters through existing runtimes.
2. Conversation Runtime remains the submit / message authority and forwards
   exploration-relevant facts as DiscoveryEvents.
3. Discovery Runtime alone updates DiscoveryState and resolves DiscoveryAction.
4. Presentation Runtime executes `present`.
5. Conversation Runtime / Speech Bubble execute explanatory `ask` dialogue when
   required.
6. Provider communication remains outside Discovery Runtime ownership.

## 6.4 Discovery Runtime owns

- DiscoveryState
- DiscoveryEvent intake and validation
- phase transitions caused by events
- constraint interpretation for exploration decisions
- committed anchors after NameSelected
- preference accumulation
- exploration history
- DiscoveryAction selection, including `reason`

## 6.5 Discovery Runtime does not own

- message storage
- user input focus / draft editing
- presentation DOM / rendering
- speech bubble layout
- provider request transport
- direct DeepSeek prompting as a free-form chatbot
- name generation algorithms
- viewport / world / spatial anchor systems

## 6.6 Ownership anti-patterns

Do not allow:

1. Conversation Runtime inventing exploration phase privately
2. Presentation Runtime deciding the next discovery step
3. Input Runtime mutating committed DiscoveryState
4. Speech Bubble controlling workflow by "please continue" prompts
5. Duplicate constraint stores with conflicting meanings
6. Direct DiscoveryState mutation without a DiscoveryEvent
7. DiscoveryAction without a `reason`

One exploration truth.

Event in.

State update.

Action out.

Many executors.

---

# 7. Integration Flow

## 7.1 High-level flow

```
User action
    |
    v
Input Runtime / Presentation selection
    |
    v
Conversation Runtime
    |
    +--> updates messages
    |
    +--> emits / forwards DiscoveryEvent
    |
    v
Discovery Runtime
    |
    +--> processes DiscoveryEvent
    |
    +--> updates DiscoveryState
    |
    +--> emits DiscoveryAction { type, reason, payload }
    |
    +----------------------+----------------------+
    |                      |                      |
    v                      v                      v
ask via                present via             generate / refine
Conversation           Interactive             via Provider /
+ Speech Bubble        Presentation            Discovery request
```

## 7.2 Relationship to Conversation Runtime

Conversation Runtime remains the message and submit authority.

Discovery Runtime consumes exploration-relevant DiscoveryEvents originating
from Conversation Runtime outcomes, including:

- free-text submits → UserInputReceived
- Choice selection submits → DirectionSelected or related events
- Name Anchor submits after draft commit → NameSelected

Conversation Runtime must not become the owner of DiscoveryState.

When DiscoveryAction.type is `ask` or requires explanatory dialogue,
Conversation Runtime / Speech Bubble display the resulting short message.

When DiscoveryAction.type is `present`, Conversation Runtime routes or
delegates presentation intent to Interactive Presentation Runtime without
duplicating presentation ownership.

## 7.3 Relationship to Interactive Presentation Runtime

Interactive Presentation Runtime remains the only owner of:

- current presentation
- selection UI
- confirm / submit handoff for structured choices

Discovery Runtime may request:

- Choice Presentation
- Name Candidate Presentation

It must not render cards, weights, tooltips, or confirm buttons.

## 7.4 Relationship to Input Runtime

Input Runtime owns:

- current text
- Name Anchor Draft before submit
- disabled / loading interaction state

Discovery Runtime owns committed anchors after NameSelected is processed.

Draft and committed anchor must remain distinct.

Selecting a candidate updates draft only.

Submitting commits exploration progress through Conversation Runtime into
Discovery Runtime as an event.

## 7.5 Relationship to Name Candidate Interaction Runtime

Name Candidate Interaction Runtime owns:

- candidate interaction state
- selection of a candidate
- draft synchronization with Input Runtime
- outside-constraint tooltip / origin semantics at interaction time

Discovery Runtime owns:

- whether name exploration is the current phase
- whether excluded directions remain excluded
- whether the next action is refine / generate / ask / present
- the reason for that next action

Name Candidate Interaction Runtime must not decide the next discovery phase.

## 7.6 Name Anchor submit path

Approved conceptual path:

```
Candidate click
    |
    v
Name Candidate Interaction Runtime
    |
    v
Input Runtime Name Anchor Draft
    |
    v
User submits
    |
    v
Conversation Runtime
    |
    v
DiscoveryEvent: NameSelected
    |
    v
Discovery Runtime commits Name Anchor
    |
    v
Discovery Runtime emits DiscoveryAction
    |
    v
Automatic continuation when ready
```

No empty acknowledgement turn is required between commit and next action.

---

# 8. NANA Dialogue Policy

## 8.1 Policy name

NANA Dialogue Policy v1.0

## 8.2 Character stance

NANA is a quiet creative companion.

NANA may accompany the user.

NANA should not interrupt exploration with unnecessary dialogue.

## 8.3 Rules

### Rule 1 — No meaningless confirmation

Avoid:

- 收到了
- 明白了
- 好的
- 我记住了
- 我们继续吧

unless the message itself changes exploration state or explains the next
meaningful action.

### Rule 2 — Every message must do work

Every NANA message must do at least one of:

- advance exploration
- explain why something is shown
- request necessary information

### Rule 3 — Continue automatically when ready

When information is sufficient:

Do not ask the user to continue.

Automatically proceed to the next exploration action.

### Rule 4 — Speech Bubble explains, it does not control

Speech Bubble explains exploration.

It does not own workflow.

It does not replace DiscoveryAction selection.

## 8.4 Dialogue examples

Allowed:

- A short explanation of why these directions are shown
- A short question for missing target information
- A short explanation that outside candidates remain exploratory

Not allowed as standalone turns:

- acknowledgement with no next action
- filler reassurance
- "tell me when to continue"

---

# 9. Non-goals

Phase 1 explicitly excludes:

1. JavaScript implementation
2. Changes to `namora.js`
3. UI / CSS changes
4. Presentation Renderer changes
5. AI generation implementation
6. DeepSeek integration for Discovery Runtime
7. Memory persistence / long-term storage of DiscoveryState
8. Multi-world exploration
9. Long-term user profile
10. Automatic production wiring of Discovery Runtime
11. Full Direction Tree productization
12. Weight propagation algorithms
13. Companion personality expansion beyond Dialogue Policy v1.0
14. Reopening Conversation / Presentation / Input ownership boundaries

Automatic exploration continuation is designed here, but not implemented in
this phase.

---

# 10. Future Extension Points

The following may be added in later tasks without redesigning ownership:

1. Discovery Tree Navigation over Direction Trees
2. Direction weight propagation into preferences
3. Multi-anchor support beyond Name Anchor
4. Explicit rejection / favoriting of candidates as first-class UI
5. Session resume from DiscoveryState
6. Provider adapters specialized for `generate` and `refine`
7. Analytics over exploration history and action reasons
8. Stronger readiness scoring
9. Additional DiscoveryEvent categories

Each extension must preserve:

Discovery Runtime decides.

Conversation Runtime speaks and submits.

Presentation Runtime shows structured choices.

Input Runtime holds draft text.

Name Candidate Runtime handles candidate interaction.

Event in.

State update.

Action out.

---

# 11. Definition of Ready for Implementation

A later implementation task may begin only when:

1. This architecture draft is reviewed
2. DiscoveryState fields are accepted or revised
3. DiscoveryEvent categories are accepted or revised
4. DiscoveryAction types and `reason` contract are accepted or revised
5. Ownership boundaries remain uncontested
6. NANA Dialogue Policy v1.0 is accepted
7. Implementation scope is authorized separately

Until then, this document remains Draft and non-binding for code.

---

# End

Status:

Draft

Version:

0.1.1

Revision:

Phase 1 Revision A

Phase:

Architecture Only
