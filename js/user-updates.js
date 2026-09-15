// Nagorik Hub V9 — user update workflow.
// Demo storage: localStorage. Production: connect the same payload to Supabase/another DB.
(function(){
  const KEY='nagorikHub.userUpdates.v1';
  const form=document.getElementById('updateForm');
  const category=document.getElementById('updateCategory');
  const status=document.getElementById('submitStatus');
  if(!form||!category) return;

  const $=id=>document.getElementById(id);
  const getAll=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
  const saveAll=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const norm=s=>(s||'').toString().toLocaleLowerCase('bn-BD').replace(/[^\p{L}\p{N}]+/gu,'');
  const today=()=>new Date().toISOString().slice(0,10);

  function toggle(){
    const v=category.value;
    $('busFields').hidden=v!=='bus'; $('marketFields').hidden=v!=='market'; $('newInfoFields').hidden=v!=='new_info';
    document.querySelectorAll('.dynamic-fields input').forEach(x=>x.required=false);
    if(v==='bus'){ $('busFrom').required=true;$('busTo').required=true;$('busFare').required=true; }
    if(v==='market'){ $('marketProduct').required=true;$('marketPrice').required=true; }
    if(v==='new_info'){ $('infoTitle').required=true; }
  }
  category.addEventListener('change',toggle); toggle();

  function duplicateKey(d){
    if(d.category==='bus') return ['bus',norm(d.from),norm(d.to),norm(d.proposedValue)].join('|');
    if(d.category==='market') return ['market',norm(d.product),norm(d.proposedValue),norm(d.location)].join('|');
    return ['new_info',norm(d.title),norm(d.location)].join('|');
  }

  async function aiCheck(payload, reportCount){
    const endpoint=(window.NAGORIK_AI_VERIFY_ENDPOINT||'').trim();
    if(!endpoint) return {mode:'demo',flag:false,confidence:0,reason:'AI endpoint configured নয় — Admin review-এর জন্য pending রাখা হয়েছে।'};
    try{
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission:payload,reportCount})});
      if(!r.ok) throw new Error('AI verification failed');
      return await r.json();
    }catch(err){return {mode:'error',flag:false,confidence:0,reason:'AI service unavailable — submission pending রাখা হয়েছে।'};}
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const v=category.value;
    if(!v){status.hidden=false;status.className='submit-status bad';status.textContent='Category নির্বাচন করুন।';return;}
    const base={id:'NH-'+Date.now().toString(36).toUpperCase(),category:v,reporterName:$('reporterName').value.trim(),details:$('details').value.trim(),createdAt:new Date().toISOString(),status:'pending_ai',aiFlag:false,adminStatus:'pending'};
    if(v==='bus') Object.assign(base,{from:$('busFrom').value.trim(),to:$('busTo').value.trim(),proposedValue:$('busFare').value.trim(),routeInfo:$('busRouteInfo').value.trim(),targetType:'bus_fare'});
    if(v==='market') Object.assign(base,{product:$('marketProduct').value.trim(),proposedValue:$('marketPrice').value.trim(),location:$('marketLocation').value.trim(),reportedDate:$('marketDate').value||today(),targetType:'market_price'});
    if(v==='new_info') Object.assign(base,{title:$('infoTitle').value.trim(),location:$('infoLocation').value.trim(),targetType:'new_info'});

    const all=getAll(); const key=duplicateKey(base); const reportCount=all.filter(x=>duplicateKey(x)===key).length+1;
    status.hidden=false;status.className='submit-status pending';status.innerHTML='🤖 AI verification চলছে… online source + আগের user reports check করা হচ্ছে।';
    const ai=await aiCheck(base,reportCount);
    base.reportCount=reportCount;base.aiFlag=ai.flag===true;base.aiConfidence=Number(ai.confidence||0);base.aiReason=ai.reason||'';base.aiSources=ai.sources||[];base.status=base.aiFlag?'ai_green':'pending_admin';
    all.push(base);saveAll(all);
    status.className=base.aiFlag?'submit-status good':'submit-status pending';
    status.innerHTML=base.aiFlag?`🟢 <b>AI Green Flag</b> — ${reportCount}টি matching report পাওয়া গেছে। Confidence: ${base.aiConfidence}%. এখন Admin final verification করবে।`:`🟡 <b>Pending Review</b> — ${reportCount}টি matching report পাওয়া গেছে। ${base.aiReason}`;
    form.reset();toggle();
  });
})();
