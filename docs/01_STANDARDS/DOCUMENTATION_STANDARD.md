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
1.1.0

Owner:
NameAI Universe

Purpose:
Define the unified standards for creating, maintaining, and evolving every documentation file in the NameAI Universe.

Depends On:
None

Related Documents:
STATUS_STANDARD
VERSION_STANDARD
INDEX_STANDARD
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
| Depends On | Documents that should be understood before reading this document. |
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

The complete naming rules are defined in:

**DOCUMENT_NAMING_STANDARD.md** *(Planned)*

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

# 4. Documentation Standards

This document defines the overall philosophy of documentation.

Detailed rules are maintained in dedicated standards.

- Status → STATUS_STANDARD.md
- Version → VERSION_STANDARD.md
- Index → INDEX_STANDARD.md
- Naming → DOCUMENT_NAMING_STANDARD.md *(Planned)*

Documentation should reference these standards instead of redefining them.

This follows the principle of:

> **One concept, one authoritative definition.**

---

# 5. One Responsibility Rule

Every document has exactly one responsibility.

If a document begins explaining multiple independent topics,

split it into separate documents.

Simple documents are easier to maintain.

---

# 6. Directory Responsibilities

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

Shared interactive systems.

Product

User-facing product behavior.

Engineering

Technical implementation.

Archive

Historical preservation.

---

# 7. Reading Principle

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

# 8. Single Source of Truth

Every documentation rule should have exactly one authoritative definition.

Other documents should reference that definition instead of duplicating it.

This principle prevents documentation drift and keeps the documentation system internally consistent.

---

# 9. Documentation Philosophy

Documentation evolves together with the project.

Code follows documentation.

Documentation does not follow code.

No important knowledge should exist only inside conversations.

Documentation should describe principles before implementation.

---

# End

Status:

Canonical

Version:

1.1.0