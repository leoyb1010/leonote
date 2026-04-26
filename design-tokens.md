# Leonote Design Tokens

## 1. 设计关键词
- 静谧：深色、低饱和、低对比噪音
- 智慧：信息层级清晰，动效服务理解
- 呼吸感：留白、缓动、柔和边界、克制发光

---

## 2. 色彩系统

### Neutral 深色阶
- `neutral-950` `#06070a`：全局背景基底
- `neutral-925` `#0a0c11`：大面积背景
- `neutral-900` `#10131a`：主工作区背景
- `neutral-850` `#141923`：悬浮背景
- `neutral-800` `#1a2230`：卡片底色
- `neutral-750` `#222c3d`：交互态底色
- `neutral-700` `#2c374b`：边框 / 分割线
- `neutral-600` `#45516a`：弱强调
- `neutral-500` `#64728c`：次级文本
- `neutral-400` `#90a0bf`：弱文本
- `neutral-300` `#bec8da`：辅助文本
- `neutral-100` `#f4f7fb`：高亮文本

### 品牌渐变
- `brand-indigo` `#6366f1`
- `brand-violet` `#7c3aed`
- `brand-cyan` `#22d3ee`
- 主渐变：`linear-gradient(135deg, #6366f1 0%, #7c3aed 52%, #22d3ee 100%)`
- 柔光渐变：`radial-gradient(circle at top, rgba(99,102,241,.24), rgba(124,58,237,.14) 42%, rgba(34,211,238,.08) 72%, transparent 100%)`

### 语义色
- Success：`#34d399`
- Warning：`#fbbf24`
- Danger：`#fb7185`
- Info：`#38bdf8`

---

## 3. 玻璃态阴影系统

### Glass 1 / Hairline
- background: `rgba(16,19,26,0.58)`
- blur: `14px`
- border: `1px solid rgba(255,255,255,0.08)`
- shadow: `0 10px 30px rgba(0,0,0,0.22)`

### Glass 2 / Panel
- background: `rgba(19,24,33,0.72)`
- blur: `18px`
- border: `1px solid rgba(255,255,255,0.10)`
- inner highlight: `inset 0 1px 0 rgba(255,255,255,0.06)`
- shadow: `0 18px 54px rgba(0,0,0,0.30)`

### Glass 3 / Floating Card
- background: `rgba(23,29,41,0.74)`
- blur: `20px`
- border gradient: `linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.05))`
- shadow: `0 24px 80px rgba(3,7,18,0.42)`

### Glass 4 / Focused Surface
- background: `rgba(20,25,36,0.82)`
- blur: `22px`
- border: 品牌渐变外环 + `rgba(255,255,255,0.08)` 内边
- shadow: `0 0 0 1px rgba(99,102,241,.22), 0 30px 90px rgba(13,18,30,.54)`

### Glass 5 / Hero Glow
- background: `rgba(18,23,34,0.76)`
- blur: `26px`
- border gradient: `linear-gradient(135deg, rgba(99,102,241,.4), rgba(124,58,237,.22), rgba(34,211,238,.18))`
- glow: `0 0 0 1px rgba(255,255,255,.08), 0 24px 100px rgba(68,86,255,.18)`

---

## 4. 排版系统
- 中文优先字体：`"PingFang SC", "SF Pro Display", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- 英文数字辅助：`"SF Pro Text", "Inter Tight", sans-serif`

### 字号层级
- `xs` 12 / 18
- `sm` 14 / 22
- `base` 16 / 26
- `lg` 18 / 28
- `xl` 20 / 30
- `2xl` 24 / 34
- `3xl` 32 / 42
- `4xl` 40 / 48

### 字重
- Regular 400
- Medium 500
- Semibold 600
- Bold 700

### 字距
- Display：`-0.04em`
- Heading：`-0.025em`
- Body：`-0.01em`
- Caption：`0.04em`

---

## 5. 圆角系统
- `radius-6` 6px
- `radius-10` 10px
- `radius-12` 12px
- `radius-16` 16px
- `radius-18` 18px
- `radius-20` 20px
- `radius-24` 24px

---

## 6. 动画时长与 Easing
- Fast: `160ms`
- Base: `240ms`
- Medium: `360ms`
- Slow: `520ms`
- Ambient: `1200ms`

### Spring presets
- Gentle: `{ type: "spring", stiffness: 280, damping: 28, mass: 0.8 }`
- Bouncy: `{ type: "spring", stiffness: 380, damping: 22, mass: 0.8 }`
- Slow Reveal: `{ type: "spring", stiffness: 120, damping: 30, mass: 1 }`

### Easing
- Standard: `[0.22, 1, 0.36, 1]`
- Soft exit: `[0.4, 0, 0.2, 1]`
- Sharp attention: `[0.16, 1, 0.3, 1]`

---

## 7. 微交互规范
- Hover：上浮 2~6px，亮度提升 3~6%，不要突然放大
- Active：缩放 `0.985 ~ 0.97`，时长 120~180ms
- Focus：统一用品牌 conic / linear 渐变外环，不使用纯蓝默认 outline
- Loading：优先 shimmer / pulse / text morph，不要转圈堆满全站
- Success：短促、轻量、局部反馈，例如保存气泡 / 图标勾选

---

## 8. 粒子与光效原则
- 仅用于 AI、记忆、摘要、联想等“智能感”场景
- 粒子必须低密度、低速度、低对比
- 不覆盖文本主阅读区域
- 默认透明度 < 0.24
- 不得持续抢焦点；用户输入时自动弱化
- 禁止彩虹色粒子，严格限制在 indigo / violet / cyan 光谱
