function readRawBody(req) {
  return new Promise(function(resolve, reject) {
    var chunks = [];
    req.on('data', function(chunk) { chunks.push(chunk); });
    req.on('end', function() { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

function normalizaBody(req, raw) {
  if (req.body && typeof req.body === 'object') return req.body;
  var type = String(req.headers['content-type'] || '');
  if (type.indexOf('application/json') !== -1) {
    try { return JSON.parse(raw || '{}'); } catch (err) { return {}; }
  }
  var dados = {};
  new URLSearchParams(raw || '').forEach(function(valor, chave) {
    dados[chave] = valor;
  });
  return dados;
}

function toUrlEncoded(dados) {
  var params = new URLSearchParams();
  Object.keys(dados || {}).forEach(function(chave) {
    var valor = dados[chave];
    if (valor !== undefined && valor !== null) params.set(chave, String(valor));
  });
  return params.toString();
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  var webhook = process.env.LEADS_WEBHOOK_URL;
  var raw = '';
  if (typeof req.body === 'string') raw = req.body;
  else if (!req.body) raw = await readRawBody(req);
  var lead = normalizaBody(req, raw);

  if (!lead.data) {
    lead.data = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }

  if (!webhook) {
    return res.status(202).json({ ok: true, saved: false, reason: 'LEADS_WEBHOOK_URL_NOT_CONFIGURED' });
  }

  try {
    var resposta = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: toUrlEncoded(lead)
    });

    if (!resposta.ok) {
      return res.status(502).json({ ok: false, saved: false, status: resposta.status });
    }

    return res.status(200).json({ ok: true, saved: true });
  } catch (err) {
    return res.status(502).json({ ok: false, saved: false });
  }
};
