# ==============================================================================
# NameAI Documentation
# ==============================================================================
#
# Document:      WORLD_COORDINATE_SYSTEM.md
# Title:         Namora World Coordinate System
# Tier:          Mechanics
# Status:        Draft
# Version:       v1.0.0
# Owner:         NameAI Universe
#
# Purpose:
# Define the canonical world coordinate model used by Namora.
# This document specifies how world objects exist, how coordinates are mapped,
# and how rendering systems maintain spatial consistency across viewport sizes.
#
# Depends On:
# - UNIVERSE_CONSTITUTION.md
# - SYSTEM_ARCHITECTURE.md
#
# Related Documents:
# - NAMING_DISCOVERY_SYSTEM.md
# - SESSION_LIFECYCLE.md
# - NANA_BEHAVIOR_MODEL.md
# - UI_FOUNDATION.md
# - LAYOUT_SYSTEM.md
#
# Last Updated:
# 2026-07-13 (UTC+8)
#
# ==============================================================================

# Namora World Coordinate System

---

# Chapter 1
# Purpose

Namora is not a webpage.

Namora is a world.

The browser merely provides a window through which the user observes that world.

The purpose of this document is to define the spatial mechanics governing that world.

This document establishes:

- how the world exists;
- how objects are positioned;
- how coordinates are interpreted;
- how different rendering technologies must preserve identical spatial behavior.

This document is independent of:

- HTML;
- CSS;
- JavaScript;
- rendering framework;
- AI model.

It defines mechanics rather than implementation.

---

# Chapter 2
# Design Philosophy

Every object inside Namora must exist for a reason.

Every position must be explainable.

Every movement must originate from a defined coordinate relationship.

Nothing may exist because:

"It looks right."

Nothing may be corrected by arbitrary viewport offsets.

Instead:

Every visible position must originate from an explicit spatial relationship.

The world exists independently.

The viewport merely reveals part of it.

---

# Chapter 3
# Core Principles

The World Coordinate System follows eight permanent principles.

Principle 1

Namora is a continuous world.

It is never treated as unrelated HTML elements.

---

Principle 2

Every object belongs to exactly one coordinate space.

Objects may inherit coordinates.

Objects may not own multiple independent coordinate systems.

---

Principle 3

The viewport does not define object locations.

The viewport only determines which part of the world is visible.

---

Principle 4

Responsive layout changes visible regions.

Responsive layout does not redefine the world.

---

Principle 5

Every object has exactly one coordinate owner.

Coordinate ownership must always be explicit.

---

Principle 6

Rendering technology is replaceable.

Spatial mechanics are not.

---

Principle 7

World registration always takes precedence over visual approximation.

If mathematical registration and manual offsets disagree,

the manual offsets are considered incorrect.

---

Principle 8

Background and world objects must share the same world transformation.

Independent transformations are prohibited.

---

# Chapter 4
# Coordinate Philosophy

Traditional web development places objects relative to:

- viewport;
- container;
- parent element.

Namora uses a different philosophy.

Objects are positioned relative to the world itself.

Example:

Incorrect

Viewport

↓

NANA

Correct

World

↓

Rock

↓

Standing Point

↓

NANA

This distinction ensures that changing the viewport never changes the intended relationship between the character and the environment.

---

# Chapter 5
# Coordinate Spaces

The system defines four canonical coordinate spaces.

These coordinate spaces form the foundation of every future mechanic.

They must remain stable throughout the lifetime of the project.

---

## 5.1 Source Space

Source Space represents the original artwork.

Every background asset possesses:

Image Width

Image Height

Every landmark inside the artwork is measured within this coordinate system.

Source Space never changes.

Regardless of:

- browser;
- monitor;
- operating system;
- device.

The original artwork remains authoritative.

---

## 5.2 World Space

World Space represents Namora itself.

It is independent from:

HTML

CSS

Viewport

DOM hierarchy.

World Space is the canonical coordinate system.

Every persistent scene object must ultimately be expressed in World Space.

Examples:

NANA

Fish

Shell

Treasure

Coral

Future NPC

Environmental animations

---

## 5.3 Viewport Space

Viewport Space represents the browser window currently visible to the user.

Viewport Space changes whenever:

- browser width changes;
- browser height changes;
- mobile orientation changes;
- browser zoom affects visible dimensions.

Viewport Space never changes the world.

It only changes how much of the world can currently be seen.

---

## 5.4 Local Space

Local Space belongs to an object.

Examples include:

NANA

Bubble

Pearl

Input Panel

Future animation anchors.

Local Space exists solely to simplify child-object positioning.

