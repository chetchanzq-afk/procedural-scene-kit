// 演示录制模式：30 秒自动时间轴，切主题 + 推机位，打开 demo.html 直接录屏。
// 参数：?q=high 画质 · ?start=2 从第 3 段开始 · ?t=12 冻结在第 12 秒 · ?loop 循环 · ?clean 隐藏字幕
import { createKit } from './kit.js';
import { buildYard } from './scene-yard.js';

const params = {};
for (const [k, v] of new URLSearchParams(location.search)) {
  params[k] = v === '' ? '1' : v;
}

const canvas = document.getElementById('view');
// shot=1 关掉鼠标控制，机位完全交给时间轴
const kit = createKit({ canvas, params: { ...params, shot: '1' } });

// 每段：起始时间、主题、机位与视线（起 → 止）、字幕
// 同一机位换主题是这支片子的核心卖点：几何不动，只换光照与调色
const SHOTS = [
  {
    t: 0,
    theme: 'neon-rain',
    title: 'Rainy night · port',
    from: { pos: [-52, 12, 54], look: [0, 4, -4] },
    to: { pos: [-30, 7, 34], look: [1, 4, -4] },
  },
  {
    t: 7,
    theme: 'port-day',
    title: 'Same layout · new light',
    from: { pos: [-30, 7, 34], look: [1, 4, -4] },
    to: { pos: [-30, 6.4, 33], look: [1, 3.8, -5] },
  },
  {
    t: 13,
    theme: 'neon-rain',
    title: 'Rain · low angle',
    from: { pos: [-40, 1.6, 30], look: [0, 2.4, 10] },
    to: { pos: [-16, 1.8, 24], look: [2, 2.6, 6] },
  },
  {
    t: 19.5,
    theme: 'port-day',
    title: 'Zero asset files',
    from: { pos: [-22, 8, 38], look: [0, 4, -6] },
    to: { pos: [-50, 15, 60], look: [0, 4, -6] },
  },
];

const END = 25.5;
const FADE_IN = 1.0;
const FADE_OUT = 1.2;
const clean = !!params.clean;
// ?t=12 冻结在某一秒，用于出静帧或校验机位
const freeze = params.t !== undefined ? Math.max(0, Math.min(END, Number(params.t) || 0)) : null;

const fadeEl = document.getElementById('fade');
const titleEl = document.getElementById('shot-title');
const statEl = document.getElementById('stat');

const ease = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

function setLook([x, y, z]) {
  const p = kit.camera.position;
  const dx = x - p.x;
  const dy = y - p.y;
  const dz = z - p.z;
  kit.controls.setLook(
    Math.atan2(-dx, -dz),
    Math.asin(dy / Math.max(1e-4, Math.hypot(dx, dy, dz))),
  );
}

let elapsed = 0;
let shotIndex = -1;
let currentTheme = null;
let finished = false;
let statFrame = 0;

function enterShot(i) {
  const s = SHOTS[i];
  if (s.theme !== currentTheme) {
    // 颜色是烘进顶点色的，换主题必须重建关卡；光照与调色则是即时生效
    kit.resetLevel();
    kit.setTheme(s.theme);
    buildYard(kit);
    currentTheme = s.theme;
  }
  kit.camera.position.set(...s.from.pos);
  setLook(s.from.look);

  if (!clean) {
    titleEl.style.opacity = '0';
    setTimeout(() => {
      titleEl.textContent = s.title;
      titleEl.style.opacity = '1';
    }, 180);
  }
}

function seek(t) {
  elapsed = Math.max(0, Math.min(END, t));
  finished = false;
  shotIndex = -1;
}

if (params.start) {
  const i = Math.max(0, Math.min(SHOTS.length - 1, Number(params.start) | 0));
  seek(SHOTS[i].t);
}

kit.onUpdate((dt) => {
  dt = Math.min(dt, 0.05);
  if (freeze !== null) elapsed = freeze;
  else if (!finished) elapsed += dt;
  else return;

  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (elapsed >= SHOTS[k].t) i = k;
  if (i !== shotIndex) {
    shotIndex = i;
    enterShot(i);
  }

  const s = SHOTS[i];
  const nextT = i + 1 < SHOTS.length ? SHOTS[i + 1].t : END;
  const u = Math.min(1, Math.max(0, (elapsed - s.t) / Math.max(0.001, nextT - s.t)));
  const e = ease(u);

  kit.camera.position.set(...lerp3(s.from.pos, s.to.pos, e));
  setLook(lerp3(s.from.look, s.to.look, e));

  // 片头淡入 / 片尾淡出
  let opacity = 0;
  if (elapsed < FADE_IN) opacity = 1 - elapsed / FADE_IN;
  const tail = END - elapsed;
  if (tail < FADE_OUT) opacity = Math.max(opacity, 1 - Math.max(0, tail) / FADE_OUT);
  fadeEl.style.opacity = String(opacity);

  if (++statFrame % 12 === 0) {
    const st = kit.stats();
    statEl.textContent = `${(st.tris / 1000).toFixed(0)}K TRIANGLES · 0 ASSET FILES`;
  }

  if (elapsed >= END) {
    if (params.loop) {
      seek(0);
    } else {
      finished = true;
    }
  }
});

// 空格重播，方便录多条
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    currentTheme = null;
    seek(0);
  }
});

window.__kit = kit;
kit.start();

window.addEventListener('error', (e) => {
  const box = document.getElementById('fatal');
  if (!box) return;
  box.style.display = 'block';
  box.textContent = '启动失败：' + (e.message || '未知错误') + (e.filename ? `\n${e.filename}:${e.lineno}` : '');
});
