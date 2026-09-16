// Nagorik Hub — instant local verification + normalized duplicate/conflict detection.
(function(){
  const form=document.getElementById('updateForm'), category=document.getElementById('updateCategory'), status=document.getElementById('submitStatus');
  if(!form||!category)return;
  const $=id=>document.getElementById(id);
  const locationAPI=window.NagorikLocation||{};
  const normText=locationAPI.canonicalText||((s)=>(s||'').toString().normalize('NFKC').toLocaleLowerCase('bn-BD').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim());
  const normLocation=locationAPI.normalizeLocation||normText;
  const normRoute=locationAPI.normalizeRoute||((a,b)=>normLocation(a)+'->'+normLocation(b));
  const today=()=>new Date().toISOString().slice(0,10);
  function toggle(){const v=category.value;if($('busFields'))$('busFields').hidden=v!=='bus';if($('marketFields'))$('marketFields').hidden=v!=='market';if($('newInfoFields'))$('newInfoFields').hidden=v!=='new_info';document.querySelectorAll('.dynamic-fields input').forEach(x=>x.required=false);if(v==='bus'){$('busFrom').required=true;$('busTo').required=true;$('busFare').required=true;}if(v==='market'){$('marketProduct').required=true;$('marketPrice').required=true;}if(v==='new_info')$('infoTitle').required=true;}
  category.addEventListener('change',toggle);toggle();
  async function db(){if(window.supabaseClient)return window.supabaseClient;if(!window.supabase||!window.NAGORIK_SUPABASE_URL||!window.NAGORIK_SUPABASE_ANON_KEY)return null;window.supabaseClient=window.supabase.createClient(window.NAGORIK_SUPABASE_URL,window.NAGORIK_SUPABASE_ANON_KEY);return window.supabaseClient;}
  // Local AI Lite: instant, offline, deterministic. No model/cache download is required.
  function localAI(p,rows,duplicateCount,conflict){
    if(conflict)return{flag:false,confidence:100,reason:'⚠️ একই normalized route-এ ভিন্ন ভাড়া পাওয়া গেছে। Admin evidence যাচাই করবে।',conflict:true};
    if(duplicateCount)return{flag:false,confidence:100,reason:'ℹ️ একই normalized তথ্য আগে জমা হয়েছে। Duplicate হিসেবে Admin review করবে।',duplicate:true};
    if(p.category==='bus'&&(!Number.isFinite(Number(p.proposedValue))||Number(p.proposedValue)<=0))return{flag:false,confidence:100,reason:'ভাড়া সঠিক সংখ্যা নয়; Admin review প্রয়োজন।'};
    return{flag:true,confidence:p.category==='bus'?88:82,reason:'স্থান/তথ্য local rule check পাস করেছে; Admin final verification করবে.'};
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const v=category.value;if(!v){status.hidden=false;status.textContent='Category নির্বাচন করুন।';return;}
    const p={id:'NH-'+Date.now().toString(36).toUpperCase(),category:v,reporterName:$('reporterName')?.value.trim()||'',details:$('details')?.value.trim()||'',createdAt:new Date().toISOString(),status:'pending_admin',aiFlag:false,adminStatus:'pending'};
    if(v==='bus')Object.assign(p,{from:$('busFrom').value.trim(),to:$('busTo').value.trim(),proposedValue:$('busFare').value.trim(),routeInfo:$('busRouteInfo')?.value.trim()||'',targetType:'bus_fare',normalizedFrom:normLocation($('busFrom').value),normalizedTo:normLocation($('busTo').value),routeKey:normRoute($('busFrom').value,$('busTo').value)});
    if(v==='market')Object.assign(p,{product:$('marketProduct').value.trim(),proposedValue:$('marketPrice').value.trim(),location:$('marketLocation')?.value.trim()||'',reportedDate:$('marketDate')?.value||today(),targetType:'market_price',normalizedLocation:normLocation($('marketLocation').value),normalizedProduct:normText($('marketProduct').value)});
    if(v==='new_info')Object.assign(p,{title:$('infoTitle').value.trim(),location:$('infoLocation')?.value.trim()||'',targetType:'new_info',normalizedLocation:normLocation($('infoLocation').value),normalizedTitle:normText($('infoTitle').value)});
    status.hidden=false;status.textContent='🔎 Local check চলছে…';
    const d=await db();if(!d){status.textContent='Database connection পাওয়া যায়নি।';return;}
    const {data:old,error:readError}=await d.from('user_updates').select('*').eq('category',v).limit(500);if(readError){status.textContent='তথ্য যাচাই করা যায়নি: '+readError.message;return;}
    const rows=old||[];let duplicateCount=0,conflict=false;
    if(v==='bus'){
      rows.forEach(x=>{if(normRoute(x.from||'',x.to||'')===p.routeKey){if(normText(x.proposed_value||'')===normText(p.proposedValue))duplicateCount++;else conflict=true;}});
    }else if(v==='market'){
      const key=[normText(p.product),normText(p.proposedValue),p.normalizedLocation].join('|');rows.forEach(x=>{if([normText(x.product),normText(x.proposed_value),normLocation(x.location||'')].join('|')===key)duplicateCount++;});
    }else{
      const key=[normText(p.title),p.normalizedLocation].join('|');rows.forEach(x=>{if([normText(x.title),normLocation(x.location||'')].join('|')===key)duplicateCount++;});
    }
    const ai=localAI(p,rows,duplicateCount,conflict);p.reportCount=duplicateCount+1;p.aiFlag=ai.flag;p.aiConfidence=ai.confidence;p.aiReason=ai.reason;p.aiSources=['local-rule-engine'];p.status='pending_admin';
    const row={id:p.id,category:p.category,reporter_name:p.reporterName,details:p.details,created_at:p.createdAt,status:p.status,ai_flag:p.aiFlag,ai_confidence:p.aiConfidence,ai_reason:p.aiReason,ai_sources:p.aiSources,report_count:p.reportCount,admin_status:'pending',from:p.from||null,to:p.to||null,proposed_value:p.proposedValue||null,route_info:p.routeInfo||null,product:p.product||null,location:p.location||null,reported_date:p.reportedDate||null,title:p.title||null,target_type:p.targetType||null};
    const{error}=await d.from('user_updates').insert(row);if(error){status.textContent='Save হয়নি: '+error.message;return;}
    status.innerHTML=ai.conflict?'🔴 Route conflict detected<br>Admin evidence যাচাই করবে।':ai.duplicate?'🟡 Duplicate detected<br>Admin review করবে।':'🟢 Local check complete<br>Admin final verification করবে।';form.reset();toggle();
  });
})();