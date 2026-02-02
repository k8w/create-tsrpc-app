# Contributing Examples Guide

This guide explains how to contribute example projects to create-tsrpc-app.

## Example Requirements

All examples must meet these requirements:

1. **Must include `example.json`** - Metadata file describing the example
2. **Must be runnable** - `npm install && npm run dev` should work
3. **Must include `README.md`** - Documentation for the example
4. **Recommended: Include screenshot** - Visual preview of the example

## Directory Structure

```
your-example/
├── backend/              # Backend (required)
│   ├── src/
│   │   ├── api/          # API implementations
│   │   └── shared/       # Shared types (will be symlinked)
│   ├── package.json
│   └── tsrpc.config.ts
├── frontend/             # Frontend (optional for backend-only examples)
│   ├── src/
│   │   └── shared/       # Symlink target
│   ├── package.json
│   └── vite.config.ts
├── example.json          # Required: Example metadata
├── README.md             # Required: Documentation
└── screenshot.png        # Recommended: Preview image
```

## example.json Schema

```json
{
  "$schema": "https://raw.githubusercontent.com/k8w/create-tsrpc-app/main/schemas/example.schema.json",
  "name": "your-example-name",
  "version": "1.0.0",
  "displayName": {
    "zh-CN": "示例中文名称",
    "en-US": "Example English Name"
  },
  "description": {
    "zh-CN": "示例的中文描述",
    "en-US": "Example description in English"
  },
  "author": "your-github-username",
  "tags": ["fullstack", "react", "http"],
  "difficulty": "intermediate",
  "stack": {
    "server": "http",
    "client": "react"
  },
  "features": ["authentication", "crud"],
  "minNodeVersion": "18",
  "screenshot": "./screenshot.png"
}
```

### Required Fields

| Field | Description |
|-------|-------------|
| `name` | Unique identifier (kebab-case, e.g., `ecommerce-admin`) |
| `displayName` | Display name with multi-language support |
| `description` | Description with multi-language support |
| `stack` | Technology stack (`server`: http/ws, `client`: react/vue3/browser/none) |

### Optional Fields

| Field | Description |
|-------|-------------|
| `version` | SemVer version (default: "1.0.0") |
| `author` | Author's GitHub username |
| `tags` | Array of tags for search/categorization |
| `difficulty` | beginner / intermediate / advanced |
| `features` | List of features demonstrated |
| `minNodeVersion` | Minimum Node.js version required |
| `screenshot` | Relative path to screenshot image |
| `demoUrl` | Live demo URL |

### Available Tags

| Category | Tags |
|----------|------|
| Architecture | `fullstack`, `backend-only`, `frontend-only` |
| Frontend | `react`, `vue3`, `browser` |
| Protocol | `http`, `websocket`, `realtime` |
| Features | `crud`, `auth`, `file-upload`, `pagination`, `search` |
| Use Case | `admin`, `dashboard`, `chat`, `game`, `api-gateway` |
| Complexity | `starter`, `enterprise`, `microservice` |

## Contribution Methods

### Method 1: Official Examples (Recommended for High-Quality Examples)

Submit your example to the `examples/` directory in this repository.

1. Fork this repository
2. Create your example in `examples/your-example-name/`
3. Ensure it meets all requirements
4. Test locally:
   ```bash
   cd examples/your-example-name/backend && npm install && npm run dev
   cd examples/your-example-name/frontend && npm install && npm run dev
   ```
5. Submit a Pull Request with:
   - Title: `feat(example): add your-example-name`
   - Include screenshot in PR description
   - Describe the use case and features

### Method 2: Community Examples (For Personal Repositories)

Add your example to the community index while hosting it in your own repository.

1. Create a TSRPC example in your GitHub repository
2. Ensure it includes a valid `example.json`
3. Fork this repository
4. Edit `community-examples.json`:
   ```json
   {
     "examples": [
       {
         "name": "your-example-name",
         "repo": "your-username/your-repo",
         "branch": "main",
         "subpath": "",
         "description": {
           "zh-CN": "中文描述",
           "en-US": "English description"
         },
         "author": "your-username"
       }
     ]
   }
   ```
5. Submit a Pull Request with:
   - Title: `feat(community): add your-example-name`
   - Link to your repository

## Quality Standards

### Code Quality
- Follow TSRPC best practices
- Use TypeScript strict mode
- Include proper error handling
- Add meaningful comments for complex logic

### Documentation
- Clear README explaining:
  - What the example demonstrates
  - Prerequisites
  - How to run locally
  - Project structure overview
- Inline code comments where helpful

### User Experience
- Example should work out of the box
- Clear console output during development
- Helpful error messages

## CI Validation

When you submit a PR, the CI will automatically verify:

- `example.json` format is valid
- `npm install` succeeds for both backend and frontend
- `npm run build` succeeds (if applicable)
- All required files are present

## Need Help?

- [Open an issue](https://github.com/k8w/create-tsrpc-app/issues) for questions
- Check existing examples for reference
- Join the TSRPC community for discussions
