// 体积光片：从窗户/灯口射出的半透明光锥。
// 屏幕空间径向光柱适合"太阳在画面里"的外景；室内用这种几何光片更稳定，不会拖出条状伪影。
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */`
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    // 沿光束方向渐隐，横向再收一道边，避免看到硬边
    float along = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y));
    float across = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));
    float a = along * across;
    gl_FragColor = vec4(uColor * uIntensity * a, a);
  }
`;

export function createShafts(scene) {
  const group = new THREE.Group();
  group.name = 'shafts';
  scene.add(group);

  function add({ pos = [0, 2, 0], width = 3, length = 6, dir = [0, -0.3, 1], color = 0xfff2d8, intensity = 0.3 } = {}) {
    const g1 = new THREE.PlaneGeometry(width, length, 1, 1);
    g1.translate(0, length / 2, 0);
    const g2 = g1.clone();
    g2.rotateY(Math.PI / 2);
    const geo = mergeGeometries([g1, g2], false);

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uIntensity: { value: intensity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    const d = new THREE.Vector3(...dir).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  }

  function clear() {
    group.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
    group.clear();
  }

  return { group, add, clear };
}
