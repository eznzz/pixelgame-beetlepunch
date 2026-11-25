// SCENE v2.1: runtime-only background correction; cached per source and settings.
const balanceCache=new WeakMap();
function correctedBackground(img,layer,tone,config){
  const key=JSON.stringify(tone),prev=balanceCache.get(img);if(prev&&prev.key===key)return prev.canvas;
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;g.drawImage(img,0,0);const data=g.getImageData(0,0,c.width,c.height),d=data.data;
  const b=tone.brightness/100,k=tone.contrast/100,s=tone.saturation/100,w=tone.warmReduction/100,p=config.backgroundContrastPivot,m=config.moonProtection;
  for(let i=0;i<d.length;i+=4){if(d[i+3]===0)continue;const r=d[i],gr=d[i+1],bl=d[i+2],l=.2126*r+.7152*gr+.0722*bl;const n=i/4,x=n%c.width+layer.x,y=Math.floor(n/c.width)+layer.y;
    // Lower contrast around a dark pivot, so the night floor does not turn gray.
    // Warm highlights are subdued selectively; the moon and its halo are protected.
    const warm=y>300?Math.min(1,Math.max(0,(r-bl-12)/85))*Math.min(1,Math.max(0,(l-25)/70)):0;
    const moon=layer.y===0?Math.max(0,Math.min(1,(m.radius-Math.hypot(x-m.x,y-m.y))/35)):0;
    const dim=1-w*warm;
    for(let j=0;j<3;j++){const original=d[i+j],sat=l+(original-l)*s;const v=((sat-p)*k+p)*b*dim;d[i+j]=v*(1-moon)+original*moon;}
  }g.putImageData(data,0,0);balanceCache.set(img,{key,canvas:c});return c;
}
