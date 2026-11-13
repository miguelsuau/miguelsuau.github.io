// Preserve the approved four-pose artwork as a shallow, solid cutout.
export function createAvatar(THREE, { image, object, pixelated = false }) {
  const avatar = object('Avatar', [0, 0, 7]);
  avatar.scale.setScalar(.9);
  const poses = [], columns = 128, rows = 342;
  const cellWidth = image.width / 4, cellHeight = image.height;
  // Match the two sheets by visible body height and soles, not transparent padding.
  const unit = 9.2 / (pixelated ? 822 : 857), baseline = pixelated ? 937 : 954, depth = .44;
  for (let pose = 0; pose < 4; pose++) {
    const canvas = document.createElement('canvas'); canvas.width = cellWidth; canvas.height = cellHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, pose * cellWidth, 0, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
    const maskCanvas = document.createElement('canvas'); maskCanvas.width = columns; maskCanvas.height = rows;
    const maskContext = maskCanvas.getContext('2d'); maskContext.drawImage(canvas, 0, 0, columns, rows);
    const pixels = maskContext.getImageData(0, 0, columns, rows).data;
    const filled = (x, y) => x >= 0 && y >= 0 && x < columns && y < rows && pixels[(y * columns + x) * 4 + 3] > 205;
    const front = [], back = [], sides = [], uv = [], sideColors = [];
    const point = (x, y, z) => [(x / columns * cellWidth - cellWidth / 2) * unit, (baseline - y / rows * cellHeight) * unit, z];
    const quad = (target, corners) => { for (const i of [0, 1, 2, 0, 2, 3]) target.push(...corners[i]); };
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
      if (!filled(x, y)) continue;
      const corners = [[x,y+1],[x+1,y+1],[x+1,y],[x,y]];
      quad(front, corners.map(([cx,cy]) => point(cx,cy,depth/2)));
      quad(back, [...corners].reverse().map(([cx,cy]) => point(cx,cy,-depth/2)));
      for (const i of [0,1,2,0,2,3]) uv.push(corners[i][0]/columns, 1-corners[i][1]/rows);
      const edges = [[x,y+1,0,1],[x+1,y,1,2],[x,y-1,2,3],[x-1,y,3,0]];
      const p = (y * columns + x) * 4;
      const color = new THREE.Color().setRGB(pixels[p]/255,pixels[p+1]/255,pixels[p+2]/255,THREE.SRGBColorSpace).multiplyScalar(.55);
      for (const [nx,ny,a,b] of edges) if (!filled(nx,ny)) {
        const [ax,ay] = corners[a], [bx,by] = corners[b];
        quad(sides,[point(bx,by,depth/2),point(ax,ay,depth/2),point(ax,ay,-depth/2),point(bx,by,-depth/2)]);
        for (let i=0;i<6;i++) sideColors.push(color.r,color.g,color.b);
      }
    }
    const geometry = positions => { const g = new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); g.computeVertexNormals(); return g; };
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = pixelated ? THREE.NearestFilter : THREE.LinearFilter;
    texture.magFilter = pixelated ? THREE.NearestFilter : THREE.LinearFilter;
    texture.generateMipmaps = false;
    const g = new THREE.Group(); g.name = ['Normal','Hello','Thinking','Suspicious'][pose];
    const frontGeometry = geometry(front); frontGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.add(new THREE.Mesh(frontGeometry,new THREE.MeshBasicMaterial({map:texture,alphaTest:.55,toneMapped:false})));
    g.add(new THREE.Mesh(geometry(back),new THREE.MeshLambertMaterial({color:0x30342f})));
    const edgeGeometry = geometry(sides); edgeGeometry.setAttribute('color',new THREE.Float32BufferAttribute(sideColors,3));
    g.add(new THREE.Mesh(edgeGeometry,new THREE.MeshLambertMaterial({vertexColors:true})));
    g.visible = pose === 0; avatar.add(g); poses.push(g);
  }
  avatar.userData.pose = value => poses.forEach((g,i) => { g.visible = i === value; });
  return avatar;
}
