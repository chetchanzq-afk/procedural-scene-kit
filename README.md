# Procedural Scene Kit

**用代码生成 3D 场景与电影感渲染，零外部资产文件。**
代码建模 · Canvas/shader 程序化贴图 · SSAO/Bloom/体积光 · 湿地面反射 · 动态分辨率

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![three.js](https://img.shields.io/badge/three.js-r180-black?style=flat-square)](https://threejs.org)

<!-- TODO: 替换为 assets/kit 示例运行截图（当前使用仓库内预览图） -->
![港区示例](assets/kit/preview.jpg)

本地运行一条命令即可看到示例场景，见下方「快速开始」。

---

## 🎯 解决什么问题

传统 Web 3D 场景依赖下载 `.glb` 模型和 `.png/.jpg` 贴图，带来三个问题：**资产体积大**、**加载慢**、**风格不统一且难以批量调整**。
Procedural Scene Kit 把模型、贴图、光照、后处理**全部放到运行时生成**，你只写代码，不碰素材文件。

> 适合：港口、仓库、街道、室内、基地等**硬表面场景**的快速原型与演示交付。
> 不适合：角色、有机体、植被等需要唯一美术资产的场景；体积雾默认关闭，需按场景手动调参（`theme.volumetric`，建议 0.02–0.08）。

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

## 作为起始工程使用

复制 `assets/kit/` 到你的项目，替换三处内容即可换场景：

- `src/props.js`：道具库
- `src/scene-*.js`：布局与相机
- `src/themes.js`：光照、雾、配色、后处理

内核（`kit / mesh / materials / pipeline / quality / shafts / weather`）不需要改。

<details>
<summary>作为 Agent Skill 使用</summary>

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

</details>

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

## 许可

MIT，见 [LICENSE](./LICENSE)。第三方依赖与许可见 [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md)。
