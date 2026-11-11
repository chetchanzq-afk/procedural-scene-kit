// 代码建模层：用 box / cyl / tube / plane 拼道具，最终合并成一个几何体 + 一组 AABB 碰撞盒。
// 原则：几何在运行时生成，贴图在 shader 里求值，所以换场景只需要换这套生成代码。
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const ONE = new THREE.Vector3(1, 1, 1);

// 与 materials.atlas 的 4×4 图集槽位对应
const LABEL_COLS = 4;
const LABEL_UV = Array.from({ length: 16 }, (_, i) => {
  const col = i % LABEL_COLS;
  const row = Math.floor(i / LABEL_COLS);
  return [col / LABEL_COLS, 1 - (row + 1) / LABEL_COLS, (col + 1) / LABEL_COLS, 1 - row / LABEL_COLS];
});

// 倒角盒是非索引几何，与索引几何混并会让 mergeGeometries 返回 null，
// 因此合并前统一成同一种形式。
function normalizeIndexed(list) {
  const mixed = list.some((g) => !g.index);
  return mixed ? list.map((g) => (g.index ? g.toNonIndexed() : g)) : list;
}

function safeMerge(list, label) {
  const geo = mergeGeometries(normalizeIndexed(list), false);
  if (!geo) throw new Error(`几何合并失败（${label}）：请检查各构件的 position / normal / uv / color 属性是否一致`);
  return geo;
}

// 可复现随机：同一个 seed 生成同一份场景
export function makeRng(seed = 1) {
  let a = (seed >>> 0) || 1;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class PropBuilder {
  constructor(seed = 1) {
    this.parts = [];
    this.glowParts = [];
    this.labelParts = [];
    this.colliders = [];
    this.stack = [new THREE.Matrix4()];
    this.rand = makeRng(seed);
  }

  get M() { return this.stack[this.stack.length - 1]; }

  // 进入局部坐标系：之后画的零件都相对这个原点
  push(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
    const local = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, ONE);
    this.stack.push(this.M.clone().multiply(local));
    return this;
  }

  pop() {
    if (this.stack.length > 1) this.stack.pop();
    return this;
  }

  _add(geo, color, o = {}) {
    const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, glow = false, collide = true } = o;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
    const local = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, ONE);
    geo.applyMatrix4(this.M.clone().multiply(local));

    // 顶点色：普通件 1 倍，发光件给 >1 的 HDR 值，供 Bloom 提取
    const c = new THREE.Color(color);
    const k = glow ? (o.intensity ?? 3.2) : 1;
    const n = geo.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = c.r * k;
      arr[i * 3 + 1] = c.g * k;
      arr[i * 3 + 2] = c.b * k;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));

    if (glow) {
      this.glowParts.push(geo);
      return geo;
    }

    this.parts.push(geo);

    if (collide) {
      geo.computeBoundingBox();
      const b = geo.boundingBox;
      this.colliders.push([b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z]);
    }
    return geo;
  }

  // 主要构件
  box(color, w, h, d, x = 0, y = 0, z = 0, o = {}) {
    return this._add(new THREE.BoxGeometry(w, h, d), color, { x, y, z, ...o });
  }

  // 倒角盒：家具、设备等近距离可见的构件用它，边缘在光下才有厚度
  rbox(color, w, h, d, x = 0, y = 0, z = 0, o = {}) {
    const r = o.r ?? Math.min(0.022, Math.min(w, h, d) * 0.16);
    const seg = o.seg ?? 2;
    const g = new RoundedBoxGeometry(w, h, d, seg, r);
    return this._add(g, color, { x, y, z, ...o });
  }

  cyl(color, rTop, rBottom, h, x = 0, y = 0, z = 0, o = {}) {
    const g = new THREE.CylinderGeometry(rTop, rBottom, h, o.seg ?? 16, 1, !!o.open);
    return this._add(g, color, { x, y, z, ...o });
  }

  plane(color, w, h, x = 0, y = 0, z = 0, o = {}) {
    const g = new THREE.PlaneGeometry(w, h);
    return this._add(g, color, { x, y, z, collide: false, ...o });
  }

  // 线缆/管道：少量使用即可，TubeGeometry 面数偏高
  tube(color, points, radius = 0.04, o = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, o.seg ?? 12, radius, o.radial ?? 5, false);
    return this._add(g, color, { collide: false, ...o });
  }

  // 贴花：用极薄的盒子避免 z-fighting，颜色与主体分开
  decal(color, w, h, x = 0, y = 0, z = 0, o = {}) {
    return this.box(color, w, h, 0.012, x, y, z, { collide: false, ...o });
  }

  // 贴花图集：编号 / 警示牌 / 锈迹，slot 对应 materials.atlas 的槽位
  label(slot, w, h, x = 0, y = 0, z = 0, o = {}) {
    const geo = new THREE.PlaneGeometry(w, h);
    const uvAttr = geo.attributes.uv;
    const [u0, v0, u1, v1] = LABEL_UV[slot] || LABEL_UV[0];
    for (let i = 0; i < uvAttr.count; i++) {
      uvAttr.setXY(i, u0 + uvAttr.getX(i) * (u1 - u0), v0 + uvAttr.getY(i) * (v1 - v0));
    }
    uvAttr.needsUpdate = true;

    const { rx = 0, ry = 0, rz = 0 } = o;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
    const local = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, ONE);
    geo.applyMatrix4(this.M.clone().multiply(local));
    this.labelParts.push(geo);
    return geo;
  }

  build() {
    const geometry = this.parts.length ? safeMerge(this.parts, 'prop') : null;
    const glow = this.glowParts.length ? safeMerge(this.glowParts, 'prop-glow') : null;
    const labels = this.labelParts.length ? safeMerge(this.labelParts, 'prop-label') : null;
    if (geometry) geometry.computeBoundingSphere();
    if (glow) glow.computeBoundingSphere();
    return { geometry, glow, labels, colliders: this.colliders };
  }
}

