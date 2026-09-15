document.addEventListener("DOMContentLoaded",()=>{
  const menu=document.querySelector(".menu"), links=document.querySelector(".navlinks");
  if(menu) menu.addEventListener("click",()=>links.classList.toggle("show"));

  document.querySelectorAll(".product-search").forEach(input=>{
    input.addEventListener("input",()=>{
      const q=input.value.toLowerCase().trim();
      document.querySelectorAll(".product-card").forEach(card=>{
        card.style.display=card.innerText.toLowerCase().includes(q)?"":"none";
      });
    });
  });

  const locations=window.NAGORIK_DISTRICTS||[];
  function normalize(s){
    return (s||"").toString().toLocaleLowerCase("bn-BD").replace(/[^\p{L}\p{N}]+/gu,"");
  }
  function setupAutocomplete(input){
    if(!input) return;
    const wrap=input.parentElement;
    const box=document.createElement("div");
    box.className="suggestions";
    wrap.appendChild(box);
    input.addEventListener("input",()=>{
      const q=normalize(input.value);
      box.innerHTML="";
      if(!q) return;
      locations.filter(x=>normalize(x.bn).includes(q)||normalize(x.en).includes(q))
        .slice(0,8).forEach(x=>{
          const item=document.createElement("button");
          item.type="button"; item.className="suggestion";
          item.innerHTML=`<strong>${x.bn}</strong><span>${x.en}</span>`;
          item.addEventListener("click",()=>{input.value=x.bn;box.innerHTML="";});
          box.appendChild(item);
        });
    });
    document.addEventListener("click",e=>{if(!wrap.contains(e.target)) box.innerHTML="";});
  }
  if(!window.NAGORIK_NEW_BUS_FARE){
    setupAutocomplete(document.getElementById("from"));
    setupAutocomplete(document.getElementById("to"));
  }

  function findLocation(value){
    const q=normalize(value);
    return locations.find(x=>normalize(x.bn)===q||normalize(x.en)===q)
      ||locations.find(x=>normalize(x.bn).includes(q)||normalize(x.en).includes(q));
  }

  const live=window.NAGORIK_LIVE||{};
  const sourceRoutes=window.NAGORIK_BUS_ROUTES||[];
  function routeMatch(a,b){
    const na=normalize(a), nb=normalize(b);
    return sourceRoutes.find(r=>(normalize(r.from)===na&&normalize(r.to)===nb)||(normalize(r.from)===nb&&normalize(r.to)===na));
  }

  const form=document.getElementById("fareForm");
  if(form && !window.NAGORIK_NEW_BUS_FARE){
    form.addEventListener("submit",e=>{
      e.preventDefault();
      const fromRaw=document.getElementById("from").value.trim();
      const toRaw=document.getElementById("to").value.trim();
      const out=document.getElementById("fareResults");
      if(!fromRaw||!toRaw){out.innerHTML='<div class="empty">From এবং To দুটোই লিখুন।</div>';return;}
      const from=findLocation(fromRaw), to=findLocation(toRaw);
      if(!from||!to){out.innerHTML='<div class="empty">Suggestion থেকে district select করুন।</div>';return;}
      if(normalize(from.bn)===normalize(to.bn)){out.innerHTML='<div class="empty">From এবং To একই জেলা হয়েছে। অন্য একটি জেলা নির্বাচন করুন।</div>';return;}

      const route=routeMatch(from.bn,to.bn);
      if(route){
        const direction=`${from.bn} → ${to.bn}`;
        out.innerHTML=`
          <div class="fare-card wide"><div class="fare-type">🚌 ${direction}</div><div class="fare-value">${route.distance}</div><div class="fare-note">📍 দূরত্ব · ⏱️ আনুমানিক সময়: <b>${route.time}</b>${route.note?`<br>ℹ️ ${route.note}`:''}</div></div>
          <div class="fare-card"><div class="fare-type">লোকাল বাস / মিনিবাস</div><div class="fare-value">৳ ${route.local}</div><div class="fare-note">আনুমানিক ভাড়া</div></div>
          <div class="fare-card"><div class="fare-type">কোচ / গেটলক বাস</div><div class="fare-value">৳ ${route.coach}</div><div class="fare-note">আনুমানিক ভাড়া</div></div>
          <div class="fare-card wide"><div class="fare-note"><b>⚠️ আনুমানিক ভাড়া:</b> প্রকৃত ভাড়া পরিবর্তিত হতে পারে। বাস কোম্পানি, সময়, রাস্তার অবস্থা ও অন্যান্য কারণে ভাড়া কম-বেশি হতে পারে। যাত্রার আগে সংশ্লিষ্ট বাস কর্তৃপক্ষের কাছ থেকে ভাড়া নিশ্চিত করুন।</div></div>`;
      }else{
        out.innerHTML=`
          <div class="fare-card wide"><div class="fare-type">🚌 ${from.bn} → ${to.bn}</div><div class="fare-value">Route data unavailable</div><div class="fare-note">এই exact route-এর দূরত্ব, সময় ও ভাড়ার তথ্য বর্তমান dataset-এ নেই। ভুল/অনুমানভিত্তিক তথ্য দেখানো হবে না।</div></div>
          <div class="fare-card"><div class="fare-type">📍 দূরত্ব</div><div class="fare-value">—</div><div class="fare-note">Verified route data unavailable</div></div>
          <div class="fare-card"><div class="fare-type">⏱️ সময়</div><div class="fare-value">—</div><div class="fare-note">Route-specific estimate unavailable</div></div>
          <div class="fare-card"><div class="fare-type">লোকাল / মিনিবাস</div><div class="fare-value">—</div><div class="fare-note">তথ্য পাওয়া যায়নি</div></div>
          <div class="fare-card"><div class="fare-type">কোচ / গেটলক</div><div class="fare-value">—</div><div class="fare-note">তথ্য পাওয়া যায়নি</div></div>
          <div class="fare-card wide"><div class="fare-note"><b>⚠️ মনে রাখুন:</b> এখানে ভাড়া বানিয়ে দেখানো হয় না। নতুন verified route data যোগ হলে এই route-এ তথ্য দেখানো যাবে।</div></div>`;
      }
    });
  }

  if(!window.NAGORIK_NEW_BUS_FARE) document.querySelectorAll(".quick-route").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.getElementById("from").value=btn.dataset.from;
      document.getElementById("to").value=btn.dataset.to;
      form?.dispatchEvent(new Event("submit",{cancelable:true}));
    });
  });

  const category=document.getElementById("category");
  if(category) category.addEventListener("change",()=>{
    const v=category.value;
    document.querySelectorAll(".product-card").forEach(card=>{
      card.style.display=(!v||card.dataset.category===v)?"":"none";
    });
  });

  // Market priority: LIVE DAM -> LIVE retail fallback -> static DAM -> static fallback.
  const staticData=window.NAGORIK_OFFICIAL||{};
  const liveMarket=live.market||{};
  const liveRetail=live.retail||{};
  document.querySelectorAll(".product-card").forEach(card=>{
    const name=card.querySelector("h3")?.innerText.trim();
    const d=liveMarket[name]||liveRetail[name]||staticData.market?.[name]||staticData.retailFallback?.[name];
    if(!d) return;
    const price=card.querySelector(".price");
    if(price) price.innerHTML=`৳ ${d.min}–${d.max} <small>/${d.unit}</small>`;
    const meta=card.querySelector(".meta");
    if(meta){
      const source=d.source||((liveMarket[name]||staticData.market?.[name])?"DAM":"Retail reference");
      const updated=d.updated||live.updatedAt?.slice(0,10)||staticData.marketDate;
      meta.innerHTML=`<span>Source: ${source}</span><span>Updated: ${updated}</span>`;
    }
  });

  const status=document.querySelector(".source");
  if(status && live.updatedAt){
    status.innerHTML=`Daily automated update: <b>${live.updatedAt.slice(0,10)}</b> · DAM first, retail fallback second.`;
  }
});