const assert=require('node:assert/strict');
const {BeetleRecords,rankRecords,normalizeRecordName}=require('../records.js');
const date='2026-11-25T10:00:00.000Z';
assert.equal(normalizeRecordName(' Алекс  42 '),'АЛЕКС 42');
for(const x of ['', '   ', 'name@', 'a\tb', 'A'.repeat(17)])assert.equal(normalizeRecordName(x),'');
const rows=Array.from({length:13},(_,i)=>({id:'test-run-'+i,score:i*100,date,name:'Игрок '+i}));
assert.equal(rankRecords(rows).length,10);assert.equal(rankRecords(rows)[0].name,'ИГРОК 12');
assert.equal(rankRecords([{id:'old-run-1',score:10,date}])[0].name,'ИГРОК');
(async()=>{let value;const storage={getItem:()=>value,setItem:(k,v)=>{value=v;}};const record=rows[12];const api=new BeetleRecords(storage,async r=>r?[r]:[]);await api.finish(record);assert.equal(api.rows[0].name,'ИГРОК 12');assert.equal(api.mode,'server');await api.refresh();assert.deepEqual(api.rows,[]);const offline=new BeetleRecords(storage,null);assert.equal(offline.rows[0].name,'ИГРОК 12');console.log('PASS: names, ranking, legacy, server reset, local fallback.');})();
