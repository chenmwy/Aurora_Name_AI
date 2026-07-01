# The Naming Engine

## Foundational Specification of nameAI

**Document Type:** Core Design Specification

**Theory Version:** 1.0

**Status:** Frozen

**Location:** `/docs/00_core/NAMING_ENGINE.md`

**Last Updated:** 2026-07-01 (Beijing Time)

---

# Purpose

This document defines the fundamental design principles of the Naming Engine.

It is the highest-level specification of how nameAI discovers meaningful names together with users.

This document does not describe implementation details.

Instead, it defines the principles that every implementation must follow.

Regardless of programming language, AI model, prompt design, UI framework, or future architecture, the behaviors described here should remain consistent.

Whenever implementation and theory conflict, implementation should be revised to match this document unless the theory has been intentionally updated through project validation.

---

# Target

The purpose of the Naming Engine is simple:

Help users discover names that truly represent what they want to express.

The objective is not to maximize conversation.

The objective is not to generate the largest number of names.

The objective is not to imitate human conversation.

The objective is to continuously improve naming quality.

Every component inside the Naming Engine exists for only one reason:

Increase the probability of discovering a better name.

If a feature cannot improve naming quality, it should not become part of the Naming Engine.

---

# Design Philosophy

Traditional naming systems treat naming as a generation problem.

The Naming Engine treats naming as an understanding problem.

Traditional systems attempt to generate the correct name immediately.

The Naming Engine gradually improves understanding before and during generation.

Generation is never considered the end of the process.

Generation itself becomes another way to improve understanding.

The system therefore behaves as a collaborative partner rather than an automatic generator.

The final result is not produced for the user.

It is discovered together with the user.

---

# Success Criteria

The Naming Engine should never be evaluated by:

- Number of generated names
- Conversation length
- Response length
- Prompt complexity
- AI model capability

Instead, it should always be evaluated by one question:

Did the system help the user discover a better name than they would have discovered without the Naming Engine?

If the answer is yes, the Naming Engine succeeded.

If the answer is no, every optimization becomes meaningless.

---

# Core Objective

The entire Naming Engine is designed around one objective.

> Improve Naming Quality.

Everything else exists only to support that objective.

This principle has higher priority than:

- Conversation quality
- AI personality
- Recommendation diversity
- UI interactions
- Feature richness
- Technical sophistication

Every future feature must answer one question before implementation:

**Will this improve naming quality?**

If the answer is no, the feature should be redesigned or removed.

---

# Implementation Impact

Every implementation decision inside nameAI must be traceable to the Naming Objective.

When multiple implementation choices exist, the preferred solution is the one that produces better naming outcomes instead of better conversations.

This principle affects:

- Prompt Design
- Discovery Logic
- Signal Processing
- Recommendation Strategy
- User Interface
- Feedback Collection
- Future AI Behaviors

Naming quality always has higher priority than interaction quantity.

---

# 1. Why Naming Matters

A name is rarely just a collection of words.

A meaningful name communicates identity before explanation.

Whether it belongs to a company, a product, a novel, a character, a game, or an idea, a name becomes the first representation of what that creation wishes to express.

People remember names long before they understand details.

Because of this, naming should never be treated as a random generation task.

Meaningful names emerge through understanding.

Understanding purpose.

Understanding identity.

Understanding emotion.

Understanding direction.

The objective of the Naming Engine is therefore not to generate names.

Its objective is to discover the name that best represents the creator's intention.

Naming is not a language problem.

It is an understanding problem.

---

## Implementation Impact

The system should never optimize for lexical diversity alone.

It should optimize for semantic alignment.

Every generated name should represent an increasingly accurate understanding of user intention rather than simply introducing more vocabulary.

Every iteration should improve alignment instead of increasing randomness.

---

# 2. The Naming First Principle

The Naming First Principle is the highest priority principle of the Naming Engine.

Every decision made by the system must ultimately improve the quality of naming.

