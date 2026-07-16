# ==============================================================================
# NameAI Documentation
# ==============================================================================
#
# Document:      SYSTEM_ARCHITECTURE.md
# Title:         System Architecture
# Tier:          Universe
# Status:        Draft
# Version:       v1.0.0
# Owner:         NameAI Universe
#
# Purpose:
# Define how the entire NameAI system operates from user interaction
# to AI execution and back.
#
# Depends On:
# - UNIVERSE_CONSTITUTION.md
#
# Related Documents:
# - NANA_BEHAVIOR_MODEL.md
# - NAMING_DISCOVERY_SYSTEM.md
# - SESSION_LIFECYCLE.md
#
# Last Updated:
# 2026-07-13 (UTC+8)
#
# ==============================================================================

# System Architecture

---

# Mission

The purpose of this architecture is not to define software.

Its purpose is to define how intelligence flows.

Every future AI Companion should follow this architecture.

---

# Layer 1
# User Layer

Everything begins with the user.

The user never communicates with an AI model directly.

The user communicates with a Companion.

Input

↓

Companion

↓

Output

---

# Layer 2
# Interface Layer

The interface exists only for interaction.

Responsibilities:

• Display

• Input

• Animation

• Feedback

The interface never decides.

The interface never thinks.

---

# Layer 3
# Session Layer

Every interaction belongs to a Session.

Responsibilities:

Start

Context

State

Completion

Memory

The Session controls the lifecycle.

---

# Layer 4
# Companion Layer

The Companion is the visible intelligence.

Responsibilities:

Understand.

Guide.

Explain.

Summarize.

Stop.

The Companion never generates names directly.

The Companion makes decisions.

---

# Layer 5
# Discovery Layer

Responsibilities:

Understand user intent.

Reduce uncertainty.

Locate the correct branch.

Find the correct leaf.

Tree Finder belongs here.

---

# Layer 6
# Prompt Layer

Responsibilities:

Translate Companion decisions

into model instructions.

Prompt is an implementation.

Not intelligence.

---

# Layer 7
# AI Model Layer

Responsibilities:

Reason.

Generate.

Infer.

Examples:

DeepSeek

OpenAI

Claude

Gemini

The model executes.

It does not own the product.

---

# Layer 8
# Result Layer

Responsibilities:

Receive output.

Validate.

Normalize.

Score.

Prepare presentation.

The model output is never shown directly.

---

# Layer 9
# Response Layer

Responsibilities:

NANA explains.

NANA recommends.

NANA confirms.

NANA ends the Session.

Only after this does the user receive the answer.

---

# Information Flow

User

↓

Interface

↓

Session

↓

Companion

↓

Discovery

↓

Prompt

↓

AI Model

↓

Result

↓

Companion

↓

User

---

# Core Principle

The AI model is replaceable.

The Companion is not.

---

# Responsibility Separation

Interface

↓

Interaction

Session

↓

Lifecycle

Companion

↓

Decision

Discovery

↓

Direction

Prompt

↓

Translation

AI Model

↓

Inference

Result

↓

Normalization

---

# Future Expansion

The architecture supports:

Multiple Companions

Multiple AI Models

Multiple Products

Without changing the architecture.

---

# Permanent Rules

Rule 1

Users never talk to models.

They talk to Companions.

Rule 2

Companions never depend on one AI model.

Rule 3

Discovery happens before generation.

Rule 4

Generation never ends a Session.

User satisfaction ends a Session.

Rule 5

The architecture must remain stable while implementation evolves.

==============================================================================

END OF DOCUMENT

==============================================================================