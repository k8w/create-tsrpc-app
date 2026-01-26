# create-tsrpc-app

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## English

Quickly create full-stack [TSRPC](https://github.com/k8w/tsrpc) projects with modern tooling.

### ✨ Features

- 🚀 **Modern Toolchain** - Vite + TypeScript 5 + Vitest
- ⚛️ **Multiple Frameworks** - React 19 / Vue 3.5 / Vanilla JS
- 🎨 **Tailwind CSS** - Optional, enabled by default
- 📡 **Dual Protocol** - HTTP / WebSocket
- 🔗 **Type Sharing** - Share TypeScript types between frontend and backend

### 📦 Usage

```bash
npx create-tsrpc-app my-app
```

Or use presets to skip prompts:

```bash
# React full-stack
npx create-tsrpc-app my-app -p react

# Vue 3 full-stack
npx create-tsrpc-app my-app -p vue3

# Backend only
npx create-tsrpc-app my-app -p server

# WebSocket (long connection)
npx create-tsrpc-app my-app -p react-ws
```

### 🎯 Available Templates

| Template | Frontend | Backend | Notes |
|----------|----------|---------|-------|
| `react` | React 19 + Vite | TSRPC | Recommended |
| `vue3` | Vue 3.5 + Vite | TSRPC | |
| `browser` | Vanilla JS + Vite | TSRPC | No framework |
| `server` | - | TSRPC | Backend only |

Each template supports both HTTP (`-p xxx`) and WebSocket (`-p xxx-ws`).

### 🛠 Requirements

- Node.js 18+
- npm / yarn / pnpm / bun

### 📁 Project Structure

```
my-app/
├── backend/          # Backend
│   ├── src/
│   │   ├── api/      # API implementations
│   │   └── shared/   # Shared type definitions
│   └── test/         # Vitest tests
└── frontend/         # Frontend
    ├── src/
    │   └── shared/   # ← Symlink to backend/src/shared
    └── vite.config.ts
```

### 🤝 Contributing

We welcome new framework templates! See [CONTRIBUTING.md](./CONTRIBUTING.md) to learn how to add support for Svelte, Solid.js, and more.

### 📄 License

MIT © [k8w](https://github.com/k8w)

---

<a name="中文"></a>

## 中文

快速创建 [TSRPC](https://github.com/k8w/tsrpc) 全栈项目，使用现代化工具链。

### ✨ 特性

- 🚀 **现代工具链** - Vite + TypeScript 5 + Vitest
- ⚛️ **多框架支持** - React 19 / Vue 3.5 / 原生 JS
- 🎨 **Tailwind CSS** - 可选，默认开启
- 📡 **双协议支持** - HTTP 短连接 / WebSocket 长连接
- 🔗 **类型共享** - 前后端共享 TypeScript 类型定义

### 📦 使用方法

```bash
npx create-tsrpc-app my-app
```

使用预设跳过交互式配置：

```bash
# React 全栈项目
npx create-tsrpc-app my-app -p react

# Vue 3 全栈项目
npx create-tsrpc-app my-app -p vue3

# 仅后端
npx create-tsrpc-app my-app -p server

# WebSocket 长连接
npx create-tsrpc-app my-app -p react-ws
```

### 🎯 可用模板

| 模板 | 前端 | 后端 | 说明 |
|------|------|------|------|
| `react` | React 19 + Vite | TSRPC | 推荐 |
| `vue3` | Vue 3.5 + Vite | TSRPC | |
| `browser` | 原生 JS + Vite | TSRPC | 无框架 |
| `server` | - | TSRPC | 仅后端 |

每个模板都支持 HTTP（`-p xxx`）和 WebSocket（`-p xxx-ws`）两种协议。

### 🛠 环境要求

- Node.js 18+
- npm / yarn / pnpm / bun

### 📁 生成的项目结构

```
my-app/
├── backend/          # 后端
│   ├── src/
│   │   ├── api/      # API 实现
│   │   └── shared/   # 共享类型定义
│   └── test/         # Vitest 测试
└── frontend/         # 前端
    ├── src/
    │   └── shared/   # ← 符号链接到 backend/src/shared
    └── vite.config.ts
```

### 🤝 参与贡献

欢迎贡献新的框架模板！查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何添加 Svelte、Solid.js 等框架支持。

### 📄 开源协议

MIT © [k8w](https://github.com/k8w)
