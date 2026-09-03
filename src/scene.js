import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export function carModel(color = 0xf04435) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.62, roughness: 0.28 });
  const carbon = new THREE.MeshStandardMaterial({
    color: 0x14171c,
    metalness: 0.3,
    roughness: 0.52,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.94 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f1e9, metalness: 0.4, roughness: 0.3 });
  const box = (w, h, d, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const hull = (sections, material) => {
    const vertices = [],
      indices = [];
    sections.forEach(([z, w, h, y], i) => {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        vertices.push(Math.cos(a) * w, y + Math.sin(a) * h, z);
        if (i < sections.length - 1) {
          const v = i * 12 + k,
            n = i * 12 + ((k + 1) % 12);
          indices.push(v, n, v + 12, n, n + 12, v + 12);
        }
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    g.add(mesh);
  };
  hull(
    [
      [-1.85, 0.24, 0.13, 0.48],
      [-1.1, 0.45, 0.36, 0.62],
      [-0.3, 0.43, 0.25, 0.62],
      [0.55, 0.31, 0.16, 0.54],
      [1.5, 0.16, 0.12, 0.46],
      [2.22, 0.12, 0.075, 0.39],
    ],
    paint,
  );
  for (const side of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 1.2, 5, 12), paint);
    pod.rotation.x = Math.PI / 2;
    pod.scale.set(1.22, 1, 0.65);
    pod.position.set(side * 0.62, 0.49, -0.4);
    pod.castShadow = true;
    g.add(pod);
  }
  box(1.5, 0.055, 2.65, 0, 0.23, -0.18, carbon);
  box(1.9, 0.09, 0.52, 0, 0.26, 2.25, carbon);
  box(1.88, 0.12, 0.62, 0, 1.04, -1.88, paint);
  box(0.08, 0.65, 0.4, -0.84, 0.79, -1.9, carbon);
  box(0.08, 0.65, 0.4, 0.84, 0.79, -1.9, carbon);
  box(0.59, 0.12, 0.75, 0, 0.77, 0.05, carbon);
  box(0.15, 0.6, 0.32, 0, 0.9, -0.7, paint);
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xf1d780 }),
  );
  helmet.position.set(0, 0.94, 0.02);
  g.add(helmet);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 6, 18, Math.PI * 1.5), carbon);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 1.08, 0.1);
  g.add(halo);
  box(0.04, 0.26, 0.04, 0, 0.94, 0.47, carbon);
  box(0.13, 0.015, 2.7, 0, 0.722, 0.9, white);
  const wheels = [];
  for (const x of [-1.0, 1.0])
    for (const z of [-1.25, 1.35]) {
      box(2, 0.07, 0.1, 0, 0.39, z, carbon);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.38, 24), rubber);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.38, z);
      w.castShadow = true;
      g.add(w);
      wheels.push(w);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.395, 12), white);
      rim.rotation.z = Math.PI / 2;
      rim.position.copy(w.position);
      g.add(rim);
    }
  const decal = document.createElement('canvas');
  decal.width = 256;
  decal.height = 64;
  const dc = decal.getContext('2d');
  dc.fillStyle = '#efeee7';
  dc.font = 'bold 37px sans-serif';
  dc.textAlign = 'center';
  dc.fillText('FORMULA', 128, 46);
  const texture = new THREE.CanvasTexture(decal);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.34),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }),
  );
  label.position.set(0, 1.13, -1.91);
  label.rotation.y = Math.PI;
  g.add(label);
  g.userData.wheels = wheels;
  return g;
}
function asphalt() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d'),
    data = ctx.createImageData(256, 256);
  let seed = 47;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const n = 48 + (seed % 22);
    data.data[i] = n;
    data.data[i + 1] = n + 1;
    data.data[i + 2] = n + 3;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 60);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
