// 入口：参数、建场景、HUD。换场景时主要改 buildYard 的引用。
import { createKit } from './kit.js';
import { buildYard } from './scene-yard.js';
import { THEME_IDS } from './themes.js';

const params = {};
for (const [k, v] of new URLSearchParams(location.search)) {
  params[k] = v === '' ? '1' : v; // 支持 ?shot 这种无值参数
}
const canvas = document.getElementById('view');
const kit = createKit({ canvas, params });
const hud = document.getElementById('hud');

function lookAt(x, y, z) {
  const p = kit.camera.position;
  const dx = x - p.x;
  const dy = y - p.y;
  const dz = z - p.z;
  kit.controls.setLook(Math.atan2(-dx, -dz), Math.asin(dy / Math.max(1e-4, Math.hypot(dx, dy, dz))));
}

function build(themeId) {
  kit.resetLevel();
  kit.setTheme(themeId);
  buildYard(kit);

  if (params.cam) {
    const [x, y, z, tx = 0, ty = 3, tz = 0] = String(params.cam).split(',').map(Number);
    kit.camera.position.set(x, y, z);
    lookAt(tx, ty, tz);
  } else {
    kit.camera.position.set(-26, 8.5, 32);
    lookAt(0, 4, -2);
  }
  updateHud(true);
}

const el = (id) => document.getElementById(id);
let lastHud = 0;
function updateHud(force = false) {
  const now = performance.now();
  if (!force && now - lastHud < 320) return;
  lastHud = now;
  const s = kit.stats();
  el('h-theme').textContent = kit.state.theme.label;
  el('h-quality').textContent = `${s.quality} · ×${s.scale.toFixed(2)}`;
  el('h-res').textContent = `${s.res[0]}×${s.res[1]}`;
  el('h-calls').textContent = String(s.calls);
  el('h-tris').textContent = (s.tris / 1000).toFixed(1) + 'k';
  el('h-ms').textContent = `${s.ms.toFixed(1)} ms · ${s.fps.toFixed(0)} fps`;
}

const startTheme = THEME_IDS.includes(params.theme) ? params.theme : THEME_IDS[0];
build(startTheme);

window.addEventListener('keydown', (e) => {
  const idx = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
  if (idx >= 0 && THEME_IDS[idx]) build(THEME_IDS[idx]);
});

if (params.shot) hud.classList.add('off');
window.__kit = kit;

kit.start();
setInterval(() => updateHud(), 500);

// 首帧就绪后收起启动遮罩
const boot = document.getElementById('boot');
const timer = setInterval(() => {
  if (window.__ready) {
    clearInterval(timer);
    boot.classList.add('done');
    setTimeout(() => boot.remove(), 600);
  }
}, 120);

window.addEventListener('error', (e) => {
  const box = document.getElementById('fatal');
  if (!box) return;
  box.style.display = 'block';
  box.textContent = '启动失败：' + (e.message || '未知错误') + (e.filename ? `\n${e.filename}:${e.lineno}` : '');
});
