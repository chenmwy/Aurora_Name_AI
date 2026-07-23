---
Document:

TASK045_DISCOVERY_INTEGRATION_ARCHITECTURE

Title:

Discovery Runtime Integration Architecture

Tier:

Engineering

Status:

Draft

Version:

0.1.0

Owner:

NameAI Engineering

Purpose:

Define how the standalone Discovery Runtime skeleton integrates into Namora
without violating existing runtime ownership boundaries established by
TASK039–TASK044 and TASK045 Phase 1 / Phase 2B.

Depends On:

TASK045_DISCOVERY_RUNTIME_ARCHITECTURE
CURRENT_STATE

Related Documents:

NAMING_DISCOVERY_SYSTEM
ORCHESTRATOR
UI_FOUNDATION
LAYOUT_SYSTEM

Last Updated:

2026-07-23
---

# Discovery Runtime Integration Architecture

## Phase 3A — Design Only

Status:

Draft — architecture design only

This document does not authorize implementation.

It defines future event flow, action execution, ownership, and coordination
boundaries for integrating Discovery Runtime into Namora.

---

# 1. Purpose

TASK045 Phase 2B delivered an isolated Discovery Runtime skeleton:

```
discovery-runtime.js
```

That module can:

- maintain DiscoveryState
- process DiscoveryEvents
- resolve DiscoveryActions

It is not yet connected to Namora.

Phase 3A defines how that connection should occur later.

Core principle:

Discovery Runtime decides:

"What should happen next?"

Discovery Runtime does NOT execute:

- rendering
- messaging
- provider calls

---

# 2. Current Baseline

## 2.1 Completed

| Stage | Status |
|---|---|
| TASK045 Phase 1 Architecture Foundation | Complete |
| TASK045 Phase 1 Revision A (Events + Action reason) | Complete |
| TASK045 Phase 2A Implementation Plan | Complete |
| TASK045 Phase 2B Discovery Runtime Skeleton | Complete |

## 2.2 Existing Namora interaction stack

```
Input Runtime
    |
    v
Conversation Runtime
    |
    +--> Response Provider
    |
    +--> Speech Bubble Runtime
    |
    +--> Interactive Presentation Runtime
            |
            +-- Choice Presentation
            |
            +-- Name Candidate Presentation
                    |
                    v
            Name Candidate Interaction Runtime
                    |
                    v
            Input Runtime Name Anchor Draft
```

## 2.3 Integration gap

Today:

1. Choice selection becomes conversation submit / provider metadata.
2. Name Candidate selection becomes Name Anchor Draft only.
3. Free-text submit becomes Conversation messages + Provider reply.
4. Discovery Runtime exists outside this loop.

Missing:

```
User / system exploration facts
        |
        v
DiscoveryEvent
        |
        v
Discovery Runtime
        |
        v
DiscoveryAction
        |
        v
Action Executor
        |
        v
Owned runtimes (Presentation / Conversation / future Provider adapters)
```

---

# 3. Integration Model

## 3.1 Separation of decide vs execute

| Layer | Responsibility |
|---|---|
| Interaction Runtimes | Observe user gestures, own UI/message/provider concerns |
| Event Bridge | Translate owned outcomes into DiscoveryEvents |
| Discovery Runtime | Update DiscoveryState and resolve DiscoveryAction |
| Action Executor | Route DiscoveryAction to the correct owning runtime |
| Owning Runtimes | Execute ask / present / refine / generate within their domain |

Discovery Runtime never calls Presentation, Conversation, Input, or Provider
APIs directly.

## 3.2 Canonical integrated flow

```
User Action
    |
    v
Owned Interaction Runtime
    |
    v
Conversation Runtime (when submit / conversation authority is required)
    |
    v
DiscoveryEvent
    |
    v
Discovery Runtime
    |
    +--> update DiscoveryState
    |
    +--> resolve DiscoveryAction { type, reason, payload }
    |
    v
Action Executor
    |
    +--> present  → Interactive Presentation Runtime
    |
    +--> ask      → Conversation Runtime / Speech Bubble
    |
    +--> refine   → Provider request adapter (future)
    |
    +--> generate → Provider request adapter (future)
```

