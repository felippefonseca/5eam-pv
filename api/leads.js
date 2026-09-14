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

var CSV_COLUMNS = [
  'data', 'nome', 'whatsapp', 'whatsapp_e164', 'email', 'perfil', 'funcionarios',
  'desafio', 'faturamento', 'origem', 'midia', 'campanha', 'conteudo', 'termo',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id',
  'gclid', 'fbclid', 'pagina', 'evento', 'user_agent', 'ip'
];

function limpaQuebras(valor) {
  if (valor === undefined || valor === null) return '';
  return String(valor).replace(/\r?\n/g, ' ').trim();
}

function csvCampo(valor) {
  var texto = limpaQuebras(valor);
  if (/[;"\n\r]/.test(texto)) {
    return '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

function csvLinha(lead) {
  return CSV_COLUMNS.map(function(coluna) {
    return csvCampo(lead[coluna]);
  }).join(';') + '\n';
}

function csvCabecalho() {
  return CSV_COLUMNS.join(';') + '\n';
}

function normalizaCsvAtual(conteudo) {
  var csv = conteudo || '';
  if (!csv.trim()) return csvCabecalho();
  if (csv.indexOf(CSV_COLUMNS[0] + ';') !== 0) csv = csvCabecalho() + csv;
  if (csv[csv.length - 1] !== '\n') csv += '\n';
  return csv;
}

function githubConfig() {
  var token = process.env.LEADS_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  return {
    token: token,
    owner: process.env.LEADS_GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER || 'felippefonseca',
    repo: process.env.LEADS_GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG || '5eam-pv',
    branch: process.env.LEADS_GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main',
    path: process.env.LEADS_CSV_PATH || 'data/leads.csv'
  };
}

async function githubFetch(url, config, options) {
  var resposta = await fetch(url, {
    method: options && options.method ? options.method : 'GET',
    headers: Object.assign({
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + config.token,
      'User-Agent': '5eam-leads-api',
      'X-GitHub-Api-Version': '2022-11-28'
    }, options && options.headers ? options.headers : {}),
    body: options && options.body
  });
  return resposta;
}

async function buscaCsvAtual(config) {
  var url = 'https://api.github.com/repos/' + encodeURIComponent(config.owner) +
    '/' + encodeURIComponent(config.repo) + '/contents/' +
    config.path.split('/').map(encodeURIComponent).join('/') +
    '?ref=' + encodeURIComponent(config.branch);
  var resposta = await githubFetch(url, config);
  if (resposta.status === 404) return { sha: null, content: '' };
  if (!resposta.ok) {
    return { error: true, status: resposta.status, body: await resposta.text() };
  }
  var arquivo = await resposta.json();
  return {
    sha: arquivo.sha,
    content: Buffer.from(String(arquivo.content || '').replace(/\n/g, ''), 'base64').toString('utf8')
  };
}

async function salvaNoGithub(lead) {
  var config = githubConfig();
  if (!config.token) {
    return { configured: false, saved: false, reason: 'LEADS_GITHUB_TOKEN_NOT_CONFIGURED' };
  }

  var url = 'https://api.github.com/repos/' + encodeURIComponent(config.owner) +
    '/' + encodeURIComponent(config.repo) + '/contents/' +
    config.path.split('/').map(encodeURIComponent).join('/');

  for (var tentativa = 0; tentativa < 3; tentativa++) {
    var atual = await buscaCsvAtual(config);
    if (atual.error) return { configured: true, saved: false, status: atual.status };

    var conteudo = normalizaCsvAtual(atual.content) + csvLinha(lead);
    var body = {
      message: 'Registra lead 5EAM' + (lead.nome ? ' - ' + limpaQuebras(lead.nome) : ''),
      content: Buffer.from(conteudo, 'utf8').toString('base64'),
      branch: config.branch
    };
    if (atual.sha) body.sha = atual.sha;

    var resposta = await githubFetch(url, config, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (resposta.status === 200 || resposta.status === 201) {
      return { configured: true, saved: true, path: config.path };
    }
    if (resposta.status !== 409) {
      return { configured: true, saved: false, status: resposta.status };
    }
  }

  return { configured: true, saved: false, status: 409 };
}

async function enviaWebhook(webhook, lead) {
  if (!webhook) return { configured: false, saved: false };
  var resposta = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toUrlEncoded(lead)
  });

  return { configured: true, saved: resposta.ok, status: resposta.status };
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

  lead.user_agent = lead.user_agent || req.headers['user-agent'] || '';
  lead.ip = lead.ip || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] || '';

  try {
    var github = await salvaNoGithub(lead);
    var legado = await enviaWebhook(webhook, lead);

    if (github.saved || legado.saved) {
      return res.status(200).json({ ok: true, saved: true, github: github, webhook: legado });
    }

    if (!github.configured && !legado.configured) {
      return res.status(202).json({ ok: true, saved: false, reason: 'LEADS_STORAGE_NOT_CONFIGURED' });
    }

    return res.status(502).json({ ok: false, saved: false, github: github, webhook: legado });
  } catch (err) {
    return res.status(502).json({ ok: false, saved: false });
  }
};