It never replaces World Space.

Instead:

World Space

↓

Object

↓

Local Space

↓

Child Object

This hierarchical relationship must always be preserved.

==============================================================================

END OF PART 1 / 8

==============================================================================

---

# Chapter 6
# Visible Region Management

Visible Region Management is the core spatial mechanic of Namora.

It replaces the traditional concept of a responsive page layout.

Namora does not simulate a moving camera.

Namora does not zoom the world because the browser width changes.

Instead:

The browser reveals different portions of the same world.

The world itself remains spatially consistent.

---

## 6.1 Objective

The purpose of Visible Region Management is to ensure:

- the world never appears to move closer or farther simply because the viewport width changes;
- NANA remains attached to the same world position;
- every registered world object preserves its spatial relationship;
- responsive behavior is achieved by changing the visible region rather than redefining object positions.

---

## 6.2 Browser Width

When browser width decreases:

The visible world becomes narrower.

Objects remain fixed within World Space.

The viewport simply reveals less of the left side.

Nothing inside the world should shift in order to compensate.

---

When browser width increases:

The visible world becomes wider.

Additional world content becomes visible on the left.

No object should require breakpoint-specific repositioning.

---

## 6.3 Browser Height

Height changes affect the active world scale according to the current Scale Policy.

The relationship between:

Background

↓

Standing Point

↓

NANA

must remain unchanged.

---

## 6.4 Browser Zoom

Browser zoom changes how the browser renders the viewport.

Browser zoom does not redefine World Space.

The renderer must preserve:

World registration

before

visual scaling.

---

## 6.5 Forbidden Behavior

The following are prohibited:

- moving NANA because viewport width changed;
- manually adjusting Bubble offsets at breakpoints;
- creating separate desktop and mobile CSS positions for the same world object;
- introducing viewport-dependent corrections that are unrelated to world coordinates.

---

# Chapter 7
# World Origin

Every coordinate system requires a stable origin.

The first Namora implementation defines:

World Origin

↓

Bottom Right

This decision matches the composition of the current background artwork.

---

## 7.1 Origin Definition

The rendered world's bottom-right corner is aligned with the viewport's bottom-right corner.

Therefore:

Rendered World Bottom Right

=

Viewport Bottom Right

This alignment remains stable during viewport resizing.

---

## 7.2 World Offset

After scaling, the rendered world may become larger than the viewport.

The renderer calculates:

worldOffsetX

worldOffsetY

These offsets determine:

which portion of the world lies outside the visible region.

Negative offsets indicate clipped regions.

No additional manual correction is permitted.

---

## 7.3 Stable Registration

Every registered world object uses the same world offset.

Examples:

Background

NANA

Fish

Treasure

Future NPC

All objects share one transformation.

Independent transforms are forbidden.

---

# Chapter 8
# World Profile

Different background artworks represent different versions of the same world.

Each artwork requires its own World Profile.

A World Profile describes:

- native image dimensions;
- scale policy;
- coordinate origin;
- landmark locations;
- registered object positions.

---

## 8.1 Profile Identity

Each profile must possess:

Profile ID

Asset Path

Native Width

Native Height

Scale Policy

Origin

Supported Device Type

---

## 8.2 Initial Profiles

The first implementation defines:

namora-desktop

namora-mobile

Additional profiles may be introduced later.

Examples:

Tablet

UltraWide

Accessibility

Seasonal Theme

Special Event

---

## 8.3 Landmark Registry

Every profile may contain reference landmarks.

Examples include:

Main Rock

Large Shell

Coral Formation

Sea Floor Edge

Future Portal

Landmarks simplify object registration and debugging.

---

# Chapter 9
# Scale Policy

Scale Policy determines how the rendered world is derived from the source artwork.

This policy belongs to Mechanics.

Products may not redefine it.

---

## 9.1 Initial Policy

The initial implementation adopts:

Height Locked Scaling.

This means:

The rendered world height matches the viewport height.

The visible region changes primarily in the horizontal direction.

This behavior matches the approved Namora experience.

---

## 9.2 Scale Consistency

Changing browser width alone must not change:

NANA size

Rock size

Bubble scale

Pearl scale

The world appears spatially stable.

Only visibility changes.

---

## 9.3 Future Policies

The architecture may later support:

Width Locked

Fit

Contain

Dynamic Cinematic

Virtual Camera

These policies do not belong to Version 1.

---

# Chapter 10
# Coordinate Mapping

Coordinate Mapping transforms Source Space into Viewport Space.

This mapping is the only authoritative path.

