// Nagorik Hub — Bus Fare system with approved user reports.
window.NAGORIK_NEW_BUS_FARE = true;
(function(){
  const districts=window.NAGORIK_DISTRICTS||[],routes=window.NAGORIK_BUS_ROUTES||[];
  const api=window.NagorikLocation||{};
  const normalize=api.canonicalText||((s)=>(s||'').toString().normalize('NFKC').toLocaleLowerCase('bn-BD').replace(/[^\p{L}\p{N}]+/gu,''));
  const locationKey=api.normalizeLocation||normalize;
  const special=new Map([
    ['ঢাকা|চট্টগ্রাম',{nonAc:'৬৮০–৭৫০',ac:'১,২০০–১,৬০০'}],['ঢাকা|সিলেট',{nonAc:'৫৫০–৬৫০',ac:'১,০০০–১,৪০০'}],['ঢাকা|রাজশাহী',{nonAc:'৬৫০–৭৫০',ac:'১,১০০–১,৫০০'}],['ঢাকা|বগুড়া',{nonAc:'৫০০–৬০০',ac:'৮০০–১,২০০'}],['ঢাকা|গাইবান্ধা',{nonAc:'৬৫০–৭৫০',ac:'১,০০০–১,৩০০'}],['ঢাকা|রংপুর',{nonAc:'৭৫০–৮৫০',ac:'১,২০০–১,৬০০'}],['ঢাকা|দিনাজপুর',{nonAc:'৮০০–৯০০',ac:'১,৩০০–১,৭০০'}],['ঢাকা|ঠাকুরগাঁও',{nonAc:'৯০০–১,০০০',ac:'১,৪০০–১,৮০০'}]
  ]);
  const form=document.getElementById('fareForm'),fromInput=document.getElementById('from'),toInput=document.getElementById('to'),output=document.getElementById('fareResults');
  if(!form||!fromInput||!toInput||!output)return;
  function findDistrict(value){const q=normalize(value);return districts.find(x=>normalize(x.bn)===q||normalize(x.en)===q)||districts.find(x=>normalize(x.bn).includes(q)||normalize(x.en).includes(q));}
  function routeMatch(a,b){const na=locationKey(a),nb=locationKey(b);return routes.find(r=>(locationKey(r.from)===na&&locationKey(r.to)===nb)||(locationKey(r.from)===nb&&locationKey(r.to)===na));}
  function setupAutocomplete(input){const wrap=input.parentElement,box=document.createElement('div');box.className='suggestions';wrap.appendChild(box);input.addEventListener('input',()=>{const q=normalize(input.value);box.innerHTML='';if(!q)return;districts.filter(x=>normalize(x.bn).includes(q)||normalize(x.en).includes(q)).slice(0,8).forEach(x=>{const item=document.createElement('button');item.type='button';item.className='suggestion';item.innerHTML=`<strong>${x.bn}</strong><span>${x.en}</span>`;item.addEventListener('click',()=>{input.value=x.bn;box.innerHTML='';});box.appendChild(item);});});document.addEventListener('click',e=>{if(!wrap.contains(e.target))box.innerHTML='';});}
  setupAutocomplete(fromInput);setupAutocomplete(toInput);
  let approvedCache=null;
  async function approvedUserFare(from,to){
    try{
      if(!window.supabaseClient&&window.supabase&&window.NAGORIK_SUPABASE_URL&&window.NAGORIK_SUPABASE_ANON_KEY)window.supabaseClient=window.supabase.createClient(window.NAGORIK_SUPABASE_URL,window.NAGORIK_SUPABASE_ANON_KEY);
      const d=window.supabaseClient;if(!d)return '';
      if(!approvedCache){const r=await d.from('user_updates').select('from,to,proposed_value,report_count,created_at').eq('category','bus').eq('status','approved').eq('admin_status','approved').order('created_at',{ascending:false}).limit(200);approvedCache=r.data||[];}
      const a=locationKey(from),b=locationKey(to),hit=approvedCache.find(x=>locationKey(x.from)===a&&locationKey(x.to)===b);if(!hit)return '';
      return `<div class="user-approved-fare"><b>👥 নাগরিক রিপোর্ট</b><strong>৳ ${hit.proposed_value}</strong><span>✅ Admin approved · ${hit.report_count||1} report(s)</span></div>`;
    }catch{return '';}
  }
  function renderApproved(from,to,base){return approvedUserFare(from,to).then(user=>base.replace('<!--USER_FARE--> ',user));}
  function normalResult(from,to,route){return `<div class="fare-result-head"><div><span class="route-badge">🚌 Route</span><h3>${from} → ${to}</h3></div></div><div class="route-stats"><div><span>📍 দূরত্ব</span><strong>${route.distance}</strong></div><div><span>⏱️ আনুমানিক সময়</span><strong>${route.time}</strong></div></div>${route.note?`<div class="route-note">ℹ️ ${route.note}</div>`:''}<!--USER_FARE--><div class="fare-grid"><div class="fare-card"><div class="fare-type">লোকাল বাস / মিনিবাস</div><div class="fare-value">৳ ${route.local}</div><div class="fare-note">আনুমানিক ভাড়া</div></div><div class="fare-card"><div class="fare-type">কোচ / গেটলক বাস</div><div class="fare-value">৳ ${route.coach}</div><div class="fare-note">আনুমানিক ভাড়া</div></div></div><div class="fare-disclaimer">⚠️ ভাড়া আনুমানিক। বাস কোম্পানি, সময়, রাস্তার অবস্থা ও অন্যান্য কারণে প্রকৃত ভাড়া পরিবর্তিত হতে পারে।</div>`;}
  function specialResult(from,to,data){return `<div class="fare-result-head"><div><span class="route-badge special">🚌 দূরপাল্লার রুট</span><h3>${from} → ${to}</h3></div></div><!--USER_FARE--><div class="special-fare-grid"><div class="fare-card special-card"><div class="fare-type">Non-AC বাস</div><div class="fare-value">৳ ${data.nonAc}</div><div class="fare-note">আনুমানিক ভাড়া</div></div><div class="fare-card special-card"><div class="fare-type">AC বাস</div><div class="fare-value">৳ ${data.ac}</div><div class="fare-note">আনুমানিক ভাড়া</div></div></div><div class="fare-disclaimer">⚠️ এই ৮টি নির্দিষ্ট ঢাকা দূরপাল্লার রুটে শুধু Non-AC ও AC ভাড়া দেখানো হয়। Local/Minibus বা Coach/Gate-lock ভাড়া এই রুটগুলোর জন্য দেখানো হবে না।</div>`;}
  function unavailable(from,to){return `<div class="empty"><strong>${from} → ${to}</strong><br><br>এই exact route-এর তথ্য বর্তমান dataset-এ নেই। ভুল বা অনুমানভিত্তিক ভাড়া দেখানো হবে না।</div>`;}
  async function check(){const from=findDistrict(fromInput.value.trim()),to=findDistrict(toInput.value.trim());if(!from||!to){output.innerHTML='<div class="empty">From ও To থেকে একটি district নির্বাচন করুন।</div>';return;}if(locationKey(from.bn)===locationKey(to.bn)){output.innerHTML='<div class="empty">From এবং To একই জেলা। অন্য জেলা নির্বাচন করুন।</div>';return;}const data=special.get(`${from.bn}|${to.bn}`);const base=data?specialResult(from.bn,to.bn,data):(routeMatch(from.bn,to.bn)?normalResult(from.bn,to.bn,routeMatch(from.bn,to.bn)):unavailable(from.bn,to.bn));output.innerHTML=base;const user=await approvedUserFare(from.bn,to.bn);if(user)output.innerHTML=output.innerHTML.replace('<!--USER_FARE-->',user);else output.innerHTML=output.innerHTML.replace('<!--USER_FARE-->','');}
  form.addEventListener('submit',e=>{e.preventDefault();check();});
  document.querySelectorAll('.quick-route').forEach(btn=>btn.addEventListener('click',()=>{fromInput.value=btn.dataset.from;toInput.value=btn.dataset.to;check();}));
})();