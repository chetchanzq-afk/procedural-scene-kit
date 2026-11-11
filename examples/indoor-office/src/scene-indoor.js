// 白昼办公室布局。换场景时改这个文件与 props-indoor.js，内核不用动。
import { registerIndoorProps } from './props-indoor.js';

export function buildOffice(kit) {
  const P = kit.state.theme.palette;
  registerIndoorProps(kit.props, P);

  const L = kit.level;
  L.ground(P.floor, 19, 13, 0);

  // ---- 四面墙：远墙开窗，右墙开门 ----
  for (const x of [-6, 0, 6]) L.place('wall-window', x, -6, { seed: x + 20 });
  for (const x of [-6, 0, 6]) L.place('wall-solid', x, 6, { seed: x + 30 });

  L.place('wall-solid', -9, -3, { ry: Math.PI / 2, seed: 3 });
  L.place('wall-solid', -9, 3, { ry: Math.PI / 2, seed: 4 });
  L.place('wall-door', 9, -3, { ry: -Math.PI / 2, seed: 5 });
  L.place('wall-solid', 9, 3, { ry: -Math.PI / 2, seed: 6 });

  // ---- 天花板（含四盏顶灯）----
  L.place('ceiling', 0, 0, { y: 3.7, seed: 1 });

  // ---- 三张办公桌，朝向窗户 ----
  const deskX = [-4.6, -1.6, 1.4];
  deskX.forEach((x, i) => {
    L.place('desk', x, -1.2, { seed: i + 1 });
    L.place('chair', x, -0.25, { ry: Math.PI, seed: i + 4 });
    L.place('monitor', x - 0.1, -1.72, { y: 0.77, seed: i + 2 });
    if (i !== 1) L.place('deskLamp', x + 0.58, -1.55, { y: 0.77, seed: i + 3 });
  });

  // ---- 靠墙收纳 ----
  L.place('shelf', -8.4, -2.4, { ry: Math.PI / 2, seed: 2 });
  L.place('shelf', -8.4, 1.6, { ry: Math.PI / 2, seed: 5 });
  L.place('cabinet', 8.2, -3.6, { ry: -Math.PI / 2, seed: 4 });

  // ---- 杂项 ----
  L.place('boxStack', 7.2, 3.6, { seed: 6 });
  L.place('boxStack', 6.5, 4.3, { seed: 9 });
  L.place('duct', 2, 3.4, { y: 3.15, seed: 2 });

  // ---- 细节层：纸张、线槽、指示牌、插座、风口 ----
  L.place('papers', -4.2, -1.45, { y: 0.77, seed: 12 });
  L.place('papers', 1.75, -1.35, { y: 0.77, ry: 0.4, seed: 15 });
  L.place('cableTray', 0, -5.35, { y: 3.28, seed: 3 });
  L.place('cableTray', 0, 2.2, { y: 3.28, seed: 6 });
  L.place('wallSign', 8.84, 2.4, { y: 2.2, ry: -Math.PI / 2, seed: 4 });
  L.place('outlet', -8.82, -1.2, { y: 0.35, ry: Math.PI / 2, seed: 2 });
  L.place('outlet', -8.82, 2.0, { y: 0.35, ry: Math.PI / 2, seed: 5 });
  L.place('outlet', 8.82, 4.1, { y: 0.35, ry: -Math.PI / 2, seed: 7 });
  L.place('ceilingVent', -4, 1.2, { y: 3.58, seed: 3 });
  L.place('ceilingVent', 4, -1.5, { y: 3.58, seed: 8 });

  L.build();

  // ---- 体积光片：从三扇窗射入的光锥（比屏幕空间光柱更适合室内）----
  const beams = [
    { x: -6, w: 3.0, i: 0.2 },
    { x: 0, w: 3.2, i: 0.24 },
    { x: 6, w: 3.0, i: 0.2 },
  ];
  for (const b of beams) {
    kit.shafts.add({
      pos: [b.x, 2.05, -5.86],
      width: b.w,
      length: 7.6,
      dir: [-0.12, -0.42, 0.9],
      color: 0xfff4dc,
      intensity: b.i,
    });
  }

  return L;
}
