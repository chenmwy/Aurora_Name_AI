# ==============================================================================
# NameAI Documentation
# ==============================================================================
#
# Document:      UI_COMPONENT_STANDARD.md
# Title:         UI Component Standard
# Tier:          Engineering
# Status:        Draft
# Version:       v1.0.0
# Owner:         NameAI Engineering
#
# Purpose:
# 定义 NameAI 全站 UI 组件标准。
# 所有界面元素必须来源于统一组件系统。
#
# Depends On:
# - UI_FOUNDATION.md
# - LAYOUT_SYSTEM.md
#
# Related Documents:
# - RESPONSIVE_GUIDE.md
# - DESIGN_TOKEN.md
#
# Last Updated:
# 2026-07-13 (UTC+8)
#
# ==============================================================================

# UI Component Standard

---

# 一、目标

建立 NameAI 全站统一组件系统。

所有按钮、

聊天框、

输入框、

气泡、

卡片、

投票、

提示框、

未来全部来自同一个组件库。

禁止：

页面自行创建新的 UI 样式。

---

# 二、组件等级

整个系统分为：

Primitive

↓

Basic

↓

Business

↓

Page

四个层级。

---

# 三、Primitive Components

最基础组件。

包括：

Button

Text

Icon

Avatar

Image

Divider

Badge

这些组件：

不具有业务含义。

仅负责：

显示。

---

# 四、Basic Components

基础功能组件。

例如：

Input

Textarea

Card

Dialog

Toast

Tooltip

Progress

Loading

以后：

页面优先组合这些组件。

---

# 五、Business Components

业务组件。

例如：

Chat Panel

Prompt Box

Generator Card

Example Card

Vote Card

Notify Card

Coming Soon Card

Podcast Result Card

Business Result Card

这些组件：

具有明确业务意义。

---

# 六、Page Components

页面级组件。

例如：

Hero

Generator

Example Section

Coming Soon Section

Footer

Navigation

页面：

由多个 Business Component 组成。

---

# 七、Button Standard

所有按钮：

统一规范。

包括：

Primary

Secondary

Ghost

Danger

Disabled

Loading

任何页面：

不得重新设计按钮。

---

# 八、Input Standard

输入框统一：

高度

圆角

字体

Placeholder

Padding

Focus

Hover

Error

Success

统一体验。

---

# 九、Chat Component

Chat 是：

Interaction Layer。

包括：

Input

Send

Typing

History

Future Voice

Future Image

Chat 不负责：

业务逻辑。

仅负责：

交互。

---

# 十、Bubble Component

Bubble 属于：

Speech Layer。

Bubble：

依附：

NANA。

Bubble：

永远不能单独存在。

未来支持：

Greeting

Thinking

Explanation

Suggestion

Warning

Success

Coming Soon

---

# 十一、NANA Component

NANA 是：

Character。

不是：

Image。

未来：

拥有：

Animation

Mood

State

Gesture

Expression

所有行为：

统一管理。

---

# 十二、Generator Component

Generator：

负责：

Prompt 输入。

生成按钮。

结果区域。

以后：

Podcast

Business

Chinese

Startup

YouTube

全部复用。

---

# 十三、Result Card

统一：

名字

评分

Meaning

Inspiration

Tag

Action

未来：

任何生成结果：

全部采用统一 Card。

---

# 十四、Vote Component

统一：

Vote Button

Vote Count

Success

Duplicate

Disabled

所有：

Coming Soon

统一使用。

---

# 十五、Notify Component

统一：

Email Input

Subscribe Button

Success Message

Already Joined

Loading

以后：

所有等待上线功能：

统一体验。

---

# 十六、Coming Soon Component

包括：

Title

Description

Vote

Notify

Status

Future ETA（可选）

由 NANA 提供解释。

---

# 十七、Navigation Component

统一：

Logo

Language

Theme

Future User

Future Settings

保持全站一致。

---

# 十八、Feedback Component

统一：

Loading

Success

Error

Warning

Empty

Offline

以后：

所有状态：

统一视觉。

---

# 十九、Component 生命周期

每个组件必须具有：

Idle

Hover

Focus

Active

Loading

Disabled

Success

Error

任何组件：

不得缺少状态。

---

# 二十、组件命名规范

统一采用：

PascalCase。

例如：

PrimaryButton

VoteCard

NotifyCard

GeneratorPanel

PodcastResultCard

禁止：

button1

button2

newButton

---

# 二十一、组件职责原则

每个组件：

只做一件事情。

例如：

Button：

只负责点击。

Chat：

只负责聊天。

Generator：

只负责生成。

禁止：

组件承担多个职责。

---

# 二十二、组件组合原则

页面：

由多个组件组成。

组件：

由多个子组件组成。

禁止：

页面直接操作元素。

---

# 二十三、组件可替换原则

未来：

任何组件：

可以整体替换。

例如：

旧 Button

↓

新 Button

页面无需修改。

---

# 二十四、Definition of Done

完成标准：

☐ Button 全部统一

☐ Input 全部统一

☐ Bubble 全部统一

☐ Chat 全部统一

☐ Generator 全部统一

☐ Result Card 全部统一

☐ Coming Soon 全部统一

☐ Vote 全部统一

☐ Notify 全部统一

☐ Feedback 全部统一

☐ Navigation 全部统一

==============================================================================

END OF DOCUMENT

==============================================================================