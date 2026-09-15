(function(){
  const gate=document.getElementById('authGate');
  const valid=window.NAGORIK_SUPABASE_URL && window.NAGORIK_SUPABASE_ANON_KEY && !window.NAGORIK_SUPABASE_URL.includes('YOUR-PROJECT') && !window.NAGORIK_SUPABASE_ANON_KEY.includes('YOUR_');
  if(!valid){location.replace('admin-login.html');return;}
  const client=supabase.createClient(window.NAGORIK_SUPABASE_URL,window.NAGORIK_SUPABASE_ANON_KEY);
  (async()=>{
    const {data:{session}}=await client.auth.getSession();
    if(!session){location.replace('admin-login.html');return;}
    const {data:isAdmin,error}=await client.rpc('is_admin');
    if(error||isAdmin!==true){await client.auth.signOut();location.replace('admin-login.html');return;}
    const email=document.getElementById('adminEmail');if(email)email.textContent=session.user.email||'Admin';
    const logout=document.getElementById('logoutBtn');if(logout)logout.onclick=async()=>{await client.auth.signOut();location.replace('admin-login.html');};
    if(gate)gate.remove();
  })();
})();
