import type { Transition, Variants } from "framer-motion";

/**
 * Leonote motion presets.
 * 所有动画都围绕“静谧、智慧、呼吸感”，避免夸张位移与过度弹跳。
 */
export const springs = {
  gentle: { type: "spring", stiffness: 280, damping: 28, mass: 0.8 } satisfies Transition,
  bouncy: { type: "spring", stiffness: 380, damping: 22, mass: 0.8 } satisfies Transition,
  slowReveal: { type: "spring", stiffness: 120, damping: 30, mass: 1 } satisfies Transition,
};

export const easings = {
  standard: [0.22, 1, 0.36, 1] as const,
  softExit: [0.4, 0, 0.2, 1] as const,
  sharp: [0.16, 1, 0.3, 1] as const,
};

/** 页面或大卡片的轻上浮进入 */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 18, filter: "blur(8px)", scale: 0.985 },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: springs.gentle },
  exit: { opacity: 0, y: 10, filter: "blur(6px)", transition: { duration: 0.18, ease: easings.softExit } },
  whileHover: { y: -2, transition: { duration: 0.22, ease: easings.standard } },
  whileTap: { scale: 0.992, transition: { duration: 0.12, ease: easings.sharp } },
};

/** 适合按钮、徽章、浮层的缩放淡入 */
export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.94, filter: "blur(10px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition: springs.gentle },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.16, ease: easings.softExit } },
  whileHover: { scale: 1.015, transition: { duration: 0.22, ease: easings.standard } },
  whileTap: { scale: 0.985, transition: { duration: 0.12, ease: easings.sharp } },
};

/** 统一 stagger 容器 */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  whileHover: {},
  whileTap: {},
};

/** 列表内元素单项 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: springs.gentle },
  exit: { opacity: 0, y: 8, transition: { duration: 0.16, ease: easings.softExit } },
  whileHover: { y: -3, transition: { duration: 0.2, ease: easings.standard } },
  whileTap: { scale: 0.99, transition: { duration: 0.12, ease: easings.sharp } },
};

/** 玻璃面板统一状态 */
export const glassPanel: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.985, boxShadow: "0 0 0 rgba(0,0,0,0)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    boxShadow: "0 24px 72px rgba(2,6,23,0.28)",
    transition: springs.gentle,
  },
  exit: { opacity: 0, y: 10, scale: 0.99, transition: { duration: 0.18, ease: easings.softExit } },
  whileHover: {
    y: -4,
    boxShadow: "0 32px 90px rgba(9,13,26,0.36)",
    transition: { duration: 0.24, ease: easings.standard },
  },
  whileTap: { scale: 0.992, transition: { duration: 0.12, ease: easings.sharp } },
};

/** 卡片 hover 重点：轻抬起、轻转、阴影变化 */
export const noteCardHover: Variants = {
  initial: { scale: 1, rotateX: 0, rotateY: 0, y: 0 },
  animate: { scale: 1, rotateX: 0, rotateY: 0, y: 0, transition: springs.gentle },
  exit: { opacity: 0, y: 8, transition: { duration: 0.16, ease: easings.softExit } },
  whileHover: { y: -6, scale: 1.01, rotateX: 2, rotateY: -2, transition: springs.gentle },
  whileTap: { y: -1, scale: 0.985, transition: { duration: 0.12, ease: easings.sharp } },
};

/** AI 消息出现：稍慢、更柔和，保留“思考感” */
export const aiMessageAppear: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.97, filter: "blur(12px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: springs.slowReveal },
  exit: { opacity: 0, y: 10, scale: 0.985, transition: { duration: 0.18, ease: easings.softExit } },
  whileHover: {
    scale: 1.008,
    boxShadow: "0 0 0 1px rgba(99,102,241,0.22), 0 20px 48px rgba(35,43,78,0.35)",
    transition: { duration: 0.22, ease: easings.standard },
  },
  whileTap: { scale: 0.992, transition: { duration: 0.12, ease: easings.sharp } },
};

/** Memory facts 的漂浮感 */
export const memoryFactFloat: Variants = {
  initial: { opacity: 0, y: 20, rotate: -1.5, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: springs.slowReveal,
  },
  exit: { opacity: 0, y: 8, rotate: 1, transition: { duration: 0.18, ease: easings.softExit } },
  whileHover: { y: -8, rotate: 0, scale: 1.012, transition: springs.gentle },
  whileTap: { scale: 0.986, transition: { duration: 0.12, ease: easings.sharp } },
};

/** 总结卡片展开，适合 layout 动画前后的联动 */
export const summarizeExpand: Variants = {
  initial: { opacity: 0, y: -14, height: 0, scaleY: 0.96, transformOrigin: "top" },
  animate: { opacity: 1, y: 0, height: "auto", scaleY: 1, transition: springs.slowReveal },
  exit: { opacity: 0, y: -8, height: 0, transition: { duration: 0.2, ease: easings.softExit } },
  whileHover: { scale: 1.005, transition: { duration: 0.22, ease: easings.standard } },
  whileTap: { scale: 0.995, transition: { duration: 0.12, ease: easings.sharp } },
};

/** 页面切换 */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 22, filter: "blur(14px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { ...springs.slowReveal, delay: 0.02 } },
  exit: { opacity: 0, y: 12, filter: "blur(10px)", transition: { duration: 0.2, ease: easings.softExit } },
  whileHover: {},
  whileTap: {},
};

/** 侧边栏展开 / 折叠 */
export const sidebarCollapse: Variants = {
  initial: { width: 88, opacity: 0.96 },
  animate: { width: 288, opacity: 1, transition: springs.gentle },
  exit: { width: 88, opacity: 0.92, transition: { duration: 0.18, ease: easings.softExit } },
  whileHover: { boxShadow: "0 18px 60px rgba(15,23,42,0.42)", transition: { duration: 0.22, ease: easings.standard } },
  whileTap: { scale: 0.998, transition: { duration: 0.12, ease: easings.sharp } },
};
