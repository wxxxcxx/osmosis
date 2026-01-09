# 项目上下文：Familiarity (Osmosis)

## 项目概述
**Familiarity**（内部代号 **Osmosis**）是一款浏览器扩展程序，旨在通过在网页中识别并高亮用户标记的生词，帮助用户在日常阅读中自然地学习和记忆单词。用户可以“收藏”单词，这些单词将在后续的浏览过程中被自动高亮。

## 技术栈
- **框架:** [Plasmo](https://docs.plasmo.com/) (浏览器扩展开发框架)
- **前端:** React, TypeScript
- **样式:** Tailwind CSS, Framer Motion (`motion`), `clsx`, `tailwind-merge`
- **存储:** Chrome Storage Sync (通过 `@plasmohq/storage`)
- **通信:** Plasmo Messaging (`@plasmohq/messaging`)

## 系统架构

该扩展遵循 Manifest V3 标准架构，并结合了 Plasmo 的增强特性：

### 1. 后台服务 (`src/background/`)
- 处理核心数据逻辑和持久化状态。
- **消息处理器 (`src/background/messages/`):** 为内容脚本提供的 API 端点。
    - `star.ts`: 将单词保存到同步存储中。
    - `unstar.ts`: 移除单词。
    - `list.ts`: 获取所有已保存的单词列表。
    - `query.ts`: 查询特定单词的状态。

### 2. 内容脚本 (`src/contents/`)
注入到网页中的脚本，用于实现 UI 和交互逻辑。
- **渲染与高亮:**
    - `highlighter.tsx`, `decorator.tsx`: 使用 Plasmo 的 `CSUI` (Content Script UI) 功能，在页面中识别并高亮显示已收藏的单词。
    - `marker.ts`: 核心的单词匹配与标记逻辑。
- **交互组件:**
    - `tooltip.tsx`: 提供单词详情、翻译或取消收藏等操作的悬浮窗。
- **注意:** `src/contents.a/` 文件夹为旧版本逻辑的备份，当前项目已不再实际使用。

### 3. UI 页面
- **弹出窗口 (`src/popup/`):** 扩展程序的点击弹出界面。
- **选项页面 (`src/options/`):** 扩展程序的设置管理页面。

## 关键目录说明
- `src/background/`: Service Worker 逻辑与消息处理函数。
- `src/components/`: 可复用的 React 组件（如 UI 元素、提示框等）。
- `src/contents/`: 核心内容脚本和页面覆盖层 UI。
- `src/utils/`: 通用工具函数（单词验证、常量定义、存储辅助函数等）。

## 开发指南

### 环境准备
- Node.js
- 推荐使用 pnpm (或 npm/yarn)

### 常用命令
- **启动开发模式:**
  ```bash
  pnpm dev
  ```
  该命令将加载扩展到 Chrome 并开启热重载。

- **构建生产版本:**
  ```bash
  pnpm build
  ```
  在 `build/` 目录下生成可发布的扩展程序包。

- **代码格式化:**
  ```bash
  pnpm format
  ```

## 数据模型
单词存储在 `chrome.storage.sync` 中，键名以 `word.` 为前缀。
- **键 (Key):** `word.<小写单词>`
- **值 (Value):** `{ timespan: number }` (添加单词时的时间戳)

## 开发规范
- **命名规范:** React 组件使用 PascalCase，普通文件通常使用 kebab-case 或 camelCase。
- **样式方案:** 优先使用 Tailwind CSS 原子化类名。
- **异步处理:** 广泛使用 `async/await` 处理消息传递和存储操作。