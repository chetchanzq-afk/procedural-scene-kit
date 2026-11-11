// 示例场景：一个港区堆场。生成新场景时替换本文件的布局即可，内核不用动。
import { registerCoreProps } from './props.js';

export function buildYard(kit) {
  const P = kit.state.theme.palette;
  registerCoreProps(kit.props, P);

  const L = kit.level;
  L.ground(P.concrete, 96, 84, 0);

  // ---- 后排围墙 ----
  for (let i = 0; i < 9; i++) {
    L.place('wall', -36 + i * 9, -34, { ry: 0, seed: i + 1 });
  }

  // ---- 集装箱阵列：三排，部分堆叠、部分转向 ----
  const rows = [-20, -7, 6];
  rows.forEach((z, r) => {
    for (let i = 0; i < 5; i++) {
      const x = -26 + i * 12.8;
      const turned = (i + r) % 3 === 0;
      L.place('container', x, z + (i % 2 ? 0.6 : -0.6), {
        ry: turned ? Math.PI / 2 : 0,
        seed: r * 10 + i + 1,
      });
      if ((i + r) % 4 === 1) {
        L.place('container', x, z - 0.4, { y: 2.59, ry: Math.PI / 2, seed: r * 20 + i });
      }
    }
  });

  // ---- 灯杆 ----
  for (const [x, z] of [[-32, -26], [32, -26], [-32, 16], [32, 16]]) {
    L.place('lightMast', x, z, { seed: x + z });
  }

  // ---- 货架与木箱 ----
  for (let i = 0; i < 3; i++) {
    L.place('rack', 16 + i * 3.4, 12, { ry: Math.PI, seed: i + 1 });
  }
  for (let i = 0; i < 6; i++) {
    L.place('crate', -14 + (i % 3) * 1.4, 15 + Math.floor(i / 3) * 1.2, { y: 0, ry: i * 0.4, seed: i + 3 });
  }
  for (let i = 0; i < 4; i++) {
    L.place('pallet', -18 + i * 1.6, 19, { seed: i + 7 });
  }

  // ---- 靠墙管道与空调外机 ----
  L.place('pipes', -6, -33.4, { seed: 2 });
  L.place('pipes', 6, -33.4, { seed: 5 });
  L.place('acUnit', -12, -33.2, { seed: 4 });
  L.place('acUnit', 12, -33.2, { seed: 6 });

  // ---- 防撞墩、指示牌、系缆桩 ----
  for (let i = 0; i < 7; i++) {
    L.place('barrier', -21 + i * 7, 24, { seed: i + 1 });
  }
  L.place('sign', -4, 22, { seed: 3 });
  L.place('sign', 20, 20, { ry: -0.5, seed: 9 });
  for (let i = 0; i < 6; i++) {
    L.place('bollard', -30 + i * 12, 30, { seed: i + 2 });
  }

  // ---- 检修通道 ----
  L.place('catwalk', 26, -12, { y: 0.9, ry: Math.PI / 2, seed: 2 });
  L.place('catwalk', 26, -8, { y: 0.9, ry: Math.PI / 2, seed: 4 });

  L.build();
  return L;
}
