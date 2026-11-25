// Background-only retro renderer. Original PNGs and approved color balance remain untouched.
const retroCache = new WeakMap();
function retroBackground(source, layer, mode) {
  const options = {normal:[1,0], retro:[4,64], arcade:[8,32]};
  const [block, limit] = options[mode] || options.normal;
  if (block===1) return source;
  let cache=retroCache.get(source); if(!cache){cache=new Map();retroCache.set(source,cache);}
  if(cache.has(mode)) return cache.get(mode);
  const w=source.width,h=source.height, ox=layer.x%block,oy=layer.y%block;
  const pad=document.createElement('canvas');pad.width=Math.ceil((w+ox)/block)*block;pad.height=Math.ceil((h+oy)/block)*block;
  const pg=pad.getContext('2d');pg.drawImage(source,ox,oy);
  // Extend opaque edges by the partial block, avoiding dark seams at layer boundaries.
  if(oy && layer.file.endsWith('plaza.png'))pg.drawImage(source,0,0,w,1,ox,0,w,oy);
  if(layer.file.endsWith('background.png')){const tail=pad.height-h-oy;if(tail>0)pg.drawImage(source,0,h-1,w,1,ox,oy+h,w,tail);}
  const small=document.createElement('canvas');small.width=pad.width/block;small.height=pad.height/block;
  const sg=small.getContext('2d',{willReadFrequently:true});sg.imageSmoothingEnabled=true;sg.imageSmoothingQuality='high';sg.drawImage(pad,0,0,small.width,small.height);
  const im=sg.getImageData(0,0,small.width,small.height), d=im.data, hist=new Map();
  for(let i=0;i<d.length;i+=4){if(d[i+3]<128)continue;const key=((d[i]>>3)<<10)|((d[i+1]>>3)<<5)|(d[i+2]>>3);let p=hist.get(key);if(!p){p={r:0,g:0,b:0,n:0,key};hist.set(key,p);}p.r+=d[i];p.g+=d[i+1];p.b+=d[i+2];p.n++;}
  const entries=[...hist.values()];for(const p of entries){p.r/=p.n;p.g/=p.n;p.b/=p.n;}
  function describe(items){let n=0,min=[255,255,255],max=[0,0,0];for(const p of items){n+=p.n;[p.r,p.g,p.b].forEach((v,j)=>{min[j]=Math.min(min[j],v);max[j]=Math.max(max[j],v);});}const ranges=max.map((v,j)=>v-min[j]);const axis=ranges.indexOf(Math.max(...ranges));return {items,n,axis,score:items.length>1?ranges[axis]*Math.sqrt(n):0};}
  let boxes=entries.length?[describe(entries)]:[];
  while(boxes.length<limit){boxes.sort((a,b)=>b.score-a.score);const box=boxes.shift();if(!box||!box.score){if(box)boxes.unshift(box);break;}const channel=['r','g','b'][box.axis];box.items.sort((a,b)=>a[channel]-b[channel]);let sum=0,j=0;while(j<box.items.length-1&&sum<box.n/2){sum+=box.items[j++].n;}j=Math.max(1,Math.min(j,box.items.length-1));boxes.push(describe(box.items.slice(0,j)),describe(box.items.slice(j)));}
  const palette=boxes.map(b=>['r','g','b'].map(ch=>Math.round(b.items.reduce((a,p)=>a+p[ch]*p.n,0)/b.n)));
  const lut=new Map();for(const p of entries){let best=Infinity,c=palette[0];for(const q of palette){const dist=(p.r-q[0])**2+(p.g-q[1])**2+(p.b-q[2])**2;if(dist<best){best=dist;c=q;}}lut.set(p.key,c);}
  for(let i=0;i<d.length;i+=4){if(d[i+3]<128){d[i]=d[i+1]=d[i+2]=d[i+3]=0;continue;}const key=((d[i]>>3)<<10)|((d[i+1]>>3)<<5)|(d[i+2]>>3),c=lut.get(key);if(c){d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];}d[i+3]=255;}
  sg.putImageData(im,0,0);const out=document.createElement('canvas');out.width=w;out.height=h;const g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(small,-ox,-oy,pad.width,pad.height);cache.set(mode,out);return out;
}
