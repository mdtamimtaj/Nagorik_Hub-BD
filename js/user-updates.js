// Nagorik Hub — user update workflow
// Uses the current public.user_updates schema and location normalization.
(function(){
  const form=document.getElementById('updateForm'), category=document.getElementById('updateCategory'), status=document.getElementById('submitStatus');
  if(!form||!category)return;
  const $=id=>document.getElementById(id);
  const api=window.NagorikLocation||{};
  const cleanText=api.canonicalText||((s)=>String(s||'').normalize('NFKC').toLocaleLowerCase('bn-BD').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim());
  const normLocation=api.normalizeLocation||cleanText;
  const normRoute=api.normalizeRoute||((a,b)=>normLocation(a)+'->'+normLocation(b));
  const today=()=>new Date().toISOString().slice(0,10);

  function toggle(){
    const v=category.value;
    if($('busFields'))$('busFields').hidden=v!=='bus';
    if($('marketFields'))$('marketFields').hidden=v!=='market';
    if($('newInfoFields'))$('newInfoFields').hidden=v!=='new_info';
    document.querySelectorAll('.dynamic-fields input').forEach(x=>x.required=false);
    if(v==='bus'){ $('busFrom').required=true; $('busTo').required=true; $('busFare').required=true; }
    if(v==='market'){ $('marketProduct').required=true; $('marketPrice').required=true; }
    if(v==='new_info')$('infoTitle').required=true;
  }
  category.addEventListener('change',toggle); toggle();

  async function db(){
    if(window.supabaseClient)return window.supabaseClient;
    if(!window.supabase||!window.NAGORIK_SUPABASE_URL||!window.NAGORIK_SUPABASE_ANON_KEY)return null;
    window.supabaseClient=window.supabase.createClient(window.NAGORIK_SUPABASE_URL,window.NAGORIK_SUPABASE_ANON_KEY);
    return window.supabaseClient;
  }

  // Fast, free browser-side plausibility check. No model download or paid API.
  function localCheck(p, rows){
    let duplicate=false, conflict=false;
    if(p.category==='bus'){
      rows.forEach(x=>{
        if(normRoute(x.from||'',x.to||'')===p.routeKey){
          if(cleanText(x.proposed_value||'')===cleanText(p.proposedValue||'')) duplicate=true;
          else if(x.proposed_value!==null && x.proposed_value!==undefined && String(x.proposed_value)!=='') conflict=true;
        }
      });
    } else if(p.category==='market'){
      rows.forEach(x=>{
        if(cleanText(x.product||'')===p.normalizedProduct && normLocation(x.location||'')===p.normalizedLocation && cleanText(x.proposed_value||'')===cleanText(p.proposedValue||'')) duplicate=true;
      });
    } else {
      rows.forEach(x=>{
        if(cleanText(x.title||'')===p.normalizedTitle && normLocation(x.location||'')===p.normalizedLocation) duplicate=true;
      });
    }
    if(conflict)return {flag:false,confidence:100,reason:'⚠️ একই normalized route-এ ভিন্ন ভাড়া পাওয়া গেছে। Admin verification প্রয়োজন।'};
    if(duplicate)return {flag:false,confidence:100,reason:'ℹ️ একই তথ্যের সম্ভাব্য duplicate report পাওয়া গেছে। Admin review করবে।'};
    return {flag:true,confidence:90,reason:'🟢 তথ্যের format ও location normalization প্রাথমিকভাবে ঠিক আছে। Admin final verification করবে।'};
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const v=category.value;
    status.hidden=false;
    status.textContent='🔎 তথ্য পরীক্ষা করা হচ্ছে…';
    const d=await db();
    if(!d){status.textContent='Database connection পাওয়া যায়নি।';return;}

    const p={category:v,reporterName:$('reporterName')?.value.trim()||'',details:$('details')?.value.trim()||'',createdAt:new Date().toISOString(),targetType:v};
    if(v==='bus'){
      p.from=$('busFrom').value.trim(); p.to=$('busTo').value.trim(); p.proposedValue=$('busFare').value.trim(); p.routeInfo=$('busRouteInfo')?.value.trim()||'';
      p.normalizedFrom=normLocation(p.from); p.normalizedTo=normLocation(p.to); p.routeKey=normRoute(p.from,p.to); p.targetType='bus_fare';
    }
    if(v==='market'){
      p.product=$('marketProduct').value.trim(); p.proposedValue=$('marketPrice').value.trim(); p.location=$('marketLocation')?.value.trim()||''; p.reportedDate=$('marketDate')?.value||today();
      p.normalizedLocation=normLocation(p.location); p.normalizedProduct=cleanText(p.product); p.targetType='market_price';
    }
    if(v==='new_info'){
      p.title=$('infoTitle').value.trim(); p.location=$('infoLocation')?.value.trim()||''; p.normalizedLocation=normLocation(p.location); p.normalizedTitle=cleanText(p.title); p.targetType='new_info';
    }

    const {data:old,error:readError}=await d.from('user_updates').select('*').eq('category',v).limit(500);
    if(readError){status.textContent='Database read হয়নি: '+readError.message;return;}
    const rows=old||[];
    const ai=localCheck(p,rows);
    const reportCount=1+(v==='bus'?rows.filter(x=>normRoute(x.from||'',x.to||'')===p.routeKey).length:0);

    // Current Supabase table uses UUID id and stores arbitrary normalized metadata in payload.
    // Do not send a custom string id or unsupported columns.
    const payload={
      reporter_name:p.reporterName, details:p.details,
      from:p.from||null, to:p.to||null, proposed_value:p.proposedValue||null, route_info:p.routeInfo||null,
      product:p.product||null, location:p.location||null, reported_date:p.reportedDate||null,
      title:p.title||null, target_type:p.targetType||null,
      normalized_from:p.normalizedFrom||null, normalized_to:p.normalizedTo||null, route_key:p.routeKey||null,
      normalized_location:p.normalizedLocation||null, normalized_product:p.normalizedProduct||null, normalized_title:p.normalizedTitle||null
    };
    const row={category:v,target_key:p.routeKey||p.normalizedProduct||p.normalizedTitle||null,payload,report_count:reportCount,ai_flag:ai.flag,ai_confidence:ai.confidence,ai_reason:ai.reason,ai_sources:[],status:ai.flag?'ai_green':'pending_admin',admin_status:'pending'};
    const {data:saved,error}=await d.from('user_updates').insert(row).select('id').single();
    if(error){status.textContent='Save হয়নি: '+error.message;return;}
    status.innerHTML=ai.flag?`🟢 Local Check সম্পন্ন — ${ai.confidence}%<br>Report ID: ${saved?.id||'saved'}<br>Admin final verification করবে।`:`🟡 Pending Admin Review<br>${ai.reason}<br>Report ID: ${saved?.id||'saved'}`;
    form.reset();toggle();
  });
})();
