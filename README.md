# Procedural Scene Kit

用代码生成 3D 场景与电影感渲染：模型、贴图、光照、后处理全部在运行时生成，不下载任何 glb / png / 音频。

A procedural 3D scene kit for the web: code-generated models, canvas textures, film-look post-processing, and quality scaling. Zero external assets.

## 它能做什么

- **代码建模**：`box / rbox / cyl / tube / plane / label` 组合出集装箱、墙体、家具、设备
- **程序化贴图**：划痕、斑驳、锈迹、箱号与警示牌，全部 Canvas / shader 生成
- **渲染管线**：SSAO、运动模糊、Bloom、体积光（光片 + 屏幕空间）、AgX、镜头脏污、颗粒、FXAA、自动曝光
- **湿地面反射**：镜像相机 + 半分辨率反射
- **天气**：实例化雨丝，可在主题里一键开关
- **画质调度**：四档预设 + 帧时闭环动态分辨率
- **可验收**：`__stats()`、`?shot`、`?spin`，方便截图回归

## 快速开始

直接跑示例，不需要构建：

```bash
cd assets/kit
python -m http.server 8877
# 打开 http://127.0.0.1:8877/?theme=port-dawn
```

另一个示例：

```bash
cd examples/indoor-office
python -m http.server 8877
```

> 示例通过 importmap 从 CDN 加载 three.js r180；离线部署时把 `index.html` 里的 importmap 改成本地路径。

## 作为 Agent Skill 使用

本仓库同时是一个 `SKILL.md` 技能，装了之后可以直接说「做一个雨夜港区」让 Agent 按流程生成。

| Harness | 路径 |
|---|---|
| Trae（CN / 国际） | `~/.trae-cn/skills/` 或 `~/.trae/skills/`；项目 `.trae/skills/` |
| Claude Code | `~/.claude/skills/`；项目 `.claude/skills/` |
| Codex CLI | 项目 `.agents/skills/`；用户 `~/.agents/skills/`；企业 `/etc/codex/skills/` |
| 其他 harness | 把 `SKILL.md` 注入系统提示，并提供文件读取 |

一键安装：

```bash
./scripts/install.sh trae-cn
powershell -File scripts\install.ps1 -Target codex-user
```

支持的 target：`trae-cn`、`trae`、`claude`、`codex-user`、`codex-project`。

详见 [docs/harness-install.md](./docs/harness-install.md)。

## 作为起始工程使用

复制 `assets/kit/` 到你的项目，替换三处内容即可换场景：

- `src/props.js`：道具库
- `src/scene-*.js`：布局与相机
- `src/themes.js`：光照、雾、配色、后处理

内核（`kit / mesh / materials / pipeline / quality / shafts / weather`）不需要改。

## 目录结构

```
procedural-scene-kit/
├── SKILL.md                    Agent 技能：流程、API、验收、常见坑
├── references/                 01 规格 · 02 建模 · 03 材质 · 04 光照 · 05 性能 · 06 配方 · 07 迭代 · 08 自动生成
├── assets/kit/                 可运行内核 + 港区示例
├── examples/indoor-office/     白昼办公室示例
├── docs/
│   └── harness-install.md
├── scripts/
│   ├── install.sh
│   └── install.ps1
├── THIRD-PARTY-NOTICES.md
└── LICENSE
```

## 精度档位

| 档位 | 三角面 | 用途 |
|---|---|---|
| 草稿 | 20k–40k | 定构图与光照 |
| 标准 | 80k–150k | 可交付演示 |
| 高精度 | 200k–400k | 对标商业项目 |

内置示例：港区约 200k 面、室内约 12k 面。迭代流程见 `references/07-fidelity-loop.md`。

## 限制

- 适合硬表面场景（港口、仓库、街道、室内、基地），不适合角色、有机体、植被
- 程序化资产风格统一，但缺少唯一美术资产
- 体积雾默认关闭，需按场景调 `theme.volumetric`（0.02–0.08）
- 需要 WebGL2 与较新的浏览器

## 许可

MIT，见 [LICENSE](./LICENSE)。第三方依赖与许可见 [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md)。
