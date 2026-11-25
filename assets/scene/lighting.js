// SCENE v2.1: per-object tone and night tint on a scratch canvas, alpha preserved.
const litCanvas=document.createElement('canvas'), litCtx=litCanvas.getContext('2d');
function drawLit(ctx,img,sx,sy,sw,sh,dx,dy,dw,dh,worldX,strength,lighting,tone=null){
  if(strength<=0&&!tone){ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);return;}
  if(litCanvas.width!==sw||litCanvas.height!==sh){litCanvas.width=sw;litCanvas.height=sh;}
  litCtx.clearRect(0,0,sw,sh);litCtx.globalCompositeOperation='source-over';litCtx.globalAlpha=1;litCtx.imageSmoothingEnabled=false;litCtx.filter=tone?`contrast(${tone.contrast}%) brightness(${tone.brightness}%) saturate(${tone.saturation}%)`:'none';litCtx.drawImage(img,sx,sy,sw,sh,0,0,sw,sh);litCtx.filter='none';
  const warm=Math.max(...lighting.lampsX.map(x=>Math.exp(-Math.pow((worldX-x)/lighting.lampRadius,2))));
  litCtx.globalCompositeOperation='source-atop';litCtx.globalAlpha=strength*(1-0.52*warm);litCtx.fillStyle=lighting.ambient;litCtx.fillRect(0,0,sw,sh);
  litCtx.globalAlpha=strength*warm*0.22;litCtx.fillStyle=lighting.lampColor;litCtx.fillRect(0,0,sw,sh);
  litCtx.globalAlpha=1;litCtx.globalCompositeOperation='source-over';ctx.drawImage(litCanvas,dx,dy,dw,dh);
}
