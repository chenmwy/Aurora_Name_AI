# DECISION_LOG

Version: 1.0

Status: Active

Owner: nameAI

Last Updated: 2026-07-01

---

# About This Document

This document records the major product, architecture, design, and engineering decisions made throughout the evolution of nameAI.

It is **not** a meeting record.

Its purpose is to explain **why** important decisions were made, what they changed, and how they influence future development.

Every significant decision should be traceable, allowing future contributors to understand the reasoning behind the product rather than only its implementation.

---

# ADR-001

**Date:** 2026-07-01

**Status:** Accepted

---

## Title

From AI Name Generator to Brand Discovery Platform

---

## Trigger

While designing the Business Name Generator, a fundamental discussion emerged.

Instead of asking how to generate better names, the discussion shifted to a more important question:

> **Do users really need more generated names, or do they need a better understanding of what they are trying to build?**

This single question ultimately changed the direction of the entire product.

---

## Decision

nameAI officially transitions from an AI Name Generator to a Brand Discovery Platform.

The product will no longer be organized around independent generators.

Instead, every user journey should begin with understanding the user's idea.

Name generation becomes one capability of the Discovery Experience rather than the starting point of the product.

---

## Background

After extensive discussion, we concluded that the naming problem is usually not caused by a lack of generated names.

Instead, it is caused by a lack of clarity.

Users often have an idea before they have a brand.

Helping users discover that brand should become the primary responsibility of nameAI.

This insight became the foundation for the future evolution of the product.

---

## Why This Decision Was Made

Traditional AI naming tools focus on generation.

Our goal is fundamentally different.

We believe:

- Better understanding leads to better branding.
- Better branding leads to better naming.
- Therefore, understanding should always come before naming.

This decision changes the foundation of the entire product.

---

## Impact

### Product

- "Tell me your idea." becomes the universal entry point.
- Discovery becomes the primary user experience.
- AI determines the workflow.
- Users no longer choose generators before describing their ideas.

### Engineering

- `PROJECT_CONTEXT.md` becomes the highest-level project document.
- The product architecture evolves around the Discovery Engine.
- Components should use generic names instead of feature-specific names.

Preferred examples:

- IdeaInput
- DiscoveryEngine
- BrandSnapshot

Avoid:

- BusinessInput
- BusinessGenerator
- BusinessSummary

### Design

- NANA evolves from a mascot into a Thinking Companion.
- Thinking replaces traditional loading wherever possible.
- Conversation replaces configuration wherever possible.

---

## Long-term Influence

This decision establishes the long-term direction of nameAI.

Future capabilities—including Startup Naming, Chinese Naming, Restaurant Naming, Podcast Naming, Brand Story, Mission Statement, Brand Voice, and future brand intelligence features—should all be built upon the same Discovery Engine.

The product should evolve as one unified Brand Discovery Platform rather than a collection of independent generators.

---

## Principle

> **Names are the result of understanding.**

Understanding is the product.

Name generation is one expression of that understanding.

---

## Founder Insight

One question changed the direction of the entire project:

> **Do users really need more generated names?**

The answer became:

No.

People rarely struggle because they cannot generate names.

They struggle because they cannot clearly express what they are trying to build.

Everything developed after this decision should reinforce that belief.

---

## Related Documents

- README.md
- PROJECT_CONTEXT.md

# 2026-07-01 (Beijing Time)

## Decision

Introduce the Naming Engine as the foundational specification of nameAI.

## Reason

The project requires a stable set of first principles that can guide every future implementation instead of relying on prompts or individual feature decisions.

## Impact

The Naming Engine becomes the highest-level specification of the project.

Future development of:

- NANA
- Discovery
- Prompt Design
- Signal Network
- Workflow
- User Experience

must remain consistent with:

docs/00_core/NAMING_ENGINE.md

Theory should guide implementation.

Implementation should validate theory.

## Development Principle

A good theory reduces implementation ambiguity.

Theory exists to guide implementation.

Implementation exists to validate theory.