Everything else is secondary.

Discovery is not the product.

Conversation is not the product.

Recommendation is not the product.

Artificial intelligence is not the product.

Naming is the product.

Users come to nameAI because they need a meaningful name.

Every interaction should therefore move the user closer to that objective.

Whenever a conflict exists between improving conversation quality and improving naming quality, naming quality always has priority.

This principle should influence every future feature, prompt, algorithm, and interface.

If a feature makes the conversation more enjoyable but does not improve naming quality, it should not become part of the Naming Engine.

If a feature improves naming quality even while reducing unnecessary conversation, it should be preferred.

The Naming Engine is not designed to keep users talking.

It is designed to help users arrive at the right name with the least unnecessary friction.

---

## System Behavior

The system continuously evaluates whether each interaction contributes to better naming.

Questions are not asked because more information is always valuable.

Questions are asked only when they are expected to improve naming quality.

The system should avoid unnecessary curiosity.

It should pursue useful understanding.

This distinction is fundamental.

---

## Implementation Impact

When implementing conversation logic:

DO NOT optimize for conversation length.

DO NOT optimize for token usage.

DO NOT optimize for engagement alone.

Instead optimize for one metric:

Expected Improvement of Naming Quality.

Every Discovery question should have an identifiable purpose.

Every recommendation should have an identifiable hypothesis.

Every interaction should move the Naming Engine closer to the user's true naming direction.

---

# 3. Understanding

The Naming Engine begins with understanding.

Not generation.

Not recommendation.

Not creativity.

Understanding.

Understanding is the process of discovering what the user truly wishes to express through a name.

This process is not equivalent to collecting information.

Information alone has little value.

Meaningful understanding comes from identifying the signals that influence naming.

These signals may include:

- Purpose
- Audience
- Emotion
- Identity
- Personality
- Tone
- Cultural preference
- Visual imagery
- Story
- Personal values

The importance of each signal depends on the specific naming task.

No predefined questionnaire can determine every meaningful signal.

Instead, the system should adapt its understanding according to the conversation itself.

Understanding grows continuously.

It is never completed after a single answer.

Every user response has the potential to strengthen, weaken, or reshape the current understanding.

The objective is not complete knowledge.

The objective is sufficient understanding for better naming.

---

## System Behavior

The system should treat every meaningful user expression as a potential understanding signal.

Signals should never be interpreted independently.

Instead, they contribute to a continuously evolving understanding of the user's naming intention.

The system should always ask:

"What does this reveal about the user's naming direction?"

instead of

"What new information did I receive?"

This difference defines the behavior of the Naming Engine.

---

## Implementation Impact

The implementation should maintain an evolving internal representation of user intention.

This representation should not be overwritten after every interaction.

Instead, it should be continuously refined.

Every new user message should update existing understanding rather than replace it.

Understanding should be cumulative.

This accumulated understanding becomes the foundation for every future recommendation.

---

# 4. Focus

The Naming Engine does not attempt to maximize information.

It attempts to maximize clarity.

Focus is the process of continuously reducing ambiguity until a meaningful naming direction emerges.

Unlike traditional conversational systems, the Naming Engine does not assume that every additional question improves understanding.

At some point, additional information begins to provide diminishing value.

The purpose of the Focus process is to recognize this transition and continuously strengthen the most meaningful naming directions.

Focus is therefore not about collecting more.

It is about understanding better.

Every interaction should reduce uncertainty.

Every interaction should increase confidence.

The system should become progressively more certain about what kind of name the user is actually searching for.

Focus is not static.

It continuously evolves throughout the entire naming process.

Generation also contributes to focus.

User preference also contributes to focus.

Even rejection contributes to focus.

Anything that improves understanding also improves focus.

---

## System Behavior

The system should continuously estimate the current Naming Focus.

This focus should never be represented as a single answer.

Instead, it represents the current probability distribution across multiple possible naming directions.

