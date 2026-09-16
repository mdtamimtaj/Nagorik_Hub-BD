// Nagorik Hub — location normalization for Bangla/English aliases.
(function(){
  const groups = {
    'bagerhat':['বাগেরহাট','bagerhat','bagerhat sadar','বাগেরহাট সদর'],
    'bandarban':['বান্দরবান','bandarban','bandarban sadar','বান্দরবান সদর'],
    'barisal':['বরিশাল','barisal','barishal','barisal sadar','বরিশাল সদর'],
    'bhola':['ভোলা','bhola','bhola sadar','ভোলা সদর'],
    'bogura':['বগুড়া','বগুড়া','bogra','bogura','bogura sadar','বগুড়া সদর','বগুড়া সদর'],
    'brahmanbaria':['ব্রাহ্মণবাড়িয়া','ব্রাহ্মণবাড়িয়া','brahmanbaria','brahmanbaria sadar','ব্রাহ্মণবাড়িয়া সদর','ব্রাহ্মণবাড়িয়া সদর'],
    'chandpur':['চাঁদপুর','chandpur','chandpur sadar','চাঁদপুর সদর'],
    'chapainawabganj':['চাঁপাইনবাবগঞ্জ','chapainawabganj','chapai nawabganj','chapai','চাঁপাই','চাঁপাই নবাবগঞ্জ'],
    'chattogram':['চট্টগ্রাম','চট্টগ্রাম শহর','chattogram','chittagong','chittagong city','chattogram city'],
    'chuadanga':['চুয়াডাঙ্গা','চুয়াডাঙ্গা','chuadanga','chuadanga sadar','চুয়াডাঙ্গা সদর','চুয়াডাঙ্গা সদর'],
    'comilla':['কুমিল্লা','cumilla','comilla','comilla sadar','কুমিল্লা সদর'],
    'coxs-bazar':['কক্সবাজার','cox bazar','coxsbazar','cox\'s bazar','cox\'s-bazar','কক্স বাজার','কক্সবাজার সদর'],
    'dhaka':['ঢাকা','dhaka','dhaka city','ঢাকা শহর','dhaka sadar','ঢাকা সদর'],
    'dinajpur':['দিনাজপুর','dinajpur','dinajpur sadar','দিনাজপুর সদর'],
    'faridpur':['ফরিদপুর','faridpur','faridpur sadar','ফরিদপুর সদর'],
    'feni':['ফেনী','feni','feni sadar','ফেনী সদর'],
    'gaibandha':['গাইবান্ধা','gaibandha','gaibandha sadar','গাইবান্ধা সদর'],
    'gazipur':['গাজীপুর','gazipur','gazipur sadar','গাজীপুর সদর'],
    'gopalganj':['গোপালগঞ্জ','gopalganj','gopalganj sadar','গোপালগঞ্জ সদর'],
    'habiganj':['হবিগঞ্জ','habiganj','habiganj sadar','হবিগঞ্জ সদর'],
    'jamalpur':['জামালপুর','jamalpur','jamalpur sadar','জামালপুর সদর'],
    'jashore':['যশোর','jashore','jessore','jashore sadar','যশোর সদর'],
    'jhalokati':['ঝালকাঠি','jhalokati','jhalokathi','jhalokati sadar','ঝালকাঠি সদর'],
    'jhenaidah':['ঝিনাইদহ','jhenaidah','jhenaidah sadar','ঝিনাইদহ সদর'],
    'joypurhat':['জয়পুরহাট','জয়পুরহাট','joypurhat','joypurhat sadar','জয়পুরহাট সদর','জয়পুরহাট সদর'],
    'khagrachhari':['খাগড়াছড়ি','খাগড়াছড়ি','khagrachhari','khagrachari','khagrachhari sadar','খাগড়াছড়ি সদর','খাগড়াছড়ি সদর'],
    'khulna':['খুলনা','khulna','khulna city','খুলনা শহর','khulna sadar','খুলনা সদর'],
    'kishoreganj':['কিশোরগঞ্জ','kishoreganj','kishoreganj sadar','কিশোরগঞ্জ সদর'],
    'kurigram':['কুড়িগ্রাম','কুড়িগ্রাম','kurigram','kurigram sadar','কুড়িগ্রাম সদর','কুড়িগ্রাম সদর'],
    'kushtia':['কুষ্টিয়া','কুষ্টিয়া','kushtia','kushtia sadar','কুষ্টিয়া সদর','কুষ্টিয়া সদর'],
    'lakshmipur':['লক্ষ্মীপুর','lakshmipur','lakshmipur sadar','লক্ষ্মীপুর সদর'],
    'lalmonirhat':['লালমনিরহাট','lalmonirhat','lalmonirhat sadar','লালমনিরহাট সদর'],
    'madaripur':['মাদারীপুর','madaripur','madaripur sadar','মাদারীপুর সদর'],
    'magura':['মাগুরা','magura','magura sadar','মাগুরা সদর'],
    'manikganj':['মানিকগঞ্জ','manikganj','manikganj sadar','মানিকগঞ্জ সদর'],
    'meherpur':['মেহেরপুর','meherpur','meherpur sadar','মেহেরপুর সদর'],
    'moulvibazar':['মৌলভীবাজার','moulvibazar','maulvibazar','moulvibazar sadar','মৌলভীবাজার সদর'],
    'munshiganj':['মুন্সিগঞ্জ','মুন্সীগঞ্জ','munshiganj','munshiganj sadar','মুন্সিগঞ্জ সদর','মুন্সীগঞ্জ সদর'],
    'mymensingh':['ময়মনসিংহ','ময়মনসিংহ','mymensingh','mymensingh sadar','ময়মনসিংহ সদর','ময়মনসিংহ সদর'],
    'naogaon':['নওগাঁ','naogaon','naogaon sadar','নওগাঁ সদর'],
    'narail':['নড়াইল','নড়াইল','narail','narail sadar','নড়াইল সদর','নড়াইল সদর'],
    'narayanganj':['নারায়ণগঞ্জ','নারায়ণগঞ্জ','narayanganj','narayanganj sadar','নারায়ণগঞ্জ সদর','নারায়ণগঞ্জ সদর'],
    'narsingdi':['নরসিংদী','narsingdi','narsingdi sadar','নরসিংদী সদর'],
    'natore':['নাটোর','natore','natore sadar','নাটোর সদর'],
    'netrokona':['নেত্রকোণা','নেত্রকোনা','netrokona','netrokona sadar','নেত্রকোণা সদর','নেত্রকোনা সদর'],
    'nilphamari':['নীলফামারী','nilphamari','nilphamari sadar','নীলফামারী সদর'],
    'noakhali':['নোয়াখালী','নোয়াখালী','noakhali','noakhali sadar','নোয়াখালী সদর','নোয়াখালী সদর'],
    'pabna':['পাবনা','pabna','pabna sadar','পাবনা সদর'],
    'panchagarh':['পঞ্চগড়','পঞ্চগড়','panchagarh','panchagarh sadar','পঞ্চগড় সদর','পঞ্চগড় সদর'],
    'patuakhali':['পটুয়াখালী','পটুয়াখালী','patuakhali','patuakhali sadar','পটুয়াখালী সদর','পটুয়াখালী সদর'],
    'pirojpur':['পিরোজপুর','pirojpur','pirojpur sadar','পিরোজপুর সদর'],
    'rajbari':['রাজবাড়ী','রাজবাড়ী','rajbari','rajbari sadar','রাজবাড়ী সদর','রাজবাড়ী সদর'],
    'rajshahi':['রাজশাহী','rajshahi','rajshahi city','রাজশাহী শহর','rajshahi sadar','রাজশাহী সদর'],
    'rangamati':['রাঙ্গামাটি','রাঙামাটি','rangamati','rangamati sadar','রাঙ্গামাটি সদর','রাঙামাটি সদর'],
    'rangpur':['রংপুর','rangpur','rangpur city','রংপুর শহর','rangpur sadar','রংপুর সদর'],
    'satkhira':['সাতক্ষীরা','satkhira','satkhira sadar','সাতক্ষীরা সদর'],
    'shariatpur':['শরীয়তপুর','শরিয়তপুর','shariatpur','shariatpur sadar','শরীয়তপুর সদর','শরিয়তপুর সদর'],
    'sherpur':['শেরপুর','sherpur','sherpur sadar','শেরপুর সদর'],
    'sirajganj':['সিরাজগঞ্জ','sirajganj','sirajganj sadar','সিরাজগঞ্জ সদর'],
    'sunamganj':['সুনামগঞ্জ','sunamganj','sunamganj sadar','সুনামগঞ্জ সদর'],
    'sylhet':['সিলেট','sylhet','sylhet city','সিলেট শহর','sylhet sadar','সিলেট সদর'],
    'tangail':['টাঙ্গাইল','tangail','tangail sadar','টাঙ্গাইল সদর'],
    'thakurgaon':['ঠাকুরগাঁও','thakurgaon','thakurgaon sadar','ঠাকুরগাঁও সদর'],
    'brahmanbaria':['ব্রাহ্মণবাড়িয়া','ব্রাহ্মণবাড়িয়া','brahmanbaria','brahmanbaria sadar','ব্রাহ্মণবাড়িয়া সদর','ব্রাহ্মণবাড়িয়া সদর']
  };
  const aliasToCanonical={};
  const clean=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('bn-BD').replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
  Object.entries(groups).forEach(([canonical,aliases])=>aliases.forEach(a=>aliasToCanonical[clean(a)]=canonical));
  function normalizeLocation(value){
    const s=clean(value); if(!s)return '';
    if(aliasToCanonical[s])return aliasToCanonical[s];
    const noPunct=s.replace(/[.,;:!?()[\]{}\-_/]+/g,' ').replace(/\s+/g,' ').trim();
    if(aliasToCanonical[noPunct])return aliasToCanonical[noPunct];
    return noPunct;
  }
  function normalizeRoute(from,to){return normalizeLocation(from)+'->'+normalizeLocation(to);}
  function canonicalText(value){return clean(value).replace(/[.,;:!?()[\]{}\-_/]+/g,' ').replace(/\s+/g,' ').trim();}
  window.NagorikLocation={normalizeLocation,normalizeRoute,canonicalText,aliases:aliasToCanonical};
})();
