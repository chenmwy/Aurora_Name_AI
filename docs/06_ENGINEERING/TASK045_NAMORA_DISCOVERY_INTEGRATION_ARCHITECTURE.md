---
Document:

TASK045_NAMORA_DISCOVERY_INTEGRATION_ARCHITECTURE

Title:

Namora Discovery Integration Architecture

Tier:

Engineering

Status:

Draft

Version:

0.1.0

Owner:

NameAI Engineering

Purpose:

Define how the isolated Discovery architecture (Runtime, Event Bridge,
Action Executor, Coordinator) will connect into Namora's existing runtime
system without violating ownership boundaries established by TASK039–TASK045.

Depends On:

TASK045_DISCOVERY_RUNTIME_ARCHITECTURE
TASK045_DISCOVERY_INTEGRATION_ARCHITECTURE
TASK045_DISCOVERY_COORDINATOR_ARCHITECTURE

Related Documents:

CURRENT_STATE
ORCHESTRATOR
NAMING_DISCOVERY_SYSTEM
UI_FOUNDATION

Last Updated:

2026-07-23
---

# Namora Discovery Integration Architecture

## Phase 4A — Design Only

Status:

Draft — architecture design only

This document does not authorize implementation.

It defines future connection points between:

```
External Event
 ↓
Discovery Coordinator
 ↓
Event Bridge
 ↓
Discovery Runtime
 ↓
Action Executor
```

and Namora's existing runtimes.

---

# 1. Purpose

TASK045 Phase 3D delivered an isolated Discovery Coordinator skeleton.

Namora already has:

- Scene Runtime
- Input Runtime
- Pearl / User Input Group Runtime
- Speech Bubble Runtime
- Conversation Runtime
- Interactive Presentation Runtime
- Name Candidate Interaction Runtime
- Response Provider Registry

Phase 4A answers:

1. Who owns the Coordinator lifecycle?
2. Who emits Discovery external events?
3. Where do Action handlers live?
4. What is the boot order?
5. How should the Coordinator be accessed publicly?

---

# 2. Coordinator Ownership Decision

## 2.1 Options

### Option A — SceneRuntime owns Coordinator

SceneRuntime creates and holds Discovery Coordinator.

Pros:

- SceneRuntime already composes world/scene accessors
- Natural page-level singleton home
- Matches existing `SceneRuntime.getConversationRuntime()` style

Cons:

- SceneRuntime is primarily spatial / scene construction authority
- Discovery orchestration is interaction-domain composition, not world geometry
- Risk of SceneRuntime becoming a general “god object”

### Option B — Conversation Runtime owns Coordinator

Conversation Runtime creates and holds Discovery Coordinator.

Pros:

- Many exploration facts pass through Conversation submit boundaries
- Close to message and provider lifecycle

Cons:

- Conversation already owns messages and provider round-trips
- Owning Coordinator invites Conversation to become exploration authority
- Violates “Conversation speaks/submits; Discovery decides”
- Harder to emit events that do not require a conversation turn later

### Option C — Independent Orchestration Layer

Coordinator remains an orchestration-layer singleton composed during boot,
held beside Conversation/Presentation, accessed via SceneRuntime facade and
`window.DiscoveryCoordinator`.

Pros:

- Matches Phase 3C Orchestration Layer recommendation
- Keeps DiscoveryState ownership in Discovery Runtime
- Keeps Conversation ownership of messages
- Scales to additional event sources without forcing them through Conversation
- Avoids SceneRuntime domain inflation while still using SceneRuntime as access hub

Cons:

- Requires explicit boot composition code in a later phase
- Needs clear init order documentation

## 2.2 Recommendation

**Option C — Independent Orchestration Layer**

with SceneRuntime as the **access facade**, not the domain owner.

Meaning:

- Coordinator is composed at boot as an orchestration singleton
- Discovery Runtime / Bridge / Executor remain injectable internals
- SceneRuntime may expose `getDiscoveryCoordinator()`
- Conversation Runtime may call Coordinator at submit boundaries
- Conversation Runtime does not own Coordinator

## 2.3 Impacts

### Lifecycle impact

Coordinator lifetime equals Namora page session.

Created once after interaction runtimes exist.

Destroyed only on full page unload / scene reload policy defined later.

### Ownership impact

| Concern | Owner |
|---|---|
| Coordinator instance composition | Boot / Orchestration composition |
| Public getter convenience | SceneRuntime facade + window facade |
| DiscoveryState | Discovery Runtime |
| Messages / submits | Conversation Runtime |
| Presentation surfaces | Interactive Presentation Runtime |

### Future scalability

Independent orchestration allows:

- additional event sources
- additional action handlers
- multi-phase Discovery evolution

without forcing SceneRuntime or Conversation Runtime to absorb Discovery
semantics.

---

# 3. Event Source Model

External events enter Coordinator via `handleEvent(externalEvent)`.

Owning runtimes capture user gestures.

They do not mutate DiscoveryState.

## 3.1 Direction Selection

Current surface:

Interactive Presentation Choice