export class RaceScene {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room).texture;
    room.dispose();
    pmrem.dispose();
    this.camera = new THREE.PerspectiveCamera(57, 1, 0.1, 2400);
    this.look = new THREE.Vector3();
    this.cameraMode = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
  build(track) {
    if (this.scene) {
      const geometries = new Set(),
        materials = new Set(),
        textures = new Set();
      this.scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material)
          for (const m of [].concat(o.material)) {
            materials.add(m);
            if (m.map) textures.add(m.map);
          }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    }
    this.track = track;
    this.scene = new THREE.Scene();
    this.scene.environment = this.environment;
    this.scene.environmentIntensity = 0.45;
    const night = track.weather === 'night',
      rain = track.weather === 'rain',
      desert = track.id === 'desert';
    const sky = night ? 0x10172d : rain ? 0x8493a3 : desert ? 0xd6b08e : 0xb3d0df;
    this.scene.background = new THREE.Color(sky);
    this.scene.fog = new THREE.Fog(sky, 220, 1100);
    this.scene.add(
      new THREE.HemisphereLight(
        night ? 0x879cca : 0xdbeaff,
        desert ? 0xa78452 : 0x526044,
        night ? 1.4 : 2.1,
      ),
    );
    const sun = new THREE.DirectionalLight(night ? 0xa6bcff : 0xffead2, night ? 1.1 : 3.2);
    sun.position.set(-130, 250, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -350, right: 350, top: 450, bottom: -250, far: 650 });
    sun.shadow.bias = -0.0006;
    this.scene.add(sun);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(3500, 3500),
      new THREE.MeshStandardMaterial({
        color: desert ? 0x988163 : night ? 0x29332d : rain ? 0x546351 : 0x627457,
        roughness: 1,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const strip = (left, right, material, y = 0.01) => {
      const vertices = [],
        uv = [],
        indices = [],
        n = track.samples.length;
      for (let i = 0; i <= n; i++) {
        const p = track.samples[i % n];
        for (const off of [left, right]) {
          vertices.push(p.x + p.tz * off, y, p.z - p.tx * off);
          uv.push(off === left ? 0 : 1, i / n);
        }
        if (i < n) {
          const k = i * 2;
          indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, material);
      m.receiveShadow = true;
      this.scene.add(m);
      return m;
    };
    strip(
      -track.width / 2 - 4.7,
      track.width / 2 + 4.7,
      new THREE.MeshStandardMaterial({ color: desert ? 0xb89c76 : 0x93918a, roughness: 1 }),
      0,
    );
    strip(
      -track.width / 2,
      track.width / 2,
      new THREE.MeshStandardMaterial({
        map: asphalt(),
        roughness: rain ? 0.26 : 0.94,
        metalness: rain ? 0.3 : 0.05,
        side: THREE.DoubleSide,
      }),
      0.025,
    );
    const edge = new THREE.MeshStandardMaterial({ color: 0xf3f0df });
    strip(-track.width / 2, -track.width / 2 + 0.13, edge, 0.035);
    strip(track.width / 2 - 0.13, track.width / 2, edge, 0.035);
    const curbGeo = new THREE.BoxGeometry(0.7, 0.08, 3.2);
    const curbs = new THREE.InstancedMesh(
      curbGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
      Math.floor(track.length / 3) * 2,
    );
    const dummy = new THREE.Object3D();
    let id = 0;
    for (let s = 0; s < track.length - 3; s += 3)
      for (const side of [-1, 1]) {
        const p = track.at(s);
        dummy.position.set(
          p.x + p.tz * (track.width / 2 + 0.35) * side,
          0.04,
          p.z - p.tx * (track.width / 2 + 0.35) * side,
        );
        dummy.rotation.set(0, p.heading, 0);
        dummy.updateMatrix();
        curbs.setMatrixAt(id, dummy.matrix);
        curbs.setColorAt(id++, new THREE.Color(Math.floor(s / 9) % 2 ? 0xefefdf : 0xad302b));
      }
    curbs.count = id;
    this.scene.add(curbs);
    const barriers = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.38, 0.9, 5.4),
      new THREE.MeshStandardMaterial({ color: 0xb9bfc0, metalness: 0.4, roughness: 0.65 }),
      Math.ceil(track.length / 5) * 2,
    );
    id = 0;
    for (let s = 0; s < track.length; s += 5)
      for (const side of [-1, 1]) {
        const p = track.at(s);
        dummy.position.set(
          p.x + p.tz * (track.width / 2 + 5.4) * side,
          0.45,
          p.z - p.tx * (track.width / 2 + 5.4) * side,
        );
        dummy.rotation.set(0, p.heading, 0);
        dummy.updateMatrix();
        barriers.setMatrixAt(id++, dummy.matrix);
      }
    barriers.count = id;
    barriers.castShadow = true;
    this.scene.add(barriers);
    this.line = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x83e6af,
      transparent: true,
      opacity: 0.65,
    });
    for (let s = 0; s < track.length; s += 8) {
      const p = track.at(s),
        mark = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 2.2), lineMat);
      mark.rotation.set(-Math.PI / 2, 0, -p.heading);
      mark.position.set(p.x, 0.045, p.z);
      this.line.add(mark);
    }
    this.scene.add(this.line);
    const start = track.at(0),
      gantry = new THREE.Group();
    gantry.position.set(start.x, 0, start.z);
    gantry.rotation.y = start.heading;
    for (const x of [-track.width / 2 - 1, track.width / 2 + 1]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 7, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x363d40 }),
      );
      post.position.set(x, 3.5, 0);
      gantry.add(post);
    }
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(track.width + 3, 1.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x19262c }),
    );
    banner.position.y = 6.5;
    gantry.add(banner);
    this.scene.add(gantry);
    for (let x = -track.width / 2; x < track.width / 2; x += 0.8)
      for (let z = 0; z < 2; z++) {
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 0.8),
          new THREE.MeshBasicMaterial({
            color: (Math.round((x + track.width / 2) / 0.8) + z) % 2 ? 0xeeeeee : 0x151515,
          }),
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(
          start.x + start.tz * x + start.tx * z * 0.8,
          0.05,
          start.z - start.tx * x + start.tz * z * 0.8,
        );
        this.scene.add(m);
      }
    const pit = track.at(24);
    const pitBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.03, 11),
      new THREE.MeshStandardMaterial({ color: 0x2f8680 }),
    );
    pitBox.position.set(
      pit.x - pit.tz * (track.width / 2 - 2),
      0.055,
      pit.z + pit.tx * (track.width / 2 - 2),
    );
    pitBox.rotation.y = pit.heading;
    this.scene.add(pitBox);
    let seed = 19;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 170; i++) {
      const p = track.at((i / 170) * track.length),
        side = i % 2 ? 1 : -1,
        off = track.width / 2 + 14 + rand() * 90;
      const x = p.x + p.tz * off * side,
        z = p.z - p.tx * off * side;
      if (track.nearest(x, z).distance < track.width / 2 + 10) continue;
      if (track.id === 'harbor' || night) {
        const h = 8 + rand() * 43;
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(8 + rand() * 8, h, 8 + rand() * 8),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.57, 0.09, 0.22 + rand() * 0.25),
            emissive: night ? 0x1d273d : 0,
            roughness: 0.7,
          }),
        );
        b.position.set(x, h / 2, z);
        b.castShadow = true;
        this.scene.add(b);
        if (night) {
          const lit = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, h * 0.8, 0.2),
            new THREE.MeshBasicMaterial({ color: i % 2 ? 0x72c6d0 : 0xffc681 }),
          );
          lit.position.set(x - 4, h / 2, z - 5);
          this.scene.add(lit);
        }
      } else {
        const h = desert ? 2 + rand() * 3 : 5 + rand() * 7;
        const tree = new THREE.Group();
        tree.position.set(x, 0, z);
        const mat = new THREE.MeshStandardMaterial({
          color: desert ? 0x897762 : new THREE.Color().setHSL(0.29, 0.27, 0.16 + rand() * 0.09),
        });
        if (!desert) {
          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.3, h * 0.6, 6),
            new THREE.MeshStandardMaterial({ color: 0x594c3b }),
          );
          trunk.position.y = h * 0.3;
          tree.add(trunk);
        }
        for (let level = 0; level < (desert ? 1 : 3); level++) {
          const foliage = new THREE.Mesh(
            new THREE.ConeGeometry(
              desert ? 3 : 2.7 - level * 0.65,
              desert ? h : h * 0.65,
              desert ? 7 : 12,
            ),
            mat,
          );
          foliage.position.y = desert ? h / 2 : h * 0.35 + level * h * 0.2;
          foliage.castShadow = true;
          tree.add(foliage);
        }
        this.scene.add(tree);
      }
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2,
        h = 80 + ((i * 37) % 120);
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(190, h, 5),
        new THREE.MeshStandardMaterial({ color: desert ? 0x9c8979 : 0x788582, roughness: 1 }),
      );
      m.position.set(Math.sin(a) * 750, h / 2 - 20, Math.cos(a) * 750 + 100);
      this.scene.add(m);
    }
    // Grandstand beside the start straight.
    const gp = track.at(65);
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.8 + i * 0.65, 50),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0x405361 : 0xa2a7a4 }),
      );
      b.position.set(
        gp.x + gp.tz * (track.width / 2 + 10 + i * 2),
        0.4 + i * 0.325,
        gp.z - gp.tx * (track.width / 2 + 10 + i * 2),
      );
      b.rotation.y = gp.heading;
      this.scene.add(b);
    }
    this.ghost = null;
    this.cars = [];
    this.camera.position.set(start.x - 30, 18, start.z - 30);
  }
  addGhost() {
    this.ghost = carModel(0x82ffe1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x82ffe1,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const oldMaterials = new Set(),
      oldTextures = new Set();
    this.ghost.traverse((o) => {
      if (o.isMesh) {
        oldMaterials.add(o.material);
        if (o.material.map) oldTextures.add(o.material.map);
        o.material = mat;
        o.castShadow = false;
      }
    });
    oldMaterials.forEach((m) => m.dispose());
    oldTextures.forEach((t) => t.dispose());
    this.ghost.visible = false;
    this.scene.add(this.ghost);
  }
  setGhost(p) {
    if (!this.ghost) return;
    this.ghost.visible = !!p;
    if (p) {
      this.ghost.position.set(p[1], 0, p[2]);
      this.ghost.rotation.y = p[3];
    }
  }
  addCars(colors) {
    this.cars = colors.map((c) => {
      const m = carModel(c);
      this.scene.add(m);
      return m;
    });
  }
  update(cars, dt, menu = false) {
    cars.forEach((c, i) => {
      const m = this.cars[i];
      if (!m) return;
      m.position.set(c.x, 0, c.z);
      m.rotation.set(c.brake * 0.008, c.heading, -c.yaw * c.speed * 0.00065);
    });
    const c = cars[0];
    if (!c) return;
    const f = new THREE.Vector3(Math.sin(c.heading), 0, Math.cos(c.heading));
    const pos = new THREE.Vector3(c.x, 0, c.z),
      desired = pos.clone();
    if (menu) {
      desired.add(new THREE.Vector3(-17, 9, 17));
      this.look.copy(pos).y = 0.8;
    } else if (this.cameraMode === 1) {
      desired.addScaledVector(f, 0.2);
      desired.y = 1.17;
      this.look.copy(pos).addScaledVector(f, 35);
      this.look.y = 1.0;
    } else if (this.cameraMode === 2) {
      desired.addScaledVector(f, -3);
      desired.y = 3.6;
      this.look.copy(pos).addScaledVector(f, 15);
      this.look.y = 0.8;
    } else {
      desired.addScaledVector(f, -9 - c.speed * 0.045);
      desired.y = 4.2 + c.speed * 0.014;
      this.look.copy(pos).addScaledVector(f, 11);
      this.look.y = 0.7;
    }
    this.camera.position.lerp(
      desired,
      menu ? 0.04 : this.cameraMode === 1 ? 1 : 1 - Math.exp(-dt * 6),
    );
    this.camera.lookAt(this.look);
    this.renderer.render(this.scene, this.camera);
  }
}
