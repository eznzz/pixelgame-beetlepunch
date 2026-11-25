'use strict';
// TOP 10: server TXT when PHP is available; localStorage backup otherwise.
const RECORDS_KEY='stance-crimea.game-beetle.top10.v1';
function normalizeRecordName(value){if(typeof value!=='string')return '';const name=value.trim().replace(/ +/g,' ').toUpperCase();return /^[A-ZА-ЯЁ0-9 -]{1,16}$/u.test(name)?name:'';}
function rankRecords(rows){
  if(!Array.isArray(rows))return [];
  const ids=new Set();return rows.filter(r=>r&&typeof r.id==='string'&&/^[a-zA-Z0-9-]{8,80}$/.test(r.id)&&Number.isInteger(r.score)&&r.score>=0&&r.score<=999999&&typeof r.date==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(r.date)).map(r=>({id:r.id,score:r.score,date:r.date,name:normalizeRecordName(r.name)||'ИГРОК'})).sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).filter(r=>{if(ids.has(r.id))return false;ids.add(r.id);return true;}).slice(0,10);
}

class BeetleRecords {
  constructor(storage,request,changed=()=>{}){this.storage=storage;this.request=request;this.changed=changed;this.local=[];this.rows=[];this.mode='local';this.pending=false;this.seq=0;this.persisted=true;try{this.local=rankRecords(JSON.parse(storage.getItem(RECORDS_KEY)||'[]'));}catch(e){this.persisted=false;}this.rows=this.local;}
  notify(){this.changed();}
  store(r){this.local=rankRecords([...this.local,r]);try{this.storage.setItem(RECORDS_KEY,JSON.stringify(this.local));this.persisted=true;}catch(e){this.persisted=false;}}
  async refresh(){if(!this.request||this.pending)return;const seq=++this.seq;try{const rows=await this.request();if(seq!==this.seq)return;this.rows=rankRecords(rows);this.mode='server';}catch(e){if(seq!==this.seq)return;this.rows=this.local;this.mode='local';}this.notify();}
  async finish(r){this.store(r);const seq=++this.seq;this.pending=!!this.request;this.rows=this.local;this.mode='local';this.notify();if(!this.request)return;try{const rows=await this.request(r);if(seq!==this.seq)return;this.rows=rankRecords(rows);this.mode='server';}catch(e){if(seq!==this.seq)return;this.rows=this.local;this.mode='local';}finally{if(seq===this.seq){this.pending=false;this.notify();}}}
}
async function recordsRequest(record){const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),3500);try{const res=await fetch('records.php',{method:record?'POST':'GET',...(record?{headers:{'Content-Type':'application/json'},body:JSON.stringify(record),keepalive:true}:{}),cache:'no-store',signal:ac.signal});if(!res.ok)throw Error('records unavailable');const data=await res.json();if(!data||data.ok!==true||!Array.isArray(data.records))throw Error('invalid records');return data.records;}finally{clearTimeout(timer);}}
if(typeof module!=='undefined')module.exports={BeetleRecords,rankRecords,normalizeRecordName};
