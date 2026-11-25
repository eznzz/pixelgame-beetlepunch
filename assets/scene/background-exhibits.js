// Decorative exhibits are composited into the static background, not gameplay sprites.
const exhibitCache = new WeakMap();
function backgroundWithExhibits(source, layer, mode, decoration, tone, baseline, settings) {
  if (!settings.enabled || !decoration || !settings.appliesTo.some(k=>layer.file.endsWith('/'+k+'.png'))) return source;
  const key=JSON.stringify([mode,tone]); let cache=exhibitCache.get(source);
  if(!cache){cache=new Map();exhibitCache.set(source,cache);} if(cache.has(key))return cache.get(key);
  const out=document.createElement('canvas');out.width=source.width;out.height=source.height;
  const g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(source,0,0);
  const b=tone||baseline;const factor=(b.brightness/baseline.brightness)*(1-(b.warmReduction-baseline.warmReduction)/200);
  const contrast=b.contrast/baseline.contrast,saturation=b.saturation/baseline.saturation;
  if(factor!==1||contrast!==1||saturation!==1)g.filter=`brightness(${factor}) contrast(${contrast}) saturate(${saturation})`;
  let art=decoration;if(mode==='arcade'){const s=document.createElement('canvas');s.width=decoration.width/8;s.height=decoration.height/8;const sg=s.getContext('2d');sg.imageSmoothingEnabled=false;sg.drawImage(decoration,0,0,s.width,s.height);art=s;}
  g.drawImage(art,settings.x-layer.x,settings.y-layer.y,decoration.width,decoration.height);g.filter='none';cache.set(key,out);return out;
}