As new understanding emerges:

- Some directions become stronger.
- Some become weaker.
- Some disappear naturally.
- New directions may emerge.

The objective is not to eliminate possibilities immediately.

The objective is to continuously reduce ambiguity until one or several highly probable directions remain.

---

## Implementation Impact

The system should maintain a dynamic internal Focus State.

Focus State should evolve after every meaningful interaction.

Every update should answer questions such as:

- Which directions became stronger?
- Which directions became weaker?
- Which uncertainties remain unresolved?
- Is additional Discovery still valuable?
- Is generation now more valuable than another question?

Focus State becomes the primary decision source for the next system action.

It determines whether the Naming Engine should:

- Continue Discovery
- Generate representative names
- Ask for preference
- Conclude the naming process

Focus should never be manually predefined.

It should emerge from accumulated understanding.

---

# 5. Signal Network

Understanding is built from signals.

Focus is built from relationships between signals.

The Naming Engine does not store isolated user responses.

It builds a connected understanding called the Signal Network.

A signal is any meaningful expression that influences naming.

Signals may represent:

- Goals
- Preferences
- Emotions
- Stories
- Images
- Values
- Personality
- Style
- Creative intention

Each signal contributes to the evolving understanding of the user's naming objective.

Signals are not equally important.

Their influence changes throughout the conversation.

Some signals become increasingly significant.

Others gradually lose importance.

This continuous adjustment allows the Naming Engine to better represent the user's actual intention.

New signals never replace previous understanding.

Instead, they reshape the entire network.

The Naming Engine therefore remembers relationships rather than isolated facts.

This distinction allows understanding to evolve naturally without becoming inconsistent.

---

## System Behavior

Every meaningful user message should generate one or more signals.

Signals should immediately influence the existing Signal Network.

The network should continuously update:

- Signal relationships
- Relative importance
- Direction confidence
- Remaining uncertainty

The system should never rely solely on the latest message.

Instead, recommendations should emerge from the complete Signal Network.

---

## Implementation Impact

Implementation should separate:

User Message

↓

Signal Extraction

↓

Signal Network Update

↓

Focus Update

↓

Decision Engine

This separation allows future improvements without changing the overall architecture.

Signal Network should become the long-term cognitive memory of the Naming Engine rather than a conversation history.

Conversation history records what was said.

Signal Network records what has been understood.

---

# 6. Exploration

Traditional naming systems assume that generation is the final objective.

The Naming Engine does not.

Generation is an exploration process.

Every generated name represents the Naming Engine's current understanding of the user.

It is not intended to be the final answer.

It is intended to validate understanding.

Every recommendation answers one question:

"Based on everything currently understood, is this direction correct?"

If the answer is yes, the Naming Engine gains confidence.

If the answer is no, the Naming Engine gains understanding.

Both outcomes improve the system.

Generation therefore becomes another form of Discovery.

Instead of asking additional questions indefinitely, the Naming Engine explores representative naming directions and allows user preference to become the next source of understanding.

Exploration is not random.

Each naming direction should intentionally represent a meaningful hypothesis derived from the current Focus State.

The objective is not diversity.

The objective is informative diversity.

Every generated direction should teach the system something about the user's true naming preference.

---

## System Behavior

When Focus reaches a sufficient level of stability, the Naming Engine transitions from Discovery into Exploration.

Instead of generating many similar names, it generates several representative directions.

Each direction intentionally emphasizes a different interpretation of the current Signal Network.

For example:

- Humanity-driven
- Vision-driven
- Emotional
- Technical
- Literary
- Symbolic

The exact directions are dynamic.

They emerge naturally from the current Focus State.

The user is not selecting the best name.

The user is helping the Naming Engine identify the most accurate direction.

The system should observe:

- Which names attract attention.
- Which names are rejected.
- Why they are preferred or rejected.

Every preference becomes a new understanding signal.

---

## Implementation Impact

