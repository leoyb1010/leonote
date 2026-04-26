# Leonote UI Upgrade Implementation Guide

## 阶段划分（建议 4 阶段）

### Phase 1：设计系统与基础设施
- 建立 `design-tokens.md`
- 新增 `src/lib/animations.ts`
- 重构 `globals.css` 为深色玻璃态主题
- 扩展 `tailwind.config.ts`
- 引入 `framer-motion`、`lucide-react`

### Phase 2：壳层与核心卡片
- `AppShell`
- `AnimatedSidebar`
- `BottomNav`
- `GlassPanel`
- `AnimatedCard`
- `NoteCard`

### Phase 3：编辑器与记忆体验
- `EnhancedEditor`
- `MemoryFactsPanel`
- `MemoryFactCard`
- AI summary push card
- autosave micro-feedback

### Phase 4：AI 抽屉与项目看板
- `AIChatPanel`
- draggable drawer width
- 记忆高亮联动
- Project board 视觉升级
- 后续可继续接入真正的项目内拖拽数据流

---

## 性能优化建议
- 不要对大列表里的每个节点都长期挂高成本 blur + shadow + layout 动画。
- `motion.div` 只放在真正需要状态过渡的层，不要全树 motion 化。
- 大量卡片列表优先：
  - 容器 `stagger`
  - 卡片轻量 `opacity + y`
  - 避免同时启用复杂 filter / box-shadow 动态变化
- 3D hover 只给关键卡片，不要给全站所有列表。
- 粒子背景控制密度，默认低透明，避免覆盖主文本阅读区。
- 输入型场景优先稳定，编辑器聚焦光效应是局部且可快速关闭的。

---

## `useReducedMotion` 使用建议
- 在 `EnhancedEditor`、`AIChatPanel` 这类复杂交互中优先接入。
- 对以下效果降级：
  - typewriter
  - wave insert
  - floating particles
  - draggable secondary motion embellishment
- 降级策略：
  - 保留状态变化
  - 去掉连续动画
  - 改成直接显隐 / 轻淡入

示例：
```tsx
const reduceMotion = useReducedMotion();
if (reduceMotion) {
  setContent(nextContent);
  return;
}
```

---

## 与 Next.js 15/16 View Transitions API 结合
- 已在 `globals.css` 中加上：
  - `@view-transition { navigation: auto; }`
- 建议后续把项目切换、搜索跳转、笔记详情切换都统一接入 view transition name。
- 对支持不完整的浏览器：
  - 保留普通导航作为 fallback
  - 不依赖它承载关键业务逻辑

建议实践：
- 页面级切换用 View Transitions
- 组件级细节用 Framer Motion
- 不要两者在同一层重复控制同一个 transform

---

## 推荐目录结构
```txt
src/
  app/
  components/
    ai/
    editor/
    layout/
    notes/
    ui/
  lib/
    animations.ts
    utils.ts
```

后续建议继续拆：
- `components/memory/`
- `components/projects/`
- `components/dashboard/`

---

## Tailwind 需要的自定义配置
已增加：
- `colors.leonote.*`
- `backgroundImage.brand-gradient`
- `backgroundImage.brand-radial`
- `boxShadow.glass`
- `boxShadow.glow`
- `animation.float`
- `animation.breathe`

后续可继续增加：
- 自定义 spacing token
- 自定义 fontSize token
- semantic z-index token

---

## 浏览器兼容性问题与处理

### 1. `backdrop-filter`
- 某些低端环境表现较差
- fallback：提高背景不透明度，弱化 blur

### 2. View Transitions
- Safari / 部分环境支持不完整
- fallback：普通页面跳转 + Framer Motion 页面淡入

### 3. 3D transform / perspective
- 老设备可能掉帧
- fallback：在低性能场景关闭 `AnimatedCard` 的 tilt

### 4. 粒子与复杂阴影
- GPU 压力会升高
- fallback：降低 density / opacity / shadow blur

---

## 本次已完成的实际落地点
- 深色静谧主题基底
- 统一 design tokens 文档
- 统一 animation variants
- GlassPanel / AnimatedCard / AISpark / MemoryFactCard
- AnimatedSidebar / NoteCard / EnhancedEditor / AIChatPanel
- 首页、笔记列表、搜索、收藏记忆页、项目页、项目详情页、笔记详情页接入升级
- `typecheck`、`lint`、`build` 已通过

---

## 下一步最值得继续做的两件事
1. 把项目详情页的“笔记跨项目拖拽”接成真实数据更新
2. 把 AI panel 的记忆引用改成真实后端 memory reference payload，而不是当前前端联动版
