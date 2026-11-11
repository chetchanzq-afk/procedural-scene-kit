# 开源发布清单

## 1. 仓库元数据

| 项 | 建议值 |
|---|---|
| 仓库名 | `procedural-scene-kit` |
| 描述 | Procedural 3D scenes for the web with code-generated assets, film-look post FX, and quality scaling |
| Topics | `threejs`, `procedural-generation`, `webgl`, `agent-skill`, `level-design`, `game-dev`, `post-processing` |
| 默认分支 | `main` |
| 许可 | MIT |
| 首个版本 | `v0.1.0` |

## 2. 发布前检查

- [ ] 无内部业务信息、账号、域名
- [ ] 无录制产物或本地截图（`screenshots/`、`*.jsonl`）
- [ ] `SKILL.md` frontmatter 可解析，`name` 与目录名一致
- [ ] 两个示例能直接起服务运行，`__stats().errors === 0`
- [ ] 示例中的 three.js 均通过 CDN importmap 引入，未 vendored
- [ ] `THIRD-PARTY-NOTICES.md` 与实际依赖一致

自检命令：

```bash
grep -rniE "internal-host|company-name|/Users/[^/]+|C:\\\\Users" . | grep -v THIRD-PARTY || echo "clean"
find . -name "*.jsonl" -o -name "screenshots" -o -name "frames" | grep . && echo "remove" || echo "clean"
```

## 3. 示例验收

```bash
cd assets/kit && python -m http.server 8877 &
# 打开 /?q=high，确认画面与 HUD
cd examples/indoor-office && python -m http.server 8878 &
```

记录每个示例的 `__stats()` 输出，写进 README 或 release notes。

## 4. 初始化与发布

```bash
cd procedural-scene-kit
git init
git add .
git commit -m "feat: initial release of procedural scene kit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

## 5. 后续更新约定

- 新通道/新道具/新主题：minor
- 参数与文档修正：patch
- 破坏性 API 调整：major
- 每次发布附一张示例截图与 `__stats()`，便于回归对比

## 6. Issue 模板建议

- **场景生成问题**：附 `scene.spec.json`、`__stats()`、截图
- **性能问题**：附设备/浏览器、画质档位、帧时
- **渲染异常**：附控制台报错与 `window.__errors`