No alternative mapping may exist.

---

## 10.1 Mapping Pipeline

Source Space

↓

World Space

↓

Rendered World

↓

Viewport Space

Every visible position must pass through this pipeline.

---

## 10.2 Registration Rule

Objects never register directly to the viewport.

Instead:

Object

↓

World Coordinate

↓

Renderer

↓

Viewport Position

This rule applies to:

NANA

Fish

Bubble Origin

Pearl Origin

Future Objects

---

## 10.3 Single Mapping Authority

Only one component in the runtime may calculate:

World → Viewport

Other modules must consume the calculated result.

Duplicated mapping logic is prohibited.

---

## 10.4 Future Compatibility

Future rendering technologies:

Canvas

WebGL

Three.js

Native App

must preserve the same mapping behavior.

Rendering implementation may change.

Coordinate mechanics must remain unchanged.

==============================================================================

END OF PART 2 / 8

==============================================================================

---

# Chapter 11
# World Objects

Every visible entity inside Namora is a World Object or derives from one.

Objects are not HTML elements.

Objects are logical entities that exist independently of rendering technology.

Rendering merely visualizes them.

---

## 11.1 Definition

A World Object is any entity that possesses:

- identity;
- coordinate ownership;
- lifecycle;
- rendering representation.

A World Object may or may not be visible.

---

## 11.2 World Object Categories

Version 1 defines three categories.

### Category A

Static World Objects

Examples:

- Background
- Rock
- Coral
- Shell
- Sea Floor

Static objects never change their world position.

---

### Category B

Dynamic World Objects

Examples:

- NANA
- Fish
- Future NPC
- Treasure
- Floating Particles

Dynamic objects may move within World Space.

Movement must always be expressed in World Coordinates.

---

### Category C

Interface-Related Objects

Examples:

- Bubble Anchor
- Input Anchor
- Pearl Anchor

These objects inherit their parent coordinate.

They do not exist independently inside the world.

---

# Chapter 12
# Object Registration

Every World Object must be registered.

Registration establishes:

- identity;
- ownership;
- coordinate source;
- rendering behavior.

Unregistered objects are not permitted.

---

## 12.1 Registration Information

Every object should eventually define:

Object ID

Object Type

Coordinate Space

Parent

Anchor

Visibility

Scale Policy

Interaction Capability

Future Extension

The exact storage format is an implementation detail.

This document only defines the required concepts.

---

## 12.2 Coordinate Ownership

Every object has exactly one coordinate owner.

Examples:

Background

↓

World Profile

Rock

↓

Background

NANA

↓

Standing Point

Bubble

↓

Dialogue Anchor

Pearl

↓

Interaction Anchor

Objects must never possess multiple competing coordinate owners.

---

## 12.3 Parent Relationship

Parent-child relationships form a hierarchy.

Example:

World

↓

Background

↓

Rock

↓

Standing Point

↓

NANA

↓

Dialogue Anchor

↓

Bubble

Movement propagates downward.

Children never redefine the parent's position.

---

# Chapter 13
# Anchor System

Anchors describe meaningful positions.

They are semantic locations rather than arbitrary coordinates.

Anchors make future interaction predictable.

---

## 13.1 World Anchors

Examples:

Standing Point

Treasure Point

Portal Point

NPC Spawn

Camera Focus (Future)

World Anchors belong to the World Profile.

---

## 13.2 Character Anchors

NANA will eventually define:

Foot Anchor

Center Anchor

Dialogue Anchor

Interaction Anchor

Head Anchor

Eye Anchor

Animation Root

These anchors belong to NANA Local Space.

---

## 13.3 Interface Anchors

Bubble

↓

Dialogue Anchor

Input

↓

Interaction Anchor

Pearl

↓

Input Anchor

This relationship must remain stable regardless of viewport size.

---

# Chapter 14
# Standing Point

The Standing Point is the most important coordinate in Version 1.

It represents the exact position where NANA contacts the environment.

Everything else derives from it.

---

## 14.1 Background Standing Point

Each World Profile contains one measured Standing Point.

This point belongs to the artwork.

It is measured once.

It is never estimated.

---

## 14.2 Character Foot Anchor

NANA contains one Foot Anchor.

It is measured from the visible character artwork.

Transparent padding must not influence the anchor location.

---

## 14.3 Registration

The renderer aligns:

Background Standing Point

with

NANA Foot Anchor.

Once registration succeeds,

NANA automatically follows all future world transformations.

No breakpoint offsets are required.

---

# Chapter 15
# Local Coordinate Spaces

Objects may define Local Spaces.

