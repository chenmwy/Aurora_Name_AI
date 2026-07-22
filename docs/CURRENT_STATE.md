---
Document:

CURRENT_STATE

Title:

Current Project State

Tier:

Project

Status:

Active

Version:

1.4.0

Owner:

NameAI Universe

Purpose:

Provide a real-time overview of the current status, priorities, completed milestones, and next objectives of the NameAI Universe.

Depends On:

PROJECT_INDEX

Related Documents:

UNIVERSE_INDEX
DOCUMENTATION_ARCHITECTURE

Last Updated:

2026-07-22
---

# Current State

This document represents the current operational state of the NameAI Universe.

Unlike Canonical specifications, this document changes frequently.

It serves as the project's operational dashboard and should always reflect the latest development progress.

---

# Current Milestone

Interaction Architecture Foundation

Status:

🟢 Completed

Completed tasks:

- TASK039
- TASK040
- TASK041
- TASK042
- TASK043
- TASK044

---

# Current Focus

Discovery Runtime Foundation

Status:

🟡 Planned Next Phase

Namora now has a verified interaction stack:

Input → Conversation → Provider → Presentation → Layout → UI Layers.

Name Candidate Interaction is part of that stack.

The next planned phase is Discovery Runtime Foundation.

Do not treat Discovery Runtime as started until a dedicated task authorizes it.

---

# Architecture Milestone

## Interaction Architecture Foundation

Completed through the Namora Behavior / Runtime expansion sequence (Task039–Task044).

These tasks are recorded as one Architecture Milestone, not as separate open workstreams.

### What was established

Conversation Runtime

- Canonical message model
- Submit lifecycle
- Speech Bubble integration
- Loading / error / duplicate-submit protection
- Chinese IME safety
- Local Response Provider for offline verification
- Async `submitUserText()` contract (resolves after provider + presentation routing)

DeepSeek Provider

- Replaceable Response Provider boundary
- Protected `/api/nana` reuse
- Provider Registry with Local fallback
- Normalized success / failure contract
- No credential exposure in the browser

Interactive Presentation Runtime

- Generic Presentation model
- Choice Presentation (multi-select + optional weight refinement)
- Name Candidate Presentation
- Confirm → Conversation Runtime handoff
- Structured selection metadata for Provider requests
- Speech Bubble reserved for short dialogue only

Name Candidate Interaction Foundation (TASK044)

- Name Candidate Presentation type introduced
- Candidate origin model introduced (`inside-constraint` / `outside-constraint`)
- Name Anchor Draft introduced
- Candidate selection synchronizes with Input Runtime
- Selection does not auto-submit
- Outside Constraint Exploration introduced
- Outside candidates are visually and semantically separated
- Outside candidate selection does not restore excluded directions
- Conversation Runtime correctly routes Presentation payloads to Interactive Presentation Runtime

Responsive Layout System

- Desktop Workspace vs Mobile Guided Flow
- Device-semantic layout resolution (desktop windows stay desktop)
- Mobile Presentation → Companion → Input order
- Independent companion / input lift policy
- Mobile background policy

UI Layer Architecture

- Background / Presentation / Character / Dialogue / Input layers
- Runtime owns state · Layer owns space · Renderer owns presentation
- Centralized z-index and pointer boundaries
- `NamoraUILayers` inspection API

### Approved interaction flow

User thought

↓

Input Runtime

↓

Conversation Runtime

↓

Response Provider (DeepSeek / Local)

↓

Conversation Runtime

↓

Speech Bubble Runtime

↓

Interactive Presentation Runtime (when structured content exists)

↓

Responsive Layout + UI Layers

### Conversation Runtime Async Contract

`submitUserText()` resolves only after:

1. Provider response completed
2. Assistant message created
3. Presentation routing completed
4. Runtime state updated

Callers that `await submitUserText(...)` must not assume earlier completion.

---

# Immediate Next Work

Priority Order

1. Discovery Runtime Foundation
2. Discovery Tree Navigation
3. Direction Weight Propagation
4. Interaction Intelligence
5. Companion Intelligence Expansion

These objectives build on the completed Interaction Architecture Foundation.

They must not reopen Runtime ownership boundaries already established for Conversation, Presentation, Input, Pearl, Provider, Layout, or UI Layers.

---

# Recent Achievements

- Conversation Runtime
- DeepSeek Provider
- Interactive Presentation Runtime
- Name Candidate Interaction Foundation
- Responsive Layout System
- UI Layer Architecture
- Interaction Architecture Foundation Completed (TASK039–TASK044)

---

# Operational Health

Conversation Runtime

🟢 Stable

Response Providers

🟢 Stable

Interactive Presentation

🟢 Stable

Name Candidate Interaction

🟢 Stable

Responsive Layout

🟢 Stable

UI Layer Architecture

🟢 Stable

Discovery Runtime

🟡 Not Started

Legacy Public Frontend (`index.html`)

🟢 Compatible

---

# Current Development Principles

Priority 1

Architecture before features.

Priority 2

Runtime ownership before visual convenience.

Priority 3

Same state, different layout.

Priority 4

Fewer high-value interactions over large name dumps.

Priority 5

Preserve the operational public frontend while Namora expands.

---

# Long-Term Vision

Build the world's first companion-centered AI Universe.

Create an ecosystem where intelligent companions, shared mechanics, evolving worlds, and thoughtful products work together to help people think, create, and grow.

Within Namora, Discovery should feel like walking a living tree:

NANA points to a few branches,

the user chooses and refines,

and the path narrows toward the right leaf.

---

# Notes

CURRENT_STATE is the live operational overview.

Canonical documents remain the source of truth for frozen specifications.

Every accepted engineering milestone that changes project direction must be reflected here.

Do not use CURRENT_STATE as a task changelog.

Use Architecture Milestones and Current Focus instead.

---

# End

Status:

Active

Version:

1.4.0

---

## 2026-07-22

### TASK044 Name Candidate Interaction Foundation Completed

Namora completed Name Candidate Interaction Foundation and the Conversation Presentation Routing fix.

Name Candidate Presentation, origin metadata, Name Anchor Draft, and Conversation Runtime presentation routing are now part of the Interaction Architecture Foundation.

Discovery Runtime Foundation remains the next planned phase and is not started.

---

## 2026-07-16

### Interaction Architecture Foundation Completed

Namora completed the Interaction Architecture Foundation milestone through TASK043.

Conversation Runtime, DeepSeek Provider integration, Interactive Presentation Runtime, Responsive Layout System, and UI Layer Architecture formed a coherent replaceable interaction stack.

TASK044 later extended that foundation with Name Candidate Interaction.
