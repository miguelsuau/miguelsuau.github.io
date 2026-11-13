/* The original NFT-style pose sprites, extruded into real voxel geometry. */
(() => {
  'use strict';
  const frame=document.querySelector('[data-avatar]');
  if(!frame)return;
  const sprite=frame.querySelector('.avatar-sprite');
  const canvas=document.createElement('canvas');
  canvas.className='avatar-voxel';canvas.tabIndex=0;
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','3D avatar of Miguel Suau. Drag or use left and right arrow keys to rotate.');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false});
  if(!gl)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const mul=(a,b)=>{const c=new Array(16).fill(0);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)c[col*4+row]+=a[k*4+row]*b[col*4+k];return c;};
  const T=(x,y,z)=>{const m=I();m[12]=x;m[13]=y;m[14]=z;return m;};
  const RY=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];};
  const RX=a=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];};
  const projection=aspect=>{const h=132,w=h*aspect;return[2/w,0,0,0,0,2/h,0,0,0,0,-2/400,0,0,0,0,1];};
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  const image=new Image();
  image.onload=()=>{
    const meshes=[];
    try{
      const program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,`
        attribute vec3 position; attribute vec3 normal; attribute vec3 color;
        uniform mat4 mvp; uniform mat4 model;
        varying vec3 shade;
        void main(){vec3 n=normalize(mat3(model)*normal);
          float light=.48+.52*max(0.,dot(n,normalize(vec3(-.25,.35,1.))));
          shade=color*light;gl_Position=mvp*vec4(position,1.);}
      `));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`
        precision mediump float; varying vec3 shade;
        void main(){gl_FragColor=vec4(shade,1.);}
      `));
      gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
      const attributes=['position','normal','color'].map(name=>gl.getAttribLocation(program,name));
      const uMvp=gl.getUniformLocation(program,'mvp'),uModel=gl.getUniformLocation(program,'model');
      const sample=document.createElement('canvas');sample.width=96;sample.height=256;
      const context=sample.getContext('2d',{willReadFrequently:true});context.imageSmoothingEnabled=false;
      for(let pose=0;pose<4;pose++){
        context.clearRect(0,0,96,256);
        context.drawImage(image,pose*image.width/4,0,image.width/4,image.height,0,0,96,256);
        const pixels=context.getImageData(0,0,96,256).data;
        const vertices=[];
        const opaque=(x,y)=>x>=0&&x<96&&y>=0&&y<256&&pixels[(y*96+x)*4+3]>240;
        const depth=(x,y)=>y<103&&x>12&&x<84?13:y<170?8:5;
        function quad(points,normal,color){for(const index of [0,1,2,0,2,3])vertices.push(...points[index],...normal,...color);}
        for(let y=0;y<256;y++)for(let x=0;x<96;x++){
          if(!opaque(x,y))continue;
          const p=(y*96+x)*4,color=[pixels[p]/255,pixels[p+1]/255,pixels[p+2]/255];
          const l=(x-48)*.5,r=l+.5,t=(128-y)*.5,b=t-.5,z=-depth(x,y)*.5;
          // The front keeps the source artwork exactly; the sides add physical thickness.
          quad([[l,b,0],[r,b,0],[r,t,0],[l,t,0]],[0,0,1],color);
          quad([[r,b,z],[l,b,z],[l,t,z],[r,t,z]],[0,0,-1],color);
          if(!opaque(x-1,y))quad([[l,b,z],[l,b,0],[l,t,0],[l,t,z]],[-1,0,0],color);
          if(!opaque(x+1,y))quad([[r,b,0],[r,b,z],[r,t,z],[r,t,0]],[1,0,0],color);
          if(!opaque(x,y-1))quad([[l,t,0],[r,t,0],[r,t,z],[l,t,z]],[0,1,0],color);
          if(!opaque(x,y+1))quad([[l,b,z],[r,b,z],[r,b,0],[l,b,0]],[0,-1,0],color);
        }
        const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
        meshes.push({buffer,count:vertices.length/9});
      }
      let yaw=null,pitch=0,drag=null,raf=0,lastFrame=0;
      function draw(now=performance.now()){
        raf=0;if(document.hidden)return;
        if(!motion.matches&&now-lastFrame<40){raf=requestAnimationFrame(draw);return;}
        lastFrame=now;
        const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
        const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
        const angle=yaw===null?.10+(motion.matches?0:Math.sin(now*.00035)*.035):yaw;
        const model=mul(RY(angle),RX(pitch));
        const mvp=mul(projection(w/h),mul(T(0,0,-40),model));
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        const pose=Math.min(3,Math.max(0,Number(sprite.dataset.pose||0))),mesh=meshes[pose];
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
        attributes.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,i*12);});
        gl.uniformMatrix4fv(uMvp,false,new Float32Array(mvp));gl.uniformMatrix4fv(uModel,false,new Float32Array(model));
        gl.drawArrays(gl.TRIANGLES,0,mesh.count);canvas.dataset.pose=String(pose);canvas.dataset.yaw=angle.toFixed(3);
        if(!motion.matches)raf=requestAnimationFrame(draw);
      }
      const requestDraw=()=>{if(!raf)raf=requestAnimationFrame(draw);};
      canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};if(yaw===null)yaw=.1;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});
      canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.012;pitch=Math.max(-.3,Math.min(.3,pitch+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY};requestDraw();});
      const release=()=>{drag=null;canvas.style.cursor='grab';};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
      canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();yaw=(yaw===null?.1:yaw)+(e.key==='ArrowLeft'?-.15:.15);requestDraw();});
      new MutationObserver(requestDraw).observe(sprite,{attributes:true,attributeFilter:['data-pose']});
      new ResizeObserver(requestDraw).observe(canvas);motion.addEventListener('change',requestDraw);document.addEventListener('visibilitychange',requestDraw);
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);frame.classList.remove('has-voxel');});
      frame.appendChild(canvas);frame.classList.add('has-voxel');frame.dataset.voxelState='ready';requestDraw();
    }catch(error){canvas.remove();frame.classList.remove('has-voxel');frame.dataset.voxelState='fallback';}
  };
  image.src=frame.dataset.sprite;
})();
