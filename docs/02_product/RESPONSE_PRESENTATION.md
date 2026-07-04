# RESPONSE_PRESENTATION.md

Document Level: Specification

Status: Living

Version: 1.0

---

# Response Presentation Specification

## Purpose

This document defines how NANA presents information during a conversation.

It does not define prompt logic.

It does not define API behavior.

It does not define implementation details.

It defines the presentation responsibilities of Bubble, Choice Cards, Memory and Input.

Every future UI implementation should follow this specification.

When conflicts occur:

NANA_CONSTITUTION

↓

This Specification

↓

Implementation

This document is the single source of truth for conversation presentation.

---

# Design Philosophy

Conversation is not a message stream.

Conversation is a guided journey.

Every UI component exists for only one purpose.

Responsibilities should never overlap.

The goal is not to display more information.

The goal is to present information more clearly.

---

# Time Model

Every conversation exists in three moments.

Past

↓

Present

↓

Future

These moments should always remain visually distinguishable.

Memory represents the Past.

Bubble represents the Present.

Input represents the Future.

Choice Cards support the user's next decision.

No component should represent multiple moments simultaneously.

---

# Information Flow

Users should naturally read the page in this order.

Page Header

↓

Memory

↓

Bubble

↓

Choice Cards

↓

Input

↓

Tool Layer

Information should always flow downward.

The interface should never feel crowded.

---

# Bubble Responsibilities

Bubble is NANA's current voice.

Bubble is responsible for:

• Understanding

• Explaining

• Reasoning

• Guiding

• Summarizing

Bubble should feel conversational.

Bubble should never become a list.

Bubble should never become a history panel.

Bubble should never become a navigation component.

Bubble exists only for the current conversation.

---

# Choice Card Responsibilities

Choice Cards represent structured decisions.

They are responsible for:

• Naming directions

• Candidate groups

• Recommendations

• User selections

Choice Cards should never explain.

Choice Cards should never summarize.

Choice Cards should never repeat Bubble content.

Bubble explains.

Cards present.

---

# Memory Responsibilities

Memory stores completed conversations.

Memory is never the current conversation.

Memory is never a message list.

Memory represents completed naming journeys.

Only completed Bubble content may enter Memory.

---

# Memory Counter Rules

Memory Count reflects only stored conversations.

The current Bubble is never counted.

Greeting Bubble starts outside Memory.

Example:

Initial State

Memory (0)

↓

Greeting Bubble

↓

User sends first message

↓

Greeting Bubble enters Memory

↓

Memory (1)

Every Bubble increases Memory Count only after leaving the stage.

Memory Count therefore represents completed conversation history.

It never represents active dialogue.

---

# Speech Area

Speech Area contains:

Bubble

+

NANA

Bubble represents the voice.

NANA represents the speaker.

Bubble should be positioned left / center.

NANA should be positioned at the lower-right corner of the Bubble.

Bubble tail should point toward NANA.

Bubble and NANA should always appear as one speaking unit.

NANA should never appear detached from her Bubble.

---

# Choice Card Rules

Choice Cards appear only after Bubble typing has completed.

Choice Cards appear below the Speech Area.

Choice Cards should never increase Bubble height.

Choice Cards should never push NANA away.

Choice Cards belong to the conversation stage,

not to the Bubble body.

---

# Choice Card Layout

Choice Cards should always prioritize visibility.

Default layout:

1 Choice

Display normally.

2 Choices

Display both simultaneously.

3 Choices

Display all simultaneously.

4 Choices

Display all simultaneously.

Only when there are more than four choices may horizontal scrolling be enabled.

Users should never need to discover hidden options during ordinary conversations.

---

# Information Separation

Each component has only one responsibility.

Bubble explains.

Choice Cards organize.

Memory remembers.

Input continues.

Responsibilities should never overlap.

---

# Information Duplication

Bubble should never duplicate Choice Card content.

Bubble may introduce available directions.

Example:

"I've prepared four possible directions."

Detailed content belongs to the Choice Cards.

Bubble remains concise.

Cards remain structured.

---

# Visual Priority

The visual priority of the Conversation Stage should always be:

1.

NANA

↓

2.

Bubble

↓

3.

Choice Cards

↓

4.

Memory

↓

5.

Input

The interface itself should never become the visual focus.

NANA should always remain the emotional center of the experience.

---

# Reading Experience

Users should naturally understand:

What NANA is saying.

↓

What choices are available.

↓

What has already happened.

↓

What they should do next.

The interface should require almost no explanation.

---

# Presentation Rules

Bubble always appears before Choice Cards.

Choice Cards always appear before user interaction.

Memory never interrupts the current conversation.

Bubble remains visible until its lifecycle ends.

Memory Count updates only after Bubble is stored.

Greeting Bubble is never counted while active.

---

# Future Components

Every future presentation component must answer one question:

Does it represent:

Past

Present

or

Future?

If the answer is unclear,

the component should not exist.

---

# Design Goal

The purpose of this specification is not visual consistency.

The purpose is cognitive clarity.

Users should always know:

What is happening now.

What has already happened.

What they can do next.

Without thinking.

---

# End of Specification