// 室内道具库：墙体模块、天花板、办公家具、设备。
// 约定：底部落在 y=0，正面朝 +Z，尺寸用米。
export function registerIndoorProps(props, P) {
  // ---- 带窗墙（真开洞）----
  props.define('wall-window', {
    size: [6, 3.6, 0.3],
    build(b) {
      const W = 6, H = 3.6, D = 0.3, wx = 3.2, wy = 1.8, cy = 2.05;
      b.box(P.wall, W, cy - wy / 2, D, 0, (cy - wy / 2) / 2, 0);
      b.box(P.wall, W, H - (cy + wy / 2), D, 0, (H + cy + wy / 2) / 2, 0);
      b.box(P.wall, (W - wx) / 2, wy, D, -(W + wx) / 4, cy, 0);
      b.box(P.wall, (W - wx) / 2, wy, D, (W + wx) / 4, cy, 0);

      // 窗台
      b.box(P.trim, wx + 0.3, 0.09, D + 0.24, 0, cy - wy / 2 - 0.045, 0, { collide: false });
      // 窗框
      b.box(P.darkMetal, wx + 0.08, 0.08, D + 0.05, 0, cy - wy / 2, 0, { collide: false });
      b.box(P.darkMetal, wx + 0.08, 0.08, D + 0.05, 0, cy + wy / 2, 0, { collide: false });
      b.box(P.darkMetal, 0.08, wy, D + 0.05, -wx / 2, cy, 0, { collide: false });
      b.box(P.darkMetal, 0.08, wy, D + 0.05, wx / 2, cy, 0, { collide: false });
      b.box(P.darkMetal, 0.05, wy, 0.05, 0, cy, 0, { collide: false });
      // 玻璃：用发光件模拟室外天光，同时不遮挡阳光
      b.box(P.glass, wx - 0.06, wy - 0.06, 0.02, 0, cy, 0, { glow: true, intensity: 1.6, collide: false });
    },
  });

  // ---- 实墙 ----
  props.define('wall-solid', {
    size: [6, 3.6, 0.3],
    build(b) {
      b.box(P.wall, 6, 3.6, 0.3, 0, 1.8, 0);
      b.box(P.trim, 6, 0.12, 0.36, 0, 0.06, 0, { collide: false });
      b.box(P.trim, 6, 0.05, 0.36, 0, 3.55, 0, { collide: false });
      b.decal(P.trim, 1.2, 0.5, -1.6, 2.2, 0.16);
    },
  });

  // ---- 带门墙 ----
  props.define('wall-door', {
    size: [6, 3.6, 0.3],
    build(b) {
      const W = 6, H = 3.6, D = 0.3, dw = 1.1, dh = 2.3;
      b.box(P.wall, (W - dw) / 2, H, D, -(W + dw) / 4, H / 2, 0);
      b.box(P.wall, (W - dw) / 2, H, D, (W + dw) / 4, H / 2, 0);
      b.box(P.wall, dw, H - dh, D, 0, (H + dh) / 2, 0);

      // 门框
      b.box(P.trim, dw + 0.12, 0.08, D + 0.06, 0, dh, 0, { collide: false });
      b.box(P.trim, 0.08, dh, D + 0.06, -dw / 2, dh / 2, 0, { collide: false });
      b.box(P.trim, 0.08, dh, D + 0.06, dw / 2, dh / 2, 0, { collide: false });
      // 门板与把手
      b.box(P.wood, dw - 0.06, dh - 0.04, 0.07, 0, dh / 2, 0.06);
      b.cyl(P.metal, 0.03, 0.03, 0.22, dw / 2 - 0.2, 1.05, 0.14, { seg: 8, rz: Math.PI / 2, collide: false });
      // 门牌
      b.decal(P.hazard, 0.32, 0.14, 0, 2.55, 0.16);
    },
  });

  // ---- 天花板 + 顶灯 ----
  props.define('ceiling', {
    size: [18, 0.2, 12],
    build(b) {
      b.box(P.ceiling, 18, 0.2, 12, 0, 0, 0, { collide: false });
      for (const [x, z] of [[-5, -3], [5, -3], [-5, 3], [5, 3]]) {
        b.box(P.darkMetal, 1.4, 0.08, 0.36, x, -0.15, z, { collide: false });
        b.box(P.glow, 1.3, 0.03, 0.28, x, -0.2, z, { glow: true, intensity: 1.2, collide: false });
      }
    },
  });

  // ---- 办公桌 ----
  props.define('desk', {
    size: [1.8, 0.75, 0.8],
    build(b) {
      b.rbox(P.wood, 1.8, 0.06, 0.8, 0, 0.74, 0, { r: 0.014 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        b.rbox(P.darkMetal, 0.06, 0.72, 0.06, sx * 0.82, 0.36, sz * 0.32, { r: 0.01 });
      }
      b.box(P.trim, 1.7, 0.5, 0.04, 0, 0.45, 0.36, { collide: false });
      // 抽屉柜
      b.rbox(P.trim, 0.42, 0.62, 0.7, 0.62, 0.32, 0, { r: 0.012 });
      for (let i = 0; i < 3; i++) {
        b.box(P.darkMetal, 0.36, 0.02, 0.02, 0.62, 0.18 + i * 0.2, 0.36, { collide: false });
      }
      // 键盘、马克杯、文件
      b.rbox(P.darkMetal, 0.5, 0.02, 0.16, -0.2, 0.78, 0.16, { r: 0.006, collide: false });
      b.cyl(P.paper, 0.045, 0.04, 0.1, 0.42, 0.82, 0.12, { seg: 10, collide: false });
      b.box(P.paper, 0.32, 0.02, 0.24, -0.62, 0.78, -0.1, { collide: false });
    },
  });

  // ---- 椅子 ----
  props.define('chair', {
    size: [0.5, 1.05, 0.5],
    build(b) {
      b.box(P.fabric, 0.5, 0.07, 0.48, 0, 0.46, 0);
      b.box(P.fabric, 0.48, 0.55, 0.06, 0, 0.76, -0.21);
      b.cyl(P.darkMetal, 0.04, 0.04, 0.42, 0, 0.23, 0, { seg: 8 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        b.box(P.darkMetal, 0.05, 0.42, 0.05, sx * 0.2, 0.21, sz * 0.18);
      }
      b.box(P.darkMetal, 0.46, 0.03, 0.46, 0, 0.02, 0, { collide: false });
    },
  });

  // ---- 货架 ----
  props.define('shelf', {
    size: [2.4, 2.0, 0.4],
    build(b) {
      const W = 2.4, H = 2.0, D = 0.4;
      b.box(P.wood, 0.05, H, D, -W / 2, H / 2, 0);
      b.box(P.wood, 0.05, H, D, W / 2, H / 2, 0);
      b.box(P.wood, W, 0.05, D, 0, 0.025, 0);
      b.box(P.trim, W, 0.03, D, 0, H, 0, { collide: false });
      for (let i = 0; i < 3; i++) b.box(P.wood, W, 0.04, D, 0, 0.5 + i * 0.5, 0, { collide: false });
      // 箱子与文件
      for (let i = 0; i < 5; i++) {
        b.box(i % 2 ? P.cardboard : P.trim, 0.3, 0.26, 0.3, -0.85 + i * 0.42, 0.55, 0, { collide: false });
      }
      for (let i = 0; i < 4; i++) {
        b.box(i % 2 ? P.paper : P.cardboard, 0.32, 0.2, 0.28, -0.6 + i * 0.4, 1.04, 0, { collide: false });
      }
    },
  });

  // ---- 文件柜 ----
  props.define('cabinet', {
    size: [1.2, 1.8, 0.5],
    build(b) {
      b.rbox(P.trim, 1.2, 1.8, 0.5, 0, 0.9, 0, { r: 0.016 });
      for (const sx of [-0.3, 0.3]) {
        b.box(P.darkMetal, 0.56, 1.68, 0.02, sx, 0.92, 0.26, { collide: false });
        b.cyl(P.metal, 0.02, 0.02, 0.16, sx + 0.18, 1.0, 0.29, { seg: 6, collide: false });
      }
      b.decal(P.paper, 0.3, 0.12, 0, 1.62, 0.27);
    },
  });

  // ---- 显示器 ----
  props.define('monitor', {
    size: [0.8, 0.55, 0.3],
    build(b) {
      b.box(P.darkMetal, 0.34, 0.02, 0.2, 0, 0.01, 0, { collide: false });
      b.box(P.metal, 0.05, 0.2, 0.05, 0, 0.12, 0, { collide: false });
      b.rbox(P.darkMetal, 0.78, 0.46, 0.04, 0, 0.45, 0, { r: 0.01, collide: false });
      b.box(P.screen, 0.72, 0.4, 0.01, 0, 0.45, 0.026, { glow: true, intensity: 1.2, collide: false });
      b.box(P.darkMetal, 0.16, 0.02, 0.1, 0, 0.02, 0.12, { collide: false });
    },
  });

  // ---- 风管 ----
  props.define('duct', {
    size: [0.6, 0.45, 5],
    build(b) {
      b.box(P.metal, 0.6, 0.45, 5, 0, 0, 0, { collide: false });
      for (let i = 0; i < 10; i++) {
        b.box(P.darkMetal, 0.5, 0.02, 0.06, 0, -0.235, -2.2 + i * 0.5, { collide: false });
      }
      for (const z of [-2, 0, 2]) {
        b.box(P.darkMetal, 0.66, 0.03, 0.06, 0, 0.18, z, { collide: false });
      }
    },
  });

  // ---- 纸箱堆 ----
  props.define('boxStack', {
    size: [0.75, 0.9, 0.55],
    build(b) {
      b.box(P.cardboard, 0.7, 0.5, 0.5, 0, 0.25, 0);
      b.box(P.cardboard, 0.55, 0.4, 0.45, 0.05, 0.7, -0.02);
      b.box(P.paper, 0.72, 0.06, 0.06, 0, 0.5, 0, { collide: false });
    },
  });

  // ---- 台灯 ----
  props.define('deskLamp', {
    size: [0.35, 0.5, 0.2],
    build(b) {
      b.cyl(P.darkMetal, 0.12, 0.14, 0.03, 0, 0.015, 0, { seg: 12 });
      b.cyl(P.metal, 0.025, 0.025, 0.42, 0, 0.23, 0, { seg: 8 });
      b.box(P.metal, 0.32, 0.03, 0.03, 0.13, 0.44, 0, { collide: false });
      b.cyl(P.darkMetal, 0.09, 0.11, 0.12, 0.27, 0.4, 0, { seg: 10, rx: 0.4, collide: false });
      b.cyl(P.glow, 0.085, 0.085, 0.02, 0.27, 0.34, 0, { seg: 10, glow: true, intensity: 1.6, collide: false });
    },
  });

  // ---- 纸张 ----
  props.define('papers', {
    size: [0.3, 0.03, 0.22],
    build(b) {
      b.box(P.paper, 0.3, 0.02, 0.22, 0, 0.01, 0);
      b.box(P.paper, 0.28, 0.006, 0.2, 0.02, 0.024, 0.01, { ry: 0.18, collide: false });
    },
  });

  // ---- 线槽（带电缆）----
  props.define('cableTray', {
    size: [3, 0.14, 0.3],
    build(b) {
      b.box(P.metal, 3, 0.04, 0.3, 0, 0, 0, { collide: false });
      b.box(P.darkMetal, 3, 0.06, 0.02, 0, 0.05, 0.15, { collide: false });
      b.box(P.darkMetal, 3, 0.06, 0.02, 0, 0.05, -0.15, { collide: false });
      for (let i = 0; i < 5; i++) {
        b.cyl(P.darkMetal, 0.02, 0.02, 0.3, -1.2 + i * 0.6, -0.09, 0, { seg: 6, rz: Math.PI / 2, collide: false });
      }
      b.tube(P.darkMetal, [[-1.5, 0.04, 0.06], [0, 0.06, -0.04], [1.5, 0.04, 0.05]], 0.012, { seg: 16, radial: 4 });
    },
  });

  // ---- 墙面指示牌 ----
  props.define('wallSign', {
    size: [0.9, 0.3, 0.06],
    build(b) {
      b.rbox(P.darkMetal, 0.9, 0.3, 0.05, 0, 0, 0, { r: 0.01 });
      b.box(P.glow, 0.8, 0.2, 0.01, 0, 0, 0.03, { glow: true, intensity: 1.1, collide: false });
    },
  });

  // ---- 墙面插座 ----
  props.define('outlet', {
    size: [0.12, 0.18, 0.03],
    build(b) {
      b.rbox(P.paper, 0.12, 0.18, 0.02, 0, 0, 0, { r: 0.006, collide: false });
      b.box(P.darkMetal, 0.05, 0.04, 0.01, 0, 0.03, 0.015, { collide: false });
      b.box(P.darkMetal, 0.05, 0.04, 0.01, 0, -0.03, 0.015, { collide: false });
    },
  });

  // ---- 天花板风口 ----
  props.define('ceilingVent', {
    size: [0.6, 0.06, 0.6],
    build(b) {
      b.box(P.metal, 0.6, 0.05, 0.6, 0, 0, 0, { collide: false });
      for (let i = 0; i < 6; i++) {
        b.box(P.darkMetal, 0.5, 0.02, 0.04, 0, -0.03, -0.22 + i * 0.09, { collide: false });
      }
    },
  });
}
