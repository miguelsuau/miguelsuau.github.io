// Integrate only the two ImageGen moustache edits; preserve every other source pixel.
export function composeAvatarArtwork(original, edited) {
  const canvas=document.createElement('canvas');canvas.width=original.width;canvas.height=original.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(original,0,0);
  if(!edited)return canvas;
  for(const [x,y,width,height] of [[924,302,82,26],[1291,303,84,29]]){
    const patch=document.createElement('canvas');patch.width=width;patch.height=height;
    const pctx=patch.getContext('2d');pctx.drawImage(edited,x,y,width,height,0,0,width,height);
    const base=ctx.getImageData(x,y,width,height),next=pctx.getImageData(0,0,width,height);
    for(let i=0;i<base.data.length;i+=4){
      if(base.data[i]>135&&base.data[i]-next.data[i]>25&&next.data[i]<155&&next.data[i+1]<112&&next.data[i+2]<94&&next.data[i+3]>160){
        for(let c=0;c<3;c++)base.data[i+c]=next.data[i+c];
      }
    }
    ctx.putImageData(base,x,y);
  }
  return canvas;
}