## 3.3 Design invariants

1. One exploration truth: DiscoveryState.
2. No silent DiscoveryState mutation outside DiscoveryEvent processing.
3. DiscoveryAction always includes `reason`.
4. Action Executor is the only component allowed to fan out decisions.
5. Existing ownership boundaries remain intact.

---

# 4. Event Flow

User actions become DiscoveryEvents through owning runtimes.

Discovery Runtime receives events.

It does not watch DOM clicks.

## 4.1 Direction selection

```
Choice Presentation
        |
        v
Interactive Presentation Runtime confirm / submit
        |
        v
Conversation Runtime (selection submit authority)
        |
        v
DiscoveryEvent: DirectionSelected
        |
        v
Discovery Runtime
```

Event payload:

```
{
  directionId,
  label,
  weight
}
```

Meaning:

User accepted an exploration direction into the allowed generation space.

Notes:

- Presentation Runtime owns the Choice UI.
- Conversation Runtime owns structured selection submit into the conversation
  lifecycle when a conversation turn is required.
- The Event Bridge emits DirectionSelected for Discovery Runtime.
- Discovery Runtime updates `constraints.allowedDirections` and history.

## 4.2 Name selection

```
Name Candidate Presentation
        |
        v
Name Candidate Interaction Runtime
        |
        +--> Input Runtime Name Anchor Draft (current behavior; preserved)
        |
        v
User submits (Pearl / Input submit)
        |
        v
Conversation Runtime
        |
        v
DiscoveryEvent: NameSelected
        |
        v
Discovery Runtime
```

Event payload:

```
{
  candidateId,
  name,
  origin,
  sourceDirectionId
}
```

Meaning:

User committed a Name Anchor into exploration state.

Important:

1. Candidate click alone remains draft-only.
2. NameSelected is emitted on commit/submit, not on hover or draft click.
3. `origin: "outside-constraint"` must not restore excluded directions.
4. Discovery Runtime updates `anchors` and typically moves phase to
   `name-exploration`.

## 4.3 User text input

```
Input Runtime text
        |
        v
Conversation Runtime submitUserText
        |
        v
DiscoveryEvent: UserInputReceived
        |
        v
Discovery Runtime
```

Event payload:

```
{
  text
}
```

Meaning:

User provided additional exploration information as free text.

Phase 3A rule:

Discovery Runtime may record the event now.

Automatic semantic interpretation of free text remains a later task.

Conversation Runtime still owns messages and provider conversation.

## 4.4 Additional mapped events (future-ready)

| User / system fact | DiscoveryEvent |
|---|---|
| Preference or soft constraint added | UserPreferenceAdded |
| Candidate explicitly rejected | CandidateRejected |

These follow the same pattern:

Owned interaction captures the fact.

Event Bridge emits DiscoveryEvent.

Discovery Runtime updates state and resolves action.

## 4.5 Event Bridge responsibility

The Event Bridge is a thin translation layer.

It may live as:

- methods on a future Discovery Coordinator
- a small helper used by Conversation Runtime
- explicit emit points at conversation submit boundaries

It must not become a second Discovery Runtime.

It must not own DiscoveryState.

---

# 5. Action Execution Model

## 5.1 Principle

DiscoveryAction must not directly call other runtimes.

```
DiscoveryAction
        |
        v
Action Executor
        |
        v
Runtime execution
```

Discovery Runtime returns decisions.

Action Executor routes them.

Owning runtimes execute them.

## 5.2 DiscoveryAction shape

```
{
  type,
  reason,
  payload
}
```

`reason` remains mandatory for observability and debugging.

## 5.3 Action routing table

| DiscoveryAction.type | Executor routes to | Execution meaning |
|---|---|---|
| `present` | Interactive Presentation Runtime | Show Choice or Name Candidate Presentation |
| `ask` | Conversation Runtime / Speech Bubble | Ask for missing information or explain next need |
| `refine` | Provider request adapter (future) | Explore around selected anchor |
| `generate` | Provider request adapter (future) | Request new candidates under constraints |

## 5.4 present

Example:

```
{
  type: "present",
  reason: "expand-selected-name",
  payload: {
    presentationType: "name-candidate"
  }
}
```

Action Executor asks Interactive Presentation Runtime to present.

Discovery Runtime does not render cards, tooltips, or confirm buttons.

## 5.5 ask

Example:

```
{
  type: "ask",
  reason: "missing-target",
  payload: {}
}
```

Action Executor asks Conversation Runtime / Speech Bubble to surface a
purposeful question or explanation.

This must obey NANA Dialogue Policy v1.0:

No empty acknowledgement.

Every message must advance exploration, explain why something is shown, or
request necessary information.

## 5.6 refine / generate

These are reserved for future Provider adapters.

Phase 3A defines the routing target only.

It does not authorize DeepSeek wiring, automatic generation loops, or prompt
redesign.

Until those adapters exist, Action Executor may:

- no-op with logged reason
- or queue the action for a later integration phase

It must not invent Provider ownership inside Discovery Runtime.

## 5.7 Action Executor rules

1. Accept only validated DiscoveryAction objects.
2. Require `type` and `reason`.
3. Route to exactly one primary owning executor path.
4. Never mutate DiscoveryState.
5. Never bypass Conversation submit contracts for user-visible message turns
   that Conversation owns.
6. Never bypass Presentation lifecycle for interactive surfaces.

---

# 6. Ownership Validation

## 6.1 Ownership table

| Concern | Owner |
|---|---|
| Exploration state | Discovery Runtime |
| DiscoveryEvent processing | Discovery Runtime |
| DiscoveryAction decision | Discovery Runtime |
| Event translation from interaction outcomes | Event Bridge / Coordinator |
| Action routing | Action Executor |
| Messages | Conversation Runtime |
| User submissions | Conversation Runtime |
| Provider conversation requests | Conversation Runtime / Provider Registry |
| Interactive visual presentation | Interactive Presentation Runtime |
| Name candidate click / draft sync | Name Candidate Interaction Runtime |
| Text input / Name Anchor Draft | Input Runtime |
| Layout / layers | Layout + UI Layers |

## 6.2 Discovery Runtime owns

- DiscoveryState
- event validation and application
- history of exploration events
- action resolution (`type`, `reason`, `payload`)

## 6.3 Conversation Runtime owns

- messages
- user submissions
- provider conversation round-trips
- speech-facing ask delivery when routed by Action Executor

## 6.4 Presentation Runtime owns

- current presentation model
- visual interactive presentation
- choice / name-candidate rendering and interaction chrome

## 6.5 Input Runtime owns

- text input state
- Name Anchor Draft before commit
- disabled / loading interaction state for the input surface

## 6.6 Anti-patterns

Do not allow:

1. Discovery Runtime calling `presentationRuntime.present(...)` directly
2. Discovery Runtime appending assistant messages directly
3. Presentation Runtime mutating DiscoveryState
4. Input Runtime committing anchors into DiscoveryState on draft click
5. Provider adapters deciding exploration phase
6. Duplicate exploration stores with conflicting truths

---

# 7. Name Candidate Integration

## 7.1 Current behavior (preserved)

Name Candidate selection today:

1. User clicks a candidate.
2. Name Candidate Interaction Runtime selects the candidate.
3. Input Runtime receives Name Anchor Draft.
4. No conversation advance.
5. No auto-submit.

This draft behavior remains correct and must not be removed by integration.

## 7.2 Future commit behavior

When the user submits the draft (or an equivalent commit path):

```
Name Anchor Draft
        |
        v
Conversation Runtime submit
        |
        v
DiscoveryEvent: NameSelected
        |
        v
Discovery Runtime
```

Payload:

```
{
  candidateId,
  name,
  origin,
  sourceDirectionId
}
```

Discovery updates:

- `anchors`
- phase (typically `name-exploration`)
- history

Then resolves a DiscoveryAction, commonly:

```
{
  type: "refine",
  reason: "expand-selected-anchor",
  payload: {
    anchor: { ... }
  }
}
```

## 7.3 Outside Constraint Exploration

If:

```
origin: "outside-constraint"
```

Then:

1. Anchor is still committed.
2. `sourceDirectionId` is preserved for explanation.
3. `excludedDirections` are not restored.
4. Action Executor / Presentation must continue treating that direction as
   excluded from the main generation space.

This preserves the TASK044 contract inside the Discovery model.

## 7.4 Draft vs committed anchor

| Stage | Owner | Discovery impact |
|---|---|---|
| Candidate click | Name Candidate + Input Draft | No DiscoveryEvent yet |
| User submit / commit | Conversation → NameSelected | DiscoveryState.anchors updated |

Draft and committed anchor remain distinct.

---

# 8. Coordination Layer

## 8.1 Why coordination is needed

Discovery Runtime must stay pure.

Conversation and Presentation must keep their ownership.

Therefore integration needs a coordination layer between:

- event emission
- decision
- execution

## 8.2 Recommended split

### Discovery Coordinator

Responsibility:

- hold or obtain the Discovery Runtime instance
- receive exploration-relevant outcomes from Conversation / interaction edges
- construct DiscoveryEvents
- call `processEvent`
- receive `{ ok, state, action }`
- hand resulting DiscoveryAction to Action Executor

It does not own DiscoveryState internals.

It does not render.

It does not talk to Provider directly.

### Action Executor

Responsibility:

- accept DiscoveryAction
- route by `type`
- call the correct owning runtime adapter
- report execution result back to Coordinator if needed

It does not decide the next exploration step.

It does not reinterpret user intent.

## 8.3 Placement options (future implementation choice)

Possible homes, to be chosen in an implementation task:

1. Thin modules beside Discovery Runtime
2. Methods inside SceneRuntime boot composition
3. A small dedicated coordinator object created during interaction init

Any option is acceptable if ownership remains clear:

Coordinator orchestrates.

Discovery decides.

Executor routes.

Runtimes execute.

## 8.4 Recommended mental model

```
Conversation / Interaction Outcomes
        |
        v
Discovery Coordinator
        |
        +--> DiscoveryEvent --> Discovery Runtime --> DiscoveryAction
        |
        v
Action Executor
        |
        +--> Presentation Runtime
        |
        +--> Conversation Runtime
        |
        +--> Provider adapters (future)
```

---

# 9. NANA Dialogue Policy during integration

Integration must preserve NANA Dialogue Policy v1.0.

Especially:

1. No meaningless confirmation after NameSelected / DirectionSelected.
2. If Action Executor routes `ask`, the message must request needed information
   or explain the next exploration surface.
3. If state is sufficient for `refine` / `present` / `generate`, do not ask the
   user to “continue.”
4. Speech Bubble explains; it does not own workflow.

---

# 10. Non-goals

Phase 3A does not implement:

1. Runtime wiring into `namora.js`
2. Changes to `discovery-runtime.js`
3. Automatic exploration loops
4. AI generation
5. Provider / DeepSeek integration for refine or generate
6. UI / CSS changes
7. Memory persistence
8. Multi-world discovery
9. Free-text semantic interpretation
10. Replacement of Name Anchor Draft behavior

This document is design only.

---

# 11. Implementation readiness gates

A later implementation phase may begin only when:

1. This integration architecture is reviewed
2. Event emission points are accepted
3. Action Executor routing table is accepted
4. Coordinator vs Executor split is accepted
5. NameSelected commit timing (submit, not click) is accepted
6. Implementation scope is authorized separately

Suggested later phases (not authorized here):

- Phase 3B: Coordinator + Action Executor skeleton (still no Provider AI)
- Phase 3C: Wire DirectionSelected / NameSelected / UserInputReceived
- Phase 3D: present / ask execution paths
- Phase 3E: refine / generate Provider adapters

---

# 12. Summary

Discovery Runtime remains the exploration decision engine.

Integration introduces:

1. Event Flow from owned interaction outcomes
2. Action Executor for runtime routing
3. Optional Discovery Coordinator for composition
4. Strict ownership preservation across Conversation, Presentation, and Input

Decide in Discovery.

Execute in owners.

Never collapse those boundaries.

---

# End

Status:

Draft

Version:

0.1.0

Phase:

3A Architecture Design Only