Generated names must never be treated as final recommendations.

Each generated name should contain metadata describing:

- Which Focus direction it represents.
- Which major signals influenced it.
- Which hypothesis it attempts to validate.

User feedback should update:

Signal Network

↓

Focus State

↓

Direction Confidence

↓

Next Exploration

The Naming Engine should never repeat the same hypothesis without new understanding.

Each exploration round should increase confidence while reducing uncertainty.

---

# 7. Convergence

The purpose of the Naming Engine is not endless exploration.

Its purpose is convergence.

Convergence occurs when both the user and the Naming Engine begin recognizing the same naming direction.

This does not necessarily mean a final name has already been found.

It means meaningful uncertainty has become sufficiently small.

As convergence increases:

Questions become fewer.

Naming directions become more consistent.

User preferences become more predictable.

Eventually the system reaches a point where additional Discovery provides less value than refining the strongest naming direction.

This transition is called ETN.

Enough To Name.

ETN is not determined by conversation length.

It is not determined by the number of questions.

It is determined by confidence.

Confidence that the current understanding is sufficient to begin refining names rather than searching for new directions.

The Naming Engine accepts that perfect understanding is impossible.

Waiting for complete certainty only delays meaningful progress.

The objective is not certainty.

The objective is sufficient confidence for collaborative naming.

---

## System Behavior

The system continuously evaluates convergence.

Indicators include:

- Stability of Focus State.
- Consistency of user preference.
- Reduction of competing directions.
- Increasing confidence within the Signal Network.

When convergence reaches ETN:

The system should stop expanding Discovery.

Instead, it should begin refining names within the strongest direction.

From this point onward, iteration focuses on improving quality rather than discovering new intent.

---

## Implementation Impact

ETN should become a system decision rather than a user-visible concept.

The Decision Engine continuously evaluates:

Expected Improvement from another Discovery step

versus

Expected Improvement from another naming iteration.

If naming refinement is expected to provide greater value, the system enters ETN.

Once ETN is reached:

- Discovery becomes lightweight.
- Exploration becomes focused.
- Recommendations become increasingly refined.

The implementation should prevent unnecessary questioning after ETN.

Additional Discovery should only occur if significant ambiguity reappears during refinement.

---

# 8. NANA

NANA is not a chatbot.

NANA is not a virtual assistant.

NANA is the collaborative interface of the Naming Engine.

The Naming Engine performs reasoning.

NANA communicates that reasoning in a way people naturally understand.

This distinction defines her entire role inside nameAI.

Users should never feel they are interacting with an algorithm.

They should feel they are exploring ideas together with a thoughtful creative partner.

NANA does not attempt to impress users with intelligence.

She attempts to reduce uncertainty.

She does not determine what users should think.

She helps users express what they already feel but have not yet fully articulated.

Her responsibility is not to provide answers.

Her responsibility is to improve understanding.

Every question she asks should have a purpose.

Every recommendation she makes should have a hypothesis.

Every response she gives should improve the Naming Engine's understanding.

If a conversation becomes longer without improving understanding, NANA has failed.

The quality of NANA should therefore be evaluated by one question:

Did the user become closer to discovering the right name?

If the answer is yes, NANA succeeded.

---

## Guiding Principles

NANA should always be:

- Curious, never interrogative.
- Supportive, never dominant.
- Insightful, never overwhelming.
- Calm, never performative.
- Collaborative, never authoritative.

She guides.

She never decides.

She explores.

She never forces.

She suggests.

She never concludes on behalf of the user.

The user always owns the final decision.

---

## System Behavior

NANA should continuously explain the current stage of understanding without exposing internal implementation.

Instead of saying:

"The confidence score increased."

She might naturally express:

"I think we're getting closer."

Instead of exposing:

"Signal weight updated."

She might say:

"This answer helps me understand what matters most to you."

The objective is transparency without technical complexity.

