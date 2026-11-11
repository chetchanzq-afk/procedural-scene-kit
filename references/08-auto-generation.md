# 08 · 自动生成规程（从需求到高精度）

这份文件是给执行者（人或 agent）的操作手册：收到一句场景需求后，按阶段推进，每阶段有产物和验收，直到达到目标档位。

## 阶段 0：解析需求 → scene.spec.json

```json
{
  "title": "雨夜赛博小巷",
  "genre": "street",
  "time": "night",
  "weather": "rain",
  "scale": { "width": 24, "depth": 60, "height": 14 },
  "look": { "mood": "压抑", "keyColor": "#39d7e8", "ground": "wet" },
  "fidelity": { "tier": "high", "targetTris": 250000, "maxDrawCalls": 10 },
  "counts": { "props": 18, "instances": 120, "decals": 40 }
}
```

`fidelity.tier` 决定循环停止条件（见 07）。

## 阶段 1：主题与材质（场景不同 → 参数不同）

在 `themes.js` 写一个主题对象，必须包含：

| 字段 | 由什么决定 |
|---|---|
| `sun.dir / intensity / color` | 时间：清晨低角度、正午高角度、夜晚冷光 |
| `fog.color / density` | 天气与尺度：雨夜 0.01+，外景 0.006–0.008 |
| `env.* / env.intensity` | 环境：室内 0.9、夜景 1.3+、外景 0.7–0.9 |
| `wetness / grime` | 天气：雨天 0.9+、室内 0–0.2 |
| `post.bloom / saturation / vignette / ca / grain / dirt` | 风格：电影感低饱和、游戏感高饱和 |
| `palette` | 题材：工业冷灰、赛博高饱和、废墟低饱和 |

材质细节由全局 uniform 控制，不需要为每个场景改 shader：

- `uDetailScale`：纹理密度，室内 0.8–1.2，大外景 0.3–0.5
- `uDetail`：画质档位自动给 0.5 / 0.8 / 1.0
- `uWet / uGrime`：主题驱动

## 阶段 2：道具库（8–40 类，按档位）

每类道具的生成函数固定检查这五项：

1. 主体是否用 `rbox`（近景）并给合理倒角
2. 是否有结构件（瓦楞、导轨、法兰、支架、踢脚、线槽）
3. 是否有小件（螺栓、门闩、把手、标签、指示灯）
4. 是否有 1–3 处 `b.label()` 贴花
5. 碰撞盒是否只包主体（装饰件 `collide:false`）

面数参考见 07；平均每类 300–1500 三角面。

## 阶段 3：布局（密度优先）

- 同款变体 ≥ 3 种朝向/堆叠/配色
- 每 10 米至少 1 个可读构件（灯、牌、门、管道）
- 地面与墙面每 6–10 米放一处贴花或锈迹
- 杂物 10–30 件：锥桶、托盘、缆盘、纸张、瓶罐

## 阶段 4：光照与后期

按 04 校准；顺序固定：曝光 → 太阳 → 雾 → Bloom → 暗角 → 颗粒 → 镜头脏污。

室内/狭窄空间用 `kit.shafts.add()` 光片；外景且太阳可见时用 `theme.rays`。

## 阶段 5：验收与迭代

每轮必须记录：

```js
window.__stats()
// { calls, tris, programs, res, scale, quality, fps, ms, props, colliders, errors }
```

通过条件：

- `tris` 达到目标档位 ±20%
- `calls ≤ 10`，`errors = 0`
- 近景截图能看清贴花文字与倒角
- 低/中/高画质各跑一次，低档可运行
- 与上一轮截图对比，画面没有变糊、没有穿孔

未达标 → 回到阶段 2/3 继续加，不要靠调后期掩盖。

## 差距清单与实现状态

| 缺口 | 状态 | 落点 |
|---|---|---|
| 程序化贴花/文字 | ✅ 内置 | `materials.atlas` + `b.label()` |
| 三平面细节贴图 | ✅ 内置 | `materials.js` 的 `uDetailMap` |
| SSAO | ✅ 内置 | `pipeline.js` AO 通道 |
| 运动模糊 | ✅ 内置 | `pipeline.js` MOTION 通道 |
| 体积光（屏幕空间） | ✅ 内置 | `theme.rays` |
| 体积光（几何光片） | ✅ 内置 | `shafts.js` |
| AgX 色调映射 | ✅ 内置 | `pipeline.js` FINAL |
| 镜头脏污 | ✅ 内置 | Canvas 脏污图 + 太阳位置 |
| 眼适应（自动曝光） | ✅ 内置 | `pipeline.js` LUM 通道（强度已钳制 0.72–1.25） |
| FXAA | ✅ 内置 | `pipeline.js` FXAA 通道（AO 关 MSAA 后补锯齿） |
| 湿地面平面反射 | ✅ 内置 | `kit.js` 镜像相机 + `materials.ground` 采样 |
| 阴影图体积雾 | ⚠️ 内置但默认关 | `pipeline.js` VOL 通道；雾易发白，需按场景调 `theme.volumetric`（0.02–0.08） |

## 配方：自动曝光（眼适应）

1. 建 1×1 与 8×8 的 RT
2. 8×8 pass：对场景做 16 点采样求平均亮度（log2）
3. 1×1 pass：`lum = mix(prevLum, curLum, 1 - exp(-dt * 2))`，ping-pong
4. final 里 `exposure *= clamp(target / lum, 0.6, 1.6)`
5. 地下/室内切换时把适应速度降到 0.5，避免抽搐

## 配方：FXAA

在 final 之后加一个全屏 pass：

1. 采样中心亮度与上下左右
2. `lumaMin/lumaMax` 判断边缘
3. 沿亮度梯度方向做 1–2 像素混合
4. 与 AO 配合使用（AO 会关 MSAA）

## 配方：湿地面平面反射

1. 以地面 y=0 镜像相机：位置 y 取反，俯仰取反
2. 渲染到半分辨率 RT（排除地面自身）
3. 地面材质增加 `uReflection`，用屏幕投影 UV 采样
4. 按 `wetness` 与菲涅耳混合：正视角 15%，掠射 60%
5. 加一次垂直模糊，模拟水面扰动

## 配方：阴影图体积雾

1. 从主光视角渲染一张深度图（正交相机覆盖场景）
2. 全屏 raymarch：从相机沿视线步进 24–40 步，每步投影到光源空间比较深度
3. 累计被遮挡/未被遮挡的比例，乘以雾色与光色
4. 半分辨率 + 两次模糊后叠加
5. 移动端降步数到 8–12 或关闭

## 使用方式

新场景只需替换 `props.js`、`scene-*.js`、`themes.js`，其余内核与上述流程不变。执行者按阶段产出并在每轮记录 `__stats()` 与截图，直到达到 `fidelity.targetTris`。
