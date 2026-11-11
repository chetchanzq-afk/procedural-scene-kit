# 06 · 构件配方

12 类可直接改用的硬表面构件。全部假设 Y 向上、底部在 y=0、正面朝 +Z。

## 1. 集装箱

```js
b.box(c, 12.19, 2.59, 2.44, 0, 1.295, 0);
for (let i = 0; i < 9; i++) {
  const x = -6.1 + (i + 0.5) * 1.35;
  b.box(c, .1, 2.4, .07, x, 1.3, 1.25, { collide: false });
}
```

要点：瓦楞只做可见面，内侧省略；角柱用深色区分。

## 2. 带窗洞的墙

不要用"一块墙 + 一块玻璃"，要把墙拆成四块，窗洞才是真的洞：

```js
const H = 4.5, W = 8, D = 0.4, wx = 2.2, wy = 1.1, cy = 3.0;
b.box(P.concrete, W, cy - wy / 2, D, 0, (cy - wy / 2) / 2, 0);          // 下
b.box(P.concrete, W, H - cy - wy / 2, D, 0, (H + cy + wy / 2) / 2, 0);  // 上
b.box(P.concrete, (W - wx) / 2, wy, D, -(W + wx) / 4, cy, 0);           // 左
b.box(P.concrete, (W - wx) / 2, wy, D, (W + wx) / 4, cy, 0);            // 右
b.box(P.darkMetal, wx, 0.08, D + 0.1, 0, cy - wy / 2, 0, { collide: false });
```

## 3. 楼梯

```js
const steps = 12, rise = 0.18, run = 0.28;
for (let i = 0; i < steps; i++) {
  b.box(P.concrete, 1.4, rise, run, 0, rise * (i + 0.5), -i * run);
}
```

两侧加扶手时用 `cyl` + `ry` 旋转；碰撞盒会自动覆盖每级踏步。

## 4. 栏杆

```js
for (let i = 0; i < 8; i++) b.cyl(P.metal, .04, .04, 1.05, -3 + i, .52, .5, { seg: 6, collide: false });
b.box(P.metal, 6, .05, .05, 0, 1.05, .5, { collide: false });
b.box(P.metal, 6, .03, .03, 0, .55, .5, { collide: false });
```

栏杆必须 `collide: false`，否则会形成看不见的墙。

## 5. 管道

```js
b.cyl(P.metal, .16, .16, 8, 0, 2.2, 0, { seg: 12, rz: Math.PI / 2 });
b.cyl(P.darkMetal, .2, .2, .18, -2.4, 2.2, 0, { seg: 12, rz: Math.PI / 2, collide: false });
for (const x of [-3, 0, 3]) b.cyl(P.darkMetal, .05, .05, 2.2, x, 1.1, 0, { seg: 6 });
```

法兰盘与支架是"精细感"的来源，成本极低。

## 6. 货架

```js
for (const sx of [-1, 1]) for (const sz of [-1, 1])
  b.cyl(P.metal, .06, .06, 4.2, sx * 1.3, 2.1, sz * .5, { seg: 8 });
for (let i = 0; i < 4; i++) b.box(P.hazard, 2.7, .08, 1.1, 0, .35 + i * 1.25, 0, { collide: false });
```

## 7. 灯杆

```js
b.cyl(P.metal, .1, .16, 13.2, 0, 6.9, 0, { seg: 12 });
b.box(P.metal, 2.2, .12, .12, 1.0, 13.4, 0, { collide: false });
b.box(P.glow, .8, .05, .34, 2.0, 13.2, 0, { glow: true, intensity: 4.5 });
```

灯杆是画面里最重要的"垂直线"，成对布置能立刻撑起空间感。

## 8. 检修通道

```js
b.box(P.darkMetal, 3, .1, 1.2, 0, 0, 0);
for (const sx of [-1.45, 1.45])
  for (const sz of [-.55, .55]) b.cyl(P.metal, .04, .04, 1.05, sx, .55, sz, { seg: 6, collide: false });
b.box(P.metal, 3, .05, .05, 0, 1.05, .55, { collide: false });
```