Local Spaces simplify future expansion.

---

## 15.1 NANA Local Space

Future components include:

Bubble

Input

Pearl

Thinking Indicator

Emotion Indicator

Animation Root

Voice Indicator

These objects inherit NANA's transformation.

They never register directly to the viewport.

---

## 15.2 Bubble Local Space

Future Bubble features include:

Text

Typing Animation

Pointer

Highlight

Status Icon

These belong to Bubble Local Space.

---

## 15.3 Future Expansion

Future companions may define their own Local Spaces.

The World Coordinate System remains unchanged.

Only Local Space definitions increase.

==============================================================================

END OF PART 3 / 8

==============================================================================

---

# Chapter 16
# Rendering Pipeline

The Rendering Pipeline transforms logical world information into visible pixels.

Rendering does not determine object locations.

Rendering only visualizes the current World State.

---

## 16.1 Rendering Flow

Every frame follows the same sequence.

World Profile

↓

Scale Policy

↓

World Transformation

↓

Coordinate Mapping

↓

Object Registry

↓

Renderer

↓

Viewport

Each stage has one responsibility.

Stages must not bypass one another.

---

## 16.2 Renderer Responsibilities

The Renderer is responsible for:

- reading the active World Profile;
- calculating the current world transformation;
- converting world coordinates into viewport coordinates;
- rendering visible objects;
- updating rendering after viewport changes.

The Renderer must never decide:

- product behavior;
- session state;
- interaction flow;
- object ownership.

---

## 16.3 Renderer Independence

The renderer is replaceable.

Possible implementations include:

- CSS Background
- HTML Image
- Canvas
- WebGL
- Three.js
- Native Rendering

Regardless of implementation,

the rendered result must preserve identical World Coordinates.

---

# Chapter 17
# World Transformation

World Transformation converts World Space into Rendered World Space.

Every World Object must receive the same transformation.

---

## 17.1 Shared Transformation

Background

↓

NANA

↓

Fish

↓

Treasure

↓

Future NPC

↓

Future Effects

All inherit the identical transformation.

Objects may define additional local transforms,

but they must never redefine the World Transform.

---

## 17.2 Transformation Components

The World Transform contains:

Scale

Offset X

Offset Y

Origin

Visible Region

Every rendered object derives its viewport position from these values.

---

## 17.3 Transformation Ownership

Only the Renderer owns the active World Transformation.

No object may calculate its own independent transformation.

---

# Chapter 18
# Resize Strategy

Viewport resizing changes the visible region.

It does not redefine the world.

---

## 18.1 Width Changes

When width decreases:

The visible region becomes narrower.

World Scale remains unchanged under the current Height-Locked Policy.

Only additional content on the left becomes hidden.

---

When width increases:

Additional world content becomes visible.

Object coordinates remain unchanged.

---

## 18.2 Height Changes

Height changes affect the active scale.

After recalculation:

Every object is re-rendered using the new World Transformation.

Registration relationships must remain unchanged.

---

## 18.3 Orientation Changes

Desktop

↓

Tablet

↓

Mobile

Changing orientation activates a different World Profile when necessary.

The rendering rules remain identical.

Only profile parameters change.

---

# Chapter 19
# Browser Zoom

Browser zoom differs from viewport resizing.

The Renderer must distinguish between them whenever possible.

---

## 19.1 Zoom Principle

Zoom affects presentation.

Zoom does not redefine World Space.

The renderer recalculates visible geometry,

not object ownership.

---

## 19.2 Visual Consistency

During browser zoom:

Background

↓

Standing Point

↓

NANA

↓

Bubble Anchor

↓

Input Anchor

must remain spatially aligned.

---

## 19.3 Zoom Recovery

Whenever zoom changes:

The Renderer recalculates:

Scale

Offset

Viewport Mapping

Visible Region

No manual correction is permitted.

---

# Chapter 20
# Background Assets

Background artwork represents the world.

It is not decorative.

---

## 20.1 Canonical Artwork

Each World Profile references exactly one canonical artwork.

This artwork defines:

- native dimensions;
- landmark locations;
- Standing Point;
- environmental composition.

---

## 20.2 Artwork Replacement

Replacing the artwork does not require changing:

World Objects

Coordinate Mapping

Renderer Logic

Only the corresponding World Profile requires updating.

---

## 20.3 Landmark Integrity

Reference landmarks should remain stable across revisions whenever practical.

Examples:

Primary Rock

Large Shell

Coral Cluster

Sea Floor Edge

Maintaining landmarks reduces migration cost.

---

# Chapter 21
# World Profile Switching

