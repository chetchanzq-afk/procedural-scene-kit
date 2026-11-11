// 场景内核：把渲染器、材质、管线、画质、建模、主题串起来。
// 生成新场景时通常只写 props + scene 两个文件，这里保持不动。
import * as THREE from 'three';
import { createMaterials } from './materials.js';
import { createPipeline } from './pipeline.js';
import { createQuality, guessQuality } from './quality.js';
import { createPropSystem, Level } from './mesh.js';
import { createShafts } from './shafts.js';
import { createRain } from './weather.js';
import { getTheme } from './themes.js';

function setupErrors() {
  window.__errors = window.__errors || [];
  window.addEventListener('error', (e) => window.__errors.push(String(e.message)));
  const raw = console.error.bind(console);
  console.error = (...args) => {
    try {
      window.__errors.push(args.map((a) => (a && a.stack) || String(a)).join(' ').slice(0, 400));
    } catch {}
    raw(...args);
  };
}

function createControls(camera, dom) {
  const keys = new Set();
  let dragging = false;
  let px = 0;
  let py = 0;
  let enabled = true;

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  let yaw = Math.atan2(-dir.x, -dir.z);
  let pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));

  dom.addEventListener('pointerdown', (e) => {
    if (!enabled) return;
    dragging = true;
    px = e.clientX;
    py = e.clientY;
    dom.setPointerCapture?.(e.pointerId);
  });
  dom.addEventListener('pointermove', (e) => {
    if (!dragging || !enabled) return;
    yaw -= (e.clientX - px) * 0.0026;
    pitch -= (e.clientY - py) * 0.0022;
    pitch = THREE.MathUtils.clamp(pitch, -1.35, 1.35);
    px = e.clientX;
    py = e.clientY;
  });
  const stop = () => { dragging = false; };
  dom.addEventListener('pointerup', stop);
  dom.addEventListener('pointercancel', stop);

  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  return {
    set enabled(v) { enabled = v; },
    get enabled() { return enabled; },
    setLook(y, p) { yaw = y; pitch = p; },
    update(dt) {
      camera.rotation.order = 'YXZ';
      euler.set(pitch, yaw, 0);
      camera.quaternion.setFromEuler(euler);

      if (!enabled) return;
      const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 18 : 7) * dt;
      fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      right.set(Math.cos(yaw), 0, -Math.sin(yaw));

      let mx = 0;
      let mz = 0;
      if (keys.has('KeyW')) mz += 1;
      if (keys.has('KeyS')) mz -= 1;
      if (keys.has('KeyD')) mx += 1;
      if (keys.has('KeyA')) mx -= 1;
      if (mx || mz) {
        const len = Math.hypot(mx, mz);
        camera.position.addScaledVector(fwd, (mz / len) * speed);
        camera.position.addScaledVector(right, (mx / len) * speed);
      }
      if (keys.has('KeyQ')) camera.position.y -= speed;
      if (keys.has('KeyE')) camera.position.y += speed;
    },
  };
}

