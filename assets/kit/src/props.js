// 示例道具库：12 类硬表面构件。新场景照这个格式加自己的道具即可。
// 约定：build 里只画几何，尺寸用世界单位（米），碰撞盒自动取每个构件的包围盒。
export function registerCoreProps(props, P) {
  const pick = (b, arr) => arr[Math.floor(b.rand() * arr.length) % arr.length];

  // ---- 集装箱 ----
  props.define('container', {
    size: [12.19, 2.59, 2.44],
    build(b) {
      const L = 12.19; const H = 2.59; const W = 2.44;
      const c = pick(b, [P.containerA, P.containerB, P.containerC, P.containerD]);
      b.rbox(c, L, H, W, 0, H / 2, 0, { r: 0.035 });

      // 瓦楞：两侧各 11 道竖筋
      for (let i = 0; i < 11; i++) {
        const x = -L / 2 + (i + 0.5) * (L / 11);
        b.box(c, 0.1, H * 0.93, 0.07, x, H / 2, W / 2 + 0.035, { collide: false });
        b.box(c, 0.1, H * 0.93, 0.07, x, H / 2, -W / 2 - 0.035, { collide: false });
      }
      // 四角柱 + 顶部/底部导轨
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        b.box(P.darkMetal, 0.16, H, 0.16, sx * (L / 2 - 0.08), H / 2, sz * (W / 2 - 0.08), { collide: false });
      }
      for (const sz of [-1, 1]) {
        b.box(P.darkMetal, L, 0.1, 0.12, 0, 0.06, sz * (W / 2 - 0.02), { collide: false });
        b.box(P.darkMetal, L, 0.08, 0.1, 0, H - 0.04, sz * (W / 2 - 0.02), { collide: false });
      }
      // 门框、门闩
      b.box(P.darkMetal, 0.05, H * 0.96, W * 0.94, L / 2 + 0.02, H / 2, 0, { collide: false });
      for (let i = 0; i < 4; i++) {
        b.box(P.metal, 0.04, H * 0.9, 0.05, L / 2 + 0.05, H / 2, -W / 2 + 0.32 + i * 0.6, { collide: false });
      }
      // 锁杆：门侧四根圆柱
      for (let i = 0; i < 4; i++) {
        const z = -W / 2 + 0.32 + i * 0.6;
        b.cyl(P.metal, 0.026, 0.026, H * 0.9, L / 2 + 0.1, H / 2, z, { seg: 6, collide: false });
        b.box(P.darkMetal, 0.1, 0.14, 0.06, L / 2 + 0.08, 0.34, z, { collide: false });
      }
      // 铰链
      for (const y of [0.5, 1.35, 2.15]) {
        b.box(P.darkMetal, 0.07, 0.12, 0.16, L / 2 + 0.06, y, -W / 2 + 0.14, { collide: false });
      }
      // 八只角件
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0.1, H - 0.1]) {
        b.box(P.darkMetal, 0.24, 0.2, 0.24, sx * (L / 2 - 0.12), sy, sz * (W / 2 - 0.12), { collide: false });
      }
      // 叉车孔
      for (const sz of [-1, 1]) for (const x of [-3, 3]) {
        b.box(P.darkMetal, 0.95, 0.16, 0.08, x, 0.22, sz * (W / 2 + 0.02), { collide: false });
      }
      // 可读细节：箱号、港区标牌、危险条纹（抬高一点，避开竖筋与门闩）
      b.label(0, 1.8, 0.95, L / 2 + 0.1, H * 0.66, 0.4, { ry: Math.PI / 2 });
      b.label(5, 1.7, 0.5, L / 2 + 0.1, H * 0.42, -0.55, { ry: Math.PI / 2 });
      b.label(2, 1.6, 0.28, 0, H * 0.52, W / 2 + 0.1);
    },
  });

  // ---- 防撞墩 ----
  props.define('barrier', {
    size: [3, 0.9, 0.6],
    build(b) {
      b.box(P.concrete, 3, 0.3, 0.6, 0, 0.15, 0);
      b.box(P.concrete, 3, 0.42, 0.38, 0, 0.51, 0);
      b.box(P.hazard, 0.9, 0.1, 0.4, -0.6, 0.72, 0, { collide: false });
      b.box(P.hazard, 0.9, 0.1, 0.4, 0.6, 0.72, 0, { collide: false });
    },
  });

  // ---- 灯杆（带发光灯头）----
  props.define('lightMast', {
    size: [0.5, 14, 0.5],
    build(b) {
      b.cyl(P.darkMetal, 0.22, 0.3, 0.5, 0, 0.25, 0, { seg: 12 });
      b.cyl(P.metal, 0.1, 0.16, 13.2, 0, 6.9, 0, { seg: 12 });
      b.box(P.metal, 2.2, 0.12, 0.12, 1.0, 13.4, 0, { collide: false });
      b.box(P.darkMetal, 0.9, 0.18, 0.42, 2.0, 13.3, 0, { collide: false });
      b.box(P.glow, 0.8, 0.05, 0.34, 2.0, 13.2, 0, { glow: true, intensity: 4.5 });
      b.box(P.hazard, 1.6, 0.35, 0.02, 0, 1.6, 0.17, { collide: false });
    },
  });

  // ---- 货架 ----
  props.define('rack', {
    size: [2.7, 4.2, 1.1],
    build(b) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        b.cyl(P.metal, 0.06, 0.06, 4.2, sx * 1.3, 2.1, sz * 0.5, { seg: 8 });
      }
      for (let i = 0; i < 4; i++) {
        b.box(P.hazard, 2.7, 0.08, 1.1, 0, 0.35 + i * 1.25, 0, { collide: false });
      }
    },
  });

  // ---- 墙体（带壁柱与窗洞留白）----
  props.define('wall', {
    size: [8, 4.5, 0.4],
    build(b) {
      b.box(P.concrete, 8, 4.5, 0.4, 0, 2.25, 0);
      for (const x of [-4, 0, 4]) {
        b.box(P.paint, 0.35, 4.5, 0.62, x, 2.25, 0, { collide: false });
      }
      // 窗框：只做凹陷示意，真实开洞请拆成上下两段
      b.box(P.darkMetal, 2.2, 1.1, 0.1, -2, 3.0, 0.24, { collide: false });
      b.box(P.glass, 2.1, 1.0, 0.04, -2, 3.0, 0.28, { collide: false, glow: false });
      b.box(P.darkMetal, 2.2, 1.1, 0.1, 2, 3.0, 0.24, { collide: false });
      b.box(P.glass, 2.1, 1.0, 0.04, 2, 3.0, 0.28, { collide: false });
    },
  });

  // ---- 木箱 ----
  props.define('crate', {
    size: [1.1, 1, 0.9],
    build(b) {
      b.box(P.wood, 1.1, 1, 0.9, 0, 0.5, 0);
      for (const y of [0.12, 0.5, 0.88]) {
        b.box(P.darkMetal, 1.14, 0.07, 0.94, 0, y, 0, { collide: false });
      }
      b.decal(P.paint, 0.4, 0.22, 0.56, 0.72, 0.1, { ry: Math.PI / 2 });
    },
  });

  // ---- 管道 ----
  props.define('pipes', {
    size: [8, 0.6, 0.6],
    build(b) {
      b.cyl(P.metal, 0.16, 0.16, 8, 0, 2.2, 0, { seg: 12, rz: Math.PI / 2 });
      b.cyl(P.darkMetal, 0.2, 0.2, 0.18, -2.4, 2.2, 0, { seg: 12, rz: Math.PI / 2, collide: false });
      b.cyl(P.darkMetal, 0.2, 0.2, 0.18, 2.4, 2.2, 0, { seg: 12, rz: Math.PI / 2, collide: false });
      for (const x of [-3, 0, 3]) {
        b.cyl(P.darkMetal, 0.05, 0.05, 2.2, x, 1.1, 0, { seg: 8 });
        b.box(P.darkMetal, 0.12, 0.12, 0.5, x, 2.2, 0, { collide: false });
      }
      b.box(P.hazard, 0.6, 0.16, 0.02, 0.8, 2.2, 0.19, { collide: false });
    },
  });

  // ---- 指示牌 ----
  props.define('sign', {
    size: [1.2, 2.6, 0.2],
    build(b) {
      b.cyl(P.metal, 0.06, 0.06, 2.4, 0, 1.2, 0, { seg: 8 });
      b.box(P.paint, 1.2, 0.7, 0.06, 0, 2.1, 0.02, { collide: false });
      b.box(P.hazard, 1.0, 0.1, 0.02, 0, 2.24, 0.06, { collide: false });
      b.box(P.glow, 0.9, 0.04, 0.02, 0, 1.96, 0.06, { glow: true, intensity: 2.4 });
    },
  });

  // ---- 检修通道 ----
  props.define('catwalk', {
    size: [3, 1.3, 1.2],
    build(b) {
      b.box(P.darkMetal, 3, 0.1, 1.2, 0, 0, 0);
      for (let i = 0; i < 5; i++) {
        b.box(P.darkMetal, 0.06, 0.06, 1.2, -1.4 + i * 0.7, 0.08, 0, { collide: false });
      }
      for (const sx of [-1.45, 1.45]) {
        b.cyl(P.metal, 0.04, 0.04, 1.05, sx, 0.55, 0.55, { seg: 6, collide: false });
        b.cyl(P.metal, 0.04, 0.04, 1.05, sx, 0.55, -0.55, { seg: 6, collide: false });
      }
      b.box(P.metal, 3, 0.05, 0.05, 0, 1.05, 0.55, { collide: false });
      b.box(P.metal, 3, 0.05, 0.05, 0, 1.05, -0.55, { collide: false });
    },
  });

  // ---- 系缆桩 ----
  props.define('bollard', {
    size: [0.3, 0.9, 0.3],
    build(b) {
      b.cyl(P.darkMetal, 0.16, 0.2, 0.75, 0, 0.38, 0, { seg: 10 });
      b.cyl(P.metal, 0.22, 0.22, 0.1, 0, 0.8, 0, { seg: 10, collide: false });
    },
  });

  // ---- 空调外机 ----
  props.define('acUnit', {
    size: [1.4, 1.1, 0.6],
    build(b) {
      b.box(P.paint, 1.4, 1.1, 0.6, 0, 1.9, 0);
      b.cyl(P.darkMetal, 0.34, 0.34, 0.06, 0, 1.9, 0.33, { seg: 14, rx: Math.PI / 2, collide: false });
      b.cyl(P.metal, 0.28, 0.28, 0.04, 0, 1.9, 0.36, { seg: 12, rx: Math.PI / 2, collide: false });
      b.box(P.darkMetal, 1.4, 0.08, 0.62, 0, 2.4, 0, { collide: false });
      b.box(P.hazard, 0.5, 0.14, 0.02, -0.4, 1.6, 0.31, { collide: false });
    },
  });

  // ---- 托盘 ----
  props.define('pallet', {
    size: [1.2, 0.15, 1],
    build(b) {
      for (let i = 0; i < 5; i++) {
        b.box(P.wood, 1.2, 0.03, 0.16, 0, 0.13, -0.42 + i * 0.21, { collide: false });
      }
      for (const x of [-0.45, 0, 0.45]) {
        b.box(P.wood, 0.2, 0.1, 1, x, 0.06, 0);
      }
    },
  });

  // ---- 锥桶 ----
  props.define('cone', {
    size: [0.4, 0.7, 0.4],
    build(b) {
      b.box(P.scene || P.paint, 0.42, 0.04, 0.42, 0, 0.02, 0);
      b.cyl(P.hazard || P.paint, 0.03, 0.17, 0.58, 0, 0.33, 0, { seg: 12 });
      b.cyl(P.paint, 0.12, 0.14, 0.1, 0, 0.36, 0, { seg: 12, collide: false });
    },
  });

  // ---- 电缆盘 ----
  props.define('cableReel', {
    size: [1.4, 1.4, 0.9],
    build(b) {
      b.cyl(P.wood, 0.65, 0.65, 0.08, 0, 0.65, -0.3, { seg: 18, rx: Math.PI / 2 });
      b.cyl(P.wood, 0.65, 0.65, 0.08, 0, 0.65, 0.3, { seg: 18, rx: Math.PI / 2 });
      b.cyl(P.darkMetal, 0.12, 0.12, 0.7, 0, 0.65, 0, { seg: 10, rx: Math.PI / 2, collide: false });
      b.cyl(P.darkMetal, 0.5, 0.5, 0.5, 0, 0.65, 0, { seg: 18, rx: Math.PI / 2, collide: false });
      b.label(3, 0.5, 0.5, 0.42, 0.9, 0.31);
    },
  });
}
