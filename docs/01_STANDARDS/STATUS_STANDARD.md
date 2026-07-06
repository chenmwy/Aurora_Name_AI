---
Document:
STATUS_STANDARD

Title:
Status Standard

Tier:
Standard

Status:
Canonical

Version:
1.0.0

Owner:
NameAI Universe

Purpose:
Define the official lifecycle status system used across all specifications, companions, mechanics, products, and future components within the NameAI Universe.

Depends On:
STANDARDS_INDEX

Related Documents:
DOCUMENTATION_STANDARD
DOCUMENTATION_ARCHITECTURE
VERSION_STANDARD

Last Updated:
2026-07-06
---

# Status Standard

The Status Standard defines the lifecycle of every official asset inside the NameAI Universe.

Status communicates maturity.

It allows contributors to immediately understand whether an item is experimental, under development, stable, or officially established.

A status represents the current stage of evolution.

It does not represent quality.

---

# Design Principles

A good status system should be:

- Simple
- Predictable
- Consistent
- Scalable

Every official specification should use one and only one status.

---

# Status Lifecycle

```
Planning

↓

Draft

↓

Review

↓

Active

↓

Stable

↓

Canonical

↓

Deprecated

↓

Archived
```

Every official asset progresses through this lifecycle.

Some assets may stop at Stable.

Only the most authoritative specifications become Canonical.

---

# Status Definitions

## Planning

The idea has been identified.

No official implementation exists.

Purpose:

Explore possibilities.

---

## Draft

Initial documentation or implementation has begun.

Content is expected to change frequently.

Purpose:

Rapid iteration.

---

## Review

The first complete version exists.

Waiting for discussion, validation, or approval.

Purpose:

Collect feedback.

---

## Active

Currently being developed or continuously updated.

Frequent revisions are expected.

Typical examples:

- CURRENT_STATE
- Development Roadmaps

---

## Stable

The specification is considered reliable.

Only minor improvements are expected.

Breaking changes should be avoided.

---

## Canonical

The official source of truth.

All implementations must follow the Canonical specification.

Changes require careful review and version updates.

Examples:

- UNIVERSE_CONSTITUTION
- CORE_PROTOCOL
- DOCUMENTATION_STANDARD

---

## Deprecated

The specification is no longer recommended.

It is retained only for compatibility or historical reference.

New work should not depend on Deprecated assets.

---

## Archived

The specification has completed its lifecycle.

It is preserved inside the Archive.

It should not participate in future development.

---

# Status Usage

Status may be applied to:

- Documents
- Companions
- Worlds
- Mechanics
- Product Features
- Development Specifications

The same definitions should be used consistently throughout the Universe.

---

# Status Transition

Recommended transition path:

```
Planning

↓

Draft

↓

Review

↓

Active

↓

Stable

↓

Canonical
```

If retirement becomes necessary:

```
Canonical

↓

Deprecated

↓

Archived
```

Skipping stages should be avoided unless justified.

---

# Canonical Principle

Canonical represents the highest level of authority.

Only one Canonical specification should exist for a given responsibility.

If two Canonical documents conflict,

the documentation architecture should be reviewed immediately.

---

# Maintenance Principle

Status should reflect reality.

Do not promote documents too early.

Do not leave outdated documents marked as Active.

Status is a communication tool.

Its value depends on accuracy.

---

# Closing Statement

A clear lifecycle creates confidence.

Readers should understand the maturity of a specification before reading its content.

Status helps every contributor make better decisions.

It is one of the foundations of a maintainable Universe.

---

# End

Status:

Canonical

Version:

1.0.0