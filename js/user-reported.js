(function(){
  const norm=s=>(s||'').toString().toLocaleLowerCase('bn-BD').replace(/[^\p{L}\p{N}]+/gu,'');
  async function load(){
    if(!window.supabase||!window.NAGORIK_SUPABASE_URL||!window.NAGORIK_SUPABASE_ANON_KEY)return[];
    const db=window.supabase.createClient(window.NAGORIK_SUPABASE_URL,window.NAGORIK_SUPABASE_ANON_KEY);
    const{data,error}=await db.from('user_updates').select('*').eq('category','market').eq('status','approved').eq('admin_status','approved').order('approved_at',{ascending:false}).limit(300);
    return error?[]:(data||[]);
  }
  load().then(rows=>{document.querySelectorAll('.product-card').forEach(card=>{const name=card.querySelector('h3')?.innerText.trim();if(!name)return;const hits=rows.filter(x=>norm(x.product)===norm(name));if(!hits.length)return;const x=hits[0],price=x.proposed_value??'';const box=document.createElement('div');box.className='user-market-report';box.innerHTML=`<b>👥 User Reported Price</b><strong>৳ ${String(price).replace(/</g,'&lt;')}</strong><span>🟢 Local AI checked · ✅ Admin approved · ${x.report_count||1} report(s)</span>${x.location?`<small>${String(x.location).replace(/</g,'&lt;')}</small>`:''}`;card.querySelector('.card-body')?.appendChild(box);});});
})();
