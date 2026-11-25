// BEETLE BRAWL v2.7 — sky animation. Original v2.6 PNGs are never modified.
// Source motion equations adapted from STANCE CRIMEA MENU v3/script.js.
const skyAnimationCache=new WeakMap();
function skyCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function prepareAnimatedSky(source,maskImage,retroMode){
 const block={normal:1,retro:4,arcade:8}[retroMode]||4;
 let cache=skyAnimationCache.get(source);if(!cache){cache=new Map();skyAnimationCache.set(source,cache)}if(cache.has(block))return cache.get(block);
 const w=source.width,h=source.height,base=skyCanvas(w,h),g=base.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;g.drawImage(source,0,0);
 const original=g.getImageData(0,0,w,h),clean=g.getImageData(0,0,w,h),d=original.data,o=clean.data;
 const mask=skyCanvas(w,h),mg=mask.getContext('2d',{willReadFrequently:true});mg.drawImage(maskImage,0,0);const m=mg.getImageData(0,0,w,h).data;
 const bw=Math.ceil(w/block),bh=Math.ceil(Math.min(h,320)/block),labels=new Uint8Array(bw*bh),sky=new Uint8Array(bw*bh);
 for(let by=0;by<bh;by++)for(let bx=0;bx<bw;bx++){
   let counts=[0,0,0,0,0,0],n=0,allowed=0;
   for(let y=by*block;y<Math.min(h,(by+1)*block);y++)for(let x=bx*block;x<Math.min(w,(bx+1)*block);x++){
     const k=(y*w+x)*4;counts[Math.min(5,Math.round(m[k]/40))]++;allowed+=m[k+1]>127?1:0;n++;
   }
   let label=0;for(let i=1;i<=5;i++)if(counts[i]>counts[label]||(!label&&counts[i]>=Math.max(1,n*.18)))label=i;
   const k=by*bw+bx;sky[k]=allowed>=n*.75?1:0;labels[k]=sky[k]?label:0;
 }
 // Per-cloud bounded RGBA canvases, with exact pixels from the approved processed background.
 const bounds=Array.from({length:5},()=>[w,h,0,0]);
 for(let by=0;by<bh;by++)for(let bx=0;bx<bw;bx++){const n=labels[by*bw+bx];if(!n)continue;const b=bounds[n-1];b[0]=Math.min(b[0],bx*block);b[1]=Math.min(b[1],by*block);b[2]=Math.max(b[2],Math.min(w,(bx+1)*block));b[3]=Math.max(b[3],Math.min(h,(by+1)*block));}
 const clouds=bounds.map(([x,y,r,b])=>{const c=skyCanvas(Math.max(1,r-x),Math.max(1,b-y)),cg=c.getContext('2d'),im=cg.createImageData(c.width,c.height);return {x,y,c,cg,im};});
 const clip=skyCanvas(w,h),clipg=clip.getContext('2d');clipg.fillStyle='#fff';
 for(let by=0;by<bh;by++){
   // Local dark-sky samples from this row. Use a low median to reject stars and dither highlights.
   const bins=Array.from({length:Math.ceil(w/128)},()=>[]);
   for(let bx=0;bx<bw;bx++){const k=by*bw+bx;if(sky[k])clipg.fillRect(bx*block,by*block,block,block);if(!sky[k]||labels[k])continue;const i=(by*block*w+bx*block)*4;const r=d[i],gg=d[i+1],b=d[i+2];if(b>r*1.25&&b<150)bins[Math.floor(bx*block/128)].push([r,gg,b]);}
   const med=bins.map(a=>{a.sort((u,v)=>u[2]-v[2]);return a.length?a[Math.floor(a.length*.38)]:null});
   for(let bx=0;bx<bw;bx++){
     const n=labels[by*bw+bx];if(!n)continue;const cloud=clouds[n-1],bin=Math.floor(bx*block/128);let color=med[bin];for(let j=1;!color&&j<med.length;j++)color=med[bin-j]||med[bin+j];color=color||[7,16,40];
     for(let y=by*block;y<Math.min(h,(by+1)*block);y++)for(let x=bx*block;x<Math.min(w,(bx+1)*block);x++){
       const i=(y*w+x)*4,j=((y-cloud.y)*cloud.c.width+x-cloud.x)*4;cloud.im.data.set(d.subarray(i,i+4),j);o[i]=color[0];o[i+1]=color[1];o[i+2]=color[2];
     }
   }
 }
 g.putImageData(clean,0,0);clouds.forEach(c=>{c.cg.putImageData(c.im,0,0);delete c.im;delete c.cg;});
 const result={base,clouds,clip,fx:skyCanvas(w,h),block,w,h};cache.set(block,result);return result;
}
function drawAnimatedSky(ctx,source,maskImage,retroMode,ms,settings){
 if(!settings.clouds){ctx.drawImage(source,0,0);return;}
 const a=prepareAnimatedSky(source,maskImage,retroMode),t=Math.floor(ms/1000*12)/12,p=Math.max(2,a.block),{w,h}=a;
 const fg=a.fx.getContext('2d');fg.clearRect(0,0,w,h);fg.imageSmoothingEnabled=false;
 ctx.drawImage(a.base,0,0);
 // Offset relative to phase zero,
 // preserving the approved arrangement at t=0; snap to the active pixel grid.
 a.clouds.forEach((c,k)=>{const dx=settings.clouds?Math.round((Math.sin(t*.055+k*1.7)-Math.sin(k*1.7))*w*.018/p)*p:0;fg.drawImage(c.c,c.x+dx,c.y);});
 fg.globalCompositeOperation='destination-in';fg.drawImage(a.clip,0,0);fg.globalCompositeOperation='source-over';ctx.drawImage(a.fx,0,0);
}
