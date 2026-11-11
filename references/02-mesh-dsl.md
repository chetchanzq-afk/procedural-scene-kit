# 02 · 代码建模 DSL

所有模型由 `PropBuilder` 生成：用基本体拼装 → 合并 → 输出几何 + 碰撞盒。

## API

```js
props.define('name', {
  size: [w, h, d],              // 仅作元数据，便于布局与调试
  build(b, ctx) {
    b.push(0, 0, 0, ry);        // 进入局部坐标系（可选）
    b.box(color, w, h, d, x, y, z, opts);
    b.rbox(color, w, h, d, x, y, z, opts);   // 倒角盒，家具/设备用它
    b.cyl(color, rTop, rBot, h, x, y, z, opts);
    b.plane(color, w, h, x, y, z, opts);
    b.tube(color, [[x,y,z], ...], radius, opts);
    b.decal(color, w, h, x, y, z, opts);
    b.label(slot, w, h, x, y, z, opts);       // 图集贴花：箱号/警示/锈迹
    b.pop();
  },
});
```

`opts` 可用字段：

| 字段 | 作用 |
|---|---|
| `rx / ry / rz` | 局部旋转（弧度） |
| `seg` | 圆柱分段，默认 16；装饰件用 6–10 |
| `glow` | 写入 HDR 顶点色，交给 Bloom |
| `intensity` | 发光倍率，默认 3.2；灯头 4–6 |
| `collide` | 是否生成碰撞盒，默认 true；贴花/栏杆/装饰必须 false |

`b.rand()` 是带种子的随机数，同一个 `seed` 生成同一份几何。

## 坐标约定

- Y 向上，模型底部落在 `y = 0`
- 长边沿 X 轴（集装箱、管道、栏杆）
- 正面朝 +Z
- 旋转用 `ry`（绕 Y），不要用弧度以外的单位

## 什么时候用哪种体

| 形状 | 用法 |
|---|---|
| 箱体、墙体、面板 | `box`，最便宜 |
| 家具、设备、近景构件 | `rbox`，`r` 0.01–0.025、`seg` 2，边缘有高光转折 |
| 柱、管、桩 | `cyl`，`seg` 6–12 |
| 线缆、弯曲扶手 | `tube`，段数 ≤ 12 |
| 标牌、贴花、窗面 | `decal` 或薄 `box`，禁用零厚度平面 |
| 发光条、灯头 | `box/cyl` + `glow: true` |

## 碰撞盒规则

- 默认每个 `box/cyl` 生成一个世界空间 AABB，自动进入 `level.colliders`
- 薄片、贴花、栏杆、灯头必须 `collide: false`，否则会出现"空气墙"
- 需要精确碰撞时，在道具上提供 `colliders` 覆盖（数组，`[minX,minY,minZ,maxX,maxY,maxZ]`）
- 碰撞盒会随 `place()` 的位移/旋转/缩放一起变换

## 细节密度的正确做法

不要为"精致"堆高模，堆**小构件**：

```js
// 栏杆：立柱 + 两道横杆
for (let i = 0; i < 8; i++) b.cyl(P.metal, .04, .04, 1.05, -3 + i, .52, .5, { seg: 6, collide: false });
b.box(P.metal, 6, .05, .05, 0, 1.05, .5, { collide: false });
```

```js
// 集装箱瓦楞：9 道竖筋，单侧 9 个 box
for (let i = 0; i < 9; i++) b.box(c, .1, 2.4, .07, -6 + i * 1.35, 1.3, 1.25, { collide: false });
```

## 预算参考

| 构件 | 三角面 |
|---|---|
| 普通箱体 | 12 |
| 倒角盒 seg 2 | 300–800 |
| 圆柱 seg 12 | ~72 |
| 圆柱 seg 20 | ~120 |
| 集装箱（含瓦楞） | ~400 |
| tube 12 段 | ~300 |

单件超过 3000 面就要拆解或降段数。倒角只给近景构件用，远景继续用 `box`。

## 合并与拆分

- 全部静态件交给 `level.build()` 合并，最终 1–2 个 draw call
- **索引与非索引不能混并**：`rbox` 是非索引几何，内核的 `safeMerge` 会在合并前统一；自己写合并逻辑时必须先 `toNonIndexed()`
- 合并失败会抛出明确错误（属性不一致 / 索引不一致），不要吞掉异常
- 需要单独旋转/破坏的件（风机、门、机械臂）不要合并，单独建 `Group`
- 大量重复件（螺栓、栏杆柱）优先写进同一个道具的循环里，而不是摆放成百上千个实例

## 命名

道具名用 kebab-case，语义化：`container-40`、`wall-window`、`pipe-run`、`light-mast`。不要用 `box1`、`thing2`。
