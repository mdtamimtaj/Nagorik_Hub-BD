// Nagorik Hub — Free Local AI User Update Verification
// No OpenAI API / paid API required.
// Runs a small language model in the browser through Transformers.js.
// Local AI is preliminary only; Admin remains the final authority.

(function () {
  const KEY = 'nagorikHub.userUpdates.v1';
  const form = document.getElementById('updateForm');
  const category = document.getElementById('updateCategory');
  const status = document.getElementById('submitStatus');
  if (!form || !category || !status) return;

  let modelPromise = null;
  let localModel = null;

  const $ = id => document.getElementById(id);
  const getAll = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  };
  const saveAll = x => localStorage.setItem(KEY, JSON.stringify(x));
  const norm = s => (s || '').toString().toLocaleLowerCase('bn-BD')
    .replace(/[^\p{L}\p{N}]+/gu, '');
  const today = () => new Date().toISOString().slice(0, 10);

  function toggle() {
    const v = category.value;
    $('busFields').hidden = v !== 'bus';
    $('marketFields').hidden = v !== 'market';
    $('newInfoFields').hidden = v !== 'new_info';
    document.querySelectorAll('.dynamic-fields input').forEach(x => x.required = false);
    if (v === 'bus') {
      $('busFrom').required = true; $('busTo').required = true; $('busFare').required = true;
    }
    if (v === 'market') {
      $('marketProduct').required = true; $('marketPrice').required = true;
    }
    if (v === 'new_info') $('infoTitle').required = true;
  }
  category.addEventListener('change', toggle);
  toggle();

  function duplicateKey(d) {
    if (d.category === 'bus')
      return ['bus', norm(d.from), norm(d.to), norm(d.proposedValue)].join('|');
    if (d.category === 'market')
      return ['market', norm(d.product), norm(d.proposedValue), norm(d.location)].join('|');
    return ['new_info', norm(d.title), norm(d.location)].join('|');
  }

  function fallbackCheck(submission, reports) {
    const exact = reports.filter(r => duplicateKey(r) === duplicateKey(submission)).length;
    if (exact >= 1) {
      return {
        flag: true,
        confidence: Math.min(75, 55 + exact * 10),
        reason: `একই দাবির ${exact + 1}টি matching report পাওয়া গেছে। Preliminary green flag; Admin final verification করবে।`
      };
    }
    return {
      flag: false,
      confidence: 30,
      reason: 'পর্যাপ্ত matching evidence পাওয়া যায়নি। Admin final review প্রয়োজন।'
    };
  }

  async function loadLocalAI() {
    if (localModel) return localModel;
    if (modelPromise) return modelPromise;

    modelPromise = (async () => {
      const { pipeline } = await import(
        'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1'
      );

      try {
        localModel = await pipeline(
          'text-generation',
          'HuggingFaceTB/SmolLM2-360M-Instruct',
          { device: 'webgpu', dtype: 'q4' }
        );
      } catch {
        localModel = await pipeline(
          'text-generation',
          'HuggingFaceTB/SmolLM2-360M-Instruct',
          { dtype: 'q4' }
        );
      }
      return localModel;
    })();

    try { return await modelPromise; }
    catch (e) { modelPromise = null; throw e; }
  }

  async function aiCheck(submission, all, reportCount) {
    const reports = all.filter(r => duplicateKey(r) === duplicateKey(submission));

    try {
      status.innerHTML =
        '🤖 <b>Free Local AI</b> চলছে… browser-এর ভেতরেই verification হচ্ছে। প্রথমবার model load হতে সময় লাগতে পারে।';

      const model = await loadLocalAI();
      const prompt = `You are a preliminary verification assistant for a Bangladesh citizen information website.
Analyze this submission and the matching reports.
Do not claim to browse the internet. Do not treat report count alone as proof.
Return JSON only:
{"flag":true/false,"confidence":0-100,"reason":"concise Bangla"}

Submission:
${JSON.stringify(submission)}

Matching reports:
${JSON.stringify(reports.slice(-5))}

Matching report count: ${reportCount}`;

      const result = await model(prompt, {
        max_new_tokens: 160,
        do_sample: false,
        return_full_text: false
      });

      const text = (result?.[0]?.generated_text || '').trim();
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const p = JSON.parse(match[0]);
          return {
            mode: 'local_ai',
            flag: p.flag === true,
            confidence: Math.max(0, Math.min(100, Number(p.confidence || 0))),
            reason: p.reason || 'Local AI preliminary review completed.'
          };
        } catch {}
      }
    } catch (err) {
      console.warn('Local AI unavailable:', err);
    }

    return { mode: 'local_fallback', ...fallbackCheck(submission, reports) };
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const v = category.value;
    if (!v) {
      status.hidden = false;
      status.className = 'submit-status bad';
      status.textContent = 'Category নির্বাচন করুন।';
      return;
    }

    const base = {
      id: 'NH-' + Date.now().toString(36).toUpperCase(),
      category: v,
      reporterName: $('reporterName').value.trim(),
      details: $('details').value.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending_ai',
      aiFlag: false,
      adminStatus: 'pending'
    };

    if (v === 'bus') Object.assign(base, {
      from: $('busFrom').value.trim(),
      to: $('busTo').value.trim(),
      proposedValue: $('busFare').value.trim(),
      routeInfo: $('busRouteInfo').value.trim(),
      targetType: 'bus_fare'
    });

    if (v === 'market') Object.assign(base, {
      product: $('marketProduct').value.trim(),
      proposedValue: $('marketPrice').value.trim(),
      location: $('marketLocation').value.trim(),
      reportedDate: $('marketDate').value || today(),
      targetType: 'market_price'
    });

    if (v === 'new_info') Object.assign(base, {
      title: $('infoTitle').value.trim(),
      location: $('infoLocation').value.trim(),
      targetType: 'new_info'
    });

    const all = getAll();
    const key = duplicateKey(base);
    const reportCount = all.filter(x => duplicateKey(x) === key).length + 1;

    status.hidden = false;
    status.className = 'submit-status pending';

    const ai = await aiCheck(base, all, reportCount);

    base.reportCount = reportCount;
    base.aiFlag = ai.flag === true;
    base.aiConfidence = Number(ai.confidence || 0);
    base.aiReason = ai.reason || '';
    base.aiSources = [];
    base.aiMode = ai.mode;
    base.status = base.aiFlag ? 'ai_green' : 'pending_admin';

    all.push(base);
    saveAll(all);

    status.className = base.aiFlag ? 'submit-status good' : 'submit-status pending';
    status.innerHTML = base.aiFlag
      ? `🟢 <b>AI Green Flag</b> — ${reportCount}টি matching report পাওয়া গেছে। Local AI confidence: ${base.aiConfidence}%. এখন Admin final verification করবে।`
      : `🟡 <b>Pending Review</b> — ${reportCount}টি matching report পাওয়া গেছে। ${base.aiReason}`;

    form.reset();
    toggle();
  });
})();
