---
Document:

TASK045_DISCOVERY_COORDINATOR_ARCHITECTURE

Title:

Discovery Coordinator Architecture

Tier:

Engineering

Status:

Draft

Version:

0.1.0

Owner:

NameAI Engineering

Purpose:

Define the future Discovery Coordinator as an orchestration layer that
composes Event Bridge, Discovery Runtime, and Action Executor without
becoming a decision-making runtime or owning exploration domain state.

Depends On:

TASK045_DISCOVERY_RUNTIME_ARCHITECTURE
TASK045_DISCOVERY_INTEGRATION_ARCHITECTURE

Related Documents:

ORCHESTRATOR
CURRENT_STATE
NAMING_DISCOVERY_SYSTEM

Last Updated:

2026-07-23
---

# Discovery Coordinator Architecture

## Phase 3C — Design Only

Status:

Draft — architecture design only

This document does not authorize implementation.

It defines the future Discovery Coordinator layer that will compose:

- Discovery Event Bridge
- Discovery Runtime
- Discovery Action Executor

---

# 1. Purpose

TASK045 has established:

| Stage | Result |
|---|---|
| Phase 1 | Discovery Runtime architecture |
| Phase 2B | Isolated Discovery Runtime skeleton |
| Phase 3A | Integration architecture |
| Phase 3B.1 | Event Bridge + Action Executor skeletons |

Missing piece:

A thin orchestration layer that connects those parts into one pipeline
without collapsing ownership.

That layer is Discovery Coordinator.

Architecture principle:

```
Discovery Runtime decides.
Action Executor routes.
Coordinator orchestrates.
```

---

# 2. Core Principle

Coordinator orchestrates the pipeline.

It does not become a second Discovery Runtime.

Coordinator does NOT:

- generate names
- decide exploration direction
- modify DiscoveryState directly
- render UI
- send messages
- call providers
- invent DiscoveryAction reasons
- reinterpret user intent beyond event normalization already owned by Event Bridge

If a behavior changes exploration meaning, it belongs in Discovery Runtime.

If a behavior executes a surface or provider request, it belongs in an owning
runtime reached through Action Executor.

If a behavior only sequences those steps, it belongs in Coordinator.

---

# 3. Coordinator Responsibility

## 3.1 Coordinator owns

- orchestration flow
- runtime composition
- event/action pipeline sequencing
- returning a structured pipeline result to callers
- optional observability of the pipeline (timestamps, stage outcomes)

## 3.2 Coordinator does not own

- exploration state (`DiscoveryState`)
- conversation messages / conversation state
- presentation state / rendering
- input draft state
- provider logic / network transport
- event schema semantics beyond invoking Event Bridge
- action decision logic beyond invoking Discovery Runtime
- handler business logic beyond invoking Action Executor

## 3.3 One-line definition

Discovery Coordinator is a composition root for the Discovery decision
pipeline, not a domain authority.

---

# 4. Layer Decision

## 4.1 Options

### Option A — Runtime Layer

Place Coordinator beside Conversation / Presentation / Discovery as another
`*Runtime`.

### Option B — Orchestration Layer

Place Coordinator above decision/execution modules as a pipeline composer.

## 4.2 Recommendation

**Orchestration Layer**

Reasons:

1. Namora “Runtime” objects own durable domain state and domain decisions.
   Coordinator owns neither.
2. Calling it a Runtime invites accidental state accumulation and decision
   leakage.
3. Phase 3A already separates Coordinator from Discovery Runtime and Action
   Executor.
4. Existing SceneRuntime / boot composition can later create a Coordinator
   without treating it as exploration truth.
5. Naming clarity:

```
Runtime  = owns domain state / decisions / surfaces
Coordinator = sequences approved modules
```

## 4.3 Practical placement (future implementation)

Conceptual home:

```
Orchestration Layer
  └── Discovery Coordinator

Decision Layer
  └── Discovery Runtime

Translation Layer
  └── Discovery Event Bridge

Routing Layer
  └── Discovery Action Executor

Execution Layer
  ├── Conversation Runtime
  ├── Interactive Presentation Runtime
  └── Provider adapters (future)
```

Exact file location remains an implementation choice.

