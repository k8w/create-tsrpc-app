# Contributing Guide / 贡献指南

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## English

Thanks for your interest in create-tsrpc-app! We welcome all kinds of contributions.

### 🎯 Adding a New Framework Template

Want to add Svelte, Solid.js, Astro, or another framework? Follow these steps:

#### 1. Template Directory Structure

```
templates/client-{framework}/
├── package.json          # Dependencies (must use Vite)
├── vite.config.ts        # Vite config
├── tsconfig.json         # TypeScript config
├── index.html            # Entry HTML (or index-http.html + index-ws.html)
├── src-http/             # HTTP example
│   ├── main.ts           # Entry file
│   ├── index.css         # Styles
│   └── client.ts         # TSRPC client (copy from other templates)
└── src-ws/               # WebSocket example
    ├── main.ts
    ├── index.css
    └── getClient.ts      # TSRPC client (copy from other templates)
```

#### 2. Requirements

- ✅ Use **Vite** as the bundler
- ✅ Support **TypeScript**
- ✅ `vite.config.ts` must include:

  ```ts
  resolve: {
    preserveSymlinks: true,  // Required for shared directory symlink
  }
  ```

- ✅ Provide both HTTP and WebSocket examples
- ✅ Use plain CSS for styles (Tailwind will be auto-injected)

#### 3. Files to Modify

1. **`src/models/CreateOptions.ts`** - Add new ClientPlatform type

   ```ts
   export type ClientPlatform = 'browser' | 'react' | 'vue3' | 'svelte' | 'none' | 'node'
   ```

2. **`src/models/preset.ts`** - Add presets

   ```ts
   svelte: {
     server: 'http',
     client: 'svelte',
     features: ['tailwind']
   },
   'svelte-ws': {
     server: 'ws',
     client: 'svelte',
     features: ['tailwind']
   },
   ```

3. **`src/models/inputCreateOptions.ts`** - Add menu option

   ```ts
   { name: i18n.projectType.svelte, value: 'svelte' },
   ```

4. **`src/i18n/en-us.ts`** and **`src/i18n/zh-cn.ts`** - Add i18n strings

   ```ts
   projectType: {
     // ...
     svelte: 'Svelte + backend',  // English
     svelte: 'Svelte + 后端',      // Chinese
   }
   ```

#### 4. Testing

```bash
# Build CLI
npm run build

# Test new template
node dist/index.js test-svelte -p svelte
cd test-svelte/frontend && npm install && npm run dev
```

#### 5. Submit PR

1. Fork this repository
2. Create branch `feat/add-svelte-template`
3. Commit your changes
4. Open a Pull Request

### 🐛 Reporting Bugs

Please submit issues at [Issues](https://github.com/k8w/create-tsrpc-app/issues) with:

- OS and Node.js version
- Full error message
- Steps to reproduce

### 💡 Feature Requests

Feel free to discuss new ideas in Issues!

### 📚 References

- [TSRPC Documentation](https://tsrpc.cn)
- [Vite Documentation](https://vitejs.dev)

---

<a name="中文"></a>

## 中文

感谢你对 create-tsrpc-app 的关注！我们欢迎各种形式的贡献。

### 🎯 添加新框架模板

想添加 Svelte、Solid.js、Astro 等框架支持？按以下步骤操作：

#### 1. 模板目录结构

```
templates/client-{框架名}/
├── package.json          # 依赖配置（必须使用 Vite）
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 配置
├── index.html            # 入口 HTML（或 index-http.html + index-ws.html）
├── src-http/             # HTTP 示例代码
│   ├── main.ts           # 入口文件
│   ├── index.css         # 样式
│   └── client.ts         # TSRPC 客户端（从其他模板复制）
└── src-ws/               # WebSocket 示例代码
    ├── main.ts
    ├── index.css
    └── getClient.ts      # TSRPC 客户端（从其他模板复制）
```

#### 2. 必须满足的要求

- ✅ 使用 **Vite** 作为打包工具
- ✅ 支持 **TypeScript**
- ✅ `vite.config.ts` 必须包含：

  ```ts
  resolve: {
    preserveSymlinks: true,  // 支持 shared 目录符号链接
  }
  ```

- ✅ 提供 HTTP 和 WebSocket 两个示例
- ✅ 样式使用纯 CSS（Tailwind 会自动注入）

#### 3. 需要修改的文件

1. **`src/models/CreateOptions.ts`** - 添加新的 ClientPlatform 类型

   ```ts
   export type ClientPlatform = 'browser' | 'react' | 'vue3' | 'svelte' | 'none' | 'node'
   ```

2. **`src/models/preset.ts`** - 添加预设

   ```ts
   svelte: {
     server: 'http',
     client: 'svelte',
     features: ['tailwind']
   },
   'svelte-ws': {
     server: 'ws',
     client: 'svelte',
     features: ['tailwind']
   },
   ```

3. **`src/models/inputCreateOptions.ts`** - 添加选项

   ```ts
   { name: i18n.projectType.svelte, value: 'svelte' },
   ```

4. **`src/i18n/en-us.ts`** 和 **`src/i18n/zh-cn.ts`** - 添加国际化文本

   ```ts
   projectType: {
     // ...
     svelte: 'Svelte + backend',  // 英文
     svelte: 'Svelte + 后端',      // 中文
   }
   ```

#### 4. 测试

```bash
# 构建 CLI
npm run build

# 测试新模板
node dist/index.js test-svelte -p svelte
cd test-svelte/frontend && npm install && npm run dev
```

#### 5. 提交 PR

1. Fork 本仓库
2. 创建分支 `feat/add-svelte-template`
3. 提交更改
4. 发起 Pull Request

### 🐛 报告 Bug

请在 [Issues](https://github.com/k8w/create-tsrpc-app/issues) 中提交，并包含：

- 操作系统和 Node.js 版本
- 完整的错误信息
- 复现步骤

### 💡 功能建议

欢迎在 Issues 中讨论新功能想法！

### 📚 参考资料

- [TSRPC 文档](https://tsrpc.cn)
- [Vite 文档](https://cn.vitejs.dev)