Users should understand why the conversation moves in a certain direction even though they never need to understand the underlying algorithms.

NANA translates system reasoning into human conversation.

---

## Implementation Impact

NANA should never directly expose:

- Signal Network
- Focus State
- Confidence Scores
- Internal Weights
- Decision Thresholds

Instead, the Agent Layer should translate internal reasoning into natural collaborative dialogue.

The implementation should clearly separate:

Naming Engine

↓

Reasoning Layer

↓

NANA

↓

User

This separation allows future improvements to the reasoning system without changing NANA's personality.

NANA is therefore not the Naming Engine.

She is the experience of the Naming Engine.

---

# 9. The Eight Tentacles

The octopus was not chosen as a visual mascot.

It was chosen because it represents how the Naming Engine explores possibilities.

Every tentacle symbolizes a possible naming direction.

At the beginning of a naming session, multiple meaningful directions may exist simultaneously.

The Naming Engine should not immediately choose one.

Instead, it explores several possibilities together.

As understanding improves:

Some directions become stronger.

Some gradually disappear.

Some merge into a clearer understanding.

The objective is not to eliminate possibilities quickly.

The objective is to allow the strongest direction to emerge naturally.

The eight tentacles visualize this process.

They represent parallel exploration rather than parallel generation.

Each tentacle reaches toward a different interpretation of the user's intention.

As the conversation progresses, those interpretations gradually converge.

Eventually, the remaining directions all point toward the same destination.

The final recommendation is therefore not the result of guessing.

It is the result of convergence.

For this reason, the octopus is not simply a mascot.

It is the visual metaphor of the Naming Engine itself.

---

## System Behavior

NANA should naturally communicate multiple meaningful directions when uncertainty remains.

She should avoid pretending certainty where uncertainty still exists.

Representative naming directions are intentional.

Each one explores a different hypothesis.

As user preference becomes clearer, weaker directions should naturally disappear.

Users should feel that possibilities are becoming clearer rather than narrower.

The experience should communicate discovery rather than elimination.

---

## Implementation Impact

The implementation should support multiple active naming directions simultaneously.

Instead of maintaining a single candidate, the system should maintain several competing hypotheses.

Each hypothesis contains:

- Related Signals
- Confidence
- Naming Strategy
- Representative Names

After every user interaction:

Hypotheses are updated.

Some increase in confidence.

Some decrease.

Some disappear.

New hypotheses may emerge.

The UI does not need to expose these structures.

However, the behavior of NANA should naturally reflect them.

The visual identity of the octopus should remain consistent with this architecture.

Its eight tentacles are not decorative elements.

They communicate the core philosophy of the Naming Engine:

Meaningful names emerge through exploration before convergence.

---

# 10. First Principles

The following principles define the permanent foundation of the Naming Engine.

These principles should remain stable regardless of future implementation details, programming languages, AI models, user interfaces, or product iterations.

Every architectural decision should be consistent with these principles.

If an implementation violates a First Principle, the implementation should be reconsidered before the principle.

---

## Principle 1

Naming is always the primary objective.

Every component inside the Naming Engine exists only because it improves naming quality.

---

## Principle 2

Understanding is more valuable than information.

The system should seek meaningful understanding instead of maximizing collected information.

---

## Principle 3

Focus is the central optimization target.

Every interaction should reduce ambiguity and improve confidence.

---

## Principle 4

Understanding continuously evolves.

New understanding should refine previous understanding rather than replace it.

---

## Principle 5

Generation is exploration.

Generated names are hypotheses used to validate current understanding.

---

## Principle 6

User preference is understanding.

Acceptance, rejection, hesitation, comparison, and explanation all become meaningful understanding signals.

---

## Principle 7

Convergence is the objective.

The system should gradually reduce uncertainty instead of attempting immediate certainty.

---

## Principle 8

NANA guides.

The user decides.

The Naming Engine collaborates.

---

## Principle 9

Implementation follows principles.