Recommended future name:

```
discovery-coordinator.js
```

Do not create that file in Phase 3C.

---

# 5. Data Flow

Canonical pipeline:

```
External Event
        |
        v
Coordinator
        |
        v
Event Bridge
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
Handler Runtime
```

## 5.1 Stage meanings

| Stage | Module | Result |
|---|---|---|
| External Event | Caller (Conversation / interaction edge) | Raw exploration-relevant outcome |
| Event Bridge | `createEvent` | Normalized DiscoveryEvent or rejection |
| Discovery Runtime | `processEvent` | Updated DiscoveryState + resolved action |
| Action Executor | `execute` | Routed handler result |
| Handler Runtime | registered adapter | Present / ask / future refine-generate |

## 5.2 Detailed happy path

```
1. Caller invokes Coordinator with external event
2. Coordinator asks Event Bridge to normalize
3. If normalization fails -> stop; return structured failure
4. Coordinator asks Discovery Runtime to process DiscoveryEvent
5. If processing fails -> stop; return structured failure
6. If action is null -> stop successfully with no execution
7. Coordinator asks Action Executor to execute DiscoveryAction
8. Return combined pipeline result to caller
```

## 5.3 Important sequencing rules

1. Event Bridge runs before Discovery Runtime.
2. Discovery Runtime runs before Action Executor.
3. Action Executor never receives raw external events.
4. Discovery Runtime never receives Action Executor results as state mutations
   unless a later explicit feedback event is designed.
5. Coordinator never skips Discovery Runtime and invents an action.

---

# 6. State Ownership

Confirm:

| State | Owner |
|---|---|
| DiscoveryState | Discovery Runtime |
| ConversationState / messages | Conversation Runtime |
| PresentationState | Interactive Presentation Runtime |
| Input text / Name Anchor Draft | Input Runtime |
| Provider request lifecycle | Conversation Runtime / Provider Registry |
| Pipeline transient result | Coordinator (ephemeral only) |

Coordinator owns:

**No domain state.**

Allowed ephemeral values:

- last pipeline result for return value construction
- injected module references
- optional debug counters / logs that do not redefine exploration truth

Forbidden durable values:

- anchors
- constraints
- preferences
- phase
- message lists
- current presentation model

---

# 7. API Proposal

Design only. Not implemented.

## 7.1 Factory

```
createDiscoveryCoordinator(config?)
```

Suggested config dependencies:

```
{
  eventBridge,
  discoveryRuntime,
  actionExecutor
}
```

All three should be injected.

Coordinator should not construct hidden alternate Discovery Runtimes with
divergent state.

## 7.2 Proposed methods

### handleExternalEvent(input)

Primary entry for external outcomes.

Conceptual behavior:

1. bridge.createEvent(input)
2. if !ok -> return failure
3. runtime.processEvent(event)
4. if !ok -> return failure
5. if action -> executor.execute(action)
6. return pipeline result

### process(discoveryEvent)

Optional lower-level entry when caller already has a DiscoveryEvent.

Skips Event Bridge.

Useful for tests and future internal replay.

### execute(action)

Optional lower-level entry to route an already resolved DiscoveryAction.

Skips Bridge and Runtime.

Useful for tests and controlled replays.

It must not invent a new action.

### getDiscoveryState()

Read-through convenience to `discoveryRuntime.getState()`.

Must not clone a second mutable store inside Coordinator.

### resetDiscovery()

Optional read-through to `discoveryRuntime.reset()` for isolated tests.

Must not reset Conversation / Presentation / Input.

## 7.3 Proposed pipeline result shape

```
{
  ok: true | false,
  stage: "bridge" | "runtime" | "executor" | "complete",
  event: DiscoveryEvent | null,
  state: DiscoveryStateSnapshot | null,
  action: DiscoveryAction | null,
  execution: ExecutorResult | null,
  error: string | null
}
```

Exact field names may evolve in implementation.

Meaning must remain:

One result object describing which stage succeeded or failed.

---

# 8. Error Handling

Coordinator is responsible for structured failure reporting.

It is not responsible for silently repairing domain errors.

## 8.1 Event invalid

Cause:

- missing type
- unknown external type
- invalid payload

