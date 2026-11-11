// 程序化材质库：不加载任何贴图，磨损、锈迹、水痕、面板分缝全部在 shader 里求值。
import * as THREE from 'three';

// 运行时贴花图集：编号、警示牌、锈迹等，全部用 Canvas 画，不引入图片文件。
function createDecalAtlas() {
  const cell = 256;
  const cols = 4;
  const size = cell * cols;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const slot = (i, draw) => {
    ctx.save();
    ctx.translate((i % cols) * cell, Math.floor(i / cols) * cell);
    ctx.beginPath();
    ctx.rect(0, 0, cell, cell);
    ctx.clip();
    draw(ctx, cell);
    ctx.restore();
  };

  const stencil = (text, bg, fg, sub) => (c, s) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, s, s);
    c.strokeStyle = fg;
    c.lineWidth = 6;
    c.strokeRect(10, 10, s - 20, s - 20);
    c.fillStyle = fg;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `bold ${sub ? 64 : 84}px "Arial Narrow", Arial, sans-serif`;
    c.fillText(text, s / 2, s / 2 + (sub ? -14 : 2));
    if (sub) {
      c.font = 'bold 30px Arial, sans-serif';
      c.fillText(sub, s / 2, s / 2 + 56);
    }
  };

  slot(0, stencil('A-04', '#1b1d1f', '#e8e4da', 'PORT'));
  slot(1, stencil('B-17', '#1b1d1f', '#e8e4da', 'BAY 2'));
  slot(2, (c, s) => {
    c.save();
    c.beginPath();
    c.rect(0, 0, s, s);
    c.clip();
    c.fillStyle = '#d8a13a';
    c.fillRect(0, 0, s, s);
    c.fillStyle = '#171717';
    c.translate(s / 2, s / 2);
    c.rotate(-Math.PI / 4);
    for (let x = -s; x < s; x += 64) c.fillRect(x, -s, 32, s * 2);
    c.restore();
  });
  slot(3, stencil('危险', '#a33127', '#fff4e2'));
  slot(4, stencil('禁止入内', '#171717', '#e8e4da'));
  slot(5, stencil('PORT 04', '#23303a', '#cfe6f5', 'KEEP CLEAR'));
  slot(6, (c, s) => {
    const g = c.createRadialGradient(s * 0.5, s * 0.5, 8, s * 0.5, s * 0.5, s * 0.5);
    g.addColorStop(0, 'rgba(92,54,28,0.85)');
    g.addColorStop(0.55, 'rgba(74,44,24,0.45)');
    g.addColorStop(1, 'rgba(60,36,20,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  });
  slot(7, stencil('小心地滑', '#d8a13a', '#171717'));

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;

  const uv = (i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return [col / cols, 1 - (row + 1) / cols, (col + 1) / cols, 1 - row / cols];
  };

  return { texture: tex, uv, count: cols * cols };
}

// 运行时细节贴图：划痕、斑驳、颗粒。用世界坐标三平面采样，不需要 UV 展开。
function createDetailTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8f8f8f';
  ctx.fillRect(0, 0, size, size);

  // 大斑块
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 4 + Math.random() * 46;
    const a = 0.04 + Math.random() * 0.14;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const shade = Math.random() > 0.5 ? 255 : 40;
    g.addColorStop(0, `rgba(${shade},${shade},${shade},${a})`);
    g.addColorStop(1, `rgba(${shade},${shade},${shade},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // 划痕
  for (let i = 0; i < 320; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 6 + Math.random() * 70;
    const ang = Math.random() * Math.PI * 2;
    ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? 230 : 30},${Math.random() > 0.5 ? 230 : 30},220,${0.05 + Math.random() * 0.18})`;
    ctx.lineWidth = 0.6 + Math.random() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  // 细颗粒
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createMaterials() {
  const detailTex = createDetailTexture();
  const uniforms = {
    uTime: { value: 0 },
    uWet: { value: 0 },       // 0 干燥，1 全湿
    uGrime: { value: 0.6 },   // 污渍强度
    uDetail: { value: 1 },    // 细节强度（低画质可关小）
    uDetailMap: { value: detailTex },
    uDetailScale: { value: 0.55 },
    uReflection: { value: null },
    uReflVP: { value: new THREE.Matrix4() },
    uReflStrength: { value: 0 },
  };

  // ---- 通用漆面材质：顶点色 + 程序化细节 ----
  const paint = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.66,
    metalness: 0.2,
    dithering: true,
  });

  paint.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWet = uniforms.uWet;
    shader.uniforms.uGrime = uniforms.uGrime;
    shader.uniforms.uDetail = uniforms.uDetail;
    shader.uniforms.uDetailMap = uniforms.uDetailMap;
    shader.uniforms.uDetailScale = uniforms.uDetailScale;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos;
        varying vec3 vWNrm;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vWNrm = normalize(mat3(modelMatrix) * normal);`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos;
        varying vec3 vWNrm;
        uniform float uTime;
        uniform float uWet;
        uniform float uGrime;
        uniform float uDetail;
        uniform sampler2D uDetailMap;
        uniform float uDetailScale;

        float sl_hash(vec2 p) {
          return fract(sin(dot(p, vec2(41.31, 289.17))) * 43758.5453);
        }
        float sl_noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(sl_hash(i), sl_hash(i + vec2(1.0, 0.0)), f.x),
                     mix(sl_hash(i + vec2(0.0, 1.0)), sl_hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float sl_fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 4; i++) { v += a * sl_noise(p); p *= 2.03; a *= 0.5; }
          return v;
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        // 1. 构件之间的色差：同一材质不会像复制粘贴
        float tint = sl_hash(floor(vWPos.xz * 0.35) + floor(vWPos.y * 0.35));
        diffuseColor.rgb *= 1.0 - (0.5 - tint) * 0.14 * uDetail;

        // 2. 面板分缝：1.2 米网格，只压暗一点点
        vec3 cell = abs(fract(vWPos / 1.2) - 0.5);
        float seam = smoothstep(0.462, 0.5, max(max(cell.x, cell.y), cell.z));
        diffuseColor.rgb *= 1.0 - seam * 0.22 * uDetail;

        // 3. 边缘磨损：法线突变处露出底色金属
        vec3 wn = normalize(vWNrm);
        float edge = smoothstep(0.05, 0.2, length(fwidth(wn)));
        edge = clamp(edge, 0.0, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.58, 0.56, 0.52), edge * 0.32 * uDetail);

        // 4. 污渍斑块 + 竖向流痕
        float patchMask = smoothstep(0.42, 0.86, sl_fbm(vWPos.xz * 0.55 + vWPos.y * 0.33));
        float streak = smoothstep(0.52, 0.94, sl_fbm(vec2(vWPos.x * 3.1 + vWPos.z * 3.1, vWPos.y * 0.22)));
        float grime = clamp(patchMask * 0.7 + streak * 0.45, 0.0, 1.0) * uGrime;
        diffuseColor.rgb *= mix(1.0, 0.6, grime);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.06, 0.96, 0.88), grime * 0.35);

        // 5. 三平面细节贴图：划痕、斑驳，按世界坐标采样，任意尺寸不拉伸
        vec3 an = abs(wn);
        float wsum = an.x + an.y + an.z + 1e-4;
        float dX = texture2D(uDetailMap, vWPos.zy * uDetailScale).r;
        float dY = texture2D(uDetailMap, vWPos.xz * uDetailScale).r;
        float dZ = texture2D(uDetailMap, vWPos.xy * uDetailScale).r;
        float det = (dX * an.x + dY * an.y + dZ * an.z) / wsum;
        diffuseColor.rgb *= mix(0.92, 1.0, uDetail) * (0.86 + 0.28 * det);`)
      // 粗糙度：细节起伏 + 磨损处更光滑 + 湿润
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float roughVar = sl_fbm(vWPos.xz * 1.6 + vWPos.y * 0.8);
        roughnessFactor = clamp(roughnessFactor * (0.82 + 0.36 * roughVar) + edge * 0.08, 0.04, 1.0);
        roughnessFactor = clamp(roughnessFactor * (0.92 + 0.18 * det) + (1.0 - det) * 0.05 * uDetail, 0.04, 1.0);
        float wetMask = smoothstep(0.25, 0.85, sl_fbm(vWPos.xz * 0.6 + 3.7));
        roughnessFactor = mix(roughnessFactor, 0.06, uWet * wetMask);`);
  };

  // ---- 发光件：顶点色直接存 HDR 值（>1），靠 Bloom 起光 ----
  const glow = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });

  // ---- 地面：更粗糙，湿润时接近镜面 ----
  const ground = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.82, metalness: 0.08,
  });
  ground.onBeforeCompile = (shader) => {
    shader.uniforms.uWet = uniforms.uWet;
    shader.uniforms.uDetail = uniforms.uDetail;
    shader.uniforms.uDetailMap = uniforms.uDetailMap;
    shader.uniforms.uDetailScale = uniforms.uDetailScale;
    shader.uniforms.uReflection = uniforms.uReflection;
    shader.uniforms.uReflVP = uniforms.uReflVP;
    shader.uniforms.uReflStrength = uniforms.uReflStrength;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos;
        uniform float uWet;
        uniform float uDetail;
        uniform sampler2D uDetailMap;
        uniform float uDetailScale;
        uniform sampler2D uReflection;
        uniform mat4 uReflVP;
        uniform float uReflStrength;
        float g_hash(vec2 p) { return fract(sin(dot(p, vec2(41.31, 289.17))) * 43758.5453); }
        float g_noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(g_hash(i), g_hash(i + vec2(1.0, 0.0)), f.x),
                     mix(g_hash(i + vec2(0.0, 1.0)), g_hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float floorMask = g_noise(vWPos.xz * 2.2) * g_noise(vWPos.xz * 0.7);
        float floorDet = texture2D(uDetailMap, vWPos.xz * uDetailScale).r;
        diffuseColor.rgb *= mix(0.94, 1.0, uDetail) * (0.88 + floorMask * 0.14 + floorDet * 0.18);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.07, uWet);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (uReflStrength > 0.001) {
          vec4 rp = uReflVP * vec4(vWPos, 1.0);
          vec2 ruv = rp.xy / max(0.0001, rp.w) * 0.5 + 0.5;
          if (ruv.x > 0.0 && ruv.x < 1.0 && ruv.y > 0.0 && ruv.y < 1.0) {
            totalEmissiveRadiance += texture2D(uReflection, ruv).rgb * uReflStrength;
          }
        }`);
  };

  // ---- 贴花：共用一张运行时图集，单独一层，避免和主体抢材质 ----
  const atlas = createDecalAtlas();
  const decal = new THREE.MeshBasicMaterial({
    map: atlas.texture,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    toneMapped: false,
  });

  return {
    paint, glow, ground, decal, atlas, uniforms,
    update(dt) { uniforms.uTime.value += dt; },
    setWetness(v) { uniforms.uWet.value = THREE.MathUtils.clamp(v, 0, 1); },
    setGrime(v) { uniforms.uGrime.value = THREE.MathUtils.clamp(v, 0, 1); },
    setDetail(v) { uniforms.uDetail.value = THREE.MathUtils.clamp(v, 0, 1); },
    setReflection(texture, vp, strength) {
      uniforms.uReflection.value = texture;
      if (vp) uniforms.uReflVP.value.copy(vp);
      uniforms.uReflStrength.value = THREE.MathUtils.clamp(strength, 0, 0.8);
    },
  };
}
