# ==============================================================================
# NameAI Documentation
# ==============================================================================
#
# Document:      PHASE_1_UI_FOUNDATION.md
# Title:         Phase 1 - UI Foundation（界面基础重构）
# Tier:          Engineering
# Status:        Draft
# Version:       v1.0.0
# Owner:         NameAI
#
# Purpose:
# 建立 NameAI 全站统一的 UI 架构。
# 解决页面缩放、元素漂移、布局混乱等问题。
# 为未来 Tree Finder、NANA、Coming Soon 等功能提供稳定基础。
#
# Depends On:
# - UNIVERSE_CONSTITUTION.md
# - DESIGN_PRINCIPLES.md
#
# Related Documents:
# - CURRENT_STATE.md
# - ROADMAP.md
#
# Last Updated:
# 2026-07-13 (UTC+8)
#
# ==============================================================================

# Phase 1
# UI Foundation

---

# 一、目标（Mission）

NameAI 第一阶段的目标不是增加功能。

而是：

> 建立一套稳定、统一、长期可维护的 UI 基础架构。

以后所有功能：

- Tree Finder
- NANA
- Chat
- Coming Soon
- Vote
- Notify Me

全部建立在这一基础之上。

换句话说：

UI Foundation 是整个产品未来数年的地基。

---

# 二、总体设计原则

遵循以下原则：

## Principle 1

任何元素都必须属于某一个 Layer。

禁止：

自由摆放。

禁止：

依赖 Magic Number 定位。

例如：

left:421px;

top:389px;

这类写法全部禁止。

所有元素必须具有明确坐标来源。

---

## Principle 2

所有布局以 Viewport 为参考。

而不是：

浏览器尺寸。

也不是：

图片尺寸。

整个页面始终围绕：

Viewport

进行布局。

---

## Principle 3

背景永远属于 Background Layer。

背景不能参与布局。

背景不能决定其它元素位置。

背景仅负责：

营造氛围。

---

## Principle 4

NANA 是 Character。

不是图片。

未来：

她拥有：

身份。

位置。

动画。

行为。

交互。

因此：

她不能依赖背景。

也不能依赖聊天框。

---

## Principle 5

所有交互属于独立 Layer。

聊天框。

按钮。

输入框。

Bubble。

Coming Soon。

Vote。

全部独立。

互不影响。

---

# 三、页面 Layer 架构

整个页面采用五层结构。

──────────────────────────────

Layer 5

Navigation Layer

负责：

导航。

菜单。

顶部按钮。

语言切换。

未来：

用户中心。

──────────────────────────────

Layer 4

Interaction Layer

负责：

Chat

Input

Send

Vote

Notify

Coming Soon

所有点击行为。

──────────────────────────────

Layer 3

Speech Layer

负责：

Bubble

提示

引导

状态提示

未来：

Tree Finder 对话。

──────────────────────────────

Layer 2

Character Layer

只有一个元素：

NANA。

NANA 永远位于：

Character Layer。

不允许其它图片进入。

未来：

所有动画。

动作。

眨眼。

挥手。

全部属于这一层。

──────────────────────────────

Layer 1

Background Layer

背景图。

光影。

渐变。

装饰。

永远不能参与交互。

---

# 四、页面坐标系统

采用统一坐标。

Viewport

↓

Container

↓

Anchor

↓

Element

例如：

Viewport

↓

Hero

↓

NANA Anchor

↓

NANA

Bubble

↓

Bubble Anchor

↓

Bubble

以后：

任何元素都不能直接：

position:absolute

然后写：

left:...

top:...

必须：

相对于 Anchor。

---

# 五、NANA 定位系统

NANA 是整个页面唯一 Character。

因此：

定义：

Character Anchor。

包括：

X

Y

Scale

Safe Area

Interaction Area

Animation Area

以后：

浏览器缩放。

窗口缩放。

不同显示器。

NANA 都必须保持稳定。

---

# 六、Bubble 定位

Bubble 永远属于：

Speech Layer。

Bubble 永远依附：

NANA。

不是：

浏览器。

不是：

窗口。

Bubble 与 NANA 形成：

固定关系。

未来：

NANA 走。

Bubble 跟随。

---

# 七、Chat 定位

Chat 永远属于：

Interaction Layer。

Chat 不依赖：

Bubble。

也不依赖：

背景。

Chat 必须：

始终位于页面底部安全区域。

保证：

输入体验稳定。

---

# 八、背景系统

背景负责：

情绪。

氛围。

品牌。

背景不得：

控制布局。

背景不得：

影响响应式。

背景采用：

cover

保持主体。

未来：

允许：

昼夜主题。

节日主题。

品牌主题。

全部仅替换：

Background Layer。

---

# 九、响应式规范

支持：

Desktop

Laptop

Tablet

Mobile

推荐断点：

1920+

1600

1440

1366

1024

768

480

320

每个断点：

仅调整：

Container

Spacing

Scale

禁止：

重新写整套页面。

---

# 十、安全区域（Safe Area）

页面定义：

Top Safe Area

Bottom Safe Area

Character Safe Area

Chat Safe Area

任何元素：

禁止越界。

---

# 十一、动画原则

动画必须服务于：

理解。

不能：

炫技。

动画分为：

Idle

Hover

Typing

Thinking

Success

Waiting

Coming Soon

所有动画：

未来统一管理。

---

# 十二、视觉层级

统一：

Background

↓

Character

↓

Speech

↓

Interaction

↓

Navigation

禁止：

随意修改：

z-index。

未来：

统一维护：

Layer Index。

---

# 十三、开发规范

修改页面前：

必须确认：

属于哪个 Layer。

新增元素：

必须指定：

Anchor。

不得：

直接：

position:absolute

不得：

大量：

left/top 微调。

所有定位：

必须：

可解释。

可维护。

可扩展。

---

# 十四、Phase 1 完成标准（Definition of Done）

完成以下内容：

☐ 页面缩放稳定

☐ NANA 永远固定

☐ Bubble 固定

☐ Chat 固定

☐ Send 固定

☐ 背景稳定

☐ Layer 全部分离

☐ 响应式完成

☐ CSS 完成模块化

☐ 所有布局统一采用 Anchor

当以上全部完成时：

UI Foundation 正式完成。

后续：

Tree Finder

NANA Personality

Coming Soon

均建立于此基础。

==============================================================================
END OF DOCUMENT
==============================================================================