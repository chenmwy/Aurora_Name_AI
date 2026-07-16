# ==============================================================================
# NameAI Documentation
# ==============================================================================
#
# Document:      LAYOUT_SYSTEM.md
# Title:         Layout System
# Tier:          Engineering
# Status:        Draft
# Version:       v1.0.0
# Owner:         NameAI Engineering
#
# Purpose:
# 定义 NameAI 全站统一布局系统。
# 所有页面必须遵循本规范。
#
# Depends On:
# - UI_FOUNDATION.md
#
# Related Documents:
# - UI_COMPONENT_STANDARD.md
# - RESPONSIVE_GUIDE.md
#
# Last Updated:
# 2026-07-13 (UTC+8)
#
# ==============================================================================

# Layout System

---

# 一、目标

建立一套：

统一

可维护

可扩展

响应式

长期稳定

的布局系统。

任何页面不得自行创造布局规则。

---

# 二、布局层级

整个页面采用：

Viewport

↓

Page

↓

Section

↓

Container

↓

Anchor

↓

Component

↓

Element

所有页面保持一致。

---

# 三、Viewport

Viewport 是整个页面唯一坐标原点。

禁止：

相对于背景定位。

禁止：

相对于图片定位。

所有定位：

最终均来源于 Viewport。

---

# 四、Page

Page 负责：

整个页面。

例如：

Home

Podcast

Business

Chinese

About

Pricing

以后：

每一个页面：

都是一个独立 Page。

---

# 五、Section

页面划分为多个 Section。

例如：

Hero

Generator

Examples

Coming Soon

Footer

Section 之间：

保持统一间距。

不得自由调整。

---

# 六、Container

Container 决定：

内容宽度。

内容居中。

左右留白。

Container 不负责：

元素排列。

Container 仅负责：

边界。

---

# 七、Anchor

Anchor 是整个布局系统核心。

任何组件：

必须拥有 Anchor。

例如：

NANA Anchor

Bubble Anchor

Chat Anchor

Vote Anchor

以后：

组件移动。

只修改 Anchor。

禁止：

修改组件自身位置。

---

# 八、Component

Component 属于：

Button

Card

Chat

Input

Bubble

Vote

Notify

Generator

以后：

全部独立维护。

---

# 九、Element

Element：

属于 Component。

例如：

Button Icon

Button Text

Input Placeholder

Vote Count

这些：

不能直接参与页面布局。

---

# 十、Spacing

统一采用：

Spacing Scale。

例如：

XS

S

M

L

XL

2XL

禁止：

页面大量：

17px

23px

41px

等随机距离。

---

# 十一、Grid

采用统一 Grid。

建议：

12 Column。

未来：

所有页面：

保持一致。

---

# 十二、Safe Area

统一定义：

Top

Bottom

Left

Right

Character

Chat

Bubble

任何组件：

禁止超出 Safe Area。

---

# 十三、Z Layer

统一：

Layer Index。

Background

Character

Speech

Interaction

Navigation

不得：

自行：

z-index:99999;

---

# 十四、Overflow

默认：

页面禁止横向滚动。

背景允许裁剪。

组件禁止超出 Container。

---

# 十五、Absolute Position

允许：

仅限：

Anchor 内部。

禁止：

整个页面：

大量 absolute。

---

# 十六、Flex

优先：

Flex。

其次：

Grid。

最后：

Absolute。

---

# 十七、尺寸规范

统一：

Width

Height

Min Width

Max Width

Aspect Ratio

避免：

图片撑开布局。

---

# 十八、缩放策略

浏览器缩放时：

优先：

Container。

其次：

Scale。

最后：

字体。

禁止：

组件漂移。

---

# 十九、开发原则

新增组件前：

必须回答：

属于哪个 Section？

属于哪个 Container？

属于哪个 Anchor？

属于哪个 Layer？

如果回答不了：

说明设计不完整。

---

# 二十、Definition of Done

Layout System 完成标准：

☐ 全站采用统一布局层级

☐ Anchor 全部建立

☐ Container 全部统一

☐ Grid 建立

☐ Safe Area 建立

☐ Layer 建立

☐ 响应式兼容

☐ CSS 不存在 Magic Number 定位

==============================================================================

END OF DOCUMENT

==============================================================================