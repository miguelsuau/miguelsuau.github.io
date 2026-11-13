// A small low-poly character: shaped surfaces and pixel-art face textures.
export function createAvatar(THREE, { image, object }) {
  const person = object('Avatar', [0, 0, 7]);
  person.scale.setScalar(.9);
  const palette = { jacket: 0x30332e, lapel: 0x3a3d36, shirt: 0xe6e5de, trousers: 0x181a18, skin: 0xd99d69, hair: 0x321c11, beard: 0x4a2b16 };
  const materials = new Map();
  const material = color => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshLambertMaterial({ color, flatShading: true }));
    return materials.get(color);
  };
  function block(parent, x, y, z, width, height, depth, color, bevel = .07) {
    const b = Math.min(bevel, width / 4, height / 4, depth / 4);
    const shape = new THREE.Shape();
    const w = width / 2 - b, h = height / 2 - b;
    shape.moveTo(-w, -h); shape.lineTo(w, -h); shape.lineTo(w, h); shape.lineTo(-w, h); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 1, steps: 1 });
    geometry.translate(0, 0, -depth / 2 + b);
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  const head = new THREE.Group();
  head.position.y = 7.45; person.add(head);
  const expressions = [];
  const columns = 48, rows = 48, width = 3.3, height = 3.3;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = columns; maskCanvas.height = rows;
  const maskContext = maskCanvas.getContext('2d'); maskContext.imageSmoothingEnabled = false;
  maskContext.drawImage(image, 48, 98, 288, 288, 0, 0, columns, rows);
  const mask = maskContext.getImageData(0, 0, columns, rows).data;
  const filled = (x, y) => x >= 0 && x < columns && y >= 0 && y < rows && mask[(y * columns + x) * 4 + 3] > 220;
  function point(x, y, back = false) {
    const nx = (x / columns - .5) * 2, ny = (.5 - y / rows) * 2;
    const curve = Math.sqrt(Math.max(.008, 1 - (nx * 1.06) ** 2 - (ny * 1.03) ** 2));
    return [(x / columns - .5) * width, (.5 - y / rows) * height, (back ? -1.05 : 1.05) * curve];
  }
  const front = [], uv = [], volume = [];
  function quad(target, corners) {
    for (const index of [0, 1, 2, 0, 2, 3]) target.push(...corners[index]);
  }
  // One continuous, closed curved shell, using the approved head silhouette.
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    if (!filled(x, y)) continue;
    const corners = [[x, y + 1], [x + 1, y + 1], [x + 1, y], [x, y]];
    quad(front, corners.map(([cx, cy]) => point(cx, cy)));
    for (const index of [0, 1, 2, 0, 2, 3]) uv.push(corners[index][0] / columns, 1 - corners[index][1] / rows);
    quad(volume, [...corners].reverse().map(([cx, cy]) => point(cx, cy, true)));
    const edges = [
      { neighbor: [x, y + 1], ends: [corners[0], corners[1]] },
      { neighbor: [x + 1, y], ends: [corners[1], corners[2]] },
      { neighbor: [x, y - 1], ends: [corners[2], corners[3]] },
      { neighbor: [x - 1, y], ends: [corners[3], corners[0]] }
    ];
    for (const edge of edges) if (!filled(...edge.neighbor)) {
      const [a, b] = edge.ends;
      quad(volume, [point(...b), point(...a), point(...a, true), point(...b, true)]);
    }
  }
  const shell = new THREE.BufferGeometry();
  shell.setAttribute('position', new THREE.Float32BufferAttribute(volume, 3)); shell.computeVertexNormals();
  head.add(new THREE.Mesh(shell, material(palette.hair)));
  const surface = new THREE.BufferGeometry();
  surface.setAttribute('position', new THREE.Float32BufferAttribute(front, 3));
  surface.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); surface.computeVertexNormals();
  for (let pose = 0; pose < 4; pose++) {
    const crop = document.createElement('canvas'); crop.width = 288; crop.height = 288;
    const ctx = crop.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, pose * image.width / 4 + 48, 98, 288, 288, 0, 0, 288, 288);
    const texture = new THREE.CanvasTexture(crop);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
    const face = new THREE.Mesh(surface, new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .7 }));
    face.visible = pose === 0; head.add(face); expressions.push(face);
  }

  block(person, 0, 5.98, 0, .7, .68, .7, palette.skin);
  block(person, 0, 4.45, 0, 2.2, 2.7, 1.15, palette.jacket, .15);
  block(person, 0, 4.45, .59, .75, 2.4, .09, palette.shirt, .02);
  for (const side of [-1, 1]) {
    const lapel = block(person, side * .62, 5.25, .68, .48, 1.18, .16, palette.lapel, .05);
    lapel.rotation.z = side * -.2;
    block(person, side * .69, 3.92, .63, .58, 1.65, .12, palette.lapel, .04);
    block(person, side * .49, 1.71, 0, .78, 2.9, .82, palette.trousers, .09);
    block(person, side * .49, .3, .27, .87, .48, 1.4, 0x181b18, .1);
    block(person, side * .49, .12, .3, .9, .16, 1.43, palette.shirt, .035);
    for (let lace = 0; lace < 2; lace++) block(person, side * .49, .52, .53 + lace * .22, .44, .035, .07, palette.shirt, .005);
  }
  block(person, -.68, 4.92, .74, .46, .32, .055, 0x151813, .025);
  block(person, -.68, 4.95, .78, .29, .07, .025, 0x666a60, .005);

  const arms = [-1, 1].map(side => ({
    side,
    upper: block(person, 0, 0, 0, .6, 1, .67, palette.jacket, .1),
    lower: block(person, 0, 0, 0, .55, 1, .62, palette.lapel, .08),
    hand: block(person, 0, 0, 0, .47, .61, .43, palette.skin, .065)
  }));
  function segment(mesh, a, b) {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
    const delta = to.clone().sub(from);
    mesh.position.copy(from.add(to).multiplyScalar(.5)); mesh.scale.y = delta.length();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  }
  person.userData.pose = (value, time) => {
    expressions.forEach((face, i) => { face.visible = i === value; });
    for (const arm of arms) {
      const s = arm.side;
      let elbow = [s * 1.4, 4.18, 0], wrist = [s * 1.4, 2.97, .08];
      if (s === 1 && value === 1) { elbow = [1.92, 6.2, .12]; wrist = [2.31 + Math.sin(time * 5) * .12, 7.5, .25]; }
      if (s === 1 && value === 2) { elbow = [1.65, 4.1, .6]; wrist = [.57, 6.32, 1.26]; }
      if (s === 1 && value === 3) { elbow = [1.97, 4.8, .1]; wrist = [2.9, 5.6, .25]; }
      segment(arm.upper, [s * 1.23, 5.48, 0], elbow); segment(arm.lower, elbow, wrist);
      arm.hand.position.set(...wrist); arm.hand.rotation.z = value === 1 && s === 1 ? -.12 : 0;
    }
  };
  person.userData.head = head;
  return person;
}