## 9. 指示牌

```js
b.cyl(P.metal, .06, .06, 2.4, 0, 1.2, 0, { seg: 8 });
b.box(P.paint, 1.2, .7, .06, 0, 2.1, .02, { collide: false });
b.box(P.glow, .9, .04, .02, 0, 1.96, .06, { glow: true, intensity: 2.4 });
```

霓虹场景把 `glow` 强度提到 5–6，Bloom 会自然做出光晕。

## 10. 系缆桩 / 隔离柱

```js
b.cyl(P.darkMetal, .16, .2, .75, 0, .375, 0, { seg: 10 });
b.cyl(P.metal, .22, .22, .1, 0, .8, 0, { seg: 10, collide: false });
```

成排布置在边界，能快速建立"区域感"。

## 11. 空调外机

```js
b.box(P.paint, 1.4, 1.1, .6, 0, 1.9, 0);
b.cyl(P.darkMetal, .34, .34, .06, 0, 1.9, .33, { seg: 14, rx: Math.PI / 2, collide: false });
```

墙面的"机械凸起"比纯平墙更耐看，成本只有几十面。

## 12. 托盘 / 木箱

```js
for (let i = 0; i < 5; i++) b.box(P.wood, 1.2, .03, .16, 0, .13, -.42 + i * .21, { collide: false });
for (const x of [-.45, 0, .45]) b.box(P.wood, .2, .1, 1, x, .06, 0);
```

堆叠时用 `place(..., { y: 0.15 })`，不要改生成函数里的高度。

## 13. 室内外壳（墙 / 门窗 / 天花板）

室内场景先把"壳"做对，家具才有意义。墙必须是**真开洞**：把一面墙拆成上下左右四块。

```js
// 带窗墙：6 × 3.6 × 0.3，窗洞 3.2 × 1.8，中心离地 2.05
const W = 6, H = 3.6, D = 0.3, wx = 3.2, wy = 1.8, cy = 2.05;
b.box(P.wall, W, cy - wy / 2, D, 0, (cy - wy / 2) / 2, 0);          // 窗下
b.box(P.wall, W, H - cy - wy / 2, D, 0, (H + cy + wy / 2) / 2, 0);  // 窗上
b.box(P.wall, (W - wx) / 2, wy, D, -(W + wx) / 4, cy, 0);           // 左
b.box(P.wall, (W - wx) / 2, wy, D, (W + wx) / 4, cy, 0);            // 右
b.box(P.glass, wx - 0.06, wy - 0.06, 0.02, 0, cy, 0,                // 玻璃用发光件
  { glow: true, intensity: 1.25, collide: false });
```

```js
// 带门墙：门洞 1.1 × 2.3，门板略内凹
b.box(P.wall, (W - dw) / 2, H, D, -(W + dw) / 4, H / 2, 0);
b.box(P.wall, (W - dw) / 2, H, D, (W + dw) / 4, H / 2, 0);
b.box(P.wall, dw, H - dh, D, 0, (H + dh) / 2, 0);
```

```js
// 天花板 + 顶灯（place 时 y 给 3.7，让底面对齐 3.6）
b.box(P.ceiling, 18, 0.2, 12, 0, 0, 0, { collide: false });
b.box(P.glow, 1.3, 0.03, 0.28, x, -0.2, z, { glow: true, intensity: 1.2, collide: false });
```

要点：

- 玻璃不要用透明材质，用 `glow` 的浅色薄板模拟室外天光，既便宜又不挡阳光
- 太阳 `dir` 要指向窗户内侧，`shadow.size` 给 12–18，门框窗挺的投影才清楚
- 天花板必须 `collide: false`，否则头顶会有隐形碰撞
- 墙面颜色不要纯白，`#dad5c6` 这类暖灰在 ACES 下才不会一片惨白

## 组合建议

- 每种场景 8–14 种构件足够，靠**数量与排布**制造密度
- 每 3–4 个同色构件插入一个异色件（`hazard` / `accent`），画面才不会糊
- 垂直线（灯杆、管道、栏杆）与水平线（集装箱、通道）比例约 1:3 最稳