Different environments may require different World Profiles.

Examples include:

Desktop

Mobile

Accessibility

Seasonal Theme

Future Story Chapters

---

## 21.1 Switching Rules

Changing World Profiles may change:

Background Asset

Standing Point

Reference Landmarks

Character Scale Ratio

Safe Regions

The following must remain unchanged:

Coordinate Philosophy

Coordinate Spaces

Object Registration

Mapping Pipeline

---

## 21.2 Runtime Behavior

Profile switching should occur only through the Runtime.

Individual components must never switch profiles independently.

==============================================================================

END OF PART 4 / 8

==============================================================================

---

# Chapter 22
# World Object Registry

The World Object Registry is the authoritative catalogue of every object that exists within Namora.

It defines:

- object identity;
- coordinate ownership;
- rendering participation;
- interaction capability.

The registry is independent of rendering technology.

It describes logical world objects rather than HTML elements.

---

## 22.1 Purpose

The registry provides one authoritative location for describing every world object.

Every object should be discoverable through the registry.

Objects must never be created implicitly inside unrelated modules.

---

## 22.2 Registry Principle

Every object shall have:

One Identity

One Coordinate Owner

One Parent

One Lifecycle

One Rendering Entry

One Interaction Definition

No object may possess multiple conflicting registrations.

---

## 22.3 Registry Categories

Version 1 defines the following categories.

Environment

Character

Companion

Interaction

Animation

Effect

Landmark

Future categories may be introduced without changing the registry architecture.

---

## 22.4 Environment Objects

Examples:

Background

Sea Floor

Rock

Coral

Shell

Plants

These objects define the static world.

---

## 22.5 Character Objects

Examples:

NANA

Future Companion

NPC

Creatures

These objects participate in interaction.

Characters possess Local Coordinate Spaces.

---

## 22.6 Interaction Objects

Examples:

Bubble

Input

Pearl

Voice Indicator

Status Indicator

Interaction Objects normally inherit coordinates from Character Objects.

---

# Chapter 23
# Coordinate Ownership

Coordinate ownership defines which object is responsible for another object's spatial position.

Ownership is inherited.

Ownership is never duplicated.

---

## 23.1 Ownership Hierarchy

World Profile

↓

Background

↓

Standing Point

↓

NANA

↓

Dialogue Anchor

↓

Bubble

↓

Bubble Contents

Each child inherits the transformation of its parent.

---

## 23.2 Ownership Rules

A child object:

may inherit

may extend

may offset locally

must never redefine its parent.

---

## 23.3 Invalid Ownership

Examples of invalid ownership include:

Bubble

↓

Viewport

NANA

↓

Grid

Pearl

↓

Breakpoint CSS

These patterns violate the World Coordinate System.

---

# Chapter 24
# Anchor System

Anchors define meaningful attachment locations.

An anchor is not merely an X/Y coordinate.

It represents a semantic location.

---

## 24.1 World Anchors

Examples:

Standing Point

Portal

Treasure

Spawn

Landmark

World Anchors belong to World Profiles.

---

## 24.2 Character Anchors

NANA defines:

Foot Anchor

Dialogue Anchor

Interaction Anchor

Center Anchor

Animation Root

Head Anchor

Future companions should expose similar anchors.

---

## 24.3 Interface Anchors

Bubble

↓

Dialogue Anchor

Input

↓

Interaction Anchor

Pearl

↓

Input Anchor

The interface follows the character.

The character follows the world.

The world follows no interface.

---

# Chapter 25
# Parent–Child Relationship

Objects form a hierarchy.

Hierarchy defines:

Transformation

Visibility

Lifecycle

Interaction

---

## 25.1 Example

World

↓

Background

↓

Rock

↓

Standing Point

↓

NANA

↓

Bubble

↓

Text

Movement propagates downward.

Children never redefine parent movement.

---

## 25.2 Detachment

Temporary detachment is allowed only when explicitly defined.

Examples:

Floating animation

Celebration effect

Particle emission

Temporary detachment must not change permanent ownership.

---

# Chapter 26
# Character Registration

Characters are registered to the world.

Not to the browser.

Not to CSS layout.

Not to containers.

---

## 26.1 Standing Registration

Registration aligns:

Background Standing Point

with

Character Foot Anchor.

After alignment,

the renderer computes the final viewport position.

No viewport correction should be necessary.

---

## 26.2 Character Scale

Character Scale belongs to World Space.

It should derive from:

World Profile

rather than viewport width.

Future profiles may define different scale ratios.

---

## 26.3 Character Rotation

