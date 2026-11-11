# 不同 Harness 的安装方式

本技能同时包含 `SKILL.md` 与可运行代码（`assets/kit`、`examples`），安装时**整个目录一起复制**，不要只拷贝 `SKILL.md`。

本文只讲「装到哪」。装完怎么触发、Agent 会走什么流程、怎么验收，见 README 的 **Use as an Agent Skill** 一节。

## Trae（CN / 国际版）

```bash
# CN
cp -r procedural-scene-kit ~/.trae-cn/skills/
# 国际版
cp -r procedural-scene-kit ~/.trae/skills/
```

项目级：`mkdir -p .trae/skills && cp -r procedural-scene-kit .trae/skills/`

验证：新开会话，技能列表出现「程序化 3D 场景生成」。

## Claude Code

```bash
cp -r procedural-scene-kit ~/.claude/skills/
# 或项目内
mkdir -p .claude/skills && cp -r procedural-scene-kit .claude/skills/
```

## Codex CLI

Codex 原生支持 `SKILL.md`，按作用域放置：

| 作用域 | 路径 |
|---|---|
| 项目级 | `<repo>/.agents/skills/procedural-scene-kit/` |
| 用户级 | `~/.agents/skills/procedural-scene-kit/` |
| 企业级 | `/etc/codex/skills/procedural-scene-kit/` |

```bash
mkdir -p .agents/skills
cp -r procedural-scene-kit .agents/skills/
```

Codex 会从当前目录向上扫描到仓库根。旧版本不支持 skills 目录时，在 `AGENTS.md` 引用：

```markdown
## 程序化 3D 场景
当用户要求生成或改造浏览器 3D 场景时，先阅读
`.agents/skills/procedural-scene-kit/SKILL.md`，按其六步流程与验收门槛执行。
```

## DeepSeek / 自研 harness

1. 把 `SKILL.md` 注入系统提示，`references/` 作为按需读取
2. 工具侧提供 `read_file` / `grep` / `shell`
3. 让模型在生成后运行示例并读取 `window.__stats()` 验收

## 不装技能，只当起始工程

不需要 Agent 时，直接复制 `assets/kit/` 到任意静态项目，起一个静态服务器即可运行。

## 通用注意事项

- 目录名保持 `procedural-scene-kit`
- `assets/kit` 与 `examples` 通过 importmap 从 CDN 加载 three.js，离线需本地化
- 不要把本地的 `screenshots/`、`*.jsonl` 一起提交
