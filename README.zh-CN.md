# Familiarity (Osmosis)

[![Chrome Web Store](https://img.shields.io/badge/Chrome-扩展-blue.svg)](https://chrome.google.com/webstore/detail/lfacgacihecjimgffkakkefaookbfmfp)

Familiarity 是一款现代化的浏览器扩展，旨在帮助你在日常网页浏览中潜移默化地掌握新单词。通过高亮你之前“标记”过的单词，Familiarity 将每一个网页都变成一个个性化的语言学习环境。

![预览图](https://github.com/wxxxcxx/familiarity/assets/13930715/6aa04315-3d51-480a-b6de-7612809f5a54)

[English Version/英文版本](./README.md)

## ✨ 主要功能

- **智能高亮**：在您访问的任何网站上自动识别并高亮显示您标记为“不熟悉”的单词。
- **实时释义**：将鼠标悬停在高亮单词上，即可查看定义、翻译和读音，无需离开当前页面。
- **双检索引擎**：集成 **有道翻译** 和 **FreeDictionary API**，提供详尽且准确的单词数据。
- **云端同步**：利用 Chrome Storage Sync，在您所有的设备之间无缝同步词汇列表。
- **现代 UI/UX**：采用 React、Tailwind CSS 和 Framer Motion 构建，提供细腻流畅且响应迅速的使用体验。
- **隐私保护**：您的数据由您掌握。所有词汇和设置都直接存储在您的浏览器存储空间中。

## 🛠️ 技术栈

- **框架**: [Plasmo](https://docs.plasmo.com/) (Manifest V3)
- **前端**: React, TypeScript
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React
- **国际化**: i18next
- **存储**: `@plasmohq/storage` (Chrome Sync & Local)

## 🚀 快速上手

### 环境准备

- Node.js (建议最新 LTS 版本)
- [pnpm](https://pnpm.io/) (强烈建议)

### 开发流程

1. **克隆仓库:**
   ```bash
   git clone https://github.com/wxxxcxx/familiarity.git
   cd familiarity
   ```

2. **安装依赖:**
   ```bash
   pnpm install
   ```

3. **启动开发服务器:**
   ```bash
   pnpm dev
   ```

4. **在 Chrome 中加载:**
   - 打开 Chrome 并访问 `chrome://extensions/`。
   - 开启右上角的“开发者模式”。
   - 点击“加载已解压的扩展程序”，选择 `build/chrome-mv3-dev` 目录。

### 构建生产版本

生成可发布的安装包：
```bash
pnpm build
```

## 📂 项目结构

- `src/background/`: 后台服务，处理消息传递和数据持久化。
- `src/contents/`: 内容脚本，负责网页中单词的高亮和悬浮窗渲染。
- `src/components/`: 可复用的 React UI 组件。
- `src/services/`: 核心逻辑，包括词典接口和存储驱动。
- `src/popup/`: 扩展程序的弹出界面。
- `src/options/`: 设置和配置管理页面。

## 📄 许可证

本项目目前处于积极开发阶段。保留所有权利。
