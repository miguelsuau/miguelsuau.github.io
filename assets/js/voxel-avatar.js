import * as THREE from './three.module.js';
import { createAvatar } from './avatar-model.js?v=11';
import { composeAvatarArtwork } from './avatar-artwork.js?v=1';

// Solid models, one perspective camera, and ground-plane dragging.
const frame = document.querySelector('[data-avatar]');
if (frame) start().catch(() => { frame.dataset.voxelState = 'fallback'; });
async function start() {
  const landing = frame.dataset.mode === 'landing';
  const host = landing ? frame.closest('.entrance-space') : frame;
  const sprite = frame.querySelector('.avatar-sprite');
  const renderer = new THREE.WebGLRenderer({alpha:!landing,antialias:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setClearColor(landing?0x000604:0x000000,landing?1:0);
  renderer.domElement.className = landing?'industrial-world':'avatar-voxel';
  if(landing)renderer.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0';
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','Interactive 3D scene. Drag objects to move them. Select Rotate to rotate the object you drag. Scroll or use arrow keys to change its distance.');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,.1,240);
  camera.position.set(0,8,31);camera.lookAt(0,5.4,0);
  scene.add(new THREE.HemisphereLight(0xf4fff0,0x536a50,3.5));
  const sun=new THREE.DirectionalLight(0xfff0d6,5.0);sun.position.set(-8,18,12);scene.add(sun);
  const materials=new Map(),boxGeometry=new THREE.BoxGeometry(1,1,1);
  function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshLambertMaterial({color}));return materials.get(color);}
  function box(parent,x,y,z,w,h,d,color,rz=0){const m=new THREE.Mesh(boxGeometry,material(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.z=rz;parent.add(m);return m;}
  function cylinder(parent,x,y,z,radius,height,color,axis='y',top=radius){const m=new THREE.Mesh(new THREE.CylinderGeometry(top,radius,height,12),material(color));m.position.set(x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;parent.add(m);return m;}
  function beam(parent,a,b,width,color){const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const m=box(parent,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,width,v.length(),width,color);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
  const roots=[],initial=new Map();
  function object(name,position){const g=new THREE.Group();g.name=name;g.userData.interactive=true;g.position.set(...position);scene.add(g);roots.push(g);return g;}
  function pump(){const g=object('Pump',[-6.4,0,5]);box(g,0,.2,0,4,.4,2.8,0x666b69);cylinder(g,-.8,1.4,.2,1,1.0,0x174cdb,'z');cylinder(g,-.8,1.4,1,0.57,.35,0xb7bcc2,'z');cylinder(g,-.8,1.4,1.21,.33,.08,0x121a20,'z');for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder(g,-.8+Math.cos(a)*.45,1.4+Math.sin(a)*.45,1.28,.055,.08,0x525860,'z');}cylinder(g,-.8,2.45,.15,.35,1,0x174cdb);cylinder(g,-.8,2.95,.15,.5,.15,0xc4c9cd);cylinder(g,1.0,1.25,-.3,.65,2,0x177b79,'x');for(let i=0;i<9;i++)cylinder(g,.3+i*.18,1.25,-.3,.71,.055,0x2b9b91,'x');box(g,1.0,2,-.3,.7,.4,.7,0x3caaa2);for(const x of [-.8,1.1])box(g,x,.65,0,.5,.7,1.4,0x234b7f);g.rotation.y=-.25;const moving=new THREE.Group();g.children.slice(1).forEach(part=>moving.add(part));g.add(moving);g.userData.vibrationRoot=moving;return g;}
  function chiller(){const g=object('Chiller',[6.2,0,-20]);box(g,0,1.5,0,3,2.6,1.8,0xd8d6bc);box(g,0,.65,.06,3,1.15,1.9,0x277c78);for(const x of [-.75,.75]){cylinder(g,x,1.9,1.0,.59,.16,0x20282c,'z');cylinder(g,x,1.9,1.12,.13,.18,0xb5beb9,'z');const fan=new THREE.Group();fan.position.set(x,1.9,1.13);g.add(fan);for(let j=0;j<4;j++)box(fan,0,0,0,.9,.13,.06,0x7b8b88,j*Math.PI/4);(g.userData.fans??=[]).push(fan);for(let j=-2;j<=2;j++)beam(g,[x-.45,1.9+j*.16,1.2],[x+.45,1.9+j*.16,1.2],.025,0x9aaba6);cylinder(g,x,2.9,0,.5,.3,0xa6aca5);cylinder(g,x,3.06,0,.39,.025,0x35423e);}for(let i=0;i<5;i++)box(g,0,.35+i*.17,1.05,2.6,.06,.03,0x153f41);for(const x of [-1.1,1.1])box(g,x,.12,0,.2,.25,1.4,0x7f8a84);g.rotation.y=-.25;return g;}
  function turbine(){const g=object('Wind turbine',[-8,0,-7]);box(g,0,.15,0,1.6,.3,1.6,0xc8cec5);cylinder(g,0,3.7,0,.27,7.2,0xd5d9cf,'y',.17);box(g,0,7.3,.05,.75,.55,1.3,0xd4d8cc);const rotor=new THREE.Group();rotor.position.set(0,7.3,.85);g.add(rotor);cylinder(rotor,0,0,0,.28,.5,0xe9ead9,'z');for(let i=0;i<3;i++){const arm=new THREE.Group();arm.rotation.z=i*Math.PI*2/3;rotor.add(arm);const blade=box(arm,0,1.6,.05,.32,3.0,.13,0xe1e4d6,-.08);blade.position.x=.15;}g.userData.rotor=rotor;return g;}
  function substation(){const g=object('Substation',[6.6,0,5.5]);box(g,0,.12,0,5.5,.24,3.8,0x979f98);box(g,-.3,1.5,0,2.7,2.5,1.7,0x929993);for(let i=0;i<13;i++)box(g,-1.6+i*.21,1.5,1.0,.07,2.1,.45,0xb5b9ae);for(const x of [-1.2,-.2,.8]){cylinder(g,x,3.2,0,.12,1.2,0x553224);for(let j=0;j<5;j++)cylinder(g,x,2.8+j*.18,0,.22,.07,0x80604c);}for(const x of [-2.2,2.2]){beam(g,[x,.25,-1],[x,4.6,-1],.13,0xc3ccc2);beam(g,[x-.3,.25,-1],[x+.3,4.6,-1],.06,0xb9c2ba);beam(g,[x+.3,.25,-1],[x-.3,4.6,-1],.06,0xb9c2ba);}beam(g,[-2.2,4.6,-1],[2.2,4.6,-1],.13,0xc3ccc2);for(const x of [-1.2,-.2,.8])beam(g,[x,4.6,-1],[x,3.7,0],.035,0x78817a);box(g,1.8,1.1,.3,.7,1.8,.8,0xbcc3b9);for(const z of [-1.8,1.8]){for(const x of [-2.6,-1.3,0,1.3,2.6])beam(g,[x,.2,z],[x,1.4,z],.045,0xb4c6b4);for(let y=.4;y<1.45;y+=.2)beam(g,[-2.6,y,z],[2.6,y,z],.018,0x8ca18b);}g.rotation.y=-.17;const sparks=new THREE.Group();for(const x of [-1.2,-.2,.8]){const points=[];for(let k=0;k<7;k++)points.push(new THREE.Vector3(x+Math.sin(k*4.3)*.12,3.7+k*.12,-k*.1));sparks.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xaaddff,transparent:true,opacity:.95,depthWrite:false})));}sparks.visible=false;g.add(sparks);g.userData.sparks=sparks;return g;}
  function dataCenter(){
    const g=object('Data center',[-4.3,0,-18]);
    box(g,0,.10,0,4,.20,3,0x727d80);
    box(g,0,1.44,0,3.6,2.5,2.4,0x697b85);
    box(g,0,1.45,1.225,3.30,2.18,.08,0x101e26);
    const lights=[];
    for(const x of [-1.08,0,1.08]){
      box(g,x,1.43,1.29,.92,2.02,.13,0x24343e);
      for(let row=0;row<6;row++){
        const y=.64+row*.30;
        box(g,x,y,1.38,.78,.225,.12,0x4c626f);
        box(g,x-.10,y,1.45,.43,.055,.025,0x101c24);
        const light=new THREE.Mesh(boxGeometry,new THREE.MeshBasicMaterial({color:row%2?0x42d6ff:0x78f48b}));
        light.position.set(x+.28,y,1.46);light.scale.set(.045,.045,.025);g.add(light);lights.push(light);
      }
    }
    for(const x of [-1.74,-.54,.54,1.74])box(g,x,1.45,1.47,.055,2.23,.055,0xa1b0b3);
    box(g,0,2.79,0,3.91,.20,2.70,0xb6bfc0);
    box(g,-.8,3.07,-.25,1.12,.40,.84,0xb9c1b9);
    cylinder(g,-.8,3.29,-.25,.30,.035,0x344741);
    for(let i=0;i<5;i++)box(g,-1.835,1.1+i*.19,-.05,.025,.055,1.45,0x31464b);
    g.rotation.y=.18;g.userData.serverLights=lights;return g;
  }
  const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=frame.dataset.sprite;});
  const moustache=await new Promise((resolve)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>resolve(null);i.src=frame.dataset.moustache;});
  const person=createAvatar(THREE,{image:composeAvatarArtwork(image,moustache),object});
  if(landing){pump();chiller();turbine();substation();dataCenter();const floor=new THREE.Mesh(new THREE.PlaneGeometry(220,220),material(0x020b04));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;scene.add(floor);const grid=new THREE.GridHelper(220,110,0x00ff50,0x00ad2c);grid.position.y=.005;scene.add(grid);scene.fog=new THREE.FogExp2(0x000604,.015);}else{person.position.set(0,0,0);camera.position.set(0,4.5,17);camera.lookAt(0,4.5,0);}
  roots.forEach(g=>initial.set(g,{position:g.position.clone(),rotation:g.rotation.clone()}));
  host.appendChild(renderer.domElement);host.classList.add(landing?'live-world':'has-voxel');frame.dataset.voxelState='ready';
  let selected=person,mode='move',drag=null,raf=0,last=0;
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),point=new THREE.Vector3();
  function setRay(event){const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
  const controls=landing?host.parentElement.querySelector('.scene-tools'):null;
  if(controls){controls.hidden=false;const button=controls.querySelector('[data-scene-mode]');button.addEventListener('click',()=>{mode=mode==='rotate'?'move':'rotate';button.setAttribute('aria-pressed',String(mode==='rotate'));});}
  renderer.domElement.style.touchAction='none';
  renderer.domElement.addEventListener('pointerdown',event=>{setRay(event);const hit=ray.intersectObjects(roots,true)[0];if(!hit)return;let root=hit.object;while(!root.userData.interactive&&root.parent)root=root.parent;selected=root;const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-root.position.y);const onPlane=ray.ray.intersectPlane(plane,new THREE.Vector3());drag={x:event.clientX,y:event.clientY,rotation:root.rotation.clone(),plane,offset:onPlane?onPlane.sub(root.position):new THREE.Vector3(),rotate:!landing||mode==='rotate'||event.shiftKey};renderer.domElement.setPointerCapture(event.pointerId);renderer.domElement.style.cursor=drag.rotate?'grabbing':'move';});
  renderer.domElement.addEventListener('pointermove',event=>{if(!drag)return;if(drag.rotate){selected.rotation.y=drag.rotation.y+(event.clientX-drag.x)*.012;selected.rotation.x=THREE.MathUtils.clamp(drag.rotation.x+(event.clientY-drag.y)*.007,-.45,.45);}else{setRay(event);if(ray.ray.intersectPlane(drag.plane,point)){point.sub(drag.offset);selected.position.x=THREE.MathUtils.clamp(point.x,-17,17);selected.position.z=THREE.MathUtils.clamp(point.z,-25,12);}}});
  const release=()=>{drag=null;renderer.domElement.style.cursor='grab';};renderer.domElement.addEventListener('pointerup',release);renderer.domElement.addEventListener('pointercancel',release);
  renderer.domElement.addEventListener('wheel',event=>{if(!landing||!selected)return;event.preventDefault();selected.position.z=THREE.MathUtils.clamp(selected.position.z+event.deltaY*.015,-25,12);},{passive:false});
  renderer.domElement.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();if(event.shiftKey||!landing){selected.rotation.y+=(event.key==='ArrowLeft'?-.15:.15);}else{if(event.key==='ArrowLeft')selected.position.x-=.5;if(event.key==='ArrowRight')selected.position.x+=.5;if(event.key==='ArrowUp')selected.position.z-=1;if(event.key==='ArrowDown')selected.position.z+=1;} });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function render(time){raf=requestAnimationFrame(render);if(document.hidden||time-last<40)return;last=time;const r=renderer.domElement.getBoundingClientRect();if(renderer.domElement.width!==Math.round(r.width*renderer.getPixelRatio())||renderer.domElement.height!==Math.round(r.height*renderer.getPixelRatio())){renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;if(landing){camera.position.z=Math.max(31,7+20/(2*Math.tan(THREE.MathUtils.degToRad(19))*camera.aspect));camera.lookAt(0,5.4,0);}camera.updateProjectionMatrix();}const p=Math.min(3,Math.max(0,Number(sprite.dataset.pose||0)));person.userData.pose(p,reduced.matches?0:time/1000);roots.forEach(g=>{if(g.userData.rotor&&!reduced.matches)g.userData.rotor.rotation.z=time*.0002;if(g.userData.fans&&!reduced.matches)g.userData.fans.forEach(fan=>fan.rotation.z=time*.0045);if(g.userData.vibrationRoot){g.userData.vibrationRoot.position.set(reduced.matches?0:Math.sin(time*.045)*.025,reduced.matches?0:Math.sin(time*.071)*.012,0);}if(g.userData.serverLights)g.userData.serverLights.forEach((light,i)=>light.visible=reduced.matches||((time+i*353)%3600)<3200);if(g.userData.sparks)g.userData.sparks.visible=!reduced.matches&&(time%5200)<250;});renderer.render(scene,camera);renderer.domElement.dataset.pose=String(p);renderer.domElement.dataset.selected=selected.name;renderer.domElement.dataset.objectPosition=selected.position.toArray().map(v=>v.toFixed(2)).join(',');renderer.domElement.dataset.objectRotation=selected.rotation.y.toFixed(3);const bounds=new THREE.Box3().setFromObject(selected);const center=bounds.getCenter(new THREE.Vector3()).project(camera);const top=new THREE.Vector3(bounds.max.x,bounds.max.y,bounds.max.z).project(camera);const bottom=new THREE.Vector3(bounds.min.x,bounds.min.y,bounds.min.z).project(camera);renderer.domElement.dataset.objectScreenHeight=(Math.abs(top.y-bottom.y)*r.height/2).toFixed(1);renderer.domElement.dataset.objectScreenCenter=[(center.x+1)*r.width/2+r.left,(1-center.y)*r.height/2+r.top].map(v=>v.toFixed(1)).join(',');}
  renderer.domElement.addEventListener('webglcontextlost',()=>{cancelAnimationFrame(raf);host.classList.remove('live-world','has-voxel');});raf=requestAnimationFrame(render);
}
