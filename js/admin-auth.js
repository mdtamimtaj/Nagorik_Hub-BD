(function(){
  const hasConfig=()=>window.NAGORIK_SUPABASE_URL && window.NAGORIK_SUPABASE_ANON_KEY && !window.NAGORIK_SUPABASE_URL.includes('YOUR-PROJECT') && !window.NAGORIK_SUPABASE_ANON_KEY.includes('YOUR_');
  const msg=document.getElementById('loginMsg'), form=document.getElementById('loginForm');
  const show=(text,good=false)=>{msg.hidden=false;msg.className='login-msg'+(good?' good':'');msg.textContent=text;};
  if(!hasConfig()){show('Supabase config এখনো সেট করা হয়নি। supabase/config.js-এ URL এবং anon/publishable key বসান।');return;}
  const client=supabase.createClient(window.NAGORIK_SUPABASE_URL,window.NAGORIK_SUPABASE_ANON_KEY);
  document.getElementById('togglePassword').onclick=()=>{const p=document.getElementById('password');p.type=p.type==='password'?'text':'password';};
  form.addEventListener('submit',async e=>{e.preventDefault();show('Login হচ্ছে…');const email=document.getElementById('email').value.trim();const password=document.getElementById('password').value;const {data,error}=await client.auth.signInWithPassword({email,password});if(error){show('Login failed: '+error.message);return;}const {data:role,error:roleError}=await client.rpc('is_admin');if(roleError||role!==true){await client.auth.signOut();show('এই account-এর Admin access নেই।');return;}show('Login successful — Admin Panel খুলছি…',true);location.replace('admin.html');});
  document.getElementById('resetLink').onclick=async e=>{e.preventDefault();const email=document.getElementById('email').value.trim();if(!email){show('আগে Admin email লিখুন।');return;}const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname.replace('admin-login.html','reset-password.html')});show(error?'Reset request failed: '+error.message:'Password reset email পাঠানো হয়েছে।',!error);};
})();
