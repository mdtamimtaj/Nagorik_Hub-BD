// Nagorik Hub — New Bus Fare system
// Source: user-provided bus vara.txt + user-provided AC/Non-AC fare table.
window.NAGORIK_NEW_BUS_FARE = true;
(function(){
  const districts = window.NAGORIK_DISTRICTS || [];
  const routes = window.NAGORIK_BUS_ROUTES || [];

  // ONLY these exact Dhaka -> destination directions use AC/Non-AC.
  const special = new Map([
    ['ঢাকা|চট্টগ্রাম', {nonAc:'৬৮০–৭৫০', ac:'১,২০০–১,৬০০'}],
    ['ঢাকা|সিলেট', {nonAc:'৫৫০–৬৫০', ac:'১,০০০–১,৪০০'}],
    ['ঢাকা|রাজশাহী', {nonAc:'৬৫০–৭৫০', ac:'১,১০০–১,৫০০'}],
    ['ঢাকা|বগুড়া', {nonAc:'৫০০–৬০০', ac:'৮০০–১,২০০'}],
    ['ঢাকা|গাইবান্ধা', {nonAc:'৬৫০–৭৫০', ac:'১,০০০–১,৩০০'}],
    ['ঢাকা|রংপুর', {nonAc:'৭৫০–৮৫০', ac:'১,২০০–১,৬০০'}],
    ['ঢাকা|দিনাজপুর', {nonAc:'৮০০–৯০০', ac:'১,৩০০–১,৭০০'}],
    ['ঢাকা|ঠাকুরগাঁও', {nonAc:'৯০০–১,০০০', ac:'১,৪০০–১,৮০০'}]
  ]);

  const normalize = s => (s||'').toString().toLocaleLowerCase('bn-BD').replace(/[^\p{L}\p{N}]+/gu,'');
  const findDistrict = value => {
    const q = normalize(value);
    return districts.find(x=>normalize(x.bn)===q || normalize(x.en)===q) ||
           districts.find(x=>normalize(x.bn).includes(q) || normalize(x.en).includes(q));
  };
  const routeMatch = (a,b) => {
    const na=normalize(a), nb=normalize(b);
    return routes.find(r =>
      (normalize(r.from)===na && normalize(r.to)===nb) ||
      (normalize(r.from)===nb && normalize(r.to)===na)
    );
  };

  const form = document.getElementById('fareForm');
  const fromInput = document.getElementById('from');
  const toInput = document.getElementById('to');
  const output = document.getElementById('fareResults');
  if(!form || !fromInput || !toInput || !output) return;

  function setupAutocomplete(input){
    const wrap=input.parentElement;
    const box=document.createElement('div');
    box.className='suggestions';
    wrap.appendChild(box);
    input.addEventListener('input',()=>{
      const q=normalize(input.value);
      box.innerHTML='';
      if(!q) return;
      districts.filter(x=>normalize(x.bn).includes(q)||normalize(x.en).includes(q)).slice(0,8).forEach(x=>{
        const item=document.createElement('button');
        item.type='button'; item.className='suggestion';
        item.innerHTML=`<strong>${x.bn}</strong><span>${x.en}</span>`;
        item.addEventListener('click',()=>{input.value=x.bn; box.innerHTML='';});
        box.appendChild(item);
      });
    });
    document.addEventListener('click',e=>{if(!wrap.contains(e.target)) box.innerHTML='';});
  }
  setupAutocomplete(fromInput); setupAutocomplete(toInput);

  function approvedUserFare(from,to){
    try{
      const rows=JSON.parse(localStorage.getItem('nagorikHub.userUpdates.v1')||'[]');
      const n=s=>String(s||'').toLocaleLowerCase('bn-BD').replace(/[^\p{L}\p{N}]+/gu,'');
      const hit=rows.filter(x=>x.category==='bus'&&x.adminStatus==='approved'&&n(x.from)===n(from)&&n(x.to)===n(to)).slice(-1)[0];
      if(!hit) return '';
      return `<div class="user-approved-fare"><b>👥 User Reported Fare</b><strong>৳ ${hit.proposedValue}</strong><span>🟢 AI verified · ✅ Admin approved · ${hit.reportCount||1} user report(s)</span></div>`;
    }catch{return ''}
  }

  function normalResult(from,to,route){
    return `
      <div class="fare-result-head">
        <div><span class="route-badge">🚌 Route</span><h3>${from} → ${to}</h3></div>
      </div>
      <div class="route-stats">
        <div><span>📍 দূরত্ব</span><strong>${route.distance}</strong></div>
        <div><span>⏱️ আনুমানিক সময়</span><strong>${route.time}</strong></div>
      </div>
      ${route.note ? `<div class="route-note">ℹ️ ${route.note}</div>` : ''}${approvedUserFare(from,to)}
      <div class="fare-grid">
        <div class="fare-card"><div class="fare-type">লোকাল বাস / মিনিবাস</div><div class="fare-value">৳ ${route.local}</div><div class="fare-note">আনুমানিক ভাড়া</div></div>
        <div class="fare-card"><div class="fare-type">কোচ / গেটলক বাস</div><div class="fare-value">৳ ${route.coach}</div><div class="fare-note">আনুমানিক ভাড়া</div></div>
      </div>
      <div class="fare-disclaimer">⚠️ ভাড়া আনুমানিক। বাস কোম্পানি, সময়, রাস্তার অবস্থা ও অন্যান্য কারণে প্রকৃত ভাড়া পরিবর্তিত হতে পারে।</div>`;
  }

  function specialResult(from,to,data){
    return `
      <div class="fare-result-head">
        <div><span class="route-badge special">🚌 দূরপাল্লার রুট</span><h3>${from} → ${to}</h3></div>
      </div>
      ${approvedUserFare(from,to)}
      <div class="special-fare-grid">
        <div class="fare-card special-card"><div class="fare-type">Non-AC বাস</div><div class="fare-value">৳ ${data.nonAc}</div><div class="fare-note">আনুমানিক ভাড়া</div></div>
        <div class="fare-card special-card"><div class="fare-type">AC বাস</div><div class="fare-value">৳ ${data.ac}</div><div class="fare-note">আনুমানিক ভাড়া</div></div>
      </div>
      <div class="fare-disclaimer">⚠️ এই ৮টি নির্দিষ্ট ঢাকা দূরপাল্লার রুটে শুধু Non-AC ও AC ভাড়া দেখানো হয়। Local/Minibus বা Coach/Gate-lock ভাড়া এই রুটগুলোর জন্য দেখানো হবে না।</div>`;
  }

  function unavailable(from,to){
    return `<div class="empty"><strong>${from} → ${to}</strong><br><br>এই exact route-এর তথ্য বর্তমান dataset-এ নেই। ভুল বা অনুমানভিত্তিক ভাড়া দেখানো হবে না।</div>`;
  }

  form.addEventListener('submit',e=>{
    e.preventDefault();
    const from=findDistrict(fromInput.value.trim());
    const to=findDistrict(toInput.value.trim());
    if(!from || !to){ output.innerHTML='<div class="empty">From ও To থেকে একটি district নির্বাচন করুন।</div>'; return; }
    if(normalize(from.bn)===normalize(to.bn)){ output.innerHTML='<div class="empty">From এবং To একই জেলা। অন্য জেলা নির্বাচন করুন।</div>'; return; }

    // IMPORTANT: special fares are directional. Reverse routes never inherit AC/Non-AC.
    const specialKey = `${from.bn}|${to.bn}`;
    const specialFare = special.get(specialKey);
    if(specialFare){
      output.innerHTML = specialResult(from.bn,to.bn,specialFare);
      return;
    }

    const route = routeMatch(from.bn,to.bn);
    output.innerHTML = route ? normalResult(from.bn,to.bn,route) : unavailable(from.bn,to.bn);
  });

  document.querySelectorAll('.quick-route').forEach(btn=>{
    btn.addEventListener('click',()=>{
      fromInput.value=btn.dataset.from; toInput.value=btn.dataset.to;
      form.dispatchEvent(new Event('submit',{cancelable:true}));
    });
  });
})();
