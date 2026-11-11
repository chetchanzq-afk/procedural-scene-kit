# 03 · 程序化材质

没有贴图文件。颜色走顶点色，污渍/湿润/锈迹在 shader 里用噪声求值。

## 现成材质

| 材质 | 用途 | 特性 |
|---|---|---|
| `materials.paint` | 绝大多数构件 | 顶点色 + 污渍 + 竖向流痕 + 湿润反光 |
| `materials.glow` | 灯、屏幕、霓虹 | 顶点色当 HDR 输出（>1），交给 Bloom |
| `materials.ground` | 地面、水面 | 更粗糙，湿润时接近镜面 |

主题切换时 `setWetness()` / `setGrime()` 直接改全局 uniform，不需要重建几何。

注意：`MeshStandardMaterial` 的金属度与高光依赖环境贴图。内核在换主题时用天空渐变生成 IBL（`scene.environment`），否则夜景里所有金属面都会反射黑色，画面只剩发光条。新增材质时不要在未设置 `scene.environment` 的独立场景里使用高 metalness。

## 原理

`paint` 在 `MeshStandardMaterial` 上注入三段代码：

```js
// 顶点：传世界坐标
shader.vertexShader.replace('#include <begin_vertex>', `...
  vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);

// 片元：污渍与水痕
shader.fragmentShader.replace('#include <color_fragment>', `...
  float patchMask = smoothstep(0.42, 0.86, sl_fbm(vWPos.xz * 0.55 + vWPos.y * 0.33));
  float streak = smoothstep(0.52, 0.94, sl_fbm(vec2(vWPos.x * 3.1 + vWPos.z * 3.1, vWPos.y * 0.22)));
  diffuseColor.rgb *= mix(1.0, 0.58, grime);`);

// 片元：湿润区更光滑
shader.fragmentShader.replace('#include <roughnessmap_fragment>', `...
  roughnessFactor = mix(roughnessFactor, 0.06, uWet * wetMask);`);
```

关键点：**用世界坐标采样噪声**，同一材质贴到任意尺寸的构件上都不会拉伸，也不需要 UV 展开。

## 细节着色（v2）

`paint` 在 `color_fragment` / `roughnessmap_fragment` 里额外注入四层，全部按世界坐标求值：

| 层 | 做法 | 观感 |
|---|---|---|
| 构件色差 | 空间哈希做 0.86–1.02 的明度扰动 | 同款构件不再像复制粘贴 |
| 面板分缝 | `fract(vWPos / 1.2)` 取极窄边界并压暗 22% | 大面被切成板件 |
| 边缘磨损 | `fwidth(normal)` 检测法线突变并混入底色金属 | 转角露出底材，最"去塑料" |
| 粗糙度起伏 | 低频 fbm 调制 roughness + 磨损处更光滑 | 高光不再整片均匀 |

强度由 `materials.setDetail(v)` 控制，画质档位会自动设成 0.5 / 0.8 / 1.0。低档关闭可省一部分片元开销。

注意 `fwidth` 需要 WebGL2（本项目默认），且磨损阈值与几何尺度相关：构件普遍小于 10 cm 时把 `smoothstep(0.05, 0.2, ...)` 的区间调小。

## SSAO 与材质的关系

AO 由管线的深度重建完成，不依赖材质；但材质 roughness 越低，AO 的接触暗角越容易被高光盖住。室内场景建议 `metalness ≤ 0.25`、`roughness ≥ 0.5`，AO 才明显。

## 贴花图集（可读细节）

`materials.decal` 用一张 1024² 的 Canvas 图集，运行时绘制，不引入图片。槽位固定：

| slot | 内容 |
|---|---|
| 0 | 箱号 A-04 / PORT |
| 1 | 箱号 B-17 / BAY 2 |
| 2 | 黄黑危险条纹 |
| 3 | 危险（红底） |
| 4 | 禁止入内 |
| 5 | PORT 04 / KEEP CLEAR |
| 6 | 锈迹（径向渐变，透明） |
| 7 | 小心地滑 |

用法：

```js
b.label(0, 1.8, 0.95, L / 2 + 0.1, H * 0.66, 0.4, { ry: Math.PI / 2 });
```

- 偏移至少 0.09，否则会插进箱体竖筋或门闩，出现波浪状错位
- 宽度不要超过构件表面太多，跨度大时贴花会跨过肋条显得浮空
- 贴花单独合成一层 `labels` mesh（+1 draw call），不参与主体材质

## 无贴图配方

| 效果 | 做法 |
|---|---|
| 漆面磨损 | 低频 fbm 压暗颜色 + 轻微偏黄 |
| 锈迹流痕 | 竖向拉伸的噪声（`y * 0.2`）作为条纹 |
| 积水反光 | `uWet` 提高处把 roughness 压到 0.06 |
| 危险条纹 | 用几何画斜条，不用贴图 |
| 招牌文字 | 需要文字时用 Canvas 画一张，作为单独的 `CanvasTexture`，不要滥用 |
| 玻璃 | 低粗糙度 + 深色 + 轻微发光；真正的透明排序成本高，能省则省 |

## 新增材质

只有三类需要新增：透明玻璃、纯自发光屏幕、特殊地面。新增时遵守：

1. 优先复用 `paint`，用顶点色区分颜色
2. 需要不同粗糙度才新建材质，且必须同样注入 `vWPos`（否则污渍会随 UV 拉伸）
3. 新材质要在 `quality` 的低档里考虑降级（例如取消注入）

## 调试

- 画面全黑：先看控制台是否有 shader 编译错误
- 材质发灰：检查是否漏了 `vertexColors: true`，或颜色值没有写进 `color` 属性
- 污渍像"贴纸"：降低噪声频率、增大 `patchMask` 的 smoothstep 区间
- 全部过曝：检查 `exposure` 与 `uWet` 是否同时过高

## 禁止

- 引入 `TextureLoader` 加载图片
- 在片元里做循环超过 6 次的 fbm（移动端会掉帧）
- 在 shader 里用 `patch`、`input`、`output`、`filter`、`sample` 当变量名（GLSL 保留字，会导致整份材质编译失败）
