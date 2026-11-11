// 后处理管线：HDR 场景 → SSAO → 运动模糊 → 高光提取 → 体积光 → 合成调色 → 输出。
// 全部自绘，不依赖 addons，方便直接搬进任意 three 项目。
import * as THREE from 'three';

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BRIGHT = /* glsl */`
  uniform sampler2D tSrc;
  uniform float uThreshold;
  uniform float uKnee;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tSrc, vUv).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float soft = clamp(l - uThreshold + uKnee, 0.0, 2.0 * uKnee);
    soft = soft * soft / (4.0 * uKnee + 1e-4);
    float k = max(soft, l - uThreshold) / max(l, 1e-4);
    gl_FragColor = vec4(c * k, 1.0);
  }
`;

const BLUR = /* glsl */`
  uniform sampler2D tSrc;
  uniform vec2 uDir;
  varying vec2 vUv;
  void main() {
    vec3 sum = texture2D(tSrc, vUv).rgb * 0.227027;
    sum += texture2D(tSrc, vUv + uDir * 1.384615).rgb * 0.316216;
    sum += texture2D(tSrc, vUv - uDir * 1.384615).rgb * 0.316216;
    sum += texture2D(tSrc, vUv + uDir * 3.230769).rgb * 0.070270;
    sum += texture2D(tSrc, vUv - uDir * 3.230769).rgb * 0.070270;
    gl_FragColor = vec4(sum, 1.0);
  }
`;

// 深度重建的屏幕空间环境光遮蔽：让物体与地面接触处产生暗角
const AO = /* glsl */`
  uniform sampler2D tDepth;
  uniform mat4 uProj;
  uniform mat4 uInvProj;
  uniform vec2 uTexel;
  uniform float uNear;
  uniform float uFar;
  uniform float uRadius;
  uniform float uIntensity;
  varying vec2 vUv;

  vec3 viewPos(vec2 uv) {
    float d = texture2D(tDepth, uv).x;
    vec4 clip = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
    vec4 v = uInvProj * clip;
    return v.xyz / v.w;
  }

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    float raw = texture2D(tDepth, vUv).x;
    if (raw >= 0.9999) { gl_FragColor = vec4(1.0); return; }

    vec3 p = viewPos(vUv);
    float ang = hash21(vUv * 1024.0) * 6.2831853;
    float occ = 0.0;
    const int N = 12;

    for (int i = 0; i < N; i++) {
      float fi = float(i) + 1.0;
      float a = ang + fi * 2.39996323;
      float h = sqrt(fi / float(N));
      float zz = 0.35 + 0.65 * hash21(vUv + fi);
      vec3 dir = normalize(vec3(cos(a) * h, sin(a) * h, zz));
      float rad = uRadius * (0.35 + 0.65 * hash21(vUv.yx + fi * 1.7));
      vec3 sp = p + dir * rad;

      vec4 cp = uProj * vec4(sp, 1.0);
      vec2 suv = (cp.xy / cp.w) * 0.5 + 0.5;
      if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) continue;

      vec3 op = viewPos(suv);
      float diff = op.z - sp.z;                             // 遮挡物比采样点更靠近相机
      float range = smoothstep(0.0, 1.0, uRadius / max(0.001, abs(p.z - op.z)));
      occ += (diff > 0.025 ? 1.0 : 0.0) * range;
    }

    occ /= float(N);
    float ao = clamp(1.0 - occ * uIntensity, 0.0, 1.0);
    gl_FragColor = vec4(vec3(ao), 1.0);
  }
`;

