# ==============================================================================
# NameAI Documentation
# ==============================================================================
#
# Document:      ORCHESTRATOR.md
# Title:         Runtime Orchestrator
# Tier:          Engineering
# Status:        Draft
# Version:       v1.0.0
# Owner:         NameAI Engineering
#
# Purpose:
# Define how the Runtime Orchestrator coordinates all modules of NameAI.
# The Orchestrator is the execution core of the system.
#
# Depends On:
# - SYSTEM_ARCHITECTURE.md
# - SESSION_LIFECYCLE.md
# - NANA_BEHAVIOR_MODEL.md
#
# Related Documents:
# - NAMING_DISCOVERY_SYSTEM.md
# - UI_FOUNDATION.md
#
# Last Updated:
# 2026-07-13 (UTC+8)
#
# ==============================================================================

# Runtime Orchestrator

---

# Mission

The Runtime Orchestrator is the execution core of NameAI.

It does not generate names.

It does not understand language.

It coordinates every module in the correct order.

Its responsibility is:

Right module.

Right time.

Right context.

---

# Architecture Position

User

↓

UI

↓

Runtime Orchestrator

↓

System Modules

↓

AI Model

↓

Runtime Orchestrator

↓

UI

↓

User

---

# Responsibilities

The Runtime Orchestrator is responsible for:

• Session lifecycle

• State management

• Module scheduling

• Prompt construction

• AI invocation

• Response processing

• Error recovery

• UI synchronization

It never replaces business logic.

It only coordinates.

---

# Runtime Pipeline

Every request follows the same pipeline.

User Input

↓

Session Manager

↓

Discovery Engine

↓

Capability Router

↓

Prompt Builder

↓

AI Provider

↓

Response Processor

↓

NANA Behavior

↓

UI Update

↓

User

---

# Module Responsibilities

## Session Manager

Responsible for:

• Session creation

• Session resume

• Session completion

• Conversation context

• State persistence

---

## Discovery Engine

Responsible for:

• Intent discovery

• Tree selection

• Branch discovery

• Leaf discovery

• Search-space reduction

---

## Capability Router

Responsible for:

• Available capabilities

• Unsupported capabilities

• Coming Soon routing

• Vote / Notify routing

---

## Prompt Builder

Responsible for:

Transforming structured context into model prompts.

The Prompt Builder never decides product behavior.

It only translates runtime state into instructions.

---

## AI Provider

Responsible for:

Executing reasoning.

Examples:

DeepSeek

OpenAI

Claude

Gemini

The provider is replaceable.

---

## Response Processor

Responsible for:

• Validation

• Parsing

• Normalization

• Confidence evaluation

• Error detection

The raw AI output is never exposed directly.

---

## NANA Behavior

Responsible for:

• Explanation

• Recommendation

• Guidance

• Confirmation

• Session completion

Only after NANA interprets the result is it shown to the user.

---

# Runtime State

The Runtime maintains a unified state.

Example:

Session ID

Current Tree

Current Branch

Current Leaf

Discovery Progress

Conversation History

Capability State

User Preferences

Generation Results

This state is shared across all modules.

---

# Event Flow

Example:

User enters:

"I need a name for my AI podcast."

↓

Session starts.

↓

Discovery Engine identifies:

Podcast.

↓

Prompt Builder constructs prompt.

↓

DeepSeek generates candidates.

↓

Response Processor parses results.

↓

NANA explains.

↓

UI refreshes.

↓

Session continues.

---

# Error Handling

If any module fails:

The Runtime Orchestrator determines the next action.

Possible actions:

Retry

Fallback

Explain

Switch capability

End session gracefully

Errors must never expose implementation details.

---

# Replaceability

Every execution module must be replaceable.

Examples:

DeepSeek

↓

OpenAI

↓

Claude

↓

Future Models

Changing the provider must not require changing product behavior.

---

# Core Principles

Principle 1

The Runtime controls execution.

Modules never control each other directly.

---

Principle 2

Business decisions belong to NANA.

Execution belongs to the Runtime.

---

Principle 3

AI models perform reasoning.

They do not own user interaction.

---

Principle 4

Every module has a single responsibility.

---

Principle 5

Runtime state is the only source of truth during a session.

---

# Future Expansion

The Runtime must support:

• Multiple AI providers

• Multiple companions

• Multiple products

• Plugin capabilities

• Tool invocation

• Long-term memory

without redesigning the orchestration architecture.

---

# Definition of Done

A Runtime Orchestrator implementation is considered complete when:

☐ Session lifecycle is fully managed

☐ Discovery Engine is coordinated

☐ Prompt Builder is isolated

☐ AI Provider is replaceable

☐ Response Processor is integrated

☐ NANA controls user-facing behavior

☐ Runtime state remains consistent

☐ Errors are gracefully handled

☐ New modules can be added without modifying existing module responsibilities

==============================================================================

END OF DOCUMENT

==============================================================================