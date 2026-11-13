import { faceData as D } from './face-model-data.js?v=1';

// A photo-fitted facial mesh and a restrained early-CGI character.
export function createAvatar(THREE,{object}) {
  const root=object('Avatar',[0,0,7]);root.scale.setScalar(.9);
  const skin=0xbf8970,coat=0x303731,pants=0x252b2a;
  const materials=new Map();
  function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.92,metalness:0}));return materials.get(color);}
  function mesh(parent,geometry,color,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,typeof color==='number'?material(color):color);m.position.set(x,y,z);parent.add(m);return m;}
  function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
  function ellipsoid(parent,x,y,z,rx,ry,rz,color,segments=12){const m=mesh(parent,new THREE.SphereGeometry(1,segments,Math.max(6,Math.round(segments*.7))),color,x,y,z);m.scale.set(rx,ry,rz);return m;}
  function block(parent,x,y,z,w,h,d,color,bevel=.045){const b=Math.min(bevel,w/5,h/5,d/5),s=new THREE.Shape();s.moveTo(-w/2+b,-h/2+b);s.lineTo(w/2-b,-h/2+b);s.lineTo(w/2-b,h/2-b);s.lineTo(-w/2+b,h/2-b);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:1,steps:1});g.translate(0,0,-d/2+b);return mesh(parent,g,color,x,y,z);}
  function tube(parent,points,radius,color,segments=12){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(parent,new THREE.TubeGeometry(c,segments,radius,6,false),color);}
  function surface(parent,positions,indices,color){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));if(indices)g.setIndex(indices);g.computeVertexNormals();return mesh(parent,g,color);}

  const head=group(root,0,7.78,0);head.scale.setScalar(.62);
  const eyeLoops=[[33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246],[263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466]];
  const innerLip=[78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191];
  function inside(point,loop){let yes=false;for(let i=0,j=loop.length-1;i<loop.length;j=i++){const a=D.positions[loop[i]],b=D.positions[loop[j]];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  const faceTriangles=D.triangles.filter(tri=>{const c=tri.reduce((a,id)=>a.map((v,j)=>v+D.positions[id][j]/3),[0,0,0]);return ![...eyeLoops,innerLip].some(loop=>inside(c,loop));});
  const original=D.positions.slice(0,468).flat(),colors=[];
  for(const rgb of D.colors.slice(0,468)){const c=new THREE.Color().setRGB(rgb[0]/255,rgb[1]/255,rgb[2]/255,THREE.SRGBColorSpace);colors.push(c.r,c.g,c.b);}
  const faceGeometry=new THREE.BufferGeometry();faceGeometry.setAttribute('position',new THREE.Float32BufferAttribute(original,3));faceGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));faceGeometry.setIndex(faceTriangles.flat());faceGeometry.computeVertexNormals();
  const faceMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0,flatShading:false});
  const face=mesh(head,faceGeometry,faceMaterial);
  // Close the head behind the measured facial boundary; colors meet at the edge.
  const skullPositions=[],skullColors=[],skullIndices=[],rings=7;
  for(let ring=0;ring<=rings;ring++)for(const id of D.oval){const p=D.positions[id],t=ring/rings,angle=t*Math.PI/2;const x=p[0]*Math.cos(angle),y=p[1]*Math.cos(angle),z=p[2]*(1-t)-1.02*Math.sin(angle);skullPositions.push(x,y,z);const base=new THREE.Color().setRGB(...D.colors[id].map(v=>v/255),THREE.SRGBColorSpace);const back=new THREE.Color(p[1]<-.45?0x3d2e25:skin);base.lerp(back,t);skullColors.push(base.r,base.g,base.b);}
  for(let r=0;r<rings;r++)for(let i=0;i<D.oval.length;i++){const j=(i+1)%D.oval.length,a=r*D.oval.length+i,b=r*D.oval.length+j,c=(r+1)*D.oval.length+j,d=(r+1)*D.oval.length+i;skullIndices.push(a,b,c,a,c,d);}
  const skull=surface(head,skullPositions,skullIndices,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide}));skull.geometry.setAttribute('color',new THREE.Float32BufferAttribute(skullColors,3));
  for(const s of [-1,1]){ellipsoid(head,s*1.04,.13,-.03,.16,.30,.18,skin);ellipsoid(head,s*1.13,.13,.02,.035,.17,.085,0x9e6d59);}
  // Curved eye surfaces follow the measured eyelid openings, with no sphere leaking through the skin.
  const eyeParts=[];
  for(let e=0;e<2;e++) {
    const id=e===0?468:473,center=D.positions[id],loop=eyeLoops[e],positions=[0,0,.012],indices=[];
    for(const index of loop){const p=D.positions[index];positions.push(p[0]-center[0],p[1]-center[1],p[2]-center[2]+.004);}
    for(let i=0;i<loop.length;i++)indices.push(0,i+1,(i+1)%loop.length+1);
    const gaze={value:new THREE.Vector2()},eyeMaterial=new THREE.MeshStandardMaterial({color:0xe4e6e5,roughness:.33,side:THREE.DoubleSide});
    eyeMaterial.onBeforeCompile=shader=>{
      shader.uniforms.eyeGaze=gaze;
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vEyePosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEyePosition=position.xy;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vEyePosition; uniform vec2 eyeGaze;').replace('#include <color_fragment>','#include <color_fragment>\nfloat eyeRadius=length(vEyePosition-eyeGaze); if(eyeRadius<0.080)diffuseColor.rgb=vec3(0.15,0.23,0.34); if(eyeRadius<0.068)diffuseColor.rgb=vec3(0.22,0.32,0.45); if(eyeRadius<0.031)diffuseColor.rgb=vec3(0.015,0.023,0.035); if(length(vEyePosition-eyeGaze-vec2(-0.020,0.021))<0.011)diffuseColor.rgb=vec3(0.8);');
    };
    const eye=surface(head,positions,indices,eyeMaterial);eye.position.set(...center);eyeParts.push({gaze});
  }
  const cavity=ellipsoid(head,-.01,-.525,.86,.39,.11,.17,0x301c1d,16);
  const teeth=group(head),teethPositions=[],teethIndices=[];
  for(let row=0;row<2;row++)for(let i=0;i<=12;i++){const x=(i/12-.5)*.65,t=Math.abs(x)/.34;teethPositions.push(x,-.465+.065*t*t-row*.105,1.045-.19*t*t);}
  for(let i=0;i<12;i++)teethIndices.push(i,i+13,i+14,i,i+14,i+1);
  surface(teeth,teethPositions,teethIndices,new THREE.MeshStandardMaterial({color:0xe2dece,roughness:.64,side:THREE.DoubleSide}));


  // A closed, softly waved cap with a smooth, measured-height hairline.
  const hairPositions=[],hairColors=[],hairIndices=[],hairRows=24,hairColumns=64;
  for(let row=0;row<=hairRows;row++)for(let col=0;col<=hairColumns;col++){
    const theta=col/hairColumns*Math.PI*2,front=Math.max(0,Math.cos(theta))**2;
    const angle=Math.acos(Math.cos(theta)),limit=(angle<1.3?1.24+.80*(angle/1.3)**2:2.04+.55*Math.sin(Math.min(Math.PI/2,(angle-1.3)*1.2)))+.035*Math.sin(theta*7),phi=row/hairRows*limit;
    const wave=(.12*Math.sin(theta*5+phi*4)+.07*Math.sin(theta*9-phi*7)+.025*Math.sin(theta*17+phi*13))*Math.sin(phi);
    hairPositions.push(Math.sin(phi)*Math.sin(theta)*(1.62+wave),.65+Math.cos(phi)*(1.66+wave),Math.sin(phi)*Math.cos(theta)*(1.23+wave)-.04);
    const shade=.5+.5*Math.sin(theta*9+phi*6);const color=new THREE.Color(0x211711).lerp(new THREE.Color(0x3b2a1e),shade*.65);hairColors.push(color.r,color.g,color.b);
  }
  for(let row=0;row<hairRows;row++)for(let col=0;col<hairColumns;col++){const a=row*(hairColumns+1)+col,b=a+1,d=(row+1)*(hairColumns+1)+col,c=d+1;hairIndices.push(a,d,c,a,c,b);}
  const hair=surface(head,hairPositions,hairIndices,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91,side:THREE.DoubleSide}));hair.geometry.setAttribute('color',new THREE.Float32BufferAttribute(hairColors,3));
  // Human proportions and soft low-poly clothing echo the industrial objects.
  function torsoGeometry(){const p=[],idx=[],levels=[[3.56,.93,.49],[4.18,1.0,.54],[5.45,1.14,.59],[6.34,1.25,.57],[6.62,.91,.45]],n=12;for(const [y,rx,rz] of levels)for(let j=0;j<n;j++){const a=j/n*Math.PI*2;p.push(Math.sin(a)*rx,y,Math.cos(a)*rz);}for(let r=0;r<levels.length-1;r++)for(let j=0;j<n;j++){const k=(j+1)%n,a=r*n+j,b=r*n+k,c=(r+1)*n+k,d=(r+1)*n+j;idx.push(a,b,c,a,c,d);}return {p,idx};}
  const torso=torsoGeometry();surface(root,torso.p,torso.idx,coat);
  const shoulderPositions=[],shoulderIndices=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2;shoulderPositions.push(Math.sin(a)*.91,6.62,Math.cos(a)*.45,Math.sin(a)*.30,6.64,Math.cos(a)*.28);}for(let i=0;i<12;i++){const j=(i+1)%12;shoulderIndices.push(i*2,j*2,j*2+1,i*2,j*2+1,i*2+1);}surface(root,shoulderPositions,shoulderIndices,coat);
  
  mesh(root,new THREE.CylinderGeometry(.27,.32,.58,12),skin,0,6.83,-.02);
  const shirtP=[-.43,3.65,.56,.43,3.65,.56,.46,5.9,.665,-.46,5.9,.665,-.32,6.45,.55,.32,6.45,.55];surface(root,shirtP,[0,1,2,0,2,3,3,2,5,3,5,4],0xe5e4dc);
  for(const s of [-1,1]){surface(root,[s*.34,6.52,.47,s*.88,6.34,.52,s*.61,5.59,.64,s*.35,6.03,.65],s===1?[0,1,2,0,2,3]:[0,2,1,0,3,2],0x3e453d);const leg=mesh(root,new THREE.CylinderGeometry(.37,.29,3.35,10),pants,s*.47,1.95,0);leg.scale.z=1.05;block(root,s*.47,.29,.24,.64,.39,1.1,0x171b19,.07);block(root,s*.47,.10,.26,.66,.14,1.12,0xc9ccc5,.025);}
  block(root,-.78,5.52,.59,.40,.38,.055,0x272e28,.02);block(root,-.78,5.70,.625,.42,.08,.07,0x3d443b,.015);
  for(const y of [4.25,4.9,5.53]){const button=mesh(root,new THREE.CylinderGeometry(.045,.045,.025,8),0x766a4d,-.38,y,.64);button.rotation.x=Math.PI/2;}
  function hand(s){const g=group(root);ellipsoid(g,0,0,0,.18,.24,.115,skin,10);const thumb=ellipsoid(g,-s*.19,.0,.02,.065,.15,.075,skin,8);thumb.rotation.z=-s*.45;const fingers=[];for(let i=0;i<4;i++)fingers.push(ellipsoid(g,-.135+i*.09,-.25,.015,.037,.15+(i===1?.02:0),.047,skin,8));return {g,fingers};}
  const arms=[-1,1].map(s=>({s,...hand(s),upper:mesh(root,new THREE.CylinderGeometry(.30,.26,1,10),coat),lower:mesh(root,new THREE.CylinderGeometry(.265,.215,1,10),0x353e34)}));
  function limb(m,a,b){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),d=to.clone().sub(from);m.position.copy(from.add(to).multiplyScalar(.5));m.scale.y=d.length();m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());}
  let lastPose=-1;
  function expression(pose){
    const a=faceGeometry.attributes.position;
    for(let i=0;i<468;i++){let [x,y,z]=D.positions[i];const dx=x+.01,dy=y+.525,weight=Math.exp(-((dx/.70)**4+(dy/.39)**4));if(pose!==1){y+=( -.525+dy*.30-y)*weight;x+=(-.01+dx*.90-x)*weight;y-=.07*(Math.abs(dx)/.5)**2*weight;if(pose===2)y-=.035*(Math.abs(dx)/.5)**2*weight;if(pose===3)y+=dx*.10*weight;}
      for(let brow=0;brow<2;brow++){const ids=D.brows[brow],bx=ids.reduce((v,k)=>v+D.positions[k][0]/ids.length,0),by=ids.reduce((v,k)=>v+D.positions[k][1]/ids.length,0),w=Math.exp(-(((x-bx)/.30)**2+((y-by)/.17)**2));y+=(pose===2&&brow===0?.055:pose===3&&brow===1?.075:0)*w;}
      a.setXYZ(i,x,y,z);
    }a.needsUpdate=true;faceGeometry.computeVertexNormals();teeth.visible=pose===1;cavity.scale.y=pose===1?.11:.045;
    for(const eye of eyeParts)eye.gaze.value.set(pose===2?-.02:pose===3?.025:0,pose===2?.012:-.018);
  }
  root.userData.pose=(pose,time)=>{if(pose!==lastPose){expression(pose);lastPose=pose;}for(const arm of arms){const s=arm.s;let elbow=[s*1.43,4.85,.01],wrist=[s*1.35,3.37,.05];if(s===1&&pose===1){elbow=[1.92,6.90,.1];wrist=[2.13+Math.sin(time*4)*.10,8.25,.30];}if(s===1&&pose===2){elbow=[1.52,5.05,.42];wrist=[.25,7.04,.56];}if(s===1&&pose===3){elbow=[1.91,5.65,.1];wrist=[2.7,6.30,.22];}limb(arm.upper,[s*1.19,6.34,0],elbow);limb(arm.lower,elbow,wrist);arm.g.position.set(...wrist);arm.g.rotation.z=s===1&&pose===1?-.08:0;arm.fingers.forEach((finger,i)=>{const wave=s===1&&pose===1,point=s===1&&pose===3&&i===0;finger.position.set(point?.31:-.135+i*.09,point?.04:wave?.28:-.25,.015);finger.rotation.z=point?-Math.PI/2:wave?(1.5-i)*.10:0;});}};
  root.userData.head=head;root.userData.pose(0,0);return root;
}