Version 1 assumes:

Rotation = 0°

Future mechanics may introduce:

Look Direction

Swimming

Turning

Idle Motion

Rotation must remain relative to World Space.

==============================================================================

END OF PART 5 / 8

==============================================================================

---

# Chapter 27
# Rendering Independence

The World Coordinate System must remain independent from any rendering implementation.

Rendering technology may evolve.

World mechanics must remain stable.

The Renderer visualizes the world.

It does not define the world.

---

## 27.1 Rendering Principle

Rendering converts:

World State

↓

Visible Scene

No renderer may redefine:

Coordinate ownership

Anchor hierarchy

World Profile

Scale Policy

Coordinate Mapping

These belong to Mechanics.

---

## 27.2 Supported Renderers

The architecture must support:

CSS Background

HTML Image

Canvas

WebGL

Three.js

Native Rendering

Future technologies

Every renderer must produce identical spatial relationships.

---

## 27.3 Renderer Responsibilities

Every renderer is responsible for:

Loading the active World Profile

Calculating the active World Transform

Rendering visible objects

Updating after viewport changes

Maintaining registration accuracy

Nothing more.

---

# Chapter 28
# Runtime Integration

The Runtime is responsible for coordinating the World Coordinate System.

Mechanics define the rules.

Runtime applies the rules.

---

## 28.1 Runtime Responsibilities

The Runtime shall:

Load the active World Profile

Select the active Scale Policy

Calculate the current World Transform

Update registered objects

Notify the Renderer

The Runtime never manually positions individual objects.

---

## 28.2 Update Pipeline

Every viewport update follows the same sequence.

Viewport Change

↓

Determine Active World Profile

↓

Calculate Scale

↓

Calculate World Offset

↓

Update World Transform

↓

Update Registered Objects

↓

Render Frame

The sequence must remain deterministic.

---

## 28.3 Runtime Events

Typical events include:

Window Resize

Orientation Change

Profile Switch

Asset Change

Browser Zoom

Future Camera Effect

Every event must pass through the Runtime.

---

# Chapter 29
# Measurement Procedure

Accurate registration depends on measured data.

Estimated values are not authoritative.

---

## 29.1 Background Measurement

For every World Profile, record:

Native Width

Native Height

Standing Point

Reference Landmarks

Visible Safe Region

These measurements must originate from the source artwork.

---

## 29.2 Character Measurement

For every Character:

Record:

Visible Bounds

Foot Anchor

Dialogue Anchor

Interaction Anchor

Center Anchor

Future Animation Root

Transparent padding must never influence anchor positions.

---

## 29.3 Coordinate Storage

Measurements should be stored in:

Source Pixels

and

Normalized Coordinates

This allows future asset replacements while preserving mechanics.

---

# Chapter 30
# Debug Mode

The first implementation shall include a temporary Debug Mode.

Debug Mode exists solely to verify registration.

It must not become part of the production experience.

---

## 30.1 Debug Information

Recommended information includes:

Current World Profile

World Scale

World Offset

Visible Region

Viewport Size

Rendered World Size

Current Standing Point

Current Foot Anchor

Registration Error

---

## 30.2 Debug Markers

Recommended visual markers:

Red Marker

Background Standing Point

Green Marker

NANA Foot Anchor

Blue Marker

Dialogue Anchor

Yellow Marker

Interaction Anchor

Markers should remain aligned during viewport changes.

---

## 30.3 Debug Removal

Debug functionality must be removable without altering:

Coordinate calculations

World Profiles

Registration values

Production mechanics

---

# Chapter 31
# Validation Strategy

Every implementation must be validated before additional UI elements are restored.

Validation always precedes expansion.

---

## 31.1 Required Viewports

Minimum validation:

1920 × 1080

1600 × 900

1440 × 900

1366 × 768

1024 × 768

768 × 1024

430 × 932

390 × 844

375 × 812

320 × 568

Additional profiles may be added later.

---

## 31.2 Required Tests

Resize Width

Resize Height

Orientation Switch

Browser Zoom

Profile Switching

Asset Replacement

Every test must preserve:

Standing Registration

Coordinate Ownership

World Alignment

---

## 31.3 Acceptance Criteria

Registration succeeds only when:

Standing Point

↓

NANA Foot Anchor

remain visually aligned throughout all supported viewport changes.

Small rendering differences are acceptable.

Broken coordinate ownership is not.

==============================================================================

END OF PART 6 / 8

==============================================================================

---

# Chapter 32
# Future Expansion

The World Coordinate System is designed for long-term evolution.

New features should extend the existing mechanics.

