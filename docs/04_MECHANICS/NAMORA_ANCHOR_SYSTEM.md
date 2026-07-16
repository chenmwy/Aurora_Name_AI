# Document

NAMORA_ANCHOR_SYSTEM.md

---

# Title

Namora Anchor System

---

# Tier

04_MECHANICS

---

# Status

Canonical

---

# Version

v1.0.0

---

# Owner

NameAI Universe

---

# Purpose

Define the authoritative spatial anchor system for Namora.

This document establishes the fixed anchor coordinates that all interface
components, animations, particles, accessories, and interaction systems must
reference.

No UI component may introduce independent positioning rules outside this
system.

---

# Depends On

- WORLD_COORDINATE_SYSTEM.md
- NAMORA.md
- UI_FOUNDATION.md

---

# Related Documents

- LAYOUT_SYSTEM.md
- OBJECT_REGISTRY.md
- FUTURE_UI_SYSTEM.md

---

# Last Updated

2026-07-14 (UTC+8)

---

# 1. Design Philosophy

Namora is not positioned by viewport coordinates.

Namora exists inside a fixed world coordinate system.

Every future UI component is attached to semantic anchors instead of absolute
screen positions.

Relationship:

World

↓

Background

↓

Standing Point

↓

NANA

↓

Anchor System

↓

Bubble / Input / Pearl / Emotion / Particles

The renderer only converts coordinates.

The anchors define meaning.

---

# 2. Coordinate Pipeline

All coordinates follow exactly one pipeline.

```
Sprite Local Space

↓

NANA Local Space

↓

Namora World Space

↓

Viewport Space
```

No object may bypass this conversion chain.

---

# 3. Anchor Hierarchy

The current Anchor System contains five approved anchors.

```
Dialogue Tail Anchor

↓

Head Center

↓

Expression Center

↓

Foot Anchor

↓

Pearl Anchor
```

These anchors represent semantic positions instead of mathematical centers.

---

# 4. Anchor Definitions

---

## 4.1 Pearl Anchor

Status

Approved

Purpose

Reference point for:

- Pearl
- User Bubble
- User Input Area
- Future User Interaction Zone

Notes

This anchor belongs to the environment.

It is not attached to NANA.

---

## 4.2 Foot Anchor

Status

Locked

Purpose

World Registration Anchor.

Responsibilities

- Register NANA to the background.
- Maintain contact with the shell.
- Drive all world placement.

This anchor must never be moved unless the artwork itself changes.

---

## 4.3 Expression Center

Status

Locked

Purpose

Visual center of NANA's face.

Responsibilities

- Facial effects
- Expressions
- Eye animation
- Smile animation
- Emotional particles

This anchor represents the mouth/face center rather than the geometric center
of the sprite.

---

## 4.4 Head Center

Status

Locked

Purpose

Top semantic position of NANA.

Responsibilities

- Accessories
- Halo
- Crown
- Status icons
- Floating indicators

This anchor represents the visual center of the head.

---

## 4.5 Dialogue Tail Anchor

Status

Locked

Purpose

Origin of the speech bubble tail.

Responsibilities

- Bubble tail connection
- Bubble positioning

Important

The bubble itself is NOT centered on this anchor.

Only the tail connects here.

The bubble body is free to extend according to layout rules.

---

# 5. Current Coordinate Set

The current coordinates are manually calibrated.

These values are considered authoritative.

Future artwork updates must preserve these semantic positions.

| Anchor | Status |
|----------|---------|
| Pearl Anchor | Approved |
| Foot Anchor | Locked |
| Expression Center | Locked |
| Head Center | Locked |
| Dialogue Tail Anchor | Locked |

---

# 6. Coordinate Storage

Each anchor stores both source coordinates and normalized coordinates.

Example

```
ExpressionCenter

Source

x

y

Normalized

u

v
```

Renderer calculations always use the normalized representation after loading.

---

# 7. Coordinate Rules

The following rules are mandatory.

## Rule 1

Anchors describe meaning.

They do not describe geometry.

---

## Rule 2

Anchors never use viewport coordinates.

---

## Rule 3

Renderer converts coordinates.

Renderer never decides anchor positions.

---

## Rule 4

Every future component references exactly one anchor.

No component creates private positioning logic.

---

## Rule 5

All animations inherit the anchor position.

Animations may offset from the anchor but never redefine it.

---

# 8. Future Components

The following planned systems will reference these anchors.

Dialogue Tail Anchor

- Speech Bubble

Head Center

- Halo
- Accessories
- Status
- Notifications

Expression Center

- Facial animation
- Emotion effects
- Eye tracking
- Smile animation

Foot Anchor

- World registration
- Standing animation
- Idle breathing

Pearl Anchor

- User message bubble
- Input area
- Pearl Button
- User interaction

---

# 9. Modification Policy

Anchor positions are frozen.

Changing an anchor requires:

1. Visual review
2. Manual calibration
3. Documentation update
4. Version increment

No renderer change alone may modify anchor semantics.

---

# 10. Version History

## v1.0.0

First official Anchor System.

Established after manual visual calibration.

Approved anchors:

- Pearl Anchor
- Foot Anchor
- Expression Center
- Head Center
- Dialogue Tail Anchor

This version becomes the authoritative spatial foundation for all future
Namora interface development.