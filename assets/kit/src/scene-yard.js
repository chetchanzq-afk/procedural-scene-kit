// 示例场景：港区堆场。生成新场景时替换本文件的布局即可，内核不用动。
import { registerCoreProps } from './props.js';

export function buildYard(kit) {
  const P = kit.state.theme.palette;
  registerCoreProps(kit.props, P);

  const L = kit.level;
  L.ground(P.concrete, 110, 96, 0);

  // ---- 后排围墙 ----
  for (let i = 0; i < 11; i++) {
    L.place('wall', -45 + i * 9, -40, { ry: 0, seed: i + 1 });
  }

  // ---- 集装箱阵列：五排，七列，部分堆叠或转向 ----
  const rows = [-30, -17, -4, 9, 20];
  rows.forEach((z, r) => {
    for (let i = 0; i < 7; i++) {
      const x = -31 + i * 10.4;
      const turned = (i + r) % 3 === 0;
      L.place('container', x, z + (i % 2 ? 0.5 : -0.5), {
        ry: turned ? Math.PI / 2 : 0,
        seed: r * 13 + i + 1,
      });
      if ((i + r) % 3 === 1) {
        L.place('container', x, z - 0.3, { y: 2.59, ry: Math.PI / 2, seed: r * 29 + i });
      }
    }
  });

  // ---- 灯杆 ----
  for (const [x, z] of [[-42, -34], [42, -34], [-42, 24], [42, 24], [0, -34]]) {
    L.place('lightMast', x, z, { seed: x + z });
  }

  // ---- 货架、木箱、托盘 ----
  for (let i = 0; i < 4; i++) L.place('rack', 20 + i * 3.4, 30, { ry: Math.PI, seed: i + 1 });
  for (let i = 0; i < 9; i++) {
    L.place('crate', -20 + (i % 3) * 1.4, 34 + Math.floor(i / 3) * 1.3, { ry: i * 0.4, seed: i + 3 });
  }
  for (let i = 0; i < 6; i++) L.place('pallet', -26 + i * 1.7, 38, { seed: i + 7 });

  // ---- 靠墙管道、空调外机 ----
  L.place('pipes', -10, -39.4, { seed: 2 });
  L.place('pipes', 8, -39.4, { seed: 5 });
  L.place('acUnit', -18, -39.2, { seed: 4 });
  L.place('acUnit', 20, -39.2, { seed: 6 });

  // ---- 防撞墩、指示牌、系缆桩 ----
  for (let i = 0; i < 9; i++) L.place('barrier', -28 + i * 7, 40, { seed: i + 1 });
  L.place('sign', -6, 37, { seed: 3 });
  L.place('sign', 26, 34, { ry: -0.5, seed: 9 });
  for (let i = 0; i < 8; i++) L.place('bollard', -38 + i * 11, 46, { seed: i + 2 });

  // ---- 检修通道 ----
  L.place('catwalk', 34, -20, { y: 0.9, ry: Math.PI / 2, seed: 2 });
  L.place('catwalk', 34, -16, { y: 0.9, ry: Math.PI / 2, seed: 4 });

  // ---- 杂项密度：锥桶、电缆盘 ----
  const cones = [[-34, 12], [-30, 14], [-26, 15.5], [12, -24], [16, -22], [20, -20], [6, 26], [10, 28]];
  cones.forEach(([x, z], i) => L.place('cone', x, z, { seed: i + 1 }));
  L.place('cableReel', -14, 24, { seed: 2 });
  L.place('cableReel', -11.6, 25.6, { ry: 0.4, seed: 5 });
  L.place('cableReel', 24, 12, { ry: 1.2, seed: 8 });

  L.build();
  return L;
}