// 相机运动模糊：用当前深度重建世界坐标，投影回上一帧得到速度
const MOTION = /* glsl */`
  uniform sampler2D tScene;
  uniform sampler2D tDepth;
  uniform mat4 uInvViewProj;
  uniform mat4 uPrevViewProj;
  uniform float uShutter;
  uniform float uMaxVel;
  varying vec2 vUv;

  vec3 worldPos(vec2 uv) {
    float d = texture2D(tDepth, uv).x;
    vec4 clip = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
    vec4 w = uInvViewProj * clip;
    return w.xyz / w.w;
  }

  void main() {
    vec3 w0 = worldPos(vUv);
    vec4 pc = uPrevViewProj * vec4(w0, 1.0);
    vec2 puv = pc.xy / max(0.0001, pc.w) * 0.5 + 0.5;
    vec2 vel = (vUv - puv) * uShutter;

    float len = length(vel);
    if (len < 0.00035) { gl_FragColor = vec4(texture2D(tScene, vUv).rgb, 1.0); return; }
    if (len > uMaxVel) vel *= uMaxVel / len;

    float d0 = texture2D(tDepth, vUv).x;
    vec3 sum = vec3(0.0);
    float wsum = 0.0;
    const int N = 8;

    for (int i = 0; i < N; i++) {
      float t = float(i) / float(N - 1) - 0.5;
      vec2 uv = vUv + vel * t;
      float ds = texture2D(tDepth, uv).x;
      // 只混合深度接近的像素，避免前景被背景拖影
      float wgt = 1.0 - smoothstep(0.004, 0.03, abs(ds - d0) / max(0.01, d0));
      wgt *= 1.0 - abs(t) * 0.35;
      sum += texture2D(tScene, uv).rgb * wgt;
      wsum += wgt;
    }

    vec3 col = wsum > 0.001 ? sum / wsum : texture2D(tScene, vUv).rgb;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// 体积光：从太阳屏幕位置向外做径向模糊，把窗光/灯光拉成光柱
const RAYS = /* glsl */`
  uniform sampler2D tSrc;
  uniform vec2 uSunUv;
  uniform float uDensity;
  uniform float uDecay;
  varying vec2 vUv;

  void main() {
    vec2 dir = (uSunUv - vUv) * (uDensity / 16.0);
    vec2 uv = vUv;
    float w = 1.0;
    vec3 sum = vec3(0.0);
    for (int i = 0; i < 16; i++) {
      uv += dir;
      sum += texture2D(tSrc, clamp(uv, 0.001, 0.999)).rgb * w;
      w *= uDecay;
    }
    gl_FragColor = vec4(sum / 16.0, 1.0);
  }
