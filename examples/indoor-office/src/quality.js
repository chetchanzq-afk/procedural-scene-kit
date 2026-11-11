// 画质分档 + 动态分辨率：先按设备选档，再根据帧时在 0.6~1.0 之间调整渲染倍率。
// AO 与细节着色在低档位关闭，保证移动端能跑。
export const PRESETS = {
  low: {
    name: 'low', dpr: 1.25, samples: 0, shadow: 1024,
    bloom: true, iterations: 1, threshold: 1.15, grain: 0.04, vignette: 0.3,
    ao: false, detail: 0.5, motion: false, rays: false,
  },
  medium: {
    name: 'medium', dpr: 1.5, samples: 0, shadow: 2048,
    bloom: true, iterations: 2, threshold: 1.0, grain: 0.05, vignette: 0.34,
    ao: true, detail: 0.8, motion: true, rays: true,
  },
  high: {
    name: 'high', dpr: 2, samples: 4, shadow: 4096,
    bloom: true, iterations: 2, threshold: 0.9, grain: 0.05, vignette: 0.36,
    ao: true, detail: 1, motion: true, rays: true,
  },
  ultra: {
    name: 'ultra', dpr: 2, samples: 4, shadow: 4096,
    bloom: true, iterations: 3, threshold: 0.8, grain: 0.045, vignette: 0.36,
    ao: true, detail: 1, motion: true, rays: true,
  },
};

export function guessQuality() {
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900);
  if (mobile) return 'low';
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 4;
  if (cores >= 12 && mem >= 8) return 'high';
  if (cores >= 6) return 'medium';
  return 'low';
}

export function createQuality(renderer, pipeline, materials) {
  let name = 'high';
  let dyn = 1;
  let frames = 0;
  let avgMs = 16.7;
  let cooldown = 0;

  function applyPreset(preset, sun) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.dpr));
    pipeline.setQuality({
      samples: preset.samples,
      iterations: preset.iterations,
      bloom: preset.bloom,
      threshold: preset.threshold,
      ao: preset.ao,
      motion: preset.motion,
      rays: preset.rays,
    });
    pipeline.uniforms.uGrain.value = preset.grain;
    pipeline.uniforms.uVignette.value = preset.vignette;
    if (materials) materials.setDetail(preset.detail ?? 1);
    if (sun) {
      sun.shadow.mapSize.set(preset.shadow, preset.shadow);
      if (sun.shadow.map) {
        sun.shadow.map.dispose();
        sun.shadow.map = null;
      }
    }
  }

  function apply(next, sun, { keepDynamic = false } = {}) {
    const preset = PRESETS[next] ? next : guessQuality();
    name = PRESETS[next] ? next : preset;
    if (!keepDynamic) dyn = 1;
    applyPreset(PRESETS[name], sun);
    return name;
  }

  function resize(cssWidth, cssHeight) {
    pipeline.resize(cssWidth, cssHeight, renderer.getPixelRatio() * dyn);
  }

  // 每帧调用：帧时高于 22ms 降倍率，低于 16.5ms 缓慢回升
  function update(dt) {
    const ms = dt * 1000;
    avgMs = avgMs * 0.95 + ms * 0.05;
    frames++;
    cooldown -= dt;
    if (frames % 30 !== 0 || cooldown > 0) return false;

    if (avgMs > 22 && dyn > 0.6) {
      dyn = Math.max(0.6, Math.round((dyn - 0.1) * 10) / 10);
      cooldown = 2;
      return true;
    }
    if (avgMs < 16.5 && dyn < 1) {
      dyn = Math.min(1, Math.round((dyn + 0.05) * 100) / 100);
      cooldown = 4;
      return true;
    }
    return false;
  }

  return {
    apply,
    applyPreset,
    resize,
    update,
    get name() { return name; },
    get preset() { return PRESETS[name]; },
    get dynamicScale() { return dyn; },
    get avgMs() { return avgMs; },
  };
}
