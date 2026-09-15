// Vercel/Node-compatible serverless endpoint.
// Keeps the AI API key off the browser and uses web search before returning a recommendation.
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {submission,reportCount}=req.body||{};
    if(!submission) return res.status(400).json({error:'submission is required'});
    const key=process.env.OPENAI_API_KEY;
    if(!key) return res.status(500).json({error:'OPENAI_API_KEY is not configured'});
    const prompt=`You are the first-level verification agent for Nagorik Hub, a Bangladesh citizen information website.\n\nUSER SUBMISSION:\n${JSON.stringify(submission,null,2)}\n\nMATCHING USER REPORT COUNT: ${reportCount||1}\n\nTask: Search the public web for reliable evidence about this exact claim. Prefer official Bangladesh government/agency sources, official notices, BRTA for transport, DAM for market prices, and authoritative primary sources. Do not treat the number of user reports alone as proof. Return JSON only with: flag (boolean), confidence (0-100), reason (Bangla, concise), sources (array of {title,url}), checkedAt (ISO string). Set flag=true only when the evidence strongly supports the claim and there is no material conflict. If evidence is weak, conflicting, stale, or unavailable, flag=false.`;
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5.6-luna',tools:[{type:'web_search'}],input:prompt})});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.error?.message||'OpenAI request failed'});
    const text=data.output_text||'';
    let parsed; try{parsed=JSON.parse(text)}catch{parsed={flag:false,confidence:0,reason:'AI response could not be parsed safely; Admin review required.',sources:[]};}
    return res.status(200).json(parsed);
  }catch(err){return res.status(500).json({error:'Verification service error'});}
}
