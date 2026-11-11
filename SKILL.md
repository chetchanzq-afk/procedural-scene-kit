---
name: procedural-scene-kit
description: 生成程序化 3D 场景与电影感渲染，含代码建模、程序化材质、光照与后处理。用户要新建或改造浏览器 3D 场景、需要不下载模型和贴图的实时场景时使用。不用于角色动画与影视级写实资产。
---

# 程序化 3D 场景生成

用代码生成模型与材质，不下载任何 glb / png / 音频。产物是可直接打开的单页 Three.js 项目，可截图验收。

## 适用范围

适用：工业场景、港口、仓库、街道、室内、基地、废墟、太空舱等硬表面环境；需要小体积、可离线、可程序化批量变化的实时场景。

不适用：角色、面部、有机体、植被、手绘贴图、影视级唯一资产。遇到这些需求，直接说明限制，改用 DCC 资产管线，不要硬套。

## 铁律

1. **资产即代码**：模型来自 `props.define()` 的生成函数，贴图来自 shader 求值，禁止引入外部资源文件。
2. **先参数，后几何**：任何场景先写 `scene.spec.json`，再写主题、道具、布局。不要边写边猜。
3. **一切合并**：静态几何在 `level.build()` 时合并成一个网格；只有需要单独动画的构件才拆开。
4. **可验收**：每个场景必须能通过 `__stats()` 与截图检查，不允许"看起来差不多"就交付。

## 精度能力

内核内置四层"廉价细节"，用它们把简单几何做出成片质感：

| 层 | 实现 | 作用 |
|---|---|---|
| 几何 | `b.rbox()` 倒角盒 | 家具、设备边缘在光下有厚度，不再是硬切塑料盒 |
| 表面 | 细节着色：构件色差、面板分缝、边缘磨损、粗糙度起伏 | 同一材质铺满全场景也不"平" |
| 光照 | 深度重建 SSAO（半分辨率、12 采样、两次模糊） | 物体与地面接触处产生暗角，物件"落地" |
| 体积光 | 室内用 `kit.shafts.add()` 光片；外景用屏幕空间径向光柱 | 窗光/霓虹渗入空间，画面有空气感 |
| 镜头 | 相机运动模糊（深度重投影，8 taps） | 移动时有电影感拖影，静止自动归零 |
| 贴花 | 运行时 Canvas 图集：箱号、警示牌、锈迹，`b.label(slot, ...)` | 近景有可读信息，不再是纯色盒子 |
| 贴图 | 三平面细节贴图（划痕/斑驳/颗粒），世界坐标采样 | 任意尺寸不拉伸，替代外部贴图 |
| 调色 | AgX 色调映射 + 镜头脏污 + 色差 + 暗角 + 颗粒 | 电影感基底，夜景不糊死 |
| 内容 | 每场景 8–16 类构件 + 10–30 件杂物 | 密度本身就是精细度 |

细节强度随画质档位自动调整：低档关闭 AO、体积光与运动模糊，细节降到 0.5。

## 细节爬坡

高精度要**分档迭代**，不是一次生成。目标档位与循环见 `references/07-fidelity-loop.md`：

| 档位 | 三角面 | 用途 |
|---|---|---|
| 草稿 | 20k–40k | 先定构图、光照、相机 |
| 标准 | 80k–150k | 可交付演示 |
| 高精度 | 200k–400k | 对标原项目 |

循环：基线截图 → 加结构 → 加贴花 → 加密度 → 加小件 → 复测，每轮对照上一轮截图；一般 2–3 轮到标准，4–6 轮到高精度。<br>用户说"精度不够"时，先看 `__stats().tris` 是否达标，再决定是加内容还是改渲染。

## 自动生成流程

收到场景需求后，按 `references/08-auto-generation.md` 独立跑完，不需要逐步确认：

1. 解析需求 → `scene.spec.json`（含 `fidelity.targetTris`）
2. 生成场景专属主题（时间/天气/风格 → 光、雾、湿、配色）
3. 按档位写道具库（结构件 + 小件 + 贴花）
4. 排布局（密度优先，同款至少 3 种变体）
5. 校准光照与后期
6. 循环验收：截图 + `__stats()`，未达标回到 3/4

未内置的通道（自动曝光、FXAA、湿地面反射、阴影体积雾）按 08 的配方实现后再接入管线。

## 六步流程

### 1. 写场景规格

按 `references/01-scene-spec.md` 产出 `scene.spec.json`：题材、时间、天气、尺度、主色、性能档、必备构件。这是后续所有参数的唯一来源。

### 2. 定主题

在 `src/themes.js` 增删主题对象：天空、雾、太阳、半球光、曝光、湿润度、污渍、后处理强度、调色板。一个主题只改参数，不动管线。

### 3. 写道具

在 `src/props.js` 用 DSL 定义 8–16 种构件。每种给出 `size`、`build(b)`、必要时 `colliders`。写法与预算见 `references/02-mesh-dsl.md`，常见构件直接套 `references/06-prop-recipes.md`。

### 4. 排布局

在 `src/scene-yard.js`（换项目时改名）用 `level.place()` / `level.row()` 摆放，最后调用 `level.build()` 合并。相机起点与朝向在同一处设定。

### 5. 调光与后期

