(function(){
  const KEY='nagorikHub.userUpdates.v1';
  const all=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
  const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const esc=s=>(s||'').toString().replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const stats=document.getElementById('adminStats'),list=document.getElementById('adminList');
  function render(){
    const rows=all(); const green=rows.filter(x=>x.aiFlag).length; const approved=rows.filter(x=>x.adminStatus==='approved').length; const pending=rows.filter(x=>x.adminStatus!=='approved'&&x.adminStatus!=='rejected').length;
    stats.innerHTML=`<div><b>${rows.length}</b><span>Total submissions</span></div><div><b>${green}</b><span>AI Green Flag</span></div><div><b>${pending}</b><span>Pending Admin</span></div><div><b>${approved}</b><span>Approved</span></div>`;
    if(!rows.length){list.innerHTML='<div class="empty">কোনো submission নেই।</div>';return;}
    list.innerHTML=rows.slice().reverse().map(x=>`<article class="admin-card">
      <div class="admin-card-top"><div><span class="tag">${x.category}</span><h3>${esc(x.from?`${x.from} → ${x.to}`:x.product||x.title||'Update')}</h3></div><span class="status-pill ${x.aiFlag?'green':'yellow'}">${x.aiFlag?'🟢 AI Green Flag':'🟡 Pending'}</span></div>
      <p><b>Proposed:</b> ${esc(x.proposedValue||x.details)}</p>
      ${x.location?`<p><b>Location:</b> ${esc(x.location)}</p>`:''}
      <p><b>Matching reports:</b> ${x.reportCount||1} · <b>AI confidence:</b> ${x.aiConfidence||0}%</p>
      ${x.aiReason?`<p class="muted">${esc(x.aiReason)}</p>`:''}
      ${x.aiSources?.length?`<div class="source-list">${x.aiSources.map(s=>`<a href="${esc(s.url||'#')}" target="_blank" rel="noopener">${esc(s.title||s.url||'Source')}</a>`).join('')}</div>`:''}
      <div class="admin-actions"><button class="btn" data-action="approve" data-id="${x.id}">✅ Approve & Publish</button><button class="btn danger" data-action="reject" data-id="${x.id}">❌ Reject</button></div>
    </article>`).join('');
  }
  list.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.id;const rows=all();const row=rows.find(x=>x.id===id);if(!row)return;if(b.dataset.action==='approve'){row.adminStatus='approved';row.status='approved';row.approvedAt=new Date().toISOString();}else{row.adminStatus='rejected';row.status='rejected';row.rejectedAt=new Date().toISOString();}save(rows);render();});
  render();
})();