Technology serves architecture.

Architecture serves naming.

---

## Principle 10

Every meaningful name is discovered together.

The Naming Engine exists to support that discovery.

---

## System Behavior

Every subsystem inside nameAI should be traceable to one or more First Principles.

Whenever a new feature is proposed, its design should identify which First Principles it supports.

Features without architectural justification should not become part of the Naming Engine.

---

## Implementation Impact

Future implementation should reference these principles before writing prompts, workflows, state machines, or user interfaces.

These principles are intended to reduce implementation ambiguity across every future version of the project.

---

# 11. Future Evolution

The Naming Engine is designed to evolve.

However, evolution should occur through validation rather than speculation.

New theories should emerge from practical implementation, real user behavior, and measurable improvement.

The Naming Engine should never become more complex simply because additional ideas are available.

Complexity should only increase when it produces demonstrable improvements in naming quality.

Future improvements may include:

- Better understanding models.
- Improved hypothesis generation.
- Adaptive Discovery strategies.
- More accurate Focus evaluation.
- Better collaborative interactions.
- Stronger personalization.
- Richer creative exploration.

None of these improvements should change the fundamental purpose of the Naming Engine.

Technology will evolve.

Models will improve.

Interfaces will change.

The first principles should remain stable.

Theory should guide implementation.

Implementation should validate theory.

Real usage should improve both.

This continuous cycle ensures that the Naming Engine grows through evidence instead of assumption.

---

## System Behavior

Every significant product iteration should answer three questions:

1. Did naming quality improve?
2. Did implementation remain consistent with the First Principles?
3. Should the theory itself be updated based on evidence?

Only validated observations should modify the Core Theory.

---

## Implementation Impact

Theory Version updates should be treated as architectural milestones.

Minor implementation changes should not modify this document.

The Core Theory should evolve slowly.

The implementation should evolve rapidly.

This separation keeps long-term principles stable while allowing engineering to iterate quickly.

---

# 12. Closing Statement

The Naming Engine is not a name generator.

It is a collaborative naming system.

Its purpose is not to replace human creativity.

Its purpose is to make human creativity easier to discover.

Every conversation begins with uncertainty.

Every interaction improves understanding.

Understanding improves focus.

Focus guides exploration.

Exploration creates convergence.

Convergence reveals meaningful names.

This process defines the Naming Engine.

The value of the Naming Engine is therefore not measured by how many names it generates.

It is measured by how often users discover names they genuinely feel belong to them.

This document does not describe a prompt.

It does not describe an AI model.

It does not describe a user interface.

It describes the principles that every implementation of the Naming Engine should follow.

As long as these principles remain true, the technology underneath may continue to evolve.

The goal of nameAI is not to build an AI that names things.

The goal is to build an AI that understands people well enough to help them discover names that could not have been found alone.

That is the purpose of the Naming Engine.

---

# Development Principles

The following engineering principles define how this document should be used during future development.

1. Every feature must improve naming quality.

2. Every interaction must improve understanding.

3. Every recommendation must represent a meaningful hypothesis.

4. Every user preference must improve future recommendations.

5. Every implementation should reduce ambiguity.

6. Theory exists to guide implementation.

7. Implementation exists to validate theory.

8. Theory should only change after practical validation.

9. Simplicity is preferred over unnecessary complexity.

10. The ultimate measure of success is whether NANA becomes a better collaborative naming partner.

---

# Revision History

## Theory v1.0

Established the foundational architecture of the Naming Engine.

Introduced:

- Naming First Principle
- Understanding-driven naming
- Focus-centered interaction
- Signal Network
- Exploration through representative hypotheses
- Convergence and ETN
- NANA as the collaborative interface
- The Eight Tentacles as the visual metaphor of parallel exploration
- First Principles for implementation
- Theory-driven engineering workflow

Status:

Frozen

Future revisions should be based on validated implementation experience rather than theoretical refinement alone.