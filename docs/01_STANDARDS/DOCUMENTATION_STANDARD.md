---
Document:
DOCUMENTATION_STANDARD

Title:
Documentation Standard

Tier:
Standard

Status:
Canonical

Version:
1.0.0

Owner:
NameAI Universe

Purpose:
Define the unified standards for creating, maintaining, and evolving every documentation file in the NameAI Universe.

Depends On:
None

Related Documents:
PROJECT_INDEX
CURRENT_STATE

Last Updated:
2026-07-06
---

# DOCUMENTATION STANDARD

> Every document is part of the product.
>
> Consistent documentation creates consistent development.

---

# 1. Header Standard

Every official document must begin with the following header.

```yaml
---
Document:

Title:

Tier:

Status:

Version:

Owner:

Purpose:

Depends On:

Related Documents:

Last Updated:
---
```

Field definitions:

| Field | Description |
|--------|-------------|
| Document | Permanent document identifier. Never change after creation. |
| Title | Human-readable document title. |
| Tier | Document classification. |
| Status | Current lifecycle status. |
| Version | Semantic version number. |
| Owner | Responsible owner or team. |
| Purpose | One-sentence responsibility of the document. |
| Depends On | Documents that must be understood first. |
| Related Documents | Documents closely related to this one. |
| Last Updated | Last modification date. |

---

# 2. Document Naming

All official documentation files use:

- UPPERCASE
- Words separated by underscores
- `.md` extension

Examples:

```
PROJECT_INDEX.md
CURRENT_STATE.md
UNIVERSE_CONSTITUTION.md
DOCUMENTATION_STANDARD.md
PEARL_SYSTEM.md
```

---

# 3. Directory Naming

Documentation directories use:

- Numeric prefix
- UPPERCASE
- Underscore separator

Example:

```
00_UNIVERSE
01_STANDARDS
02_COMPANIONS
03_WORLDS
04_MECHANICS
05_PRODUCT
06_ENGINEERING
99_ARCHIVE
```

---

# 4. Status Standard

Every document must have one status.

Allowed values:

- Planning
- Draft
- Review
- Stable
- Canonical
- Deprecated

Definitions:

Planning → Idea only.

Draft → Being written.

Review → Awaiting confirmation.

Stable → Ready for normal use.

Canonical → Official source of truth.

Deprecated → Kept only for historical reference.

---

# 5. Version Standard

Semantic Versioning:

```
Major.Minor.Patch
```

Example:

```
0.1.0
0.8.0
1.0.0
1.2.3
2.0.0
```

Major

Breaking changes.

Minor

New sections.

Patch

Corrections only.

---

# 6. One Responsibility Rule

Every document has exactly one responsibility.

If a document begins explaining multiple independent topics,

split it into separate documents.

Simple documents are easier to maintain.

---

# 7. Directory Responsibilities

Every top-level directory owns one responsibility.

Universe

Highest principles.

Standards

Shared rules.

Companions

Residents.

Worlds

Companion environments.

Mechanics

Interactive systems.

Product

User-facing product.

Engineering

Technical implementation.

Archive

Historical preservation.

---

# 8. Reading Principle

Documentation should always be read from philosophy toward implementation.

```
PROJECT_INDEX

↓

UNIVERSE

↓

STANDARDS

↓

COMPANIONS

↓

WORLDS

↓

MECHANICS

↓

PRODUCT

↓

ENGINEERING

↓

CURRENT_STATE
```

Never reverse this order during development.

---

# 9. Documentation Philosophy

Documentation evolves together with the project.

Code follows documentation.

Documentation does not follow code.

No important knowledge should exist only inside conversations.

---

# End

Status:

Canonical

Version:

1.0.0