// ---- 道具注册表：名称 -> 生成函数，生成函数只依赖尺寸与调色板 ----
export function createPropSystem() {
  const defs = new Map();

  const define = (name, def) => {
    if (!def || typeof def.build !== 'function') throw new Error(`道具 ${name} 缺少 build`);
    defs.set(name, { size: [1, 1, 1], tags: [], ...def });
    return def;
  };

  const build = (name, opts = {}) => {
    const def = defs.get(name);
    if (!def) throw new Error(`未注册的道具: ${name}`);
    const b = new PropBuilder(opts.seed ?? 1);
    def.build(b, { ...opts, size: def.size });
    b.pop();
    return { ...b.build(), def };
  };

  return { define, build, defs, list: () => [...defs.keys()] };
}

// ---- 关卡：摆放 + 静态合批 + 碰撞收集 ----
export class Level {
  constructor({ scene, materials, props }) {
    this.scene = scene;
    this.materials = materials;
    this.props = props;
    this.root = new THREE.Group();
    this.root.name = 'level';
    scene.add(this.root);
    this.staticGeos = [];
    this.glowGeos = [];
    this.labelGeos = [];
    this.colliders = [];
    this.count = 0;
    this._groundMesh = null;
  }

  ground(color, w, d, y = 0) {
    const g = new THREE.PlaneGeometry(w, d, 1, 1);
    g.rotateX(-Math.PI / 2);
    g.translate(0, y, 0);
    const c = new THREE.Color(color);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    this.staticGeos.push(g);
    return this;
  }

  place(name, x, z, opts = {}) {
    const { y = 0, ry = 0, scale = 1, seed = this.count + 1 } = opts;
    const built = this.props.build(name, { seed });
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
      new THREE.Vector3(scale, scale, scale),
    );

    if (built.geometry) {
      const g = built.geometry.clone();
      g.applyMatrix4(m);
      this.staticGeos.push(g);
    }
    if (built.glow) {
      const g = built.glow.clone();
      g.applyMatrix4(m);
      this.glowGeos.push(g);
    }
    if (built.labels) {
      const g = built.labels.clone();
      g.applyMatrix4(m);
      this.labelGeos.push(g);
    }
    for (const c of built.colliders) {
      const box = new THREE.Box3(new THREE.Vector3(c[0], c[1], c[2]), new THREE.Vector3(c[3], c[4], c[5]));
      box.applyMatrix4(m);
      this.colliders.push([box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z]);
    }
    this.count++;
    return this;
  }

  // 同一种道具批量摆放，常用于行列、围墙、集装箱阵列
  row(name, from, to, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      const x = from[0] + (to[0] - from[0]) * t;
      const z = from[1] + (to[1] - from[1]) * t;
      this.place(name, x, z, { ...opts, seed: (opts.seed ?? 1) + i * 7 });
    }
    return this;
  }

  build() {
    if (this.staticGeos.length) {
      const geo = safeMerge(this.staticGeos, 'level');
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, this.materials.paint);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = 'static';
      this.root.add(mesh);
      this._staticMesh = mesh;
    }
    if (this.glowGeos.length) {
      const geo = safeMerge(this.glowGeos, 'level-glow');
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, this.materials.glow);
      mesh.name = 'glow';
      this.root.add(mesh);
      this._glowMesh = mesh;
    }
    if (this.labelGeos.length && this.materials.decal) {
      const geo = safeMerge(this.labelGeos, 'level-label');
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, this.materials.decal);
      mesh.name = 'labels';
      mesh.renderOrder = 1;
      this.root.add(mesh);
      this._labelMesh = mesh;
    }
    return this;
  }
}