`;

const FINAL = /* glsl */`
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform sampler2D tRays;
  uniform sampler2D tAO;
  uniform sampler2D tDirt;
  uniform float uBloom;
  uniform float uRays;
  uniform float uExposure;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uCA;
  uniform float uSat;
  uniform float uContrast;
  uniform float uTime;
  uniform float uAoOn;
  uniform float uRaysOn;
  uniform float uDirtAmount;
  uniform vec2 uSunUv;
  varying vec2 vUv;

  // ---- AgX（与 three.js / Blender 同一套拟合）----
  const mat3 SRGB_TO_REC2020 = mat3(
    0.6274, 0.0691, 0.0164,
    0.3293, 0.9195, 0.0880,
    0.0433, 0.0113, 0.8956);
  const mat3 REC2020_TO_SRGB = mat3(
    1.6605, -0.1246, -0.0182,
    -0.5876, 1.1329, -0.1006,
    -0.0728, -0.0083, 1.1187);
  const mat3 AGX_INSET = mat3(
    0.856627153315983, 0.137318972929847, 0.11189821299995,
    0.0951212405381588, 0.761241990602591, 0.0767994186031903,
    0.0482516061458583, 0.101439036467562, 0.811302368396859);
  const mat3 AGX_OUTSET = mat3(
    1.1271005818144368, -0.1413297634984383, -0.14132976349843826,
    -0.11060664309660323, 1.157823702216272, -0.11060664309660294,
    -0.016493938717834573, -0.016493938717834257, 1.2519364065950405);

  vec3 agx(vec3 color) {
    color = SRGB_TO_REC2020 * color;
    color = AGX_INSET * color;
    color = max(color, vec3(1e-10));
    color = log2(color);
    color = (color + 12.47393) / 16.5;
    color = clamp(color, 0.0, 1.0);
    color = AGX_OUTSET * pow(color, vec3(2.2));
    color = REC2020_TO_SRGB * color;
    return clamp(color, 0.0, 1.0);
  }

  void main() {
    vec2 uv = vUv;
    vec2 d = uv - 0.5;
    float r2 = dot(d, d);

    vec3 col;
    col.r = texture2D(tScene, uv + d * uCA * r2).r;
    col.g = texture2D(tScene, uv).g;
    col.b = texture2D(tScene, uv - d * uCA * r2).b;

    if (uAoOn > 0.5) col *= texture2D(tAO, uv).r;
    if (uRaysOn > 0.5) col += texture2D(tRays, uv).rgb * uRays;

    col += texture2D(tBloom, uv).rgb * uBloom;
    col *= uExposure;

    // 镜头脏污：只在太阳附近显形
    float sunDist = length(uv - uSunUv);
    float glare = smoothstep(0.3, 0.0, sunDist);
    float dirt = texture2D(tDirt, uv * 1.6).r;
    col += vec3(1.0, 0.94, 0.82) * dirt * glare * uDirtAmount;

    col = agx(col);

    // AgX 会把极暗处抬到约 0.18，室内会发灰；这里压掉黑位
    col = max(col - 0.045, 0.0) * (1.0 / 0.955);
    col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);

    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(l), col, uSat);

    col *= 1.0 - uVignette * smoothstep(0.18, 0.9, r2 * 1.7);

    float g = fract(sin(dot(uv * 1024.0 + uTime, vec2(12.9898, 78.233))) * 43758.5453);
    float grainMask = smoothstep(0.015, 0.22, dot(col, vec3(0.2126, 0.7152, 0.0722)));
    col += (g - 0.5) * uGrain * grainMask;

    col = pow(max(col, 0.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

function passMaterial(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

// 镜头脏污：运行时 Canvas 生成的软斑，不引入图片
function createDirtTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 26;
    const a = 0.05 + Math.random() * 0.3;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function createPipeline(renderer, options = {}) {
  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.Camera();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  quadScene.add(quad);

  const black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  black.needsUpdate = true;

  const uniforms = {
    uBloomStrength: { value: options.bloom ?? 0.65 },
    uThreshold: { value: options.threshold ?? 0.85 },
    uKnee: { value: 0.35 },
    uExposure: { value: options.exposure ?? 1.0 },
    uVignette: { value: options.vignette ?? 0.35 },
    uGrain: { value: options.grain ?? 0.05 },
    uCA: { value: options.ca ?? 0.012 },
    uSat: { value: options.saturation ?? 1.0 },
    uContrast: { value: options.contrast ?? 1.0 },
    uTime: { value: 0 },
    uAoOn: { value: 1 },
    uAoRadius: { value: options.aoRadius ?? 0.55 },
    uAoIntensity: { value: options.aoIntensity ?? 1.15 },
    // 运动模糊
    uMotionOn: { value: 1 },
    uShutter: { value: options.shutter ?? 0.55 },
    uMaxVel: { value: options.maxVel ?? 0.06 },
    // 体积光
    uRaysOn: { value: 1 },
    uRays: { value: options.rays ?? 0.55 },
    uRayDensity: { value: options.rayDensity ?? 0.85 },
    uRayDecay: { value: options.rayDecay ?? 0.93 },
    uRayThreshold: { value: options.rayThreshold ?? 1.0 },
    uSunUv: { value: new THREE.Vector2(0.5, 0.8) },
    uSunFade: { value: 1 },
    uDirtAmount: { value: options.dirt ?? 0.2 },
  };

  const brightMat = passMaterial(BRIGHT, {
    tSrc: { value: null }, uThreshold: uniforms.uThreshold, uKnee: uniforms.uKnee,
  });
  const rayMaskMat = passMaterial(BRIGHT, {
    tSrc: { value: null }, uThreshold: uniforms.uRayThreshold, uKnee: uniforms.uKnee,
  });
  const blurMat = passMaterial(BLUR, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });
  const aoMat = passMaterial(AO, {
    tDepth: { value: null },
    uProj: { value: new THREE.Matrix4() },
    uInvProj: { value: new THREE.Matrix4() },
    uTexel: { value: new THREE.Vector2() },
    uNear: { value: 0.1 },
    uFar: { value: 500 },
    uRadius: uniforms.uAoRadius,
    uIntensity: uniforms.uAoIntensity,
  });
  const motionMat = passMaterial(MOTION, {
    tScene: { value: null },
    tDepth: { value: null },
    uInvViewProj: { value: new THREE.Matrix4() },
    uPrevViewProj: { value: new THREE.Matrix4() },
    uShutter: uniforms.uShutter,
    uMaxVel: uniforms.uMaxVel,
  });
  const raysMat = passMaterial(RAYS, {
    tSrc: { value: null },
    uSunUv: uniforms.uSunUv,
    uDensity: uniforms.uRayDensity,
    uDecay: uniforms.uRayDecay,
  });
  const finalMat = passMaterial(FINAL, {
    tScene: { value: null },
    tBloom: { value: black },
    tRays: { value: black },
    tAO: { value: null },
    tDirt: { value: createDirtTexture() },
    uBloom: uniforms.uBloomStrength,
    uRays: uniforms.uRays,
    uExposure: uniforms.uExposure,
    uVignette: uniforms.uVignette,
    uGrain: uniforms.uGrain,
    uCA: uniforms.uCA,
    uSat: uniforms.uSat,
    uContrast: uniforms.uContrast,
    uTime: uniforms.uTime,
    uAoOn: uniforms.uAoOn,
    uRaysOn: uniforms.uRaysOn,
    uDirtAmount: uniforms.uDirtAmount,
    uSunUv: uniforms.uSunUv,
  });

  let rtScene = null;
  let rtAO = null;
  let rtAOb = null;
  let rtMB = null;
  let rtA = null;
  let rtB = null;
  let rtRays = null;
  let rtRaysB = null;
  let width = 1;
  let height = 1;
  let hasPrev = false;
  const sceneStats = { calls: 0, tris: 0 };
  const prevViewProj = new THREE.Matrix4();
  const curViewProj = new THREE.Matrix4();
  const invViewProj = new THREE.Matrix4();
  const state = {
    samples: options.samples ?? 4,
    iterations: options.iterations ?? 2,
    bloom: true,
    ao: options.ao ?? true,
    motion: options.motion ?? true,
    rays: options.raysOn ?? true,
    threshold: uniforms.uThreshold.value,
  };

  function makeTargets() {
    [rtScene, rtAO, rtAOb, rtMB, rtA, rtB, rtRays, rtRaysB].forEach((rt) => rt && rt.dispose());

    // 深度纹理与多重采样不能同时用，开 AO / 运动模糊时关闭 MSAA
    const needDepth = state.ao || state.motion;
    const samples = needDepth ? 0 : state.samples;
    rtScene = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      samples,
      depthBuffer: true,
      stencilBuffer: false,
    });
    rtScene.depthTexture = new THREE.DepthTexture(width, height);
    rtScene.depthTexture.type = THREE.UnsignedIntType;

    const hw = Math.max(1, width >> 1);
    const hh = Math.max(1, height >> 1);
    rtAO = new THREE.WebGLRenderTarget(hw, hh, { type: THREE.UnsignedByteType, depthBuffer: false });
    rtAOb = new THREE.WebGLRenderTarget(hw, hh, { type: THREE.UnsignedByteType, depthBuffer: false });
    rtMB = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, depthBuffer: false });

    const bw = Math.max(1, width >> 2);
    const bh = Math.max(1, height >> 2);
    rtA = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType, depthBuffer: false });
    rtB = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType, depthBuffer: false });
    rtRays = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType, depthBuffer: false });
    rtRaysB = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType, depthBuffer: false });

    hasPrev = false;
  }

  function draw(material, target) {
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(quadScene, quadCamera);
  }

  function updateSun(camera, sunWorld) {
    if (!sunWorld) return;
    const camSpace = sunWorld.clone().applyMatrix4(camera.matrixWorldInverse);
    uniforms.uSunFade.value = camSpace.z < 0 ? 1 : 0;
    const ndc = sunWorld.clone().project(camera);
    // 允许太阳在屏幕外：径向光柱按真实方向计算，越界由采样时 clamp 处理
    uniforms.uSunUv.value.set(ndc.x * 0.5 + 0.5, ndc.y * 0.5 + 0.5);
  }

  function render(scene, camera, sunWorld = null) {
    renderer.setRenderTarget(rtScene);
    renderer.clear();
    renderer.render(scene, camera);
    // 只记录场景本身的绘制量，后处理的全屏 pass 不算进场景预算
    sceneStats.calls = renderer.info.render.calls;
    sceneStats.tris = renderer.info.render.triangles;

    camera.updateMatrixWorld();
    curViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    invViewProj.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    updateSun(camera, sunWorld);

    // ---- SSAO ----
    if (state.ao) {
      aoMat.uniforms.tDepth.value = rtScene.depthTexture;
      aoMat.uniforms.uProj.value.copy(camera.projectionMatrix);
      aoMat.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
      aoMat.uniforms.uNear.value = camera.near;
      aoMat.uniforms.uFar.value = camera.far;
      aoMat.uniforms.uTexel.value.set(1 / rtAO.width, 1 / rtAO.height);
      draw(aoMat, rtAO);

      const hw = rtAO.width;
      const hh = rtAO.height;
      blurMat.uniforms.tSrc.value = rtAO.texture;
      blurMat.uniforms.uDir.value.set(1 / hw, 0);
      draw(blurMat, rtAOb);
      blurMat.uniforms.tSrc.value = rtAOb.texture;
      blurMat.uniforms.uDir.value.set(0, 1 / hh);
      draw(blurMat, rtAO);
    }

    // ---- 运动模糊 ----
    let src = rtScene.texture;
    const motionOn = state.motion && hasPrev;
    if (motionOn) {
      motionMat.uniforms.tScene.value = rtScene.texture;
      motionMat.uniforms.tDepth.value = rtScene.depthTexture;
      motionMat.uniforms.uInvViewProj.value.copy(invViewProj);
      motionMat.uniforms.uPrevViewProj.value.copy(prevViewProj);
      draw(motionMat, rtMB);
      src = rtMB.texture;
    }

    // ---- Bloom ----
    if (state.bloom && state.iterations > 0) {
      brightMat.uniforms.tSrc.value = src;
      brightMat.uniforms.uThreshold.value = state.threshold;
      draw(brightMat, rtA);

      const bw = rtA.width;
      const bh = rtA.height;
      for (let i = 0; i < state.iterations; i++) {
        blurMat.uniforms.tSrc.value = rtA.texture;
        blurMat.uniforms.uDir.value.set(1 / bw, 0);
        draw(blurMat, rtB);

        blurMat.uniforms.tSrc.value = rtB.texture;
        blurMat.uniforms.uDir.value.set(0, 1 / bh);
        draw(blurMat, rtA);
      }
    }

    // ---- 体积光 ----
    if (state.rays && uniforms.uSunFade.value > 0.5) {
      rayMaskMat.uniforms.tSrc.value = src;
      draw(rayMaskMat, rtRaysB);

      raysMat.uniforms.tSrc.value = rtRaysB.texture;
      draw(raysMat, rtRays);
    }

    finalMat.uniforms.tScene.value = src;
    finalMat.uniforms.tAO.value = state.ao ? rtAO.texture : null;
    finalMat.uniforms.tBloom.value = state.bloom && state.iterations > 0 ? rtA.texture : black;
    finalMat.uniforms.tRays.value = state.rays && uniforms.uSunFade.value > 0.5 ? rtRays.texture : black;
    draw(finalMat, null);

    prevViewProj.copy(curViewProj);
    hasPrev = true;
  }

  function resize(cssWidth, cssHeight, dpr = 1) {
    width = Math.max(2, Math.round(cssWidth * dpr));
    height = Math.max(2, Math.round(cssHeight * dpr));
    makeTargets();
  }

  function setQuality({ samples, iterations, bloom, threshold, ao, motion, rays }) {
    if (samples !== undefined) state.samples = samples;
    if (iterations !== undefined) state.iterations = iterations;
    if (bloom !== undefined) state.bloom = bloom;
    if (threshold !== undefined) state.threshold = threshold;
    if (ao !== undefined) state.ao = ao;
    if (motion !== undefined) state.motion = motion;
    if (rays !== undefined) state.rays = rays;
    uniforms.uAoOn.value = state.ao ? 1 : 0;
    uniforms.uMotionOn.value = state.motion ? 1 : 0;
    uniforms.uRaysOn.value = state.rays ? 1 : 0;
    makeTargets();
  }

  return {
    uniforms,
    render,
    resize,
    setQuality,
    get sceneStats() { return sceneStats; },
    get resolution() { return [width, height]; },
    get state() { return { ...state, bloomStrength: uniforms.uBloomStrength.value }; },
    update(dt) { uniforms.uTime.value += dt; },
    dispose() { [rtScene, rtAO, rtAOb, rtMB, rtA, rtB, rtRays, rtRaysB].forEach((rt) => rt && rt.dispose()); },
  };
}