Owner of detection:

Event Bridge

Coordinator response:

- do not call Discovery Runtime
- do not call Action Executor
- return `{ ok:false, stage:"bridge", error:... }`

## 8.2 Discovery Runtime rejects event

Cause:

- unknown DiscoveryEvent type
- invalid domain payload after bridge
- runtime validation failure

Owner of detection:

Discovery Runtime

Coordinator response:

- do not invent a fallback action
- do not call Action Executor
- return `{ ok:false, stage:"runtime", event, state, error:... }`

## 8.3 Action has no handler

Cause:

- DiscoveryAction.type not registered in Action Executor

Owner of detection:

Action Executor

Coordinator response:

- preserve the action in the result
- return `{ ok:false, stage:"executor", action, execution:{ handled:false }, error:... }`
- do not fabricate Presentation / Conversation side effects

## 8.4 Handler execution fails

Cause:

- registered handler throws
- owning runtime adapter returns failure

Owner of detection:

Action Executor / handler adapter

Coordinator response:

- capture failure in pipeline result
- leave DiscoveryState as already updated by the prior successful processEvent
- do not roll back DiscoveryState implicitly

Why no implicit rollback:

DiscoveryEvent already happened as exploration truth.

Execution failure is an orchestration/execution problem, not an un-happening of
the user exploration fact.

A later explicit compensating event may be designed if product requires it.

## 8.5 Null action after successful event

Cause:

Discovery Runtime processed the event but resolved no next action.

Coordinator response:

- treat as successful decision with no execution
- return `{ ok:true, stage:"complete", action:null, execution:null }`

---

# 9. Composition With Existing Namora Systems

Future wiring (not authorized in Phase 3C):

```
Conversation / Interaction Outcomes
        |
        v
Discovery Coordinator.handleExternalEvent(...)
        |
        +--> Event Bridge
        +--> Discovery Runtime
        +--> Action Executor
                |
                +--> present handler -> Interactive Presentation Runtime
                |
                +--> ask handler -> Conversation / Speech Bubble
                |
                +--> refine/generate handlers -> Provider adapters (future)
```

Rules for later wiring tasks:

1. Candidate click still updates Name Anchor Draft only.
2. NameSelected enters Coordinator on commit/submit, not draft click.
3. Coordinator must not bypass Conversation submit contracts.
4. Coordinator must not become SceneRuntime itself.

---

# 10. Relationship To Discovery Runtime Decisions

Coordinator may observe:

- returned state snapshots
- returned actions

Coordinator may not:

- change phase
- append anchors
- edit constraints
- rewrite action.reason
- replace action.type based on UI convenience

If product needs a different next step, change Discovery Runtime rules in an
authorized task.

Do not patch decisions inside Coordinator.

---

# 11. Non-goals

Phase 3C does not implement:

1. Coordinator code
2. `discovery-coordinator.js`
3. Runtime wiring into `namora.js`
4. Automatic exploration loops
5. AI generation
6. Provider / DeepSeek integration
7. UI / CSS / HTML changes
8. Conversation or Presentation handler adapters
9. Durable Coordinator domain state
10. Changes to existing skeleton modules

---

# 12. Implementation Readiness Gates

A later implementation phase may begin only when:

1. This Coordinator architecture is reviewed
2. Orchestration-layer placement is accepted
3. Pipeline result / error model is accepted
4. “No domain state in Coordinator” remains uncontested
5. Implementation scope is authorized separately

Suggested later phase (not authorized here):

Phase 3C.1 — Discovery Coordinator Skeleton

- create isolated `discovery-coordinator.js`
- inject Bridge + Runtime + Executor
- verify pipeline with Node tests
- still no Namora boot wiring

---

# 13. Summary

Discovery Coordinator is the orchestration layer for:

External Event → Bridge → Runtime → Action → Executor → Handler

It sequences approved modules.

It does not decide exploration.

It does not own DiscoveryState.

It does not execute Presentation, Conversation, or Provider logic itself.

Decide in Discovery Runtime.

Route in Action Executor.

Orchestrate in Coordinator.

---

# End

Status:

Draft

Version:

0.1.0

Phase:

3C Architecture Design Only
