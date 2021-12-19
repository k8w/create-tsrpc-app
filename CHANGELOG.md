# Change Log

## [1.2.7] - 2021-12-20
### Changed
- Update dependencies
- Rename CLI command `tsrpc` to `tsrpc-cli`

## [1.2.6] - 2021-12-07
### Fixed
- WebSocket server unit test bug

## [1.2.5] - 2021-12-04
### Changed
- Update `package.json` in server template

## [1.2.4] - 2021-12-01
### Added
- `tsrpc.config.ts` add `ptlTemplate` and `msgTemplate`, extends from base by default
### Fixed
- `npm install` error issue when create server-only project

## [1.2.3] - 2021-11-17
### Added
- Add remark to default protocols, to preview api doc effects.

## [1.2.2] - 2021-11-14
### Added
- Upgrade to `tsrpc-cli@2.2.0`, add `npm run doc` command
- `server/src/index.ts` split to 2 function: `init` and `main`

## [1.2.1] - 2021-11-09
### Changed
- Flaten directory structure of `templates/client*/src-ws`
- `client-react` switched to official templates of `create-react-app`

## [1.2.0] - 2021-11-08
### Added
- Update to `tsrpc@3.1`
### Changed
- Remove `PM2` from `Dockerfile`

## [1.1.9] - 2021-11-06
### Added
- 增加 `Dockerfile`
- `npm-check-update` 失败不会中断安装进程
### Fixed
- 优化前端模板中 `index.html` 中 `<meta>` 标签的闭合

## [1.1.8] - 2021-10-19
### Fixed
- 修改英文文案

## [1.1.7] - 2021-10-19
### Added
- Update `tsrpc` version, support `mongodb/ObjectId` by default.
- Add `env.d.ts` for `mongodb/ObjectId` support.
- Auto ask for elevating in Windows when creating symlink

## [1.1.3] - 2021-10-09
### Fixed
- 修复 Windows 平台 `npm install` 的错误
## [1.1.2] - 2021-10-08
### Added
- `index.html` 中增加 `<meta name="renderer" content="webkit" />`

## [1.1.1] - 2021-10-07
### Added
- 允许以覆盖方式在非空文件夹下安装

## [1.1.0] - 2021-10-06
### Added
- Add `tsrpc.config.ts`, update `npm run dev` and `npm run build`
- Update `tsrpc-cli` version to `^2.0.8`
- 为 Vue 项目增加 `vetur.config.js`
### Changed
- 改用 `chalk` 替代 `colors`

## [1.0.5] - 2021-06-24
### Added
- Add demo comment to template files