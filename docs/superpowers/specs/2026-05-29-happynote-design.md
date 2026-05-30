# HappyNote - 浏览器 Markdown 编辑器插件设计

## 概述

HappyNote 是一个 Chrome 浏览器扩展，提供类 Typora 的所见即所得 Markdown 编辑体验。点击插件图标即可在新 Tab 中打开一个极简的编辑器，立即开始写作。

## 目标

- 最快路径从「想记点东西」到「正在写」—— 一键打开，零配置
- 类 Typora 的 WYSIWYG 体验 —— 输入 Markdown 语法实时渲染为最终样式
- 数据安全 —— 自动保存到 IndexedDB，不丢内容

## 架构

```
Chrome Extension (Manifest V3)
├── manifest.json          # 扩展配置
├── background.js          # Service Worker: 监听图标点击 → chrome.tabs.create()
└── editor/                # 新 Tab 页面 (React App)
    ├── index.html
    ├── App.tsx            # 根组件
    ├── Editor.tsx         # Milkdown 编辑器封装
    └── db.ts             # IndexedDB 存储层
```

### 工作流

1. 用户点击 Chrome 工具栏中的 HappyNote 图标
2. `background.js`（Service Worker）接收 `chrome.action.onClicked` 事件
3. 调用 `chrome.tabs.create({ url: 'editor/index.html' })` 打开新 Tab
4. React App 挂载，初始化 Milkdown 编辑器
5. 从 IndexedDB 加载上次内容（如有）
6. 用户开始写作，内容实时自动保存

## 技术选型

| 技术 | 用途 |
|------|------|
| Chrome Manifest V3 | 扩展平台 |
| React 18 + TypeScript | UI 框架 |
| Milkdown (@milkdown/react) | WYSIWYG Markdown 编辑器 |
| Vite | 构建工具 |
| idb | IndexedDB 封装库 |
| bun | 包管理器 |

## 编辑器功能（MVP）

### 核心格式
- 标题 h1-h6（输入 `#` + 空格触发）
- 加粗（`**text**`）
- 斜体（`*text*`）
- 删除线（`~~text~~`）
- 有序列表（`1.` + 空格）
- 无序列表（`-` + 空格）
- 引用块（`>` + 空格）
- 分割线（`---`）
- 行内代码（`` `code` ``）

### 代码块
- 围栏代码块（` ``` `）
- 语法高亮显示（使用 @milkdown/plugin-prism 或类似方案）

### 链接 & 图片
- 超链接（`[text](url)`）
- 图片插入（`![alt](url)`）
- 粘贴图片自动转 base64 存入 IndexedDB

## 界面设计

### 布局
- 全屏白色背景，无多余装饰
- 顶部极细状态栏：左侧「HappyNote」品牌字，右侧显示保存状态
- 编辑区域居中，最大宽度约 800px，上下留白充足
- 无工具栏，纯键盘/Markdown 语法驱动

### 排版
- 正文使用衬线或无衬线字体（系统字体栈）
- 行高 1.8，字号 16px
- 代码块使用等宽字体，浅灰色背景

### 交互
- 打开即聚焦编辑区，可直接输入
- 输入 Markdown 语法后立即渲染（无延迟）
- 自动保存：内容变化后 1 秒防抖保存到 IndexedDB
- 状态栏显示「已保存 ✓」或「保存中...」

## 数据存储

### IndexedDB Schema

```typescript
interface NoteStore {
  id: string;          // 固定 ID（MVP 只有一篇笔记）
  content: string;     // Markdown 源文本
  updatedAt: number;   // 最后修改时间戳
}
```

MVP 阶段只维护一篇笔记（单文档模式）。后续可扩展为多篇笔记管理。

### 自动保存策略
- 内容变更后 1000ms 防抖触发保存
- 页面 `beforeunload` 时强制保存
- 保存失败时状态栏提示错误

## 项目结构

```
happynote/
├── public/
│   └── icons/              # 扩展图标 (16/48/128px)
├── src/
│   ├── background.ts       # Service Worker
│   ├── editor/
│   │   ├── index.html      # 编辑器入口 HTML
│   │   ├── main.tsx        # React 入口
│   │   ├── App.tsx         # 根组件
│   │   ├── Editor.tsx      # Milkdown 编辑器组件
│   │   ├── db.ts           # IndexedDB 操作
│   │   └── styles.css      # 全局样式
│   └── manifest.json       # Chrome 扩展 manifest
├── vite.config.ts
├── tsconfig.json
├── package.json
└── bun.lock
```

## 构建 & 开发

- `bun install` — 安装依赖
- `bun run dev` — 开发模式（Vite dev server，用于编辑器页面开发）
- `bun run build` — 构建产物输出到 `dist/`
- 加载扩展：Chrome → 扩展管理 → 加载已解压的扩展 → 选择 `dist/` 目录

## 未来扩展（不在 MVP 范围）

- 多篇笔记管理（列表、搜索、切换）
- 表格支持
- 任务列表（checkbox）
- 导出为 .md 文件
- 暗色主题
- 浮动工具栏
- 从网页摘录内容
