export type NoteItem = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  updatedAt: string;
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
  deleted?: boolean;
};

export const notes: NoteItem[] = [
  {
    id: "product-direction",
    title: "Leonote 产品方向",
    excerpt: "确定 Leonote 的产品边界：个人、轻量、中文、移动端优先。",
    content:
      "Leonote 是一个为个人长期使用设计的中文笔记与轻知识库产品。第一版不做团队协作、不做复杂平台能力，重点是记录、整理、搜索、回顾。",
    tags: ["产品", "定位"],
    updatedAt: "今天 10:20",
    pinned: true,
  },
  {
    id: "homepage-structure",
    title: "首页结构草案",
    excerpt: "首页由快速记录、置顶内容、最近更新、标签入口四部分组成。",
    content:
      "首页优先服务移动端。顶部保留搜索与快速记录入口，中段展示置顶与最近内容，底部提供首页、搜索、每日、我的四个导航入口。",
    tags: ["设计", "首页"],
    updatedAt: "今天 09:58",
    favorite: true,
  },
  {
    id: "development-plan",
    title: "第一版开发计划",
    excerpt: "先完成登录、笔记 CRUD、搜索、标签、每日笔记，再上线。",
    content:
      "开发顺序：基础框架、登录、列表、详情编辑、搜索、每日笔记、关联笔记轻版、部署上线。所有页面默认中文，风格保持克制。",
    tags: ["工程", "计划"],
    updatedAt: "昨天 21:30",
  },
  {
    id: "visual-style",
    title: "视觉风格原则",
    excerpt: "黑白灰为主，少量强调色，简约大气，不做五颜六色。",
    content:
      "Leonote 的视觉基调为低饱和、留白克制、卡片轻、层次清晰。避免花哨插画和多色块堆叠，优先表达高级感和稳定感。",
    tags: ["视觉", "规范"],
    updatedAt: "昨天 18:40",
  },
];

export const tagGroups = ["全部", "产品", "设计", "工程", "视觉", "每日"];