// 程序化环境贴图：没有它，MeshStandardMaterial 的金属/高光部分只能反射黑色，
// 夜景和湿润地面会直接糊成一片。这里用天空渐变生成一张 IBL。
function buildEnvironment(renderer, theme) {
  const envScene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(60, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(theme.env.top) },
      uMid: { value: new THREE.Color(theme.env.mid) },
      uBottom: { value: new THREE.Color(theme.env.bottom) },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vDir;
      uniform vec3 uTop, uMid, uBottom;
      void main() {
        float h = vDir.y;
        vec3 c = h > 0.0 ? mix(uMid, uTop, pow(h, 0.55)) : mix(uMid, uBottom, pow(-h, 0.45));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  envScene.add(new THREE.Mesh(geo, mat));

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  geo.dispose();
  mat.dispose();
  return rt;
}

export function createKit({ canvas, params = {} }) {
  setupErrors();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);
  camera.position.set(20, 10, 30);
  camera.rotation.order = 'YXZ';

  const materials = createMaterials();
  const props = createPropSystem();
  let level = new Level({ scene, materials, props });
  const shafts = createShafts(scene);
  const rain = createRain(scene);
  const pipeline = createPipeline(renderer, {});
  const quality = createQuality(renderer, pipeline, materials);

  // 湿地面平面反射：镜像相机 + 半分辨率 RT
  const reflRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true });
  const reflCam = new THREE.PerspectiveCamera();
  const reflVP = new THREE.Matrix4();
  const camDir = new THREE.Vector3();
  const camTarget = new THREE.Vector3();

  // 阴影图体积雾：主光正交深度 + 半分辨率步进
  const volRT = new THREE.WebGLRenderTarget(1024, 1024, { depthBuffer: true });
  volRT.depthTexture = new THREE.DepthTexture(1024, 1024);
  const volCam = new THREE.OrthographicCamera(-60, 60, 60, -60, 1, 320);
  const volVP = new THREE.Matrix4();
  const depthOverride = new THREE.MeshDepthMaterial();
  let volFrame = 0;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.castShadow = true;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 260;
  scene.add(hemi, sun, sun.target);

  // 天空穹顶：平涂背景在白天会显得很假，这里用主题色做一条纵向渐变。
  // 主题不写 skyTop/skyBottom 时三段同色，等于保持原来的纯色背景。
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x000000) },
      uMid: { value: new THREE.Color(0x000000) },
      uBottom: { value: new THREE.Color(0x000000) },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vDir;
      uniform vec3 uTop, uMid, uBottom;
      void main() {
        float h = vDir.y;
        vec3 c = h > 0.0 ? mix(uMid, uTop, pow(h, 0.55)) : mix(uMid, uBottom, pow(-h, 0.45));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 16), skyMat);
  skyDome.frustumCulled = false;
  skyDome.renderOrder = -1;
  scene.add(skyDome);

  const controls = createControls(camera, canvas);
  if (params.shot) controls.enabled = false;

  const state = { theme: null, time: 0, paused: false, frame: 0 };
  let avgFrame = 16.7;
  let fps = 60;
  let envRT = null;
  const updates = [];

  quality.apply(params.q || guessQuality(), sun);

  function setTheme(id) {
    const t = getTheme(id);
    state.theme = t;
    scene.background = new THREE.Color(t.sky);
    skyMat.uniforms.uTop.value.setHex(t.skyTop ?? t.sky);
    skyMat.uniforms.uMid.value.setHex(t.sky);
    skyMat.uniforms.uBottom.value.setHex(t.skyBottom ?? t.sky);
    scene.fog = new THREE.FogExp2(t.fog.color, t.fog.density);

    sun.color.setHex(t.sun.color);
    sun.intensity = t.sun.intensity;
    sun.position.set(...t.sun.dir).normalize().multiplyScalar(120);
    sun.target.position.set(0, 0, 0);

    const vs = (t.shadow && t.shadow.size) || 60;
    volCam.left = -vs;
    volCam.right = vs;
    volCam.top = vs;
    volCam.bottom = -vs;
    volCam.near = 1;
    volCam.far = 320;
    volCam.updateProjectionMatrix();
    volCam.position.copy(sun.position);
    volCam.lookAt(0, 0, 0);
    volCam.updateMatrixWorld();

    // 室内等小场景需要更紧的阴影范围，否则高分辨率阴影图也铺不满细节
    if (t.shadow) {
      const s = t.shadow.size ?? 80;
      sun.shadow.camera.left = -s;
      sun.shadow.camera.right = s;
      sun.shadow.camera.top = s;
      sun.shadow.camera.bottom = -s;
      sun.shadow.camera.near = t.shadow.near ?? 1;
      sun.shadow.camera.far = t.shadow.far ?? 260;
      sun.shadow.camera.updateProjectionMatrix();
    }

    hemi.color.setHex(t.hemi.sky);
    hemi.groundColor.setHex(t.hemi.ground);
    hemi.intensity = t.hemi.intensity;

    // 换主题重建 IBL，金属与湿润表面才有东西可反射
    if (envRT) envRT.dispose();
    envRT = buildEnvironment(renderer, t);
    scene.environment = envRT.texture;
    scene.environmentIntensity = t.env.intensity;

    pipeline.uniforms.uExposure.value = t.exposure;
    pipeline.uniforms.uBloomStrength.value = t.post.bloom;
    pipeline.uniforms.uSat.value = t.post.saturation;
    if (t.post.contrast !== undefined) pipeline.uniforms.uContrast.value = t.post.contrast;
    pipeline.uniforms.uCA.value = t.post.ca;
    pipeline.uniforms.uGrain.value = t.post.grain;
    pipeline.uniforms.uVignette.value = t.post.vignette;
    if (t.post.dirt !== undefined) pipeline.uniforms.uDirtAmount.value = t.post.dirt;
    if (t.post.threshold !== undefined) pipeline.uniforms.uThreshold.value = t.post.threshold;
    if (t.adaptTarget !== undefined) pipeline.uniforms.uAdaptTarget.value = t.adaptTarget;
    if (t.ao) {
      if (t.ao.intensity !== undefined) pipeline.uniforms.uAoIntensity.value = t.ao.intensity;
      if (t.ao.radius !== undefined) pipeline.uniforms.uAoRadius.value = t.ao.radius;
    }
    if (t.rays) {
      pipeline.uniforms.uRays.value = t.rays.strength ?? 0.55;
      pipeline.uniforms.uRayDensity.value = t.rays.density ?? 0.85;
      pipeline.uniforms.uRayDecay.value = t.rays.decay ?? 0.93;
      pipeline.uniforms.uRayThreshold.value = t.rays.threshold ?? 1.0;
    }
    if (t.motion) {
      pipeline.uniforms.uShutter.value = t.motion.shutter ?? 0.55;
      pipeline.uniforms.uMaxVel.value = t.motion.maxVel ?? 0.06;
    }

    materials.setWetness(t.wetness);
    materials.setGrime(t.grime);

    // 天气：雨
    if (t.weather === 'rain') {
      rain.setEnabled(true);
      if (t.rain) {
        rain.setOpacity(t.rain.opacity ?? 0.4);
        rain.mesh.material.uniforms.uColor.value.setHex(t.rain.color ?? 0xaecbe0);
      }
    } else {
      rain.setEnabled(false);
    }
    return t;
  }

  function resize() {
    const w = Math.max(2, canvas.clientWidth || window.innerWidth);
    const h = Math.max(2, canvas.clientHeight || window.innerHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    quality.resize(w, h);
    reflRT.setSize(Math.max(2, Math.floor(canvas.width * 0.35)), Math.max(2, Math.floor(canvas.height * 0.35)));
  }
  window.addEventListener('resize', resize);

  function stats() {
    const s = pipeline.sceneStats;
    return {
      calls: s.calls,
      tris: s.tris,
      programs: renderer.info.programs ? renderer.info.programs.length : 0,
      res: pipeline.resolution,
      scale: quality.dynamicScale,
      quality: quality.name,
      theme: state.theme ? state.theme.id : null,
      fps: Number(fps.toFixed(1)),
      ms: Number(avgFrame.toFixed(1)),
      props: level.count,
      colliders: level.colliders.length,
      errors: (window.__errors || []).length,
    };
  }

  function resetLevel() {
    shafts.clear();
    level.root.traverse((o) => {
      if (o.isMesh && o.geometry) o.geometry.dispose();
    });
    scene.remove(level.root);
    level = new Level({ scene, materials, props });
    return level;
  }

  function start() {
    resize();
    let last = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      state.time += dt;
      state.frame++;

      materials.update(dt);
      pipeline.update(dt);
      controls.update(dt);
      rain.update(dt, camera);

      // ?spin=1 让相机绕场景缓慢环绕，用于演示与截图验证（尤其是运动模糊）
      if (params.spin) {
        state.spinT = (state.spinT || 0) + dt * 0.9;
        camera.position.set(Math.cos(state.spinT) * 22, 9, Math.sin(state.spinT) * 22);
        camera.rotation.set(-0.12, -state.spinT + Math.PI / 2, 0, 'YXZ');
      }

      // ---- 湿地面反射 ----
      const wet = state.theme ? state.theme.wetness : 0;
      if (wet > 0.35 && level.groundMesh) {
        const gm = level.groundMesh;
        gm.visible = false;
        rain.mesh.visible = false;
        shafts.group.visible = false;

        reflCam.copy(camera);
        reflCam.position.set(camera.position.x, -camera.position.y, camera.position.z);
        camera.getWorldDirection(camDir);
        camTarget.copy(camera.position).add(camDir);
        camTarget.y = -camTarget.y;
        reflCam.up.set(0, 1, 0);
        reflCam.lookAt(camTarget);
        reflCam.projectionMatrix.copy(camera.projectionMatrix);
        reflCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
        reflCam.updateMatrixWorld();

        renderer.setRenderTarget(reflRT);
        renderer.clear();
        renderer.render(scene, reflCam);
        renderer.setRenderTarget(null);

        gm.visible = true;
        rain.mesh.visible = state.theme.weather === 'rain';
        shafts.group.visible = true;

        reflVP.multiplyMatrices(reflCam.projectionMatrix, reflCam.matrixWorldInverse);
        materials.setReflection(reflRT.texture, reflVP, Math.min(0.28, wet * 0.28));
      } else {
        materials.setReflection(null, null, 0);
      }

      // ---- 阴影图体积雾：每两帧更新一次深度 ----
      if (pipeline.state.vol && state.theme && state.theme.volumetric) {
        volFrame++;
        if (volFrame % 2 === 0) {
          rain.mesh.visible = false;
          shafts.group.visible = false;
          skyDome.visible = false;
          const bg = scene.background;
          scene.background = null;
          scene.overrideMaterial = depthOverride;
          renderer.setRenderTarget(volRT);
          renderer.clear();
          renderer.render(scene, volCam);
          renderer.setRenderTarget(null);
          scene.overrideMaterial = null;
          scene.background = bg;
          skyDome.visible = true;
          rain.mesh.visible = state.theme.weather === 'rain';
          shafts.group.visible = true;
          volVP.multiplyMatrices(volCam.projectionMatrix, volCam.matrixWorldInverse);
        }
        pipeline.setVolume(volRT.depthTexture, volVP, state.theme.volumetric);
      } else {
        pipeline.setVolume(null, volVP, 0);
      }

      for (const fn of updates) fn(dt, state);

      if (quality.update(dt)) quality.resize(
        canvas.clientWidth || window.innerWidth,
        canvas.clientHeight || window.innerHeight,
      );

      const ms = dt * 1000;
      avgFrame = avgFrame * 0.9 + ms * 0.1;
      fps = fps * 0.9 + (1 / Math.max(dt, 1e-4)) * 0.1;

      pipeline.render(scene, camera, sun.position);
      window.__frames = (window.__frames || 0) + 1;
      if (window.__frames === 2) window.__ready = true;
    });
  }

  window.__stats = stats;

  return {
    renderer, scene, camera, materials, pipeline, quality, props, shafts, rain,
    get level() { return level; },
    sun, hemi, controls, state,
    setTheme, start, stats, resize, resetLevel,
    onUpdate: (fn) => updates.push(fn),
  };
}