Future emit path:

```
Choice Presentation confirm/submit
        |
        v
Interactive Presentation Runtime
        |
        v
Conversation Runtime (structured selection submit authority)
        |
        v
Coordinator.handleEvent({
  type: "direction-selected",
  payload: { directionId, label, weight }
})
        |
        v
Event Bridge → DirectionSelected
```

Who emits:

Conversation Runtime at the structured Choice submit boundary emits the
external event into Coordinator.

Why Conversation:

Choice confirm already participates in conversation submit lifecycle today.

Discovery must observe the committed selection, not transient UI toggles.

## 3.2 Name Selection

Current surface:

Name Candidate Interaction + Name Anchor Draft

Future emit path:

```
Candidate click
        |
        v
Name Candidate Interaction Runtime
        |
        v
Input Runtime Name Anchor Draft   ← draft only; no DiscoveryEvent
        |
        v
User submit (Pearl / Input)
        |
        v
Conversation Runtime submit
        |
        v
Coordinator.handleEvent({
  type: "name-selected",
  payload: {
    candidateId,
    name,
    origin,
    sourceDirectionId
  }
})
        |
        v
Event Bridge → NameSelected
```

Who emits:

Conversation Runtime on commit/submit when a Name Anchor Draft is being
committed.

Critical rule:

Clicking a candidate remains draft-only.

Only commit/submit creates `name-selected` / `NameSelected`.

Outside-constraint selections preserve origin and sourceDirectionId and must
not restore excluded directions.

## 3.3 User Text

Future emit path:

```
Input Runtime text
        |
        v
Conversation Runtime submitUserText
        |
        v
Coordinator.handleEvent({
  type: "user-input",
  payload: { text }
})
        |
        v
Event Bridge → UserInputReceived
```

Who emits:

Conversation Runtime after accepting a free-text user submission.

Notes:

- Conversation still owns the message record and provider request
- Coordinator records exploration-relevant text through Discovery Runtime
- Free-text semantic interpretation remains a later task

## 3.4 Optional later sources

| Source | External type |
|---|---|
| Explicit preference controls | `user-preference-added` |
| Explicit candidate rejection UI | `candidate-rejected` |

These must follow the same rule:

Owning interaction captures the fact.

Coordinator receives external event.

Discovery Runtime decides.

---

# 4. Action Handler Model

## 4.1 Principle

DiscoveryAction is routed by Action Executor.

Handlers execute through owning runtimes.

Coordinator does not contain handler business logic.

## 4.2 Handler ownership by action type

| DiscoveryAction.type | Handler destination | Meaning |
|---|---|---|
| `present` | Interactive Presentation Runtime | Show Choice / Name Candidate Presentation |
| `ask` | Conversation Runtime / Speech Bubble | Ask or explain purposefully |
| `refine` | Provider adapter (future) | Explore around selected anchor |
| `generate` | Provider adapter (future) | Request new candidates |

## 4.3 Where handlers should live

Recommended:

**Handler Registry on Action Executor**

populated during boot composition by an Orchestration wiring step.

```
Boot composition
  └── register handlers on Action Executor
        ├── present  -> presentation adapter
        ├── ask      -> conversation/speech adapter
        ├── refine   -> provider adapter (future)
        └── generate -> provider adapter (future)
```

Not recommended:

- putting business handlers inside Coordinator
- putting Discovery decision logic inside Executor
- letting Presentation invent next DiscoveryActions

## 4.4 Handler adapter rules

1. Adapters translate DiscoveryAction.payload into owning-runtime APIs.
2. Adapters return `{ handled, type, reason, ... }`.
3. Adapters must not mutate DiscoveryState.
4. `ask` adapters must obey NANA Dialogue Policy v1.0.
5. `present` adapters must use Interactive Presentation Runtime lifecycle.
6. `refine` / `generate` adapters remain stubs or no-ops until Provider phase.

---

# 5. Initialization Lifecycle

## 5.1 Current Namora boot order (baseline)

Approximate current order:

```
SceneRuntime.loadScene
  └── prepareRenderer / sceneReady
  └── initUserInputRuntime
  └── initConversationRuntime
        └── Speech Bubble
        └── Name Candidate Interaction Runtime
        └── Interactive Presentation Runtime
        └── Response Provider Registry
        └── Conversation Runtime.bootstrap
```

## 5.2 Future Discovery-aware boot order

Recommended addition:

```
1. SceneRuntime load + prepare
2. UI Layers / Responsive Layout
3. Input Runtime + Pearl / User Input Group
4. Speech Bubble Runtime
5. Name Candidate Interaction Runtime
6. Interactive Presentation Runtime
7. Response Provider Registry
8. Conversation Runtime create + bootstrap
9. Discovery stack create
      ├── Discovery Runtime
      ├── Event Bridge
      ├── Action Executor
      └── Discovery Coordinator(deps)
10. Register Action Executor handlers
      ├── present -> Presentation adapter
      ├── ask -> Conversation/Speech adapter
      └── refine/generate -> future stubs
11. Expose public facades
```

