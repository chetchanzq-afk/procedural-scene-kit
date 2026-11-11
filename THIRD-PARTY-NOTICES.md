# 第三方依赖说明

本技能不打包、不内置任何第三方源码或美术资源，仅在运行时通过 CDN 引用以下开源库：

| 依赖 | 版本 | 许可 | 用途 | 引入方式 |
|---|---|---|---|---|
| three.js | 0.180.0 | MIT | WebGL 渲染引擎 | `importmap` 指向 `cdn.jsdelivr.net` |

- 没有 glTF / 纹理 / 音频等外部资产；所有几何、材质、光照均由代码生成。
- 若需离线部署，请自行下载 `three.module.js` 与 `examples/jsm/` 所需模块，并把 `index.html` 中的 importmap 改为本地路径。
- 技能自身的代码与文档以 MIT 许可发布，见 `LICENSE`。
