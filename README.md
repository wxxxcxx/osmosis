# Familiarity (Osmosis)

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore/detail/lfacgacihecjimgffkakkefaookbfmfp)

Familiarity is a modern browser extension designed to help you effortlessly master new vocabulary while surfing the web. By naturally highlighting words you've previously "starred," Familiarity turns every webpage into a personalized language learning platform.

![Preview](https://github.com/wxxxcxx/familiarity/assets/13930715/6aa04315-3d51-480a-b6de-7612809f5a54)

[中文版本/Chinese Version](./README.zh-CN.md)

## ✨ Key Features

- **Smart Highlighting**: Automatically identifies and highlights words you've marked as "unfamiliar" across any website you visit.
- **Contextual Insights**: Hover over highlighted words to see definitions, translations, and pronunciations without leaving the page.
- **Dual Dictionary Engines**: Integrated with **Youdao** and **FreeDictionary API** to provide comprehensive and accurate word data.
- **Cloud Syncing**: Seamlessly syncs your vocabulary list across all your devices using Chrome Storage Sync.
- **Premium UI/UX**: A fluid, responsive interface built with React, Tailwind CSS, and Framer Motion for a delightful user experience.
- **Privacy-Centric**: Your data stays with you. All vocabulary and settings are stored directly in your browser's storage.

## 🛠️ Tech Stack

- **Framework**: [Plasmo](https://docs.plasmo.com/) (Manifest V3)
- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Internationalization**: i18next
- **Storage**: `@plasmohq/storage` (Chrome Sync & Local)

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- [pnpm](https://pnpm.io/) (Highly recommended)

### Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/wxxxcxx/familiarity.git
   cd familiarity
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" in the top right corner.
   - Click "Load unpacked" and select the `build/chrome-mv3-dev` directory.

### Build

To create a production-ready package:
```bash
pnpm build
```

## 📂 Project Structure

- `src/background/`: Service Worker and message handlers for data persistence.
- `src/contents/`: Content scripts for word highlighting and tooltip UI overlays.
- `src/components/`: Reusable React components for the extension.
- `src/services/`: Core logic for dictionary providers and storage vaults.
- `src/popup/`: The extension's popup interface.
- `src/options/`: Settings and configuration page.

## 📄 License

This project is currently under active development. All rights reserved.