按 `references/04-lighting-post.md` 校准太阳角度、雾密度、曝光、Bloom、暗角。光照决定"像不像"，后期只做收尾，不要用后期掩盖光照问题。

### 6. 验收

本地起服务，逐项检查：

```bash
python -m http.server 8877
```

- 打开 `http://127.0.0.1:8877/?q=high`，控制台无报错
- `__stats()` 的 `calls` ≤ 8、`tris` ≤ 300k、`errors` = 0
- 截图比对：`?shot&cam=x,y,z,tx,ty,tz`
- 三档画质各跑一次：`?q=low`、`?q=medium`、`?q=high`
- 动态分辨率生效：帧时高时 `scale` 应低于 1.0

门槛细节见 `references/05-performance.md`。

## 内核 API 速查

```js
import { createKit } from './kit.js';

const kit = createKit({ canvas, params });
kit.setTheme('neon-rain');

kit.props.define('cooling-tower', {
  size: [6, 9, 6],
  build(b) {
    b.cyl(P.metal, 3.2, 4.0, 9, 0, 4.5, 0, { seg: 20 });
    b.box(P.hazard, 1.2, 0.2, 0.1, 0, 7.2, 3.1, { collide: false });
  },
});

kit.level.ground(P.concrete, 80, 80, 0);
kit.level.place('cooling-tower', 0, -12, { ry: 0.3, seed: 4 });
kit.level.row('barrier', [-20, 10], [20, 10], 6);
kit.level.build();

kit.start();
```

- `b.box / b.rbox / b.cyl / b.tube / b.plane / b.decal`：画构件，`rbox` 是带倒角的盒体，家具优先用它
- `b.push(x,y,z,ry) / b.pop()`：进出局部坐标系
- `b.label(slot, w, h, x, y, z, { ry })`：贴花图集，slot 见 `references/03-materials.md`
- `glow: true`：顶点色写入 HDR（>1），由 Bloom 提亮
- `collide: false`：不生成碰撞盒（贴花、装饰件必加）
- `level.place` 的 `seed` 固定后结果可复现
- `kit.shafts.add({ pos, width, length, dir, color, intensity })`：加一束体积光片，室内窗光/灯口用它
- `?spin=1`：相机自动环绕，用于截图验收运动模糊

## 常见坑

- **GLSL 保留字**：变量不要叫 `patch`、`input`、`output`、`filter`、`sample`，否则整份材质编译失败，画面只剩背景。
- **合并要求属性一致**：所有几何都要有 `position/normal/uv/color`；自己造几何时补齐，否则 `mergeGeometries` 返回 null。
- **索引与非索引不能混并**：`rbox()` 生成的是非索引几何，道具级和关卡级合并前都必须统一（内核已用 `safeMerge` 处理，自定义合并时注意）。
- **AO 与 MSAA 互斥**：深度纹理不能挂在多重采样缓冲上，开 AO 时内核自动关 MSAA；需要抗锯齿请提高渲染倍率或加 FXAA。
- **阴影范围**：太阳阴影相机必须覆盖场景（默认 ±80），否则远处物体没有影子，会明显"飘"。
- **夜景欠曝**：夜间/室内主题必须给 `env`（渐变 IBL）并把 `env.intensity` 提到 1.2 以上、曝光提到 1.4 左右；只加发光件不补环境光，画面会黑到只剩灯条。
- **贴花 z-fighting**：用 0.012 厚度的小盒，不要用零厚度平面。
- **面数失控**：`tube` 与高分段 `cyl` 最贵，单件超过 3000 面就要警惕。
- **主题切换**：颜色在生成时烘进顶点色，换主题必须重建关卡（`kit.resetLevel()` 后再摆放）。

## 交付清单

- `index.html`、`src/kit.js`、`src/mesh.js`、`src/materials.js`、`src/pipeline.js`、`src/quality.js`、`src/shafts.js`、`src/themes.js`
- 本场景的 `src/props.js`、`src/scene-*.js`
- `scene.spec.json`
- 一张验收截图与 `__stats()` 输出

## 示例

- `assets/kit/`：港区堆场示例，演示主题切换、合批、动态分辨率
- `examples/indoor-office/`：白昼办公室示例，演示真开洞墙体、室内光照、SSAO、倒角家具与杂物密度

两个示例都能直接起服务运行：

```bash
cd assets/kit          # 或 examples/indoor-office
python -m http.server 8877
```

## 许可

代码与文档以 MIT 发布，见 `LICENSE`；第三方依赖见 `THIRD-PARTY-NOTICES.md`。技能不含任何外部美术资源，可离线部署（自行本地化 three.js 即可）。

## 参考文件

- `references/01-scene-spec.md` 需求到参数的映射与样例
- `references/02-mesh-dsl.md` 建模 DSL、命名与预算
- `references/03-materials.md` 程序化材质与无贴图配方
- `references/04-lighting-post.md` 光照、雾、后处理参数
- `references/05-performance.md` 性能门槛与降档策略
- `references/06-prop-recipes.md` 12 类构件配方
- `references/07-fidelity-loop.md` 细节分档与多轮迭代流程
- `references/08-auto-generation.md` 从需求到高精度的自动生成规程与差距配方
- `assets/kit/` 可运行内核与示例场景，新项目直接复制