They must not redefine the underlying coordinate philosophy.

---

## 32.1 Expansion Principle

Future systems shall reuse:

- World Space
- Coordinate Ownership
- Anchor System
- World Profiles
- Registration Rules
- Mapping Pipeline

No expansion should introduce an alternative coordinate system.

---

## 32.2 Planned Expansion

Future mechanics may include:

Dynamic Lighting

Particle Systems

Ocean Current

Environmental Animation

Weather

Time of Day

Interactive Props

NPC Navigation

Companion System

Story Events

These systems should register through the World Coordinate System.

---

## 32.3 Object Growth

The number of World Objects may grow significantly.

The architecture must support:

Hundreds

or

Thousands

of registered objects.

Object quantity must never require changing coordinate ownership rules.

---

# Chapter 33
# Performance Principles

Spatial correctness takes priority over optimization.

Optimization must never change coordinate results.

---

## 33.1 Single Calculation Principle

Each frame should calculate:

World Scale

World Offset

Coordinate Mapping

only once.

The calculated result is shared by every World Object.

Repeated calculations across components are prohibited.

---

## 33.2 Registration Cache

Stable values may be cached.

Examples:

Standing Point

Foot Anchor

Dialogue Anchor

Interaction Anchor

Reference Landmarks

Cached values remain authoritative until their source asset changes.

---

## 33.3 Rendering Efficiency

Invisible objects should not consume rendering resources.

Visibility determination belongs to the Renderer.

Coordinate ownership remains valid regardless of visibility.

---

# Chapter 34
# Error Handling

Spatial failures must be detectable.

Silent failures are unacceptable.

---

## 34.1 Missing World Profile

If the active World Profile cannot be loaded:

The Runtime must prevent scene initialization.

A default fallback profile may be used only if explicitly defined.

---

## 34.2 Invalid Registration

If:

Standing Point

or

Foot Anchor

cannot be resolved,

the Character must not enter production rendering.

Instead:

Debug Mode should report the registration failure.

---

## 34.3 Invalid Ownership

Every World Object must possess exactly one coordinate owner.

If ownership becomes ambiguous:

Rendering should stop.

The Runtime should report an ownership conflict.

---

## 34.4 Mapping Failure

If coordinate mapping cannot be completed:

No object should receive guessed viewport coordinates.

The Renderer must preserve deterministic behavior.

---

# Chapter 35
# Responsibility Boundary

The World Coordinate System defines mechanics only.

Responsibilities are divided between documentation layers.

---

## 35.1 Mechanics

Owns:

Coordinate Spaces

World Profiles

Registration

Anchor System

Coordinate Mapping

World Transformation

Renderer Requirements

---

## 35.2 Product

Owns:

Desired User Experience

Scene Composition

Interaction Flow

Visibility Rules

Animation Intent

Narrative Presentation

---

## 35.3 Engineering

Owns:

DOM Structure

CSS

JavaScript

Renderer Implementation

Performance

Compatibility

Tooling

---

## 35.4 Runtime

Owns:

Profile Loading

Viewport Monitoring

Transformation Calculation

Renderer Scheduling

Lifecycle Coordination

Mechanics define the rules.

Runtime executes them.

Engineering implements them.

---

# Chapter 36
# Compatibility Rules

Every implementation must preserve behavioral compatibility.

Implementation details may evolve.

Mechanics must remain stable.

---

## 36.1 Backward Compatibility

Existing World Profiles should continue functioning after renderer upgrades.

Only measured values should require migration.

---

## 36.2 Asset Compatibility

Replacing background artwork should require:

A new World Profile

A new Standing Point measurement

No other mechanic should change.

---

## 36.3 Renderer Compatibility

Changing renderer technology must not change:

Coordinate ownership

Anchor relationships

Visible Region behavior

Registration logic

World philosophy

---

# Chapter 37
# Architecture Relationship

The World Coordinate System occupies the Mechanics layer.

Its position within the NameAI architecture is:

Universe

↓

Standards

↓

Companions

↓

Worlds

↓

Mechanics

↓

Product

↓

Engineering

Mechanics provide deterministic rules.

Higher layers define purpose.

Lower layers implement behavior.

No lower layer may redefine Mechanics.

==============================================================================

END OF PART 7 / 8

==============================================================================

---

# Chapter 38
# Definition of Done

The World Coordinate System is considered complete only when every requirement below has been verified.

Completion is determined by behavior rather than implementation.

---

## 38.1 Coordinate Verification

The following must be confirmed:

✓ Source Space is correctly measured.

✓ World Profiles are complete.

