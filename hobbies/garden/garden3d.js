// The potted garden in 3D. Every plant is modelled procedurally from instanced leaves, stems, flowers and fruit,
// and grows, flowers and fruits on its real dates as the page scrolls (state from window.GardenApp in garden.js).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const App = window.GardenApp;
const stage = document.getElementById('stage');
const canvas = document.getElementById('garden3d');
const fallbackEl = document.getElementById('fallback');
const tip = document.getElementById('tip');
const hint = document.getElementById('stageHint');

function noWebGL() {
  fallbackEl.hidden = false;
  canvas.hidden = true;
}

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }
if (!App || !renderer) noWebGL(); else init();

function init() {
  const G = App.G;
  const reduce = App.reduce;
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const lerp = (a, b, t) => a + (b - a) * t;
  function rngFrom(seed) {
    let s = 0; for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
    return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ---------- renderer, scene, camera ----------
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 260);
  scene.fog = new THREE.Fog(0xf0d8b8, 22, 75);

  // Sky dome with a sun glow, plus stars that come out at night
  const skyUniforms = {
    uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color(0x3a2f28) },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color() }, uSunSize: { value: 1 }
  };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uTop, uHorizon, uGround, uSunDir, uSunColor; uniform float uSunSize; varying vec3 vDir;
      void main(){ float h = vDir.y;
        vec3 c = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h,0.0,1.0), 0.55)) : mix(uHorizon, uGround, pow(clamp(-h*3.0,0.0,1.0), 0.7));
        float d = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
        c += uSunColor * (pow(d, 900.0) * 1.6 * uSunSize + pow(d, 14.0) * 0.32 + pow(d, 3.0) * 0.08);
        gl_FragColor = vec4(c, 1.0); }`
  }));
  sky.renderOrder = -10;
  scene.add(sky);

  const starGeo = new THREE.BufferGeometry();
  { const rnd = rngFrom('stars'), pts = [];
    for (let i = 0; i < 900; i++) { const u = rnd(), v = rnd() * 0.85 + 0.12, th = u * TAU, ph = Math.acos(v); pts.push(Math.sin(ph) * Math.cos(th) * 160, Math.cos(ph) * 160, Math.sin(ph) * Math.sin(th) * 160); }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); }
  const starMat = new THREE.PointsMaterial({ color: 0xdfe6ff, size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
  scene.add(new THREE.Points(starGeo, starMat));

  // Lights
  const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x6b4a36, 0.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 60 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  scene.add(sun, sun.target);
  sun.target.position.set(-0.5, 0, -1.5);
  const bounce = new THREE.DirectionalLight(0xffe2c4, 0.35);
  bounce.position.set(4, 3, 8);
  scene.add(bounce);
  const bloomLight = new THREE.PointLight(0xfff6e0, 0, 4.5, 1.6);
  scene.add(bloomLight);

  // ---------- textures ----------
  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  // Cream floor tiles with red bands, like the courtyard in the photos
  const floorTex = canvasTex(512, 512, (g, w) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const red = i === 0 || j === 0;
      g.fillStyle = red ? '#9d3427' : ['#eadfca', '#e6d9c2', '#ede3d0'][(i * 7 + j * 3) % 3];
      g.fillRect(i * s, j * s, s, s);
    }
    g.strokeStyle = 'rgba(90,70,55,0.35)'; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, w); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  }, [8, 6]);
  const checkTex = canvasTex(256, 256, (g, w) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#a2382b' : '#ecdfc8'; g.fillRect(i * s, j * s, s, s); }
    g.strokeStyle = 'rgba(80,60,50,0.35)'; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, w); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  }, [22, 2]);
  const wallTex = canvasTex(64, 512, (g, w, h) => {
    g.fillStyle = '#eadfc8'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(120,100,80,0.22)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, y + 2, w, 1); }
  }, [1, 1]);
  const soilTex = canvasTex(128, 128, (g, w) => {
    g.fillStyle = '#3a271c'; g.fillRect(0, 0, w, w);
    const r = rngFrom('soil');
    for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.85 ? 'rgba(210,200,185,0.55)' : `rgba(${20 + r() * 50},${12 + r() * 30},${8 + r() * 20},0.8)`; g.fillRect(r() * w, r() * w, 1 + r() * 2, 1 + r() * 2); }
  }, [1, 1]);
  const pineTex = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#b8862e'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70,45,15,0.75)'; g.lineWidth = 3;
    for (let k = -h; k < h * 2; k += 22) { g.beginPath(); g.moveTo(0, k); g.lineTo(w, k + w * 0.8); g.stroke(); g.beginPath(); g.moveTo(w, k); g.lineTo(0, k + w * 0.8); g.stroke(); }
  }, [3, 2]);

  // ---------- leaf / part geometry ----------
  // A curved blade along +y (length 1): width profile, curl towards +z, fold across the midrib
  function bladeGeo(width, curl, fold, shape = 'leaf', segV = 7) {
    const pos = [], idx = [];
    for (let j = 0; j <= segV; j++) {
      const v = j / segV;
      let hw;
      if (shape === 'leaf') hw = width * Math.pow(Math.sin(Math.PI * Math.min(1, v * 0.92 + 0.04)), 0.75) * (1 - 0.25 * v);
      else if (shape === 'broad') hw = width * Math.pow(Math.sin(Math.PI * (0.08 + v * 0.86)), 0.5);
      else hw = width * Math.pow(1 - v, 0.85); // spike / blade
      for (let i = -1; i <= 1; i++) {
        const x = i * hw;
        pos.push(x, v, curl * v * v + fold * Math.abs(i) * hw);
      }
    }
    for (let j = 0; j < segV; j++) for (let i = 0; i < 2; i++) {
      const a = j * 3 + i, b = a + 1, c = a + 3, d = a + 4;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  const geo = {
    leaf: bladeGeo(0.36, 0.22, 0.12, 'leaf'),
    broad: bladeGeo(0.62, 0.32, -0.22, 'broad'),
    blade: bladeGeo(0.05, 0.42, 0.06, 'spike', 9),
    spike: bladeGeo(0.085, 0.24, 0.14, 'spike', 6),
    stem: new THREE.CylinderGeometry(1, 1, 1, 6, 1).translate(0, 0.5, 0),
    sphere: new THREE.SphereGeometry(1, 12, 9),
    head: (() => { const g = new THREE.SphereGeometry(1, 16, 12); const p = g.attributes.position, r = rngFrom('head');
      for (let i = 0; i < p.count; i++) { const k = 1 + (r() - 0.5) * 0.06; p.setXYZ(i, p.getX(i) * k, p.getY(i) * 0.85 * k, p.getZ(i) * k); } g.computeVertexNormals(); return g; })(),
    curd: (() => { const g = new THREE.IcosahedronGeometry(1, 3); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const n = 1 + 0.09 * Math.sin(x * 11) * Math.sin(y * 13) * Math.sin(z * 9) + 0.05 * Math.sin(x * 27 + z * 23);
        p.setXYZ(i, x * n, Math.max(y * 0.62 * n, -0.15), z * n); }
      g.computeVertexNormals(); return g; })(),
    pepper: new THREE.LatheGeometry([[0, -1], [0.55, -0.92], [0.85, -0.6], [0.92, -0.1], [0.8, 0.25], [0.35, 0.36], [0.1, 0.5]].map(([x, y]) => new THREE.Vector2(x, y)), 10),
    chilli: new THREE.ConeGeometry(0.16, 1, 6).rotateX(Math.PI).translate(0, -0.5, 0),
    pom: (() => { const g = new THREE.IcosahedronGeometry(1, 1); const p = g.attributes.position, r = rngFrom('pom');
      for (let i = 0; i < p.count; i++) { const k = 0.85 + r() * 0.3; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.8, p.getZ(i) * k); } g.computeVertexNormals(); return g; })(),
    petals: (() => { const parts = [];
      for (let i = 0; i < 6; i++) { const b = bladeGeo(0.45, -0.18, 0.05, 'leaf', 4); b.rotateX(-1.15); b.rotateY(i * TAU / 6); parts.push(b); }
      return mergeGeometries(parts); })(),
    trumpet: new THREE.LatheGeometry([[0.02, 0], [0.12, 0.1], [0.14, 0.5], [0.3, 0.82], [0.62, 0.98], [0.8, 0.96], [0.66, 1.0], [0.3, 0.9], [0.1, 0.55]].map(([x, y]) => new THREE.Vector2(x, y)), 14),
    dfruit: (() => { const g = new THREE.IcosahedronGeometry(1, 1); g.scale(0.85, 1.15, 0.85); g.computeVertexNormals(); return g; })(),
    cactus: (() => {
      const s = new THREE.Shape();
      for (let i = 0; i <= 36; i++) { const th = i / 36 * TAU, r = 0.55 + 0.45 * Math.pow(Math.abs(Math.cos(1.5 * th)), 2.2); const x = Math.cos(th) * r, y = Math.sin(th) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
      const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, steps: 1, curveSegments: 6 });
      g.rotateX(-Math.PI / 2); g.computeVertexNormals(); return g;
    })()
  };
  geo.blade.computeVertexNormals();

  // ---------- materials ----------
  const windUniform = { value: 0 };
  function swaying(mat, amount) {
    mat.onBeforeCompile = sh => {
      sh.uniforms.uTime = windUniform;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 wO = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float ph = wO.x * 1.7 + wO.z * 1.3 + wO.y * 2.1;
          float hh = position.y * position.y;
          transformed.x += sin(uTime * 1.6 + ph) * ${amount.toFixed(3)} * hh;
          transformed.z += cos(uTime * 1.25 + ph * 1.3) * ${(amount * 0.8).toFixed(3)} * hh;
        #endif`);
    };
    return mat;
  }
  const mat = {
    leaf: swaying(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0, side: THREE.DoubleSide }), 0.05),
    blade: swaying(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide }), 0.06),
    stem: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
    fruit: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0 }),
    veg: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
    flower: swaying(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, side: THREE.DoubleSide }), 0.03),
    cactus: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, flatShading: true }),
    night: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide, emissive: 0xfff4dc, emissiveIntensity: 0 })
  };
  const potMats = {
    terracotta: () => new THREE.MeshStandardMaterial({ color: 0xbd6440, roughness: 0.82 }),
    big: () => new THREE.MeshStandardMaterial({ color: 0xd7895f, roughness: 0.55 }),
    oct: () => new THREE.MeshStandardMaterial({ color: 0xc46a42, roughness: 0.8, flatShading: true }),
    black: () => new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.5 }),
    green: () => new THREE.MeshStandardMaterial({ color: 0x4a7f35, roughness: 0.6 }),
    tray: () => new THREE.MeshStandardMaterial({ color: 0xe0582d, roughness: 0.6 })
  };
  const soilMat = new THREE.MeshStandardMaterial({ map: soilTex, roughness: 1 });

  // ---------- instanced pools ----------
  const pools = {};
  const POOL_DEF = {
    leaf: ['leaf', 'leaf'], broad: ['broad', 'leaf'], blade: ['blade', 'blade'], spike: ['spike', 'blade'], stem: ['stem', 'stem'],
    sphere: ['sphere', 'fruit'], head: ['head', 'veg'], curd: ['curd', 'veg'], pepper: ['pepper', 'fruit'], chilli: ['chilli', 'fruit'],
    pom: ['pom', 'flower'], petals: ['petals', 'flower'], trumpet: ['trumpet', 'night'], dfruit: ['dfruit', 'fruit'], cactus: ['cactus', 'cactus']
  };
  Object.keys(POOL_DEF).forEach(k => { pools[k] = { items: [] }; });
  const tmpObj = new THREE.Object3D();
  const C = hex => new THREE.Color(hex);
  function M(x, y, z, yaw = 0, tilt = 0, roll = 0, sx = 1, sy = sx, sz = sx) {
    tmpObj.position.set(x, y, z); tmpObj.rotation.set(tilt, yaw, roll, 'YXZ'); tmpObj.scale.set(sx, sy, sz); tmpObj.updateMatrix();
    return tmpObj.matrix.clone();
  }
  // Orient +y along a direction
  const up = new THREE.Vector3(0, 1, 0), qTmp = new THREE.Quaternion();
  function Mdir(p, dir, sx, len) {
    qTmp.setFromUnitVectors(up, dir.clone().normalize());
    return new THREE.Matrix4().compose(p.clone(), qTmp.clone(), new THREE.Vector3(sx, len, sx));
  }

  // ---------- environment ----------
  const world = new THREE.Group();
  scene.add(world);
  function box(w, h, d, material, x, y, z, cast = false, receive = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = receive; world.add(m); return m;
  }
  const WALL_Z = -4.6;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 44), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 8); floor.receiveShadow = true; world.add(floor);
  floorTex.repeat.set(64 / 2.4, 44 / 2.4);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(18, 1.0), new THREE.MeshStandardMaterial({ map: checkTex, roughness: 0.45 }));
  strip.rotation.x = -Math.PI / 2; strip.position.set(0, 0.002, -3.5); strip.receiveShadow = true; world.add(strip);
  checkTex.repeat.set(18 / 0.9, 1.0 / 0.45);
  // house wall with cladding grooves, a plinth, windows and a pipe
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92 });
  wallTex.repeat.set(44 / 0.5, 5 / 4);
  box(44, 5, 0.3, wallMat, 0, 2.5, WALL_Z - 0.15, false, true);
  const ledgeMat = new THREE.MeshStandardMaterial({ color: 0xdcccb1, roughness: 0.85 });
  box(18, 0.45, 0.62, ledgeMat, 0, 0.225, WALL_Z + 0.31, true, true);
  box(18.1, 0.05, 0.7, new THREE.MeshStandardMaterial({ color: 0xcdb99a, roughness: 0.7 }), 0, 0.47, WALL_Z + 0.33, true, true);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.6 });
  const glassTex = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7f93ab'); gr.addColorStop(0.55, '#475569'); gr.addColorStop(1, '#2a3340');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // curtains on both sides, with soft folds
    const curtain = (x0, x1) => { for (let x = x0; x < x1; x += 6) { const k = 0.5 + 0.5 * Math.sin(x * 0.45); g.fillStyle = `rgb(${226 - k * 26},${214 - k * 26},${190 - k * 24})`; g.fillRect(x, 0, 6, h); } };
    curtain(0, w * 0.34); curtain(w * 0.8, w);
    // a diagonal sky reflection
    g.globalAlpha = 0.22; g.fillStyle = '#e8f1ff';
    g.beginPath(); g.moveTo(w * 0.35, 0); g.lineTo(w * 0.6, 0); g.lineTo(w * 0.25, h); g.lineTo(0, h); g.closePath(); g.fill();
    g.globalAlpha = 1;
  });
  const glassMat = new THREE.MeshStandardMaterial({ map: glassTex, emissive: 0xffffff, emissiveMap: glassTex, emissiveIntensity: 0.28, roughness: 0.25, metalness: 0.05 });
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x2a2522, roughness: 0.5, metalness: 0.3 });
  [-2.8, 3.6].forEach(wx => {
    box(1.6, 1.5, 0.08, frameMat, wx, 1.95, WALL_Z + 0.02);
    box(1.4, 1.3, 0.06, glassMat, wx, 1.95, WALL_Z + 0.05);
    for (let i = 0; i < 6; i++) box(0.022, 1.3, 0.025, grilleMat, wx - 0.6 + i * 0.24, 1.95, WALL_Z + 0.1, true, false);
    for (let j = 0; j < 3; j++) box(1.4, 0.022, 0.025, grilleMat, wx, 1.55 + j * 0.4, WALL_Z + 0.1, true, false);
    for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.009, 4, 4), grilleMat); d.position.set(wx - 0.48 + i * 0.24, 1.75, WALL_Z + 0.1); d.rotation.z = Math.PI / 4; world.add(d);
      const d2 = d.clone(); d2.position.y = 2.15; world.add(d2); }
    box(1.7, 0.05, 0.16, frameMat, wx, 1.18, WALL_Z + 0.08, true);
    box(1.8, 0.1, 0.3, frameMat, wx, 2.75, WALL_Z + 0.1, true);
  });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.5 });
  { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 18, 8), pipeMat); p.rotation.z = Math.PI / 2; p.position.set(0, 1.05, WALL_Z + 0.06); world.add(p);
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 8), pipeMat); v.position.set(6.6, 2.6, WALL_Z + 0.07); world.add(v); }
  // low parapet with a black railing on the right
  const parapetMat = new THREE.MeshStandardMaterial({ color: 0xe5d8c0, roughness: 0.9 });
  box(0.3, 0.75, 7.6, parapetMat, 7.0, 0.375, -0.9, true, true);
  box(0.36, 0.06, 7.7, ledgeMat, 7.0, 0.78, -0.9, true, true);
  { const railGeo = new THREE.BoxGeometry(0.025, 0.7, 0.025), rail = new THREE.InstancedMesh(railGeo, grilleMat, 40);
    for (let i = 0; i < 40; i++) { rail.setMatrixAt(i, M(7.0, 1.16, -4.6 + i * 0.19)); }
    rail.castShadow = true; world.add(rail);
    box(0.05, 0.05, 7.6, grilleMat, 7.0, 1.52, -0.9, true, false); }
  // a few trees far behind the house for depth
  { const farMat = new THREE.MeshStandardMaterial({ color: 0x55704a, roughness: 1 });
    const r = rngFrom('far');
    for (let i = 0; i < 9; i++) { const s = 1.4 + r() * 1.6; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), farMat); m.scale.set(s * 1.2, s, s * 1.2); m.position.set(-11 + i * 2.8 + r(), 5.2 + s * 0.6, -7.5 - r() * 3); world.add(m); } }

  // ---------- pots ----------
  const POT_DIM = { round: [0.2, 0.28], big: [0.27, 0.36], oct: [0.24, 0.28], black: [0.16, 0.22], trough: [0.15, 0.24], tray: [0.12, 0.08] };
  const lathePot = (bottom, rim, segs) => new THREE.LatheGeometry([[0, 0], [bottom, 0], [bottom + 0.02, 0.03], [0.94, 0.9], [1.0, 0.92], [1.06, 0.96], [1.06, 1.02], [0.98, 1.03], [0.95, 0.97]].map(([x, y]) => new THREE.Vector2(x, y)), segs);
  const potGeo = { round: lathePot(0.66, 1, 24), big: lathePot(0.7, 1, 28), oct: lathePot(0.7, 1, 8), black: lathePot(0.82, 1, 18) };
  function troughGeo(L, W, H) {
    const g = new THREE.BoxGeometry(L, H, W, 1, 1, 1).translate(0, H / 2, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.01) p.setXYZ(i, p.getX(i) * 0.86, p.getY(i), p.getZ(i) * 0.82);
    // drop the top face (group 2: +y) so it reads as an open planter
    const idx = Array.from(g.index.array), top = g.groups[2];
    idx.splice(top.start, top.count);
    g.setIndex(idx); g.clearGroups();
    g.computeVertexNormals(); return g;
  }

  const potsAll = []; // { plant, pot, group, plantGroup, mat, proxy, items:[], height, top }
  const proxies = [];
  const proxyGeo = new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0);
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });

  function makeLabel(text) {
    const tex = canvasTex(256, 110, (g, w, h) => {
      g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#cfc6b6'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
      g.fillStyle = '#9b2d3b'; g.font = 'italic 500 50px "Cormorant Garamond", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, w / 2, h / 2 + 2, w - 24);
    });
    const grp = new THREE.Group();
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.073), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }));
    card.position.y = 0.25; card.castShadow = true;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.26, 4), new THREE.MeshStandardMaterial({ color: 0xb08a5a }));
    stick.position.y = 0.11;
    grp.add(card, stick);
    return grp;
  }

  // ---------- plant builders ----------
  // Each builder adds parts in plant space (origin = soil surface centre, +y up, metres).
  // add(pool, matrix, role, birth, color, color2)
  //   role: body (grows with g) · tint (body, tints with bloom) · flower (bloom) · fruit (fruit; colour ripens) · head (brassica head) · jar
  const vary = (rng, hex, amt = 0.06) => { const c = C(hex); const hsl = {}; c.getHSL(hsl); return c.setHSL(hsl.h + (rng() - 0.5) * amt * 0.4, clamp(hsl.s + (rng() - 0.5) * amt), clamp(hsl.l + (rng() - 0.5) * amt * 1.4)); };

  function rosette(ctx, pool, n, len0, len1, tilt0, tilt1, color, opts = {}) {
    const { rng, add } = ctx;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1 || 1);           // 0 = outer, oldest
      const yaw = i * 2.39996 + rng() * 0.3;
      const tilt = lerp(tilt1, tilt0, k) + (rng() - 0.5) * 0.15;
      const len = lerp(len1, len0, k) * (0.85 + rng() * 0.3);
      const r = (opts.spread || 0) * (1 - k);
      add(pool, M(Math.sin(yaw) * r, opts.y || 0, Math.cos(yaw) * r, yaw, tilt, (rng() - 0.5) * 0.3, len * (opts.w || 1), len, len), opts.role || 'body', k * 0.85, vary(rng, color), opts.color2 ? C(opts.color2) : null);
    }
  }
  function bush(ctx, { H, stems = 4, leaves, leafLen, color, pool = 'leaf', stemColor = 0x4d6b35, spread = 0.12, droop = 1.0, stemR = 0.008 }) {
    const { rng, add } = ctx;
    const tips = [];
    for (let s = 0; s < stems; s++) {
      const yaw = s / stems * TAU + rng() * 0.6, lean = 0.18 + rng() * 0.35;
      const len = H * (0.75 + rng() * 0.3);
      const dir = new THREE.Vector3(Math.sin(yaw) * Math.sin(lean), Math.cos(lean), Math.cos(yaw) * Math.sin(lean));
      add('stem', Mdir(new THREE.Vector3((rng() - 0.5) * 0.04, 0, (rng() - 0.5) * 0.04), dir, stemR, len), 'body', 0, C(stemColor));
      tips.push({ dir, len, yaw });
    }
    for (let i = 0; i < leaves; i++) {
      const st = tips[i % stems], h = Math.pow(rng(), 0.8);
      const p = st.dir.clone().multiplyScalar(st.len * h);
      p.x += (rng() - 0.5) * spread * h; p.z += (rng() - 0.5) * spread * h;
      const yaw = rng() * TAU, tilt = (0.7 + rng() * 0.7) * droop;
      const L = leafLen * (0.7 + rng() * 0.5) * (1.1 - h * 0.35);
      add(pool, M(p.x, p.y, p.z, yaw, tilt, (rng() - 0.5) * 0.5, L), 'body', h * 0.9, vary(rng, color));
    }
    return tips;
  }
  // Branching tree: trunk, primaries, secondaries, twigs; leaves grow in clusters over a canopy shell.
  // Returns cluster centres (for fruit and flowers).
  function tree(ctx, { H, trunkR = 0.02, prim = 6, clusters = 90, per = 8, leafLen, color, color2 = color, pool = 'leaf', bark = 0x6b4f3a, crown = 0.62, width = 0.45 }) {
    const { rng, add } = ctx;
    const tH = H * (1 - crown);
    add('stem', M(0, 0, 0, 0, (rng() - 0.5) * 0.08, (rng() - 0.5) * 0.08, trunkR, tH + 0.05, trunkR), 'body', 0, C(bark));
    const cy = tH + H * crown * 0.5, ry = H * crown * 0.5;
    const twigs = [];
    for (let i = 0; i < prim; i++) {
      const y0 = tH * (0.7 + rng() * 0.3), yaw = i / prim * TAU + rng() * 0.7, lean = 0.5 + rng() * 0.45;
      const dir = new THREE.Vector3(Math.sin(yaw) * Math.sin(lean), Math.cos(lean), Math.cos(yaw) * Math.sin(lean));
      const len = Math.min(H * crown * 0.75, width * 1.1) * (0.7 + rng() * 0.3);
      const base = new THREE.Vector3(0, y0, 0);
      add('stem', Mdir(base, dir, trunkR * 0.55, len), 'body', 0.08 + i * 0.02, C(bark));
      for (let j = 0; j < 3; j++) {
        const t = 0.35 + j * 0.22 + rng() * 0.1, b2 = base.clone().addScaledVector(dir, len * t);
        const yaw2 = yaw + (j - 1) * 0.8 + (rng() - 0.5) * 0.5, lean2 = Math.min(1.4, lean * 0.8 + 0.35);
        const d2 = new THREE.Vector3(Math.sin(yaw2) * Math.sin(lean2), Math.cos(lean2), Math.cos(yaw2) * Math.sin(lean2));
        const l2 = len * (0.4 + rng() * 0.25);
        add('stem', Mdir(b2, d2, trunkR * 0.28, l2), 'body', 0.2 + rng() * 0.15, C(bark));
        twigs.push(b2.clone().addScaledVector(d2, l2));
      }
    }
    const centres = [];
    for (let i = 0; i < clusters; i++) {
      let c;
      if (i < twigs.length) c = twigs[i].clone();
      else {
        const th = rng() * TAU, u = rng() * 2 - 1, r = 0.62 + 0.38 * Math.sqrt(rng());
        const sxz = Math.sqrt(1 - u * u);
        c = new THREE.Vector3(Math.cos(th) * sxz * width * r, cy + u * ry * r, Math.sin(th) * sxz * width * r);
      }
      const out = new THREE.Vector3(c.x, (c.y - cy) * 0.6, c.z).normalize();
      const baseYaw = Math.atan2(out.x, out.z);
      const col = rng() > 0.5 ? color : color2;
      const birth = 0.12 + clamp((c.y - tH) / (H - tH)) * 0.55 + rng() * 0.18;
      for (let k = 0; k < per; k++) {
        const yaw = baseYaw + (rng() - 0.5) * 2.6, tilt = 0.9 + rng() * 0.75;
        const L = leafLen * (0.75 + rng() * 0.5);
        add(pool, M(c.x + (rng() - 0.5) * 0.05, c.y + (rng() - 0.5) * 0.05, c.z + (rng() - 0.5) * 0.05, yaw, tilt, (rng() - 0.5) * 0.7, L), 'body', birth + k * 0.008, vary(rng, col, 0.1));
      }
      centres.push(c);
    }
    return centres;
  }
  const pick = (rng, arr, n) => { const out = []; for (let i = 0; i < n; i++) out.push(arr[Math.floor(rng() * arr.length)]); return out; };

  const BUILD = {
    tray(ctx) { // seed tray with seedlings in cells
      const { rng, add } = ctx;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
        if (rng() < 0.12) continue;
        const x = -0.24 + i * 0.096, z = -0.14 + j * 0.094, b = rng() * 0.6;
        for (let k = 0; k < 2; k++) add('leaf', M(x, 0.0, z, k * Math.PI + rng(), 1.05, 0, 0.03 + rng() * 0.015), 'body', b, vary(rng, 0x79b04a));
        add('leaf', M(x, 0.01, z, rng() * TAU, 0.5, 0, 0.022), 'body', b + 0.3, vary(rng, 0x5d9a3c));
      }
    },
    spinach(ctx) {
      const { rng } = ctx;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
        const sub = { ...ctx, add: (pool, m, ...r) => ctx.add(pool, new THREE.Matrix4().makeTranslation(-0.24 + i * 0.12 + (rng() - 0.5) * 0.03, 0, -0.14 + j * 0.093 + (rng() - 0.5) * 0.02).multiply(m), ...r) };
        rosette(sub, 'leaf', 9, 0.06, 0.13, 0.25, 0.85, 0x3d7c34);
      }
    },
    lettuce(ctx) { rosette(ctx, 'broad', 34, 0.08, 0.18, 0.25, 1.2, 0x9ccb62, { spread: 0.04 }); },
    brassica(ctx) {
      const { rng, add, pot } = ctx;
      const crops = pot.crop || ['cauliflower', 'cabbage', 'cauliflower'];
      crops.forEach((crop, i) => {
        const x = (i - 1) * 0.3;
        const sub = { ...ctx, add: (pool, m, ...r) => add(pool, new THREE.Matrix4().makeTranslation(x, 0, 0).multiply(m), ...r) };
        const leafC = crop === 'violet' ? 0x6b5a85 : crop === 'broccoli' ? 0x4f7a5a : 0x6f9a8c;
        rosette(sub, 'broad', 19, 0.2, 0.36, 0.3, 1.4, leafC, { spread: 0.04 });
        if (crop === 'cauliflower') add('curd', M(x, 0.06, 0, 0, 0, 0, 0.07), 'head', 0, C(0xf1e8d0));
        if (crop === 'broccoli') add('curd', M(x, 0.08, 0, 0, 0, 0, 0.06), 'head', 0, C(0x3e6b3a));
        if (crop === 'cabbage') add('head', M(x, 0.07, 0, rng() * TAU, 0, 0, 0.085), 'head', 0, C(0x9fc28f));
        if (crop === 'violet') add('head', M(x, 0.07, 0, rng() * TAU, 0, 0, 0.08), 'head', 0, C(0x5e2f6e));
      });
    },
    tomato(ctx) {
      const { rng, add } = ctx;
      for (let s = 0; s < 3; s++) add('stem', M(Math.cos(s * 2.1) * 0.1, 0, Math.sin(s * 2.1) * 0.1, 0, 0, 0, 0.007, 1.0, 0.007), 'body', 0, C(0x9b7a52));
      bush(ctx, { H: 1.0, stems: 5, leaves: 260, leafLen: 0.1, color: 0x4b7d33, spread: 0.42, droop: 1.1 });
      for (let c = 0; c < 18; c++) {
        const y = 0.25 + rng() * 0.6, a = rng() * TAU, r = 0.09 + rng() * 0.12;
        for (let k = 0; k < 4; k++) {
          const p = [Math.cos(a) * r + (rng() - 0.5) * 0.05, y - k * 0.03 - rng() * 0.02, Math.sin(a) * r + (rng() - 0.5) * 0.05];
          add('sphere', M(p[0], p[1], p[2], 0, 0, 0, 0.022 + rng() * 0.006), 'fruit', rng() * 0.6, C(0x7aa33c), C(rng() > 0.15 ? 0xd2311e : 0xe7742b));
        }
        add('petals', M(Math.cos(a + 0.4) * r, y + 0.05, Math.sin(a + 0.4) * r, rng() * TAU, 0.6, 0, 0.022), 'flower', rng(), C(0xf3d23a));
      }
    },
    capsicum(ctx) {
      const { rng, add, potIndex } = ctx;
      bush(ctx, { H: 0.5, stems: 4, leaves: 120, leafLen: 0.09, color: 0x3c7832, spread: 0.24 });
      const ripe = potIndex % 2 ? 0xf2c21f : 0xc8261c;
      for (let i = 0; i < 6; i++) { const a = rng() * TAU, r = 0.06 + rng() * 0.07;
        add('pepper', M(Math.cos(a) * r, 0.18 + rng() * 0.18, Math.sin(a) * r, rng() * TAU, 0, (rng() - 0.5) * 0.4, 0.032), 'fruit', rng() * 0.5, C(0x3f7d2c), C(ripe)); }
    },
    chilli(ctx) {
      const { rng, add } = ctx;
      bush(ctx, { H: 0.58, stems: 6, leaves: 180, leafLen: 0.055, color: 0x3b7a33, spread: 0.3 });
      for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = 0.05 + rng() * 0.15;
        add('chilli', M(Math.cos(a) * r, 0.2 + rng() * 0.32, Math.sin(a) * r, rng() * TAU, (rng() - 0.5) * 0.5, 0, 0.12, 0.07, 0.12), 'fruit', rng() * 0.5, C(0x4f8a2e), C(0xc51a14)); }
    },
    brinjal(ctx) {
      const { rng, add } = ctx;
      bush(ctx, { H: 0.6, stems: 4, leaves: 60, leafLen: 0.14, color: 0x587f4a, spread: 0.26, pool: 'broad' });
      for (let i = 0; i < 4; i++) { const a = rng() * TAU;
        add('sphere', M(Math.cos(a) * 0.1, 0.18 + rng() * 0.15, Math.sin(a) * 0.1, 0, 0.2, 0, 0.032, 0.065, 0.032), 'fruit', rng() * 0.4, C(0x5d3a6a), C(0x3a1640)); }
      for (let i = 0; i < 4; i++) add('petals', M((rng() - 0.5) * 0.2, 0.4 + rng() * 0.1, (rng() - 0.5) * 0.2, rng() * TAU, 0.5, 0, 0.022), 'flower', rng(), C(0x9b6bc5));
    },
    bhindi(ctx) {
      const { rng, add } = ctx;
      add('stem', M(0, 0, 0, 0, 0.04, 0, 0.012, 0.95, 0.012), 'body', 0, C(0x5c7f3a));
      for (let i = 0; i < 12; i++) { const y = 0.12 + i * 0.07, yaw = i * 2.4;
        add('broad', M(Math.sin(yaw) * 0.02, y, Math.cos(yaw) * 0.02, yaw, 1.0 + rng() * 0.3, 0, 0.13 * (1.15 - y * 0.5)), 'body', y / 1.0 * 0.95, vary(rng, 0x4b7e3a)); }
      for (let i = 0; i < 3; i++) add('petals', M((rng() - 0.5) * 0.06, 0.6 + i * 0.1, 0.05, rng() * TAU, 0.9, 0, 0.04), 'flower', i * 0.3, C(0xf4ecb0));
      for (let i = 0; i < 4; i++) add('chilli', M((rng() - 0.5) * 0.08, 0.55 + rng() * 0.25, (rng() - 0.5) * 0.08, rng() * TAU, Math.PI + (rng() - 0.5) * 0.4, 0, 0.18, 0.09, 0.18), 'fruit', rng() * 0.5, C(0x6f9e3c), C(0x5d9133));
    },
    vine(ctx) { // summer experiments: young melon / bean plants
      const { rng, add } = ctx;
      for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.03 + i * 0.012;
        add('broad', M(Math.cos(a) * r, 0.02 + i * 0.012, Math.sin(a) * r, a, 1.05 + rng() * 0.3, 0, 0.07 + rng() * 0.04), 'body', i / 9, vary(rng, 0x5f9b3a)); }
    },
    pineapple(ctx) {
      const { rng, add } = ctx;
      // outer leaves first; the centre blushes pink when it flowers
      for (let i = 0; i < 50; i++) {
        const k = i / 49, yaw = i * 2.39996 + rng() * 0.2;
        const tilt = lerp(1.15, 0.18, k) + (rng() - 0.5) * 0.12, len = lerp(0.58, 0.24, k) * (0.85 + rng() * 0.3);
        const inner = k > 0.45;
        add('spike', M(0, 0.01, 0, yaw, tilt, (rng() - 0.5) * 0.25, len * 0.9, len, len), inner ? 'tint' : 'body', k * 0.9, vary(rng, inner ? 0x7a9a86 : 0x6a8a74), inner ? vary(rng, 0xc06a7c) : null);
      }
    },
    dragonfruit(ctx) {
      const { rng, add } = ctx;
      const R = 0.058;
      const seg = (from, to, birth, hex = 0x4f8a3c) => { const d = to.clone().sub(from); add('cactus', Mdir(from, d, R * (0.85 + rng() * 0.3), d.length() * 1.06), 'body', birth, vary(rng, hex, 0.05)); };
      // three stems climbing the pole
      [-0.07, 0.07, 0].forEach((ox, si) => {
        const z0 = si === 2 ? -0.07 : 0.06;
        let prev = new THREE.Vector3(ox, 0, z0);
        for (let y = 0.14; y <= 1.62; y += 0.14) {
          const p = new THREE.Vector3(ox + Math.sin(y * 4 + si) * 0.02, y, z0 + Math.cos(y * 3 + si) * 0.015);
          seg(prev, p, (y / 1.62) * 0.3 + si * 0.03); prev = p;
        }
      });
      // arching, drooping branches heading out along yaw
      const tips = [];
      const arch = (start, yaw, reach, lift, droop, n, b0, b1) => {
        const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        let prev = start.clone();
        for (let i = 1; i <= n; i++) {
          const s = i / n;
          const p = start.clone().addScaledVector(dir, reach * s).add(new THREE.Vector3(0, lift * s - droop * s * s, 0));
          seg(prev, p, lerp(b0, b1, s), 0x548f3f); prev = p;
        }
        tips.push({ p: prev, dir });
      };
      const top = new THREE.Vector3(0, 1.64, 0.02);
      for (let a = 0; a < 15; a++) {
        const yaw = a / 15 * TAU + rng() * 0.35, reach = 0.45 + rng() * 0.55;
        arch(top, yaw, reach, 0.22 + rng() * 0.12, 0.9 + rng() * 0.7, 9, 0.34 + (a / 15) * 0.26, 0.6 + (a / 15) * 0.26);
      }
      // side shoots from the climbing stems
      for (let k = 0; k < 6; k++) {
        const y = 0.75 + rng() * 0.7, yaw = rng() * TAU;
        arch(new THREE.Vector3(Math.sin(yaw) * 0.06, y, Math.cos(yaw) * 0.06), yaw, 0.35 + rng() * 0.3, 0.18, 0.55 + rng() * 0.4, 6, 0.3 + k * 0.04, 0.55 + k * 0.04);
      }
      tips.forEach((t, i) => {
        if (i % 2 === 0) add('trumpet', Mdir(t.p.clone().add(new THREE.Vector3(0, 0.02, 0)), t.dir.clone().add(new THREE.Vector3(0, 1.2, 0)), 0.17, 0.26), 'flower', i / tips.length, C(0xfffaf0));
        else add('dfruit', M(t.p.x, t.p.y - 0.04, t.p.z, rng() * TAU, 0.3, 0, 0.06), 'fruit', i / tips.length, C(0x7aa33c), C(0xd8236f));
      });
    },
    citrus(ctx) {
      const { rng, add, plant } = ctx;
      const spots = tree(ctx, { H: 1.3, prim: 6, clusters: 115, per: 8, leafLen: 0.085, color: 0x3a6a2b, color2: 0x4f7f34, crown: 0.66, width: 0.5 });
      if (plant.fruitColor) pick(rng, spots, 14).forEach(p => add('sphere', M(p.x, p.y - 0.05, p.z, 0, 0, 0, 0.036), 'fruit', rng() * 0.5, C(0x6f9a3a), C(plant.fruitColor)));
      if (plant.flowerColor) pick(rng, spots, 60).forEach(p => add('pom', M(p.x, p.y + 0.03, p.z, 0, 0, 0, 0.014), 'flower', rng(), C(plant.flowerColor)));
    },
    mulberry(ctx) {
      const { rng, add } = ctx;
      const spots = tree(ctx, { H: 1.5, prim: 7, clusters: 120, per: 7, leafLen: 0.09, color: 0x5a8a37, color2: 0x6e9a3e, crown: 0.7, pool: 'broad', width: 0.55 });
      spots.forEach(p => { for (let k = 0; k < 2; k++) add('sphere', M(p.x + (rng() - 0.5) * 0.06, p.y - 0.05, p.z + (rng() - 0.5) * 0.06, 0, 0, 0, 0.011, 0.024, 0.011), 'fruit', rng() * 0.6, C(0xc9353f), C(0x4a0c22)); });
    },
    cherry(ctx) {
      const { rng, add } = ctx;
      const spots = tree(ctx, { H: 1.6, prim: 7, clusters: 170, per: 8, leafLen: 0.058, color: 0x3a782b, color2: 0x4c8a33, crown: 0.74, width: 0.52 });
      pick(rng, spots, 70).forEach(p => add('sphere', M(p.x, p.y - 0.03, p.z, 0, 0, 0, 0.017), 'fruit', rng() * 0.6, C(0x9fbf4a), C(0xd81f26)));
    },
    rambutan(ctx) {
      tree(ctx, { H: 1.15, prim: 5, clusters: 48, per: 6, leafLen: 0.16, color: 0x5d9233, color2: 0x73a33c, crown: 0.62, width: 0.45 });
    },
    litchi(ctx) {
      const { rng: r2, add: a2 } = ctx;
      const sp = tree(ctx, { H: 0.9, prim: 5, clusters: 70, per: 8, leafLen: 0.075, color: 0x4d7f37, color2: 0x3f6e2e, crown: 0.6, width: 0.36 });
      pick(r2, sp, 10).forEach(p => { for (let k = 0; k < 4; k++) a2('leaf', M(p.x, p.y + 0.02, p.z, r2() * TAU, 0.6, 0, 0.05), 'body', 0.7, vary(r2, 0xa8543b)); });
    },
    seedling(ctx) {
      const { rng, add } = ctx;
      add('stem', M(0, 0, 0, 0, 0, 0, 0.004, 0.3, 0.004), 'body', 0, C(0x7a5a3c));
      for (let i = 0; i < 12; i++) add('leaf', M(0, 0.06 + i * 0.02, 0, i * 2.4, 0.9, 0, 0.05), 'body', i / 12, vary(rng, 0x5c8f3a));
    },
    sage(ctx) {
      const { rng, add } = ctx;
      const spots = tree(ctx, { H: 1.0, prim: 8, clusters: 150, per: 8, leafLen: 0.04, color: 0xa7b6a6, color2: 0x95a796, crown: 0.82, bark: 0x7c6a55, width: 0.48 });
      pick(rng, spots, 70).forEach(p => add('pom', M(p.x, p.y + 0.02, p.z, 0, 0, 0, 0.014), 'flower', rng(), vary(rng, 0xa45ac6)));
    },
    hibiscus(ctx) {
      const { rng, add } = ctx;
      const spots = tree(ctx, { H: 1.0, prim: 6, clusters: 80, per: 7, leafLen: 0.085, color: 0x2f6b2c, color2: 0x3c7a31, crown: 0.78, width: 0.42 });
      pick(rng, spots, 14).forEach(p => add('petals', M(p.x, p.y + 0.04, p.z, rng() * TAU, 0.3, 0, 0.065), 'flower', rng(), C(0xf08a5d)));
    },
    lantana(ctx) {
      const { rng, add } = ctx;
      const tips = bush(ctx, { H: 0.4, stems: 7, leaves: 90, leafLen: 0.045, color: 0x3d6f33, spread: 0.5 });
      for (let i = 0; i < 22; i++) { const t = tips[i % tips.length], h = 0.7 + rng() * 0.3;
        add('pom', M(t.dir.x * t.len * h + (rng() - 0.5) * 0.1, t.dir.y * t.len * h + 0.03, t.dir.z * t.len * h + (rng() - 0.5) * 0.08, 0, 0, 0, 0.026), 'flower', rng(), vary(rng, 0xf6c623)); }
    },
    bloodlily(ctx) {
      const { rng, add } = ctx;
      rosette(ctx, 'broad', 7, 0.14, 0.22, 0.2, 0.6, 0x3e7a35);
      add('stem', M(0, 0, 0, 0, 0.05, 0, 0.006, 0.42, 0.006), 'flower', 0, C(0x6a8a3a));
      add('pom', M(0, 0.45, 0, 0, 0, 0, 0.075), 'flower', 0.2, C(0xe5372a));
    },
    foliage(ctx) { // spider plant, snake plant or pothos, by pot
      const { rng, add, potIndex } = ctx;
      const kind = potIndex % 3;
      if (kind === 0) { // spider plant: arching striped blades
        for (let i = 0; i < 46; i++) add('blade', M((rng() - 0.5) * 0.06, 0, (rng() - 0.5) * 0.06, rng() * TAU, 0.5 + rng() * 0.7, 0, 0.3, 0.3 * (0.8 + rng() * 0.4), 0.3), 'body', rng() * 0.8, vary(rng, rng() > 0.5 ? 0x7fa64a : 0xb9cf86, 0.06));
      } else if (kind === 1) { // snake plant: stiff upright blades
        for (let i = 0; i < 16; i++) add('spike', M((rng() - 0.5) * 0.12, 0, (rng() - 0.5) * 0.12, rng() * TAU, 0.05 + rng() * 0.18, 0, 0.55, 0.55 + rng() * 0.25, 0.4), 'body', rng() * 0.8, vary(rng, 0x3f6b3a, 0.06));
      } else { // pothos: heart leaves spilling over the rim
        for (let i = 0; i < 70; i++) { const a = rng() * TAU, r = 0.05 + rng() * 0.22, y = 0.02 + rng() * 0.25 - Math.max(0, r - 0.15) * 1.2;
          add('broad', M(Math.cos(a) * r, y, Math.sin(a) * r, a + Math.PI / 2, 1.0 + rng() * 0.6, 0, 0.08 + rng() * 0.03), 'body', rng() * 0.85, vary(rng, rng() > 0.6 ? 0x9cbf55 : 0x5f8f3a, 0.07)); }
      }
    },
    pom(ctx) { // chrysanthemum: a dense mound with pompom flowers on top
      const { rng, add, plant } = ctx;
      bush(ctx, { H: 0.3, stems: 6, leaves: 80, leafLen: 0.05, color: 0x3d6b35, spread: 0.35 });
      for (let i = 0; i < 60; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * 0.2;
        add('pom', M(Math.cos(a) * r, 0.24 + (0.2 - r) * 0.5 + rng() * 0.05, Math.sin(a) * r, 0, 0, 0, 0.026 + rng() * 0.01), 'flower', rng(), vary(rng, plant.color || 0xe5609c, 0.08)); }
    },
    petunia(ctx) {
      const { rng, add, plant, pot } = ctx;
      if (pot.species === 'poinsettia') return BUILD.poinsettia(ctx);
      bush(ctx, { H: 0.2, stems: 6, leaves: 60, leafLen: 0.045, color: 0x4e8a3a, spread: 0.32 });
      for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * 0.2;
        add('petals', M(Math.cos(a) * r, 0.16 + rng() * 0.08, Math.sin(a) * r, rng() * TAU, (rng() - 0.5) * 0.6, 0, 0.034), 'flower', rng(), rng() > 0.85 ? C(0xf5eef5) : vary(rng, plant.color, 0.08)); }
    },
    poinsettia(ctx) {
      const { rng, add } = ctx;
      const tips = bush(ctx, { H: 0.45, stems: 5, leaves: 40, leafLen: 0.085, color: 0x2f5f2c, spread: 0.2 });
      tips.forEach(t => { const p = t.dir.clone().multiplyScalar(t.len);
        for (let k = 0; k < 7; k++) add('leaf', M(p.x, p.y, p.z, k / 7 * TAU, 1.25, 0, 0.075), 'flower', rng() * 0.3, vary(rng, 0xc8172a)); });
    },
    kalanchoe(ctx) {
      const { rng, add, plant, pot } = ctx;
      rosette(ctx, 'broad', 26, 0.05, 0.08, 0.5, 1.2, 0x3a6d33, { spread: 0.12 });
      const col = pot.color && pot.color.startsWith('#') ? pot.color : plant.color;
      for (let i = 0; i < 90; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * 0.17;
        add('pom', M(Math.cos(a) * r, 0.14 + rng() * 0.08, Math.sin(a) * r, 0, 0, 0, 0.016), 'flower', rng(), vary(rng, col, 0.08)); }
    },
    dahlia(ctx) {
      const { rng, add, plant } = ctx;
      bush(ctx, { H: 0.5, stems: 4, leaves: 50, leafLen: 0.075, color: 0x3d6b33, spread: 0.2 });
      for (let i = 0; i < 7; i++) { const a = rng() * TAU, r = 0.04 + rng() * 0.12, y = 0.42 + rng() * 0.15;
        add('petals', M(Math.cos(a) * r, y, Math.sin(a) * r, rng() * TAU, 0.25, 0, 0.075), 'flower', rng(), vary(rng, plant.color, 0.05));
        add('petals', M(Math.cos(a) * r, y + 0.01, Math.sin(a) * r, rng() * TAU, 0.25, 0, 0.05), 'flower', rng(), vary(rng, 0xe85a5a, 0.05)); }
    },
    rainlily(ctx) {
      const { rng, add, plant } = ctx;
      for (let i = 0; i < 30; i++) add('blade', M((rng() - 0.5) * 0.08, 0, (rng() - 0.5) * 0.08, rng() * TAU, 0.15 + rng() * 0.35, 0, 0.32, 0.32 * (0.8 + rng() * 0.5), 0.32), 'body', rng() * 0.8, vary(rng, 0x4c7d3a));
      for (let i = 0; i < 9; i++) add('petals', M((rng() - 0.5) * 0.16, 0.25 + rng() * 0.08, (rng() - 0.5) * 0.16, rng() * TAU, 0.3, 0, 0.04), 'flower', rng(), vary(rng, plant.color, 0.06));
    },
    tuberose(ctx) {
      const { rng, add, pot } = ctx;
      if (pot.species === 'curcuma') {
        for (let i = 0; i < 9; i++) add('leaf', M(0, 0, 0, i * 2.4, 0.2 + rng() * 0.25, 0, 0.26, 0.5, 0.26), 'body', i / 9, vary(rng, 0x4f8a3a));
        return;
      }
      for (let i = 0; i < 22; i++) add('blade', M((rng() - 0.5) * 0.06, 0, (rng() - 0.5) * 0.06, rng() * TAU, 0.2 + rng() * 0.4, 0, 0.4, 0.42, 0.4), 'body', rng() * 0.8, vary(rng, 0x4a7a36));
      for (let s = 0; s < 3; s++) {
        const x = (rng() - 0.5) * 0.08, z = (rng() - 0.5) * 0.08;
        add('stem', M(x, 0, z, 0, 0.05, 0, 0.005, 0.85, 0.005), 'flower', 0, C(0x6b8f3a));
        for (let k = 0; k < 9; k++) add('pom', M(x, 0.62 + k * 0.028, z, 0, 0, 0, 0.016), 'flower', 0.2 + k * 0.08, C(0xfbf7ec));
      }
    },
    cosmos(ctx) {
      const { rng, add, plant } = ctx;
      for (let i = 0; i < 40; i++) add('blade', M((rng() - 0.5) * 0.1, rng() * 0.25, (rng() - 0.5) * 0.1, rng() * TAU, 0.6 + rng() * 0.6, 0, 0.12), 'body', rng(), vary(rng, 0x4d8a3a));
      for (let i = 0; i < 6; i++) { const x = (rng() - 0.5) * 0.2, z = (rng() - 0.5) * 0.2, h = 0.4 + rng() * 0.2;
        add('stem', M(x * 0.3, 0, z * 0.3, 0, 0, 0, 0.004, h, 0.004), 'body', 0.3, C(0x5c8a36));
        add('petals', M(x * 0.3, h, z * 0.3, rng() * TAU, 0.3, 0, 0.045), 'flower', rng(), vary(rng, plant.color, 0.05)); }
    }
  };
  const builderFor = (p, pot) => {
    const sp = pot.species || p.species;
    if (sp === 'lantana') return BUILD.lantana;
    if (sp === 'bloodlily') return BUILD.bloodlily;
    if (sp === 'poinsettia') return BUILD.poinsettia;
    if (sp === 'curcuma') return BUILD.tuberose;
    return BUILD[p.species];
  };

  // Plant-level scale curves: how big the whole plant is at growth g
  const sizeOf = (sp, g) => {
    if (['citrus', 'mulberry', 'cherry', 'rambutan', 'litchi', 'sage', 'hibiscus', 'seedling'].includes(sp)) return lerp(0.3, 1, g);
    if (sp === 'dragonfruit') return 1;
    if (sp === 'tray') return 1;
    return lerp(0.2, 1, g);
  };

  // Build every pot and its plant
  G.plants.forEach(p => {
    p.pots.forEach((pot, potIndex) => {
      const kind = pot.kind;
      const [R0, H0] = POT_DIM[kind];
      const s = pot.s || 1, R = R0 * s, H = H0 * s;
      const baseY = pot.ledge ? 0.495 : 0;
      const g = new THREE.Group();
      g.position.set(pot.x, baseY, pot.z);
      world.add(g);
      let potMat, soilY = H * 0.95;
      if (kind === 'trough' || kind === 'tray') {
        const L = kind === 'trough' ? 0.95 * s : 0.58 * s, W = kind === 'trough' ? 0.3 * s : 0.38 * s;
        potMat = (kind === 'tray' && p.species === 'tray') ? potMats.tray() : (pot.color === 'green' ? potMats.green() : potMats.terracotta());
        potMat.side = THREE.DoubleSide;
        const m = new THREE.Mesh(troughGeo(L, W, H), potMat); m.castShadow = m.receiveShadow = true; g.add(m);
        const soil = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.97, W * 0.95), soilMat); soil.rotation.x = -Math.PI / 2; soil.position.y = H * 0.86; soil.receiveShadow = true; g.add(soil);
        soilY = H * 0.86;
      } else {
        potMat = potMats[kind === 'round' ? 'terracotta' : kind]();
        const m = new THREE.Mesh(potGeo[kind], potMat); m.scale.set(R, H, R); m.castShadow = m.receiveShadow = true; g.add(m);
        const soil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.95, kind === 'oct' ? 8 : 24), soilMat); soil.rotation.x = -Math.PI / 2; soil.position.y = H * 0.97; soil.receiveShadow = true; g.add(soil);
      }
      if (p.species === 'dragonfruit') {
        const wood = new THREE.Mesh(new THREE.BoxGeometry(0.075, 1.75, 0.075), new THREE.MeshStandardMaterial({ color: 0x9a7550, roughness: 0.9 }));
        wood.position.set(0, soilY + 0.8, 0); wood.castShadow = true; g.add(wood);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.014, 6, 32), pipeMat); ring.rotation.x = Math.PI / 2; ring.position.set(0, soilY + 1.6, 0.04); ring.castShadow = true; g.add(ring);
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.62, 6), pipeMat); bar.rotation.z = Math.PI / 2; bar.position.set(0, soilY + 1.6, 0.04); g.add(bar);
      }
      if (pot.label) { const l = makeLabel(pot.label); l.position.set(R * 0.45, soilY - 0.02, R * 0.55); l.rotation.y = -0.25; g.add(l); }

      const yaw = (rngFrom(p.id + potIndex)() - 0.5) * 1.2;
      const entry = { plant: p, pot, potIndex, group: g, potMat, items: [], soilY, R, H, yaw, kind, visible: true, height: 0.5 };
      const rng = rngFrom(p.id + ':' + potIndex);
      const ctx = {
        rng, pot, plant: p, potIndex, R,
        add(poolName, m, role, birth, color, color2) {
          const it = { entry, m, role, birth: Math.min(birth || 0, 0.86), color, color2, idx: -1, pool: poolName };
          pools[poolName].items.push(it); entry.items.push(it);
        }
      };
      const b = builderFor(p, pot);
      if (b) b(ctx);
      if (p.refill) {
        const rp = { ...p, species: p.refill.species, color: p.refill.color || p.color };
        const rpot = { ...pot, crop: undefined, label: undefined, color: p.refill.color || (pot.color && pot.color.startsWith('#') ? pot.color : undefined) };
        const ROLE = { body: 'refill', tint: 'refill', head: 'refill', flower: 'refillFlower', fruit: 'refillFruit' };
        const rctx = { ...ctx, plant: rp, pot: rpot, rng: rngFrom(p.id + ':refill:' + potIndex),
          add(poolName, m, role, birth, color, color2) {
            const it = { entry, m, role: ROLE[role] || 'refill', birth: Math.min(birth || 0, 0.86), color, color2, idx: -1, pool: poolName, refill: true };
            pools[poolName].items.push(it); entry.items.push(it);
          } };
        const rb = rpot.species ? builderFor(rp, rpot) : BUILD[rp.species];
        if (rb) rb(rctx);
        entry.refillSpecies = rp.species;
      }
      // pineapple fruit and flower: a textured fruit with a crown on a short stalk
      if (p.species === 'pineapple' && pot.fruits) {
        const fg = new THREE.Group();
        const fruitMat = new THREE.MeshStandardMaterial({ map: pineTex, roughness: 0.6, color: 0xffffff });
        const fruit = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.5, 0.06], [0.75, 0.3], [0.8, 0.55], [0.7, 0.85], [0.35, 1.0], [0, 1.02]].map(([x, y]) => new THREE.Vector2(x, y)), 16), fruitMat);
        fruit.scale.set(0.075, 0.17, 0.075); fruit.position.y = 0.16; fruit.castShadow = true;
        const crownParts = [];
        for (let i = 0; i < 14; i++) { const b2 = geo.spike.clone(); const len = 0.09 + (i % 3) * 0.02; b2.scale(len * 0.9, len, len); b2.rotateX(0.2 + (i / 14) * 0.6); b2.rotateY(i * 2.4); crownParts.push(b2); }
        const crown = new THREE.Mesh(mergeGeometries(crownParts), new THREE.MeshStandardMaterial({ color: 0x6f8f72, roughness: 0.6, side: THREE.DoubleSide }));
        crown.position.y = 0.33; crown.castShadow = true;
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.17, 6), new THREE.MeshStandardMaterial({ color: 0x8a7a55 }));
        stalk.position.y = 0.08;
        fg.add(stalk, fruit, crown);
        fg.position.y = soilY;
        fg.scale.setScalar(0.001);
        g.add(fg);
        entry.pineFruit = { group: fg, mat: fruitMat };
      }
      // proxy for picking
      const proxy = new THREE.Mesh(proxyGeo, proxyMat);
      proxy.position.copy(g.position); proxy.scale.set(Math.max(R, 0.18) * 1.15, H + 0.4, Math.max(R, 0.18) * 1.15);
      proxy.userData.entry = entry;
      scene.add(proxy); proxies.push(proxy);
      entry.proxy = proxy;
      potsAll.push(entry);
    });
  });

  // Pineapple tops rooting in clear cups on the plinth, before they were potted
  const pine = G.plants.find(p => p.species === 'pineapple');
  const jars = [];
  if (pine) {
    const glass = new THREE.MeshStandardMaterial({ color: 0xdfeef2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.28, depthWrite: false });
    const water = new THREE.MeshStandardMaterial({ color: 0xbfe0e6, roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false });
    [-5.6, -5.2, -4.8].forEach((x, i) => {
      const g = new THREE.Group(); g.position.set(x, 0.495, WALL_Z + 0.32); world.add(g);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.16, 16, 1, true), glass); cup.position.y = 0.08; g.add(cup);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.045, 0.09, 16), water); w.position.y = 0.045; g.add(w);
      const entry = { plant: pine, pot: {}, group: g, items: [], soilY: 0.12, isJar: true };
      const rng = rngFrom('jar' + i);
      for (let k = 0; k < 18; k++) {
        const kk = k / 17, m = M(0, 0, 0, k * 2.4, lerp(0.9, 0.15, kk), 0, lerp(0.16, 0.08, kk) * 0.9, lerp(0.16, 0.08, kk), lerp(0.16, 0.08, kk));
        const it = { entry, m, role: 'jar', birth: 0, color: vary(rng, 0x6f8f72), idx: -1, pool: 'spike' };
        pools.spike.items.push(it); entry.items.push(it);
      }
      jars.push({ entry, group: g });
      potsAll.push(entry);
    });
  }

  // Create the instanced meshes
  const instanced = [];
  Object.entries(pools).forEach(([name, pool]) => {
    if (!pool.items.length) return;
    const [gname, mname] = POOL_DEF[name];
    const im = new THREE.InstancedMesh(geo[gname], mat[mname], pool.items.length);
    im.castShadow = !['pom', 'petals', 'sphere', 'chilli', 'pepper', 'dfruit', 'trumpet'].includes(name); im.receiveShadow = name !== 'trumpet';
    im.frustumCulled = false;
    pool.items.forEach((it, i) => { it.idx = i; im.setColorAt(i, it.color || C(0xffffff)); });
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    pool.mesh = im;
    scene.add(im);
    instanced.push(im);
  });

  // ---------- applying time ----------
  const mRefill = new THREE.Matrix4(), mPlant = new THREE.Matrix4(), mTmp = new THREE.Matrix4(), vS = new THREE.Vector3(), cTmp = new THREE.Color();
  const glowC = C(0xffe2a0);
  let lastDay = -1;
  function applyDay(day) {
    lastDay = day;
    let bloomAtNight = 0;
    const dirtyColor = new Set();
    for (const e of potsAll) {
      const st = App.plantState(e.plant, day, e.pot);
      if (e.isJar) {
        const k = st.jar;
        e.group.visible = k > 0.001;
        mPlant.makeTranslation(e.group.position.x, e.group.position.y + 0.11, e.group.position.z);
        for (const it of e.items) {
          const pool = pools.spike;
          mTmp.copy(it.m).scale(vS.setScalar(Math.max(k, 0.0001)));
          pool.mesh.setMatrixAt(it.idx, k > 0.001 ? mTmp.premultiply(mPlant) : mTmp.makeScale(0, 0, 0));
        }
        continue;
      }
      e.group.visible = st.pot;
      const size = sizeOf(e.plant.species, st.g);
      mPlant.compose(
        new THREE.Vector3(e.group.position.x, e.group.position.y + e.soilY, e.group.position.z),
        new THREE.Quaternion().setFromAxisAngle(up, e.yaw),
        vS.set(size, size, size)
      );
      const alive = st.pot && st.g > 0.001;
      const rSize = e.refillSpecies ? sizeOf(e.refillSpecies, st.r) : 0;
      if (e.refillSpecies) mRefill.compose(
        new THREE.Vector3(e.group.position.x, e.group.position.y + e.soilY, e.group.position.z),
        new THREE.Quaternion().setFromAxisAngle(up, e.yaw + 1.3), vS.set(rSize, rSize, rSize));
      const rBloom = smooth(0.55, 0.95, st.r);
      for (const it of e.items) {
        let k = 0;
        if (it.refill) {
          if (st.pot && st.r > 0.001) {
            if (it.role === 'refill') k = smooth(it.birth, it.birth + 0.14, st.r);
            else k = smooth(it.birth * 0.5, it.birth * 0.5 + 0.35, rBloom);
          }
          const pool = pools[it.pool];
          if (k < 0.002) { pool.mesh.setMatrixAt(it.idx, mTmp.makeScale(0, 0, 0)); continue; }
          mTmp.copy(it.m).scale(vS.setScalar(k)).premultiply(mRefill);
          pool.mesh.setMatrixAt(it.idx, mTmp);
          if (it.role === 'refillFruit' && it.color2) { cTmp.copy(it.color).lerp(it.color2, rBloom * 0.6); pool.mesh.setColorAt(it.idx, cTmp); dirtyColor.add(pool.mesh); }
          continue;
        }
        if (alive) {
          if (it.role === 'body' || it.role === 'tint') k = smooth(it.birth, it.birth + 0.14, st.g);
          else if (it.role === 'flower') k = smooth(it.birth * 0.5, it.birth * 0.5 + 0.35, st.bloom);
          else if (it.role === 'fruit') k = smooth(it.birth * 0.5, it.birth * 0.5 + 0.35, st.fruit);
          else if (it.role === 'head') k = st.head;
        }
        const pool = pools[it.pool];
        if (k < 0.002) { pool.mesh.setMatrixAt(it.idx, mTmp.makeScale(0, 0, 0)); continue; }
        mTmp.copy(it.m).scale(vS.setScalar(k)).premultiply(mPlant);
        pool.mesh.setMatrixAt(it.idx, mTmp);
        if (it.role === 'fruit' && it.color2) {
          cTmp.copy(it.color).lerp(it.color2, clamp(st.ripe * 1.15 - it.birth * 0.25));
          if (st.glow > 0) cTmp.lerp(glowC, st.glow * 0.25);
          pool.mesh.setColorAt(it.idx, cTmp); dirtyColor.add(pool.mesh);
        } else if (it.role === 'tint' && it.color2) {
          cTmp.copy(it.color).lerp(it.color2, clamp(st.bloom + st.fruit * 0.8));
          pool.mesh.setColorAt(it.idx, cTmp); dirtyColor.add(pool.mesh);
        }
      }
      if (e.pineFruit) {
        const k = Math.max(st.bloom * 0.8, st.fruit);
        e.pineFruit.group.scale.setScalar(Math.max(0.001, k * size));
        e.pineFruit.mat.color.setHex(0xffffff).lerp(C(0xd0556a), st.bloom * (1 - st.fruit * 0.9));
      }
      if (e.plant.species === 'dragonfruit') bloomAtNight = st.bloom;
      e.height = (e.H || 0.3) + Math.max(size, rSize) * ({ dragonfruit: 1.9, citrus: 1.25, mulberry: 1.45, cherry: 1.55, tomato: 0.95 }[e.plant.species] || 0.45);
      if (e.proxy) e.proxy.scale.y = e.height;
      e.potMat.emissive.setHex(App.state.selected === e.plant.id ? 0x6a3a12 : 0x000000);
    }
    instanced.forEach(im => { im.instanceMatrix.needsUpdate = true; });
    dirtyColor.forEach(im => { im.instanceColor.needsUpdate = true; });
    dragonBloom = bloomAtNight;
  }
  let dragonBloom = 0;

  // ---------- light presets along the story ----------
  const PRE = {
    dawn: { top: 0x3a4d80, hor: 0xf2b48c, sun: 0xffb37a, I: 1.7, elev: 9, az: -60, hemi: 0.55, exp: 1.0, night: 0 },
    morning: { top: 0x6a9cd6, hor: 0xf4e1c4, sun: 0xfff0d6, I: 2.7, elev: 32, az: -45, hemi: 0.85, exp: 1.0, night: 0 },
    noon: { top: 0x5a93da, hor: 0xe9eef0, sun: 0xfffaf0, I: 3.1, elev: 60, az: -20, hemi: 1.0, exp: 0.98, night: 0 },
    afternoon: { top: 0x6890c6, hor: 0xf5d8ab, sun: 0xffe0ad, I: 2.8, elev: 36, az: 32, hemi: 0.85, exp: 1.0, night: 0 },
    dusk: { top: 0x2b3466, hor: 0xe2916c, sun: 0xff985a, I: 1.4, elev: 4, az: 62, hemi: 0.45, exp: 1.05, night: 0.25 },
    night: { top: 0x060a1a, hor: 0x1b2446, sun: 0xa9bcff, I: 0.45, elev: 48, az: 130, hemi: 0.2, exp: 1.25, night: 1 },
    golden: { top: 0x48669f, hor: 0xffc68c, sun: 0xffb469, I: 2.5, elev: 14, az: 52, hemi: 0.65, exp: 1.02, night: 0 }
  };
  const KEYS = [[0, 'dawn'], [0.85, 'morning'], [1.7, 'morning'], [2.45, 'noon'], [3.35, 'afternoon'], [4.25, 'afternoon'], [4.7, 'dusk'], [4.9, 'night'], [5.08, 'night'], [5.3, 'dawn'], [5.6, 'golden'], [7, 'golden']];
  const colA = new THREE.Color(), colB = new THREE.Color();
  const L = { top: new THREE.Color(), hor: new THREE.Color(), sun: new THREE.Color(), I: 0, elev: 0, az: 0, hemi: 0, exp: 1, night: 0 };
  function lightAt(P) {
    let i = 0; while (i < KEYS.length - 2 && P > KEYS[i + 1][0]) i++;
    const [p0, a] = KEYS[i], [p1, b] = KEYS[i + 1];
    const t = smooth(0, 1, clamp((P - p0) / (p1 - p0)));
    const A = PRE[a], B = PRE[b];
    L.top.copy(colA.setHex(A.top)).lerp(colB.setHex(B.top), t);
    L.hor.copy(colA.setHex(A.hor)).lerp(colB.setHex(B.hor), t);
    L.sun.copy(colA.setHex(A.sun)).lerp(colB.setHex(B.sun), t);
    ['I', 'elev', 'az', 'hemi', 'exp', 'night'].forEach(k => { L[k] = lerp(A[k], B[k], t); });
    return L;
  }
  const sunDir = new THREE.Vector3();
  function applyLight(P) {
    const l = lightAt(P);
    const el = THREE.MathUtils.degToRad(l.elev), az = THREE.MathUtils.degToRad(l.az);
    sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 30);
    sun.color.copy(l.sun); sun.intensity = l.I;
    hemi.intensity = l.hemi; hemi.color.copy(l.top).lerp(colB.setHex(0xffffff), 0.45); hemi.groundColor.setHex(0x6b4a36).lerp(colB.setHex(0x101420), l.night);
    bounce.intensity = 0.35 * (1 - l.night);
    skyUniforms.uTop.value.copy(l.top); skyUniforms.uHorizon.value.copy(l.hor);
    skyUniforms.uSunDir.value.copy(sunDir); skyUniforms.uSunColor.value.copy(l.sun).multiplyScalar(1 - l.night * 0.7);
    skyUniforms.uSunSize.value = 1 - l.night * 0.6;
    skyUniforms.uGround.value.setHex(0x3a2f28).lerp(colB.setHex(0x0a0d18), l.night);
    scene.fog.color.copy(l.hor).lerp(l.top, 0.15);
    renderer.toneMappingExposure = l.exp;
    starMat.opacity = smooth(0.35, 0.9, l.night);
    nightAmt = l.night;
  }
  let nightAmt = 0;

  // ---------- pollen by day, fireflies by night ----------
  const MOTES = 180;
  const moteGeo = new THREE.BufferGeometry();
  const moteBase = new Float32Array(MOTES * 3), motePos = new Float32Array(MOTES * 3);
  { const r = rngFrom('motes'); for (let i = 0; i < MOTES; i++) { moteBase[i * 3] = -6.5 + r() * 13; moteBase[i * 3 + 1] = 0.2 + r() * 2.2; moteBase[i * 3 + 2] = -4.2 + r() * 6; } }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const moteTex = canvasTex(64, 64, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const moteMat = new THREE.PointsMaterial({ size: 0.05, map: moteTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe8b8, opacity: 0.5 });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  scene.add(motes);
  function updateMotes(time) {
    for (let i = 0; i < MOTES; i++) {
      const ph = i * 12.9898;
      motePos[i * 3] = moteBase[i * 3] + Math.sin(time * 0.13 + ph) * 0.5;
      motePos[i * 3 + 1] = moteBase[i * 3 + 1] + Math.sin(time * 0.21 + ph * 0.7) * 0.25;
      motePos[i * 3 + 2] = moteBase[i * 3 + 2] + Math.cos(time * 0.11 + ph) * 0.4;
    }
    moteGeo.attributes.position.needsUpdate = true;
    const flick = 0.55 + 0.45 * Math.sin(time * 3.1);
    moteMat.color.setHex(0xffe8b8).lerp(colB.setHex(0xd9ff7a), nightAmt);
    moteMat.size = lerp(0.045, 0.085, nightAmt);
    moteMat.opacity = lerp(0.35, 0.9 * flick, nightAmt);
  }

  // ---------- camera path ----------
  const KF = [
    { pos: [-1.5, 6.8, 9.5], tgt: [-0.6, 0.2, -1.6] },   // bare soil: wide
    { pos: [-2.6, 2.3, 3.4], tgt: [-4.6, 0.55, -3.0] },  // seedlings: the pineapple corner, cuttings and trays
    { pos: [3.2, 1.7, 2.6], tgt: [-1.6, 0.35, -1.4] },   // vegetable patch: along the rows
    { pos: [-0.6, 1.35, 1.2], tgt: [-3.0, 0.25, -1.75] },// winter: close on the troughs
    { pos: [1.9, 1.75, -0.2], tgt: [-2.4, 1.0, -3.6] },  // fruit section
    { pos: [5.6, 2.5, 4.8], tgt: [-0.9, 0.7, -1.9] },    // forest: low, golden, wide
    { pos: [0.6, 4.4, 8.2], tgt: [-0.4, 0.5, -1.6] }     // explore
  ];
  const camPosCurve = new THREE.CatmullRomCurve3(KF.map(k => new THREE.Vector3(...k.pos)), false, 'centripetal');
  const camTgtCurve = new THREE.CatmullRomCurve3(KF.map(k => new THREE.Vector3(...k.tgt)), false, 'centripetal');
  const narrowAdjust = new THREE.Vector3();
  function camAt(P, outPos, outTgt) {
    const u = clamp((P - 0.5) / (KF.length - 1));
    camPosCurve.getPoint(u, outPos); camTgtCurve.getPoint(u, outTgt);
    // on tall screens step back so the garden still fits
    const aspect = camera.aspect;
    if (aspect < 1.2) { narrowAdjust.copy(outPos).sub(outTgt).multiplyScalar((1.2 - aspect) * 0.9); outPos.add(narrowAdjust); }
  }

  // ---------- controls (explore) ----------
  const finePointer = matchMedia('(pointer: fine)').matches;
  let controls = null;
  if (finePointer) {
    controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false; controls.enablePan = false;
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.42;
    controls.enabled = false;
    canvas.style.touchAction = 'pan-y';
  }

  // ---------- sizing ----------
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.9 ? 50 : 38;
    camera.updateProjectionMatrix();
    needs = true;
  }
  addEventListener('resize', resize);

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(proxies.filter(p => p.userData.entry.group.visible), false);
    return hits.length ? hits[0].object.userData.entry : null;
  }
  let downAt = null;
  canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const en = hit(e);
    if (en) App.select(en.plant.id);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const en = hit(e);
    if (en) {
      const r = stage.getBoundingClientRect();
      tip.hidden = false; tip.textContent = en.plant.name;
      tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px';
      canvas.style.cursor = 'pointer';
    } else { tip.hidden = true; canvas.style.cursor = ''; }
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });

  // ---------- state wiring ----------
  const wantPos = new THREE.Vector3(), wantTgt = new THREE.Vector3(), curTgt = new THREE.Vector3();
  let needs = true, exploring = false, focusTarget = null;
  App.on('time', () => { needs = true; });
  App.on('select', id => {
    needs = true;
    potsAll.forEach(e => { if (e.potMat) e.potMat.emissive.setHex(id === e.plant.id ? 0x6a3a12 : 0x000000); });
    if (id && exploring && controls) {
      const e = potsAll.find(x => x.plant.id === id && !x.isJar);
      if (e) focusTarget = new THREE.Vector3(e.group.position.x, e.group.position.y + Math.min(1.1, e.height * 0.5), e.group.position.z);
    }
  });

  function setExplore(on) {
    if (on === exploring) return;
    exploring = on;
    stage.classList.toggle('exploring', on && !!controls);
    hint.hidden = !on;
    hint.textContent = controls ? 'Drag to look around · click a plant' : 'Tap a plant';
    if (controls) {
      controls.enabled = on;
      if (on) { controls.target.copy(curTgt); controls.update(); }
    }
    if (!on) focusTarget = null;
  }

  // ---------- loop ----------
  let running = false, raf = 0, last = performance.now(), smoothP = App.state.P, firstFrame = true;
  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const s = App.state;
    if (Math.abs(s.day - lastDay) > 0.25 || needs) applyDay(s.day);
    smoothP = reduce || firstFrame ? s.P : lerp(smoothP, s.P, 1 - Math.pow(0.0015, dt));
    applyLight(smoothP);
    setExplore(s.explore);
    if (exploring && controls) {
      if (focusTarget) { controls.target.lerp(focusTarget, 0.06); if (controls.target.distanceTo(focusTarget) < 0.01) focusTarget = null; }
      controls.update();
      curTgt.copy(controls.target);
    } else {
      camAt(smoothP, wantPos, wantTgt);
      if (reduce || firstFrame) { camera.position.copy(wantPos); curTgt.copy(wantTgt); }
      else { const k = 1 - Math.pow(0.004, dt); camera.position.lerp(wantPos, k); curTgt.lerp(wantTgt, k); }
      camera.lookAt(curTgt);
    }
    // the dragon fruit's night flowers glow
    mat.night.emissiveIntensity = nightAmt * 0.9 + 0.05;
    bloomLight.intensity = nightAmt * dragonBloom * 2.2;
    const df = potsAll.find(e => e.plant.species === 'dragonfruit');
    if (df) bloomLight.position.set(df.group.position.x, 1.95, df.group.position.z + 0.3);
    if (!reduce) { windUniform.value = now / 1000; updateMotes(now / 1000); }
    else if (firstFrame) updateMotes(0);
    renderer.render(scene, camera);
    needs = false; firstFrame = false;
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  resize();
  applyDay(App.state.day);
  applyLight(App.state.P);
  const story = document.getElementById('story');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { es[0].isIntersecting && !document.hidden ? start() : stop(); }, { rootMargin: '100px' }).observe(story);
  } else start();
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (story.getBoundingClientRect().bottom > 0 && story.getBoundingClientRect().top < innerHeight) start(); });
}
