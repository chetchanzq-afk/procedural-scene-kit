// 入口：白昼办公室。换场景时改 scene-indoor.js 与 props-indoor.js。
import { createKit } from './kit.js';
import { buildOffice } from './scene-indoor.js';

const params = {};
for (const [k, v] of new URLSearchParams(location.search)) {
  params[k] = v === '' ? '1' : v; // 支持 ?shot 这种无值参数
}

const canvas = document.getElementById('view');
const kit = createKit({ canvas, params });
const hud = document.getElementById('hud');
const THEME = 'daylight-interior';

function lookAt(x, y, z) {
  const p = kit.camera.position;
  const dx = x - p.x;
  const dy = y - p.y;
  const dz = z - p.z;
  kit.controls.setLook(Math.atan2(-dx, -dz), Math.asin(dy / Math.max(1e-4, Math.hypot(dx, dy, dz))));
}

function build() {
  kit.resetLevel();
  kit.setTheme(THEME);
  buildOffice(kit);

  if (params.cam) {
    const [x, y, z, tx = 0, ty = 1.4, tz = 0] = String(params.cam).split(',').map(Number);
    kit.camera.position.set(x, y, z);
    lookAt(tx, ty, tz);
  } else {
    kit.camera.position.set(-6.5, 1.7, 4.8);
    lookAt(2, 1.35, -3);
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

build();
if (params.shot) hud.classList.add('off');
window.__kit = kit;

kit.start();
setInterval(() => updateHud(), 500);

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
