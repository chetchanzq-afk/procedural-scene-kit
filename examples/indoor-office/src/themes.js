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
  'daylight-interior': {
    id: 'daylight-interior',
    label: '白昼 · 办公室',
    sky: 0xb8cddc,
    fog: { color: 0xc6d6e0, density: 0.0035 },
    sun: { color: 0xfff0d8, intensity: 3.8, dir: [0.3, 0.62, -0.72] },
    hemi: { sky: 0xd2e2ec, ground: 0x6b6255, intensity: 1.05 },
    env: { intensity: 0.95, top: 0xd6e9f7, mid: 0x93a7b4, bottom: 0x5c554a },
    shadow: { size: 14, near: 1, far: 220 },
    ao: { intensity: 1.35, radius: 0.42 },
    rays: { strength: 0.0, density: 1.0, decay: 0.98, threshold: 0.9 },
    motion: { shutter: 0.25, maxVel: 0.02 },
    exposure: 0.92, wetness: 0.0, grime: 0.3,
    post: { bloom: 0.3, saturation: 0.98, vignette: 0.26, ca: 0.006, grain: 0.03 },
    palette: {
      floor: 0x8a8578, wall: 0xdad5c6, trim: 0xb9b3a3, ceiling: 0xe4e0d4,
      wood: 0x8a6a45, metal: 0x9aa1a5, darkMetal: 0x3d4348, fabric: 0x46525b,
      screen: 0x9fd8ff, hazard: 0xd8a13a, glow: 0xfff2d0, glass: 0xcfe6f5,
      paper: 0xe8e4d8, plastic: 0x6b7378, cardboard: 0x9c7c52,
    },
  },
};

export const THEME_IDS = Object.keys(THEMES);

export function getTheme(id) {
  return THEMES[id] || THEMES[THEME_IDS[0]];
}