## 5.3 Why Discovery comes after Conversation/Presentation

Coordinator handlers need live Presentation and Conversation instances.

Event emission points live at Conversation submit boundaries.

Creating Discovery before those runtimes exist would force awkward lazy
rebinding.

## 5.4 Scene reload policy (future)

If scene reload recreates interaction runtimes, Discovery Coordinator should
be recreated or explicitly rebound in the same composition step.

Do not leave stale handler closures pointing at disposed runtimes.

Exact reload semantics belong to an implementation task.

---

# 6. Public Access Recommendation

## 6.1 Recommended pattern

Use both:

1. `window.SceneRuntime.getDiscoveryCoordinator()`
2. `window.DiscoveryCoordinator` frozen facade

Mirror existing patterns:

- `window.SceneRuntime.getConversationRuntime()`
- `window.ConversationRuntime`
- `window.InteractivePresentationRuntime`

## 6.2 Why both

SceneRuntime getter:

- keeps one composition hub for agents/tools/debug
- matches current inspection habits

window.DiscoveryCoordinator facade:

- convenient direct access
- can expose safe methods only:
  - `get()`
  - `getState()` read-through
  - optionally debug `handleEvent` in debug mode only

## 6.3 Public surface caution

Production public API should not freely expose unrestricted `handleEvent`
from arbitrary UI code if that bypasses Conversation submit contracts.

Recommended default:

- internal boot wiring calls Coordinator
- Conversation emit points call Coordinator
- debug/dev tools may call Coordinator explicitly

Exact exposure policy can be tightened in implementation.

## 6.4 Also expose read-throughs

Useful getters:

```
SceneRuntime.getDiscoveryRuntime()
SceneRuntime.getDiscoveryCoordinator()
```

Optional:

```
window.DiscoveryRuntime.getState()
```

These are convenience facades only.

They must not create second instances.

---

# 7. End-to-End Integrated Flow

```
User Action
    |
    v
Owning Interaction Runtime
    |
    v
Conversation Runtime submit boundary
    |
    v
DiscoveryCoordinator.handleEvent(externalEvent)
    |
    +--> Event Bridge
    |
    +--> Discovery Runtime
    |
    +--> DiscoveryAction
    |
    +--> Action Executor
            |
            +--> present -> Interactive Presentation Runtime
            |
            +--> ask -> Conversation / Speech Bubble
            |
            +--> refine/generate -> Provider adapters (future)
```

Conversation may continue owning provider replies in parallel where product
requires chat continuity.

Discovery must not be bypassed by inventing exploration phase inside
Conversation.

---

# 8. Ownership Validation

| Component | Owns | Does not own |
|---|---|---|
| Discovery Runtime | DiscoveryState, decisions | Messaging, rendering, providers |
| Event Bridge | External→DiscoveryEvent normalization | State, execution |
| Action Executor | Action routing | Decisions, domain state |
| Discovery Coordinator | Pipeline orchestration | Domain state, decisions, UI, providers |
| Conversation Runtime | Messages, submissions, provider conversation | DiscoveryState |
| Presentation Runtime | Interactive presentation | DiscoveryState |
| Input Runtime | Text + Name Anchor Draft | Committed Discovery anchors |
| SceneRuntime | Scene/world access facade | Discovery domain semantics |
| Handler adapters | Runtime-specific execution | Exploration decision rewriting |

One exploration truth:

DiscoveryState inside Discovery Runtime.

---

# 9. Non-goals

Phase 4A does not implement:

1. Runtime wiring into `namora.js`
2. Changes to Discovery skeleton modules
3. Provider / DeepSeek integration for refine/generate
4. UI / CSS / HTML changes
5. Automatic exploration loops beyond already-designed action resolution
6. Free-text semantic interpretation
7. Replacement of Name Anchor Draft click behavior
8. CURRENT_STATE updates tied to incomplete wiring

---

# 10. Implementation Readiness Gates

A later implementation phase may begin only when:

1. This Namora integration architecture is reviewed
2. Option C ownership decision is accepted
3. Event emission points are accepted
4. Handler registry placement is accepted
5. Boot order is accepted
6. Public access pattern is accepted
7. Implementation scope is authorized separately

Suggested later phases (not authorized here):

- Phase 4B: Boot composition + public facades (no Conversation emit yet)
- Phase 4C: Conversation emit points for direction/name/text
- Phase 4D: present/ask handler adapters
- Phase 4E: refine/generate Provider adapters

---

# 11. Summary

Recommended Namora integration model:

1. Coordinator is Independent Orchestration Layer
2. SceneRuntime provides access facade
3. Conversation submit boundaries emit external events
4. Candidate click remains draft-only; submit emits NameSelected
5. Action handlers live in Action Executor registry, adapting to owning runtimes
6. Discovery boots after Conversation/Presentation exist
7. Public access via SceneRuntime getter + window facade

Discovery decides.

Coordinator orchestrates.

Namora owners execute.

---

# End

Status:

Draft

Version:

0.1.0

Phase:

4A Architecture Design Only
