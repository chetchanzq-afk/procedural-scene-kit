// 主题包：一个主题只改参数，不动管线。换场景的第一层就是换这里。
export const THEMES = {
  'port-dawn': {
    id: 'port-dawn',
    label: '港区 · 晨雾',
    sky: 0x2c3a44,
    fog: { color: 0x33424c, density: 0.0075 },
    sun: { color: 0xffd2a0, intensity: 3.1, dir: [-0.55, 0.42, -0.72] },
    hemi: { sky: 0x9fb9cc, ground: 0x2a251f, intensity: 1.5 },
    env: { intensity: 0.85, top: 0xa8c4dc, mid: 0x6a7f92, bottom: 0x3a322a },
    rays: { strength: 0.35, density: 0.7, decay: 0.94, threshold: 1.1 },
    motion: { shutter: 0.5 },
    exposure: 1.05, wetness: 0.45, grime: 0.62,
    post: { bloom: 0.55, saturation: 0.95, vignette: 0.36, ca: 0.012, grain: 0.055 },
    palette: {
      containerA: 0x9c3a2c, containerB: 0x2f5b74, containerC: 0x3f6b43, containerD: 0xb5893a,
      metal: 0x8b9296, darkMetal: 0x3b4247, paint: 0xb9b4a6, hazard: 0xd08a2a,
      concrete: 0x6d6a63, wood: 0x7a5c3c, glow: 0xffcf8a, accent: 0xd2622a, glass: 0x5d7c87,
    },
  },
  'port-day': {
    id: 'port-day',
    label: '港区 · 白昼',
    sky: 0x8fb4cf,
    skyTop: 0x3f7fb5,
    skyBottom: 0xaab2b2,
    fog: { color: 0x9db4c4, density: 0.0022 },
    sun: { color: 0xfff0d6, intensity: 3.2, dir: [-0.78, 0.5, 0.4] },
    hemi: { sky: 0xb6d0e2, ground: 0x554c3e, intensity: 0.38 },
    env: { intensity: 0.45, top: 0xd2e7f6, mid: 0x8fa4b3, bottom: 0x6a6252 },
    shadow: { size: 22, near: 1, far: 260 },
    rays: { strength: 0.0, density: 1.0, decay: 0.98, threshold: 1.0 },
    motion: { shutter: 0.4 },
    adaptTarget: 0.1,
    exposure: 0.9, wetness: 0.12, grime: 0.55,
    post: { bloom: 0.22, threshold: 1.1, saturation: 1.15, contrast: 1.12, vignette: 0.38, ca: 0.006, grain: 0.025, dirt: 0.02 },
    palette: {
      containerA: 0xa8422c, containerB: 0x2e5f7c, containerC: 0x3d7048, containerD: 0xc09040,
      metal: 0x9aa0a4, darkMetal: 0x3d444a, paint: 0xc2bcac, hazard: 0xd8922a,
      concrete: 0x6a675f, wood: 0x86633f, glow: 0xffd79a, accent: 0xd2622a, glass: 0x6b8b96,
    },
  },
  'neon-rain': {
    id: 'neon-rain',
    label: '雨夜 · 霓虹',
    sky: 0x0b111c,
    fog: { color: 0x162030, density: 0.0085 },
    sun: { color: 0xa9bcff, intensity: 1.9, dir: [-0.25, 0.5, -0.83] },
    hemi: { sky: 0x46608f, ground: 0x0d0e16, intensity: 2.4 },
    env: { intensity: 1.35, top: 0x35507f, mid: 0x1a2740, bottom: 0x0b0c13 },
    rays: { strength: 0.5, density: 0.9, decay: 0.92, threshold: 0.9 },
    motion: { shutter: 0.6 },
    exposure: 1.5, wetness: 0.98, grime: 0.7,
    post: { bloom: 1.05, saturation: 1.05, vignette: 0.38, ca: 0.016, grain: 0.04 },
    palette: {
      containerA: 0x2a2f3e, containerB: 0x3a2440, containerC: 0x1f3a45, containerD: 0x413526,
      metal: 0x6e7784, darkMetal: 0x1d2129, paint: 0x8f96a6, hazard: 0x39d7e8,
      concrete: 0x2b2f38, wood: 0x3a2f26, glow: 0x59e0ff, accent: 0xff4fa3, glass: 0x2f6b78,
    },
  },
  'facility': {
    id: 'facility',
    label: '地下 · 设施',
    sky: 0x14181a,
    fog: { color: 0x171d1e, density: 0.009 },
    sun: { color: 0xdfeee8, intensity: 2.6, dir: [-0.4, 0.8, -0.45] },
    hemi: { sky: 0xa9c4b8, ground: 0x1a1b17, intensity: 1.25 },
    env: { intensity: 0.9, top: 0x9fb6ab, mid: 0x4a5652, bottom: 0x1e211d },
    rays: { strength: 0.3, density: 0.75, decay: 0.94, threshold: 1.0 },
    motion: { shutter: 0.45 },
    exposure: 1.1, wetness: 0.2, grime: 0.55,
    post: { bloom: 0.7, saturation: 0.86, vignette: 0.4, ca: 0.008, grain: 0.05 },
    palette: {
      containerA: 0x4a5a55, containerB: 0x3b4a56, containerC: 0x5a5348, containerD: 0x6a5c46,
      metal: 0x9aa6a2, darkMetal: 0x2c3433, paint: 0xc2c6bd, hazard: 0xe0b53a,
      concrete: 0x5b5f58, wood: 0x6a5540, glow: 0xd9fff0, accent: 0x5ec9a8, glass: 0x4c6b66,
    },
  },
};

export const THEME_IDS = Object.keys(THEMES);

export function getTheme(id) {
  return THEMES[id] || THEMES[THEME_IDS[0]];
}
