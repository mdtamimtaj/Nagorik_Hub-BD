// Nagorik Hub — local AI + Supabase user update workflow.
(function(){
  const form=document.getElementById('updateForm'), category=document.getElementById('updateCategory'), status=document.getElementById('submitStatus');
  if(!form||!category)return; const $=id=>document.getElementById(id);
  const locationAPI=window.NagorikLocation||{};
  const normText=locationAPI.canonicalText||((s)=>(s||'').toString().toLocaleLowerCase('bn-BD').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim());
  const normLocation=locationAPI.normalizeLocation||normText;
  const normRoute=locationAPI.normalizeRoute||((a,b)=>normLocation(a)+'->'+normLocation(b));
  const today=()=>new Date().toISOString().slice(0,10); let enginePromise=null;
  function toggle(){const v=category.value;if($('busFields'))$('busFields').hidden=v!=='bus';if($('marketFields'))$('marketFields').hidden=v!=='market';if($('newInfoFields'))$('newInfoFields').hidden=v!=='new_info';document.querySelectorAll('.dynamic-fields input').forEach(x=>x.required=false);if(v==='bus'){$('busFrom').required=true;$('busTo').required=true;$('busFare').required=true;}if(v==='market'){$('marketProduct').required=true;$('marketPrice').required=true;}if(v==='new_info')$('infoTitle').required=true;}
  category.addEventListener('change',toggle);toggle();
  async function db(){if(window.supabaseClient)return window.supabaseClient;if(!window.supabase||!window.NAGORIK_SUPABASE_URL||!window.NAGORIK_SUPABASE_ANON_KEY)return null;window.supabaseClient=window.supabase.createClient(window.NAGORIK_SUPABASE_URL,window.NAGORIK_SUPABASE_ANON_KEY);return window.supabaseClient;}
  async function localAI(p,count){if(!navigator.gpu)return{mode:'no-webgpu',flag:false,confidence:0,reason:'WebGPU নেই; নিরাপদভাবে Admin review-তে পাঠানো হয়েছে।',sources:[]};try{if(!enginePromise){const{CreateMLCEngine}=await import('https://esm.run/@mlc-ai/web-llm');enginePromise=CreateMLCEngine('Llama-3.2-1B-Instruct-q4f32_1-MLC',{initProgressCallback:x=>{if(status&&x?.text)status.textContent='🤖 Local AI: '+x.text;}});}const e=await enginePromise,r=await e.chat.completions.create({messages:[{role:'system',content:'Return valid JSON only.'},{role:'user',content:`Assess this Bangladesh citizen report conservatively. Green means only internally plausible, never officially verified. Return {"flag":true|false,"confidence":0-100,"reason":"short Bengali reason"}. Report count ${count}. Data: ${JSON.stringify(p)}`}],temperature:.1,max_tokens:160});const m=(r?.choices?.[0]?.message?.content||'').match(/\{[\s\S]*\}/);if(!m)throw Error();const x=JSON.parse(m[0]);return{mode:'webllm-local',flag:x.flag===true,confidence:Math.max(0,Math.min(100,Number(x.confidence)||0)),reason:String(x.reason||''),sources:[]};}catch(e){return{mode:'local-ai-error',flag:false,confidence:0,reason:'Local AI চালু করা যায়নি; Admin review-তে পাঠানো হয়েছে।',sources:[]};}}
  form.addEventListener('submit',async e=>{e.preventDefault();const v=category.value;if(!v){status.hidden=false;status.textContent='Category নির্বাচন করুন।';return;}const p={id:'NH-'+Date.now().toString(36).toUpperCase(),category:v,reporterName:$('reporterName')?.value.trim()||'',details:$('details')?.value.trim()||'',createdAt:new Date().toISOString(),status:'pending_ai',aiFlag:false,adminStatus:'pending'};
    if(v==='bus')Object.assign(p,{from:$('busFrom').value.trim(),to:$('busTo').value.trim(),proposedValue:$('busFare').value.trim(),routeInfo:$('busRouteInfo')?.value.trim()||'',targetType:'bus_fare',normalizedFrom:normLocation($('busFrom').value),normalizedTo:normLocation($('busTo').value),routeKey:normRoute($('busFrom').value,$('busTo').value)});
    if(v==='market')Object.assign(p,{product:$('marketProduct').value.trim(),proposedValue:$('marketPrice').value.trim(),location:$('marketLocation')?.value.trim()||'',reportedDate:$('marketDate')?.value||today(),targetType:'market_price',normalizedLocation:normLocation($('marketLocation').value),normalizedProduct:normText($('marketProduct').value)});
    if(v==='new_info')Object.assign(p,{title:$('infoTitle').value.trim(),location:$('infoLocation')?.value.trim()||'',targetType:'new_info',normalizedLocation:normLocation($('infoLocation').value),normalizedTitle:normText($('infoTitle').value)});
    status.hidden=false;status.innerHTML='🤖 Local AI verification চলছে…';const d=await db();if(!d){status.textContent='Database connection পাওয়া যায়নি।';return;}
    const{data:old}=await d.from('user_updates').select('*').eq('category',v).limit(500); const rows=old||[];
    let duplicateCount=0, conflict=false;
    if(v==='bus'){
      const route=p.routeKey;
      rows.forEach(x=>{const xr=normRoute(x.from||'',x.to||'');if(xr===route){const sameFare=normText(x.proposed_value||'')===normText(p.proposedValue);if(sameFare)duplicateCount++;else conflict=true;}});
    }else if(v==='market'){
      const key=[normText(p.product),normText(p.proposedValue),p.normalizedLocation].join('|');
      rows.forEach(x=>{const xkey=[normText(x.product),normText(x.proposed_value),normLocation(x.location||'')].join('|');if(xkey===key)duplicateCount++;});
    }else{
      const key=[normText(p.title),p.normalizedLocation].join('|');
      rows.forEach(x=>{const xkey=[normText(x.title),normLocation(x.location||'')].join('|');if(xkey===key)duplicateCount++;});
    }
    const count=duplicateCount+1; const ai=await localAI(p,count); p.reportCount=count;p.aiFlag=ai.flag;p.aiConfidence=ai.confidence;p.aiReason=ai.reason;p.aiSources=ai.sources;
    if(conflict){p.aiFlag=false;p.aiConfidence=100;p.aiReason='⚠️ একই normalized route-এ আগের report-এর ভাড়া আলাদা। এটি conflict হিসেবে Admin verification-এ পাঠানো হয়েছে।';}
    else if(duplicateCount>0){p.aiFlag=false;p.aiConfidence=100;p.aiReason='ℹ️ একই তথ্যের সম্ভাব্য duplicate report পাওয়া গেছে। Admin review করবে।';}
    p.status=p.aiFlag?'ai_green':'pending_admin';
    const row={id:p.id,category:p.category,reporter_name:p.reporterName,details:p.details,created_at:p.createdAt,status:p.status,ai_flag:p.aiFlag,ai_confidence:p.aiConfidence,ai_reason:p.aiReason,ai_sources:p.aiSources,report_count:p.reportCount,admin_status:'pending',from:p.from||null,to:p.to||null,proposed_value:p.proposedValue||null,route_info:p.routeInfo||null,product:p.product||null,location:p.location||null,reported_date:p.reportedDate||null,title:p.title||null,target_type:p.targetType||null};
    const{error}=await d.from('user_updates').insert(row);if(error){status.textContent='Save হয়নি: '+error.message;return;}status.innerHTML=p.aiFlag?`🟢 Local AI Green Flag — ${p.aiConfidence}%<br>Admin final verification করবে।`:`🟡 Pending Admin Review<br>${p.aiReason}`;form.reset();toggle();
  });
})();
