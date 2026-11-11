// 天气：雨。用实例化雨丝，顶点着色器里做循环下落，CPU 只更新相机中心。
// 不引入贴图与粒子系统依赖。
import * as THREE from 'three';

const VERT = /* glsl */`
  attribute vec3 aOffset;
  attribute float aSpeed;
  attribute float aScale;
  uniform float uTime;
  uniform vec3 uCenter;
  uniform float uHeight;
  uniform vec3 uDir;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 base = aOffset;
    base.y = mod(base.y - uTime * aSpeed, uHeight);
    vec3 world = uCenter + vec3(base.x, base.y - uHeight * 0.5, base.z);

    vec3 right = normalize(uDir);
    vec3 up = normalize(vec3(0.08, 1.0, 0.03));
    vec3 pos = world + right * position.x * aScale + up * position.y * aScale;
    gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float a = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
    a *= smoothstep(0.0, 0.35, vUv.x) * (1.0 - smoothstep(0.65, 1.0, vUv.x));
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`;

export function createRain(scene, opts = {}) {
  const count = opts.count ?? 1800;
  const area = opts.area ?? 70;
  const height = opts.height ?? 34;
  const speed = opts.speed ?? 16;

  const base = new THREE.PlaneGeometry(0.016, 0.62, 1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  geo.attributes.uv = base.attributes.uv;

  const offsets = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    offsets[i * 3] = (Math.random() - 0.5) * area;
    offsets[i * 3 + 1] = Math.random() * height;
    offsets[i * 3 + 2] = (Math.random() - 0.5) * area;
    speeds[i] = speed * (0.7 + Math.random() * 0.7);
    scales[i] = 0.8 + Math.random() * 0.9;
  }
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
  geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));

  const uniforms = {
    uTime: { value: 0 },
    uCenter: { value: new THREE.Vector3() },
    uHeight: { value: height },
    uDir: { value: new THREE.Vector3(1, 0, 0) },
    uColor: { value: new THREE.Color(opts.color ?? 0xaecbe0) },
    uOpacity: { value: opts.opacity ?? 0.4 },
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);

  const right = new THREE.Vector3();

  return {
    mesh,
    setEnabled(v) { mesh.visible = !!v; },
    setOpacity(v) { uniforms.uOpacity.value = v; },
    update(dt, camera) {
      if (!mesh.visible) return;
      uniforms.uTime.value += dt;
      uniforms.uCenter.value.copy(camera.position);
      right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      right.y = 0;
      if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
      uniforms.uDir.value.copy(right.normalize());
    },
  };
}