✓ Standing Points are measured.

✓ Character Foot Anchors are measured.

✓ Coordinate Mapping is deterministic.

✓ World Transformation is unique.

✓ Registration remains stable.

---

## 38.2 Rendering Verification

The Renderer must demonstrate:

✓ Correct World Profile loading.

✓ Correct Scale Policy execution.

✓ Correct World Offset calculation.

✓ Correct Visible Region behavior.

✓ Correct object registration.

✓ Correct resize behavior.

✓ Correct browser zoom behavior.

---

## 38.3 Registration Verification

For every supported viewport:

Background Standing Point

↓

Character Foot Anchor

↓

Dialogue Anchor

↓

Interaction Anchor

must preserve their intended spatial relationship.

Registration must remain stable without:

- breakpoint corrections;
- viewport-dependent offsets;
- duplicated coordinate calculations.

---

## 38.4 Interface Verification

After World registration has been verified:

Bubble

Input

Pearl

may be restored.

Every interface element must inherit from an existing Anchor.

No interface element may independently attach to the viewport unless explicitly defined as a Viewport Interface Object.

---

## 38.5 Profile Verification

Each World Profile must contain:

✓ Native asset dimensions

✓ Origin definition

✓ Scale Policy

✓ Standing Point

✓ Reference landmarks

✓ Character scale definition

✓ Safe regions

✓ Compatibility information

Profiles must be independently testable.

---

# Chapter 39
# Permanent Rules

The following rules are permanent.

They must not be violated by future implementations.

---

## Rule 1

Namora is a world.

It is never a collection of independently positioned webpage elements.

---

## Rule 2

The viewport reveals the world.

The viewport does not define the world.

---

## Rule 3

Every World Object has exactly one coordinate owner.

Ownership ambiguity is prohibited.

---

## Rule 4

Every visible object ultimately derives its position from World Space.

---

## Rule 5

The World Transformation is calculated exactly once.

All World Objects share the same transformation.

---

## Rule 6

Background and World Objects must always remain registered.

Registration must never rely on manual breakpoint offsets.

---

## Rule 7

Rendering technology may change.

Coordinate mechanics must remain unchanged.

---

## Rule 8

A renderer visualizes the world.

It does not redefine the world.

---

## Rule 9

World Profiles own environmental measurements.

Objects never own environment measurements.

---

## Rule 10

Anchors define semantic relationships.

Coordinates alone are not sufficient.

---

## Rule 11

The Runtime coordinates execution.

Mechanics define spatial rules.

Engineering implements rendering.

Product defines experience.

Each layer has one responsibility.

---

## Rule 12

New features must extend the World Coordinate System.

They must never replace it.

---

# Chapter 40
# Version History

## Version 1.0.0

Initial canonical draft.

Established:

- Coordinate Philosophy
- Coordinate Spaces
- Visible Region Management
- World Origin
- World Profiles
- Scale Policy
- Coordinate Mapping
- World Objects
- Object Registry
- Anchor System
- Rendering Pipeline
- Runtime Integration
- Measurement Procedure
- Validation Strategy
- Responsibility Boundaries
- Permanent Rules

This version becomes the authoritative spatial specification for the Namora world.

Future revisions shall extend this document while preserving backward compatibility whenever possible.

---

# Related Future Documents

The following specifications are expected to build upon this document:

- RUNTIME.md
- RENDERER_SPECIFICATION.md
- WORLD_PROFILE_SPECIFICATION.md
- OBJECT_REGISTRY.md
- ANCHOR_SYSTEM.md
- SCENE_GRAPH.md
- DEBUG_RENDERING.md

These documents inherit the mechanics defined here.

They must not redefine coordinate philosophy.

---

# Canonical Authority

This document is the highest authority for all spatial mechanics within the Namora world.

In the event of conflict:

1. This document overrides Engineering documents.
2. Product documents may define desired behavior but may not redefine mechanics.
3. Renderer implementations must conform to this specification.
4. Runtime implementations must coordinate according to this specification.

No implementation detail may supersede the mechanics defined herein.

---

# Closing Statement

The purpose of the World Coordinate System is not merely to place visual elements.

Its purpose is to establish a stable and deterministic spatial model that allows Namora to evolve from a single interactive page into a persistent digital world.

By separating world mechanics from rendering technology, and by assigning every object a single coordinate owner, this specification ensures that future companions, interactions, environments, and stories can grow upon one consistent spatial foundation.

This document defines the physics of Namora's world.

All future scene systems shall build upon it.

==============================================================================

END OF DOCUMENT

==============================================================================