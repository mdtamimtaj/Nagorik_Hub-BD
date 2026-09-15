(function(){
  const KEY='nagorikHub.userUpdates.v1';
  const norm=s=>(s||'').toString().toLocaleLowerCase('bn-BD').replace(/[^\p{L}\p{N}]+/gu,'');
  let rows=[];try{rows=JSON.parse(localStorage.getItem(KEY)||'[]')}catch{}
  document.querySelectorAll('.product-card').forEach(card=>{
    const name=card.querySelector('h3')?.innerText.trim(); if(!name)return;
    const hits=rows.filter(x=>x.category==='market'&&x.adminStatus==='approved'&&norm(x.product)===norm(name));
    if(!hits.length)return;
    const x=hits[hits.length-1];
    const box=document.createElement('div');box.className='user-market-report';
    box.innerHTML=`<b>👥 User Reported Price</b><strong>৳ ${String(x.proposedValue||'').replace(/</g,'&lt;')}</strong><span>🟢 AI verified · ✅ Admin approved · ${x.reportCount||1} report(s)</span>${x.location?`<small>${String(x.location).replace(/</g,'&lt;')}</small>`:''}`;
    card.querySelector('.card-body')?.appendChild(box);
  });
})();
