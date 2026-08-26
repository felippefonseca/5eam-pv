(function(){
  'use strict';
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- animações de rolagem (GSAP + ScrollTrigger) ---------- */
  var temGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var alvos = document.querySelectorAll('.rv');

  if (!temGsap) {
    // sem CDN disponível: reveal simples via IntersectionObserver
    if (reduz || !('IntersectionObserver' in window)) {
      alvos.forEach(function(el){ el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function(entradas){
        entradas.forEach(function(e){
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      alvos.forEach(function(el){ io.observe(el); });
    }
  } else {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    // rede de segurança: aba em segundo plano ou rAF travado deixam a animação pela metade.
    // depois de um tempo, o que ainda estiver invisível é forçado ao estado final.
    var salvaVidas = function(){
      document.querySelectorAll('.rv, .hero-logo, .hero h1, .hero-sub, .microprova, .hero .btn-primary')
        .forEach(function(el){
          var e = getComputedStyle(el);
          if (e.display === 'none') return;
          if (parseFloat(e.opacity) < 0.98 || e.visibility === 'hidden') {
            gsap.set(el, { autoAlpha: 1, y: 0, scale: 1, clearProps: 'transform' });
          }
        });
      ScrollTrigger.refresh();
    };
    setTimeout(salvaVidas, 2600);
    // se a pessoa abriu em aba de fundo, a animação só começa ao voltar: reconfere ali também
    document.addEventListener('visibilitychange', function(){
      if (!document.hidden) setTimeout(salvaVidas, 2600);
    });
    document.documentElement.classList.add('gsap-on');
    gsap.defaults({ ease: 'power2.out', duration: 0.9 });

    var mm = gsap.matchMedia();

    /* --- quem prefere menos movimento vê tudo, sem animação --- */
    mm.add('(prefers-reduced-motion: reduce)', function(){
      gsap.set('.rv', { clearProps: 'all', opacity: 1, y: 0 });
      gsap.set('.narrativa .linha', { opacity: 1 });
    });

    mm.add('(prefers-reduced-motion: no-preference)', function(){

      /* --- entrada do hero --- */
      gsap.timeline({ defaults: { duration: 1, ease: 'power3.out' } })
        .from('.hero-logo', { y: 30, autoAlpha: 0, scale: 0.96, duration: 1.1 })
        .from('.kicker', { y: 18, autoAlpha: 0 }, '-=0.7')
        .from('.hero h1', { y: 26, autoAlpha: 0 }, '-=0.75')
        .from('.hero-sub', { y: 20, autoAlpha: 0 }, '-=0.7')
        .from('.hero-meta span', { y: 14, autoAlpha: 0, stagger: 0.1 }, '-=0.65')
        .from('.hero .btn-primary', { y: 14, autoAlpha: 0, scale: 0.96, ease: 'back.out(1.6)' }, '-=0.5')
        .from('.microprova', { autoAlpha: 0 }, '-=0.5');

      /* --- parallax do hero: só no desktop, no celular gera tremor --- */
      if (window.matchMedia('(min-width: 901px)').matches) {
        gsap.to('.hero-bg img', {
          yPercent: 14, scale: 1.06, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
        gsap.to('.hero .narrow', {
          y: -60, autoAlpha: 0.15, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 55%', scrub: true }
        });
      }

      /* --- reveal padrão de todo bloco .rv --- */
      gsap.set('.rv', { autoAlpha: 0, y: 34 });
      ScrollTrigger.batch('.rv', {
        start: 'top 92%',
        once: true,
        onEnter: function(lote){
          gsap.to(lote, { autoAlpha: 1, y: 0, duration: 0.9, overwrite: true,
            stagger: { amount: Math.min(0.5, lote.length * 0.09) } });
        }
      });

      /* --- grids em cascata --- */
      [['.pilar', 0.1], ['.sp', 0.06], ['.hosp-card', 0.07], ['.cond', 0.06], ['.logo-tile', 0.07], ['.esc', 0.08]]
        .forEach(function(par){
          var itens = gsap.utils.toArray(par[0]);
          if (!itens.length) return;
          gsap.set(itens, { autoAlpha: 0, y: 26 });
          ScrollTrigger.batch(itens, {
            start: 'top 90%', once: true,
            onEnter: function(lote){ gsap.to(lote, { autoAlpha: 1, y: 0, stagger: par[1], duration: 0.75 }); }
          });
        });

      /* --- parallax leve nas fotos: desktop apenas --- */
      if (window.matchMedia('(min-width: 901px)').matches) {
        gsap.utils.toArray('.galeria .foto img, .sergio-foto img, .local-fotos .foto img').forEach(function(img){
          gsap.fromTo(img, { yPercent: -6 }, {
            yPercent: 6, ease: 'none',
            scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
      }

      /* --- contador do +7.000 --- */
      var num = document.querySelector('.sergio-nums strong');
      if (num) {
        var alvo = { v: 0 };
        gsap.to(alvo, {
          v: 7000, duration: 1.6, ease: 'power2.out',
          scrollTrigger: { trigger: num, start: 'top 85%', once: true },
          onUpdate: function(){ num.textContent = '+' + Math.round(alvo.v).toLocaleString('pt-BR'); }
        });
      }

      /* --- card da oferta entra com peso --- */
      gsap.from('.card-oferta', {
        y: 40, scale: 0.96, autoAlpha: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.card-oferta', start: 'top 85%', once: true }
      });
      gsap.from('.preco .valor', {
        scale: 0.8, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.8)',
        scrollTrigger: { trigger: '.card-oferta', start: 'top 70%', once: true }
      });

      /* --- varredura do ponteiro, como painel de carro ao ligar --- */
      ScrollTrigger.create({
        trigger: '.medidor', start: 'top 80%', once: true,
        onEnter: function(){
          var estado = { g: 0 };
          gsap.timeline()
            .to(estado, {
              g: 100, duration: 0.75, ease: 'power2.inOut',
              onUpdate: function(){
                ponteiro.style.transform = 'rotate(' + (-90 + estado.g * 1.8) + 'deg)';
                arco.style.strokeDashoffset = 377 - (377 * estado.g / 100);
              }
            })
            .to(estado, {
              g: 0, duration: 0.9, ease: 'power2.inOut',
              onUpdate: function(){
                ponteiro.style.transform = 'rotate(' + (-90 + estado.g * 1.8) + 'deg)';
                arco.style.strokeDashoffset = 377 - (377 * estado.g / 100);
              },
              onComplete: atualizaMedidor
            });
        }
      });
      /* --- títulos revelados palavra a palavra --- */
      function fatiaPalavras(el){
        if (el.dataset.fatiado) return;
        var partes = [];
        Array.prototype.slice.call(el.childNodes).forEach(function(no){
          if (no.nodeType === 3) {
            no.textContent.split(/(\s+)/).forEach(function(t){
              if (t.trim() === '') { partes.push(document.createTextNode(t)); return; }
              var fora = document.createElement('span'); fora.className = 'w';
              var dentro = document.createElement('span'); dentro.className = 'wi';
              dentro.textContent = t; fora.appendChild(dentro); partes.push(fora);
            });
          } else {
            var fora2 = document.createElement('span'); fora2.className = 'w';
            var dentro2 = document.createElement('span'); dentro2.className = 'wi';
            dentro2.appendChild(no.cloneNode(true)); fora2.appendChild(dentro2); partes.push(fora2);
          }
        });
        el.textContent = '';
        partes.forEach(function(x){ el.appendChild(x); });
        el.dataset.fatiado = '1';
      }

      /* no celular o corte palavra a palavra atrapalha a quebra de linha e pesa a rolagem */
      if (window.matchMedia('(min-width: 901px)').matches) {
        gsap.utils.toArray('section h2').forEach(function(t){
          fatiaPalavras(t);
          gsap.from(t.querySelectorAll('.wi'), {
            yPercent: 110, autoAlpha: 0, duration: 0.75, ease: 'power3.out', stagger: 0.035,
            scrollTrigger: { trigger: t, start: 'top 88%', once: true }
          });
        });
      } else {
        gsap.utils.toArray('section h2').forEach(function(t){
          gsap.from(t, {
            y: 18, autoAlpha: 0, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: t, start: 'top 92%', once: true }
          });
        });
      }

      /* --- narrativa da virada: uma linha por vez --- */
      var linhas = gsap.utils.toArray('.narrativa .linha');
      if (linhas.length) {
        mm.add('(min-width: 900px)', function(){
          var tl = gsap.timeline({
            scrollTrigger: {
              trigger: '.virada', start: 'top top', end: '+=' + (linhas.length * 45) + '%',
              pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1
            }
          });
          linhas.forEach(function(l, i){
            tl.to(l, { autoAlpha: 1, duration: 0.5 }, i * 0.7)
              .to(l, { autoAlpha: 0.18, duration: 0.5 }, i * 0.7 + 0.85);
          });
          tl.to(linhas[linhas.length - 1], { autoAlpha: 1, duration: 0.3 });
          return function(){ gsap.set(linhas, { clearProps: 'opacity,visibility' }); };
        });
        mm.add('(max-width: 899px)', function(){
          linhas.forEach(function(l){
            gsap.to(l, { autoAlpha: 1, duration: 0.6,
              scrollTrigger: { trigger: l, start: 'top 80%', once: true } });
          });
        });
      }

      /* --- linha do tempo: controlada pelo script base para funcionar mesmo sem CDN --- */

      /* --- esteira infinita das logos de patrocinador --- */
      var trilho = document.querySelector('.marquee-track');
      if (trilho) {
        var loop = gsap.to(trilho, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
        var caixa = trilho.parentNode;
        caixa.addEventListener('mouseenter', function(){ gsap.to(loop, { timeScale: 0, duration: 0.4 }); });
        caixa.addEventListener('mouseleave', function(){ gsap.to(loop, { timeScale: 1, duration: 0.4 }); });
      }

      /* --- CTA principal com leve atração do cursor (só desktop com mouse) --- */
      mm.add('(min-width: 900px) and (pointer: fine)', function(){
        gsap.utils.toArray('.card-oferta .btn-primary, .hero .btn-primary').forEach(function(b){
          var xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' });
          var yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
          b.addEventListener('mousemove', function(e){
            var r = b.getBoundingClientRect();
            xTo(gsap.utils.clamp(-10, 10, (e.clientX - (r.left + r.width / 2)) * 0.18));
            yTo(gsap.utils.clamp(-8, 8, (e.clientY - (r.top + r.height / 2)) * 0.3));
          });
          b.addEventListener('mouseleave', function(){ xTo(0); yTo(0); });
        });
      });
    });

    /* --- recalcula depois que as imagens carregam --- */
    window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
  }

  /* ---------- progresso de leitura + topbar compacta ---------- */
  var barra = document.getElementById('progresso');
  var topo = document.querySelector('.topbar');
  var tick = false;
  function aoRolar(){
    var alt = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.scrollY || window.pageYOffset;
    barra.style.width = (alt > 0 ? (y / alt) * 100 : 0) + '%';
    topo.classList.toggle('compacta', y > 80);
    tick = false;
  }
  window.addEventListener('scroll', function(){
    if (!tick) { window.requestAnimationFrame(aoRolar); tick = true; }
  }, { passive: true });
  aoRolar();
  if (temGsap) {
    gsap.to(barra, {
      width: '100%', ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.25 }
    });
  }

  /* ---------- linha do tempo das edições ---------- */
  function setupLinhaTempo(){
    var trilha = document.querySelector('.linha-tempo');
    if (!trilha) return;
    var itens = Array.prototype.slice.call(trilha.querySelectorAll('.edicao'));
    if (!itens.length) return;

	    if (reduz) {
	      trilha.style.setProperty('--progress', '1');
	      itens.forEach(function(item){ item.classList.add('is-active'); });
	      return;
	    }

    document.documentElement.classList.add('timeline-ready');
    var timelineTick = false;

    function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

	    function atualizaLinhaTempo(){
	      var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
	      var viewport = window.innerHeight || document.documentElement.clientHeight || 1;
	      var caneta = scrollTop + viewport * 0.58;
	      var pinos = itens.map(function(item){ return item.querySelector('.timeline-pin') || item; });
	      var primeiro = pinos[0].getBoundingClientRect();
	      var ultimo = pinos[pinos.length - 1].getBoundingClientRect();
	      var topoLinha = primeiro.top + scrollTop + primeiro.height / 2;
	      var baseLinha = ultimo.top + scrollTop + ultimo.height / 2;
	      var progresso = clamp((caneta - topoLinha) / Math.max(1, baseLinha - topoLinha), 0, 1);

	      trilha.style.setProperty('--progress', progresso.toFixed(4));
	      itens.forEach(function(item){
	        var pin = item.querySelector('.timeline-pin') || item;
	        var pinRect = pin.getBoundingClientRect();
	        var marcador = pinRect.top + scrollTop + pinRect.height / 2;
	        if (caneta >= marcador) item.classList.add('is-active');
	      });
      timelineTick = false;
    }

    function pedirAtualizacao(){
      if (!timelineTick) {
        window.requestAnimationFrame(atualizaLinhaTempo);
        timelineTick = true;
      }
    }

    window.addEventListener('scroll', pedirAtualizacao, { passive: true });
    window.addEventListener('resize', pedirAtualizacao);
    window.addEventListener('load', pedirAtualizacao);
    atualizaLinhaTempo();
  }
  setupLinhaTempo();

  /* ---------- medidor de improviso ---------- */
  var dores = document.querySelectorAll('#dores input');
  var ponteiro = document.getElementById('ponteiro');
  var arco = document.getElementById('arco');
  var pct = document.getElementById('gaugePct');
  var label = document.getElementById('gaugeLabel');
  var msg = document.getElementById('gaugeMsg');
  var faixas = [
    { t:'Marque as situações da lista', m:'O medidor mostra o quanto a sua oficina ainda depende de você para funcionar.' },
    { t:'Dependência baixa', m:'Boa parte da operação já anda sem você. O próximo passo é transformar isso em processo e direção de longo prazo.' },
    { t:'Dependência moderada', m:'A oficina funciona, mas ainda pede a sua presença nas decisões do dia a dia. É aqui que o crescimento costuma travar.' },
    { t:'Dependência alta', m:'A operação gira em torno de você. Faturar mais nesse formato significa trabalhar mais, e não crescer com liberdade.' },
    { t:'Improviso no limite', m:'Você é o gargalo do próprio negócio. Dois dias fora da operação, com clareza sobre o que mudar, valem mais do que mais um mês apagando incêndio.' }
  ];
  function atualizaMedidor(){
    var total = dores.length, marcadas = 0;
    dores.forEach(function(i){ if (i.checked) marcadas++; });
    var p = Math.round(marcadas / total * 100);
    pct.textContent = p;
    ponteiro.style.transform = 'rotate(' + (-90 + (p * 1.8)) + 'deg)';
    arco.style.strokeDashoffset = 377 - (377 * p / 100);
    var f = marcadas === 0 ? 0 : (marcadas <= 1 ? 1 : marcadas <= 3 ? 2 : marcadas <= 4 ? 3 : 4);
    mostraVeredito(marcadas, total);
    label.textContent = faixas[f].t;
    label.style.color = f >= 4 ? '#FF6472' : (f === 3 ? '#0066FF' : '#00B2FF');
    msg.textContent = faixas[f].m;
  }
  var veredito = document.getElementById('veredito');
  var vTitulo = document.getElementById('veredito-titulo');
  var vAberto = false;
  function mostraVeredito(marcadas, total){
    if (marcadas >= 3) {
      vTitulo.textContent = 'Você marcou ' + marcadas + ' de ' + total + '.';
      if (!vAberto) {
        vAberto = true;
        veredito.hidden = false;
        if (typeof window.gsap !== 'undefined') {
          gsap.fromTo(veredito, { autoAlpha: 0, y: -8, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 },
            { autoAlpha: 1, y: 0, height: 'auto', marginBottom: 18, paddingTop: 16, paddingBottom: 16, duration: 0.5, ease: 'power2.out' });
        }
      }
    } else if (vAberto) {
      vAberto = false;
      if (typeof window.gsap !== 'undefined') {
        gsap.to(veredito, { autoAlpha: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, duration: 0.35,
          onComplete: function(){ veredito.hidden = true; gsap.set(veredito, { clearProps: 'all' }); } });
      } else { veredito.hidden = true; }
    }
  }

  dores.forEach(function(i){ i.addEventListener('change', atualizaMedidor); });
  atualizaMedidor();

  /* ---------- calculadora de retorno ---------- */
  var INGRESSO = 397;
  var ticket = document.getElementById('ticket');
  var ticketVal = document.getElementById('ticketVal');
  var qtd = document.getElementById('qtd');
  var brl = function(v){ return 'R$ ' + v.toLocaleString('pt-BR'); };
  function atualizaCalc(){
    var v = parseInt(ticket.value, 10);
    ticketVal.textContent = brl(v);
    var n = Math.ceil(INGRESSO / v);
    qtd.textContent = n;
    qtd.parentNode.childNodes[1].nodeValue = n === 1 ? ' serviço' : ' serviços';
  }
  ticket.addEventListener('input', atualizaCalc);
  atualizaCalc();

  /* ---------- perfis ---------- */
  var perfis = [
    { n:'Dono de oficina', t:'Clareza sobre gestão, liderança, mercado e próximos passos. Você sai da imersão sabendo qual decisão precisa tomar primeiro para a oficina depender menos de você.', r:'Ingresso 5º EAM' },
    { n:'Sócio', t:'Alinhamento estratégico para tomar decisões junto com o dono e acelerar a evolução do negócio, sem puxar a operação para lados diferentes.', r:'Ingresso 5º EAM' },
    { n:'Gestor ou gerente', t:'Visão mais ampla sobre operação, equipe, produtividade e crescimento, para conduzir a rotina com critério e não apenas apagar incêndio.', r:'Ingresso 5º EAM · consulte condição para equipe' },
    { n:'Sucessor familiar', t:'Repertório para assumir mais responsabilidade e construir uma nova fase para a empresa, com segurança para propor mudanças.', r:'Ingresso 5º EAM' },
    { n:'Chefe de oficina ou mecânico líder', t:'Visão sobre liderança, produtividade, futuro técnico e profissionalização, para conduzir a equipe dentro da oficina.', r:'Consulte condição para equipe' },
    { n:'Responsável pelo financeiro', t:'Entendimento sobre decisões, gestão, caixa e crescimento, e sobre o papel estratégico de quem organiza a empresa junto com o dono.', r:'Consulte condição para dupla' }
  ];
  var pTitulo = document.getElementById('perfilTitulo');
  var pTexto = document.getElementById('perfilTexto');
  var pRec = document.getElementById('perfilRec');
  document.querySelectorAll('.perfil-btn').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.perfil-btn').forEach(function(o){ o.setAttribute('aria-selected','false'); });
      b.setAttribute('aria-selected','true');
      var d = perfis[parseInt(b.dataset.perfil, 10)];
      pTitulo.textContent = d.n; pTexto.textContent = d.t; pRec.textContent = d.r;
    });
  });

  /* ---------- modais ---------- */
  var ultimoFoco = null;
  function abrir(id){
    ultimoFoco = document.activeElement;
    var m = document.getElementById(id);
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    var f = m.querySelector('input, select, button:not(.modal-close), a');
    if (f) f.focus();
  }
  function fechar(){
    document.querySelectorAll('.modal.open').forEach(function(m){ m.classList.remove('open'); });
    document.body.style.overflow = '';
    if (ultimoFoco) ultimoFoco.focus();
  }
  document.addEventListener('click', function(e){
    var abrirForm = e.target.closest('[data-abrir-form]');
    if (abrirForm) { fechar(); abrir('modalForm'); return; }
    if (e.target.closest('[data-fechar]')) { fechar(); return; }
    if (e.target.closest('[data-abrir-privacidade]')) { fechar(); abrir('modalPriv'); return; }
    var sp = e.target.closest('.sp');
    if (sp) {
      document.getElementById('spTitulo').textContent = sp.dataset.nome;
      document.getElementById('spTema').textContent = sp.dataset.tema;
      document.getElementById('spPapel').textContent = sp.dataset.papel;
      document.getElementById('spLeva').textContent = sp.dataset.leva;
      abrir('modalSp');
    }
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') fechar(); });

  /* ---------- validação e máscaras do formulário ---------- */
  // Comercial: (11) 91349-6405. PREENCHER apenas se houver link direto de checkout.
  var ZAP = '5511913496405';

  var DDDS = [11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,
              41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,
              71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];

  var DOMINIOS_ERRADOS = {
    'gmail.co':'gmail.com','gmail.con':'gmail.com','gmail.com.br':'gmail.com','gmai.com':'gmail.com',
    'gmial.com':'gmail.com','gmaill.com':'gmail.com','gnail.com':'gmail.com','gamil.com':'gmail.com',
    'hotmai.com':'hotmail.com','hotmial.com':'hotmail.com','hotmail.con':'hotmail.com','homail.com':'hotmail.com',
    'hotmil.com':'hotmail.com','hotmail.co':'hotmail.com','outlok.com':'outlook.com','outllok.com':'outlook.com',
    'outlook.con':'outlook.com','yaho.com':'yahoo.com','yahoo.con':'yahoo.com','yahoo.com.b':'yahoo.com.br',
    'uol.com':'uol.com.br','bol.com':'bol.com.br','terra.com':'terra.com.br','icloud.co':'icloud.com'
  };

  function elemento(id){ return document.getElementById(id); }
  function campoDe(id){ return elemento(id).closest('.campo'); }

  function marca(id, mensagem){
    var c = campoDe(id);
    c.classList.toggle('campo-erro', !!mensagem);
    c.classList.toggle('campo-ok', !mensagem && elemento(id).value.trim() !== '');
    var span = c.querySelector('.erro');
    if (span) span.textContent = mensagem || '';
    return !mensagem;
  }

  /* --- máscara de telefone que preserva a posição do cursor --- */
  function formataTelefone(digitos){
    if (digitos.length === 0) return '';
    if (digitos.length <= 2) return '(' + digitos;
    var ddd = '(' + digitos.slice(0,2) + ') ';
    var resto = digitos.slice(2);
    if (resto.length <= 4) return ddd + resto;
    if (resto.length <= 8) return ddd + resto.slice(0,4) + '-' + resto.slice(4);
    return ddd + resto.slice(0,5) + '-' + resto.slice(5,9);
  }
  var zap = elemento('f-zap');
  zap.addEventListener('input', function(e){
    var el = e.target;
    var antesDoCursor = el.value.slice(0, el.selectionStart).replace(/\D/g,'').length;
    var digitos = el.value.replace(/\D/g,'').slice(0,11);
    el.value = formataTelefone(digitos);
    var pos = 0, contados = 0;
    while (pos < el.value.length && contados < antesDoCursor) {
      if (/\d/.test(el.value[pos])) contados++;
      pos++;
    }
    if (document.activeElement === el) el.setSelectionRange(pos, pos);
    if (campoDe('f-zap').classList.contains('campo-erro')) validaZap();
  });
  zap.addEventListener('blur', validaZap);

  function validaZap(){
    var d = zap.value.replace(/\D/g,'');
    if (d.length === 0) return marca('f-zap','Informe seu WhatsApp com DDD.');
    if (d.length < 11) return marca('f-zap','Faltam números. O WhatsApp tem 11 dígitos com DDD.');
    if (DDDS.indexOf(parseInt(d.slice(0,2),10)) === -1) return marca('f-zap','DDD ' + d.slice(0,2) + ' não existe. Confira o número.');
    if (d[2] !== '9') return marca('f-zap','Número de celular começa com 9 depois do DDD.');
    if (/^(\d)\1{8,}$/.test(d.slice(2))) return marca('f-zap','Esse número não parece válido.');
    return marca('f-zap','');
  }

  /* --- quanto falta para o encerramento das inscrições --- */
  var restam = document.getElementById('restam');
  if (restam) {
    var limite = new Date('2026-10-08T23:59:59-03:00');
    var dias = Math.ceil((limite - new Date()) / 86400000);
    if (dias > 1) restam.textContent = 'faltam ' + dias + ' dias';
    else if (dias === 1) restam.textContent = 'último dia';
    else if (dias === 0) restam.textContent = 'encerra hoje';
    else restam.textContent = 'inscrições encerradas';
  }

  /* --- nome --- */
  var nome = elemento('f-nome');
  nome.addEventListener('input', function(e){
    e.target.value = e.target.value.replace(/[0-9!@#$%^&*_=+\[\]{}<>\/\\|]/g,'').replace(/\s{2,}/g,' ');
    if (campoDe('f-nome').classList.contains('campo-erro')) validaNome();
  });
  nome.addEventListener('blur', function(){
    nome.value = nome.value.trim().replace(/\s+/g,' ');
    validaNome();
  });
  function validaNome(){
    var v = nome.value.trim();
    if (v === '') return marca('f-nome','Preencha seu nome.');
    if (v.length < 3) return marca('f-nome','Nome muito curto.');
    if (v.split(' ').filter(function(x){ return x.length > 1; }).length < 2)
      return marca('f-nome','Informe nome e sobrenome.');
    return marca('f-nome','');
  }

  /* --- e-mail, com sugestão de domínio digitado errado --- */
  var email = elemento('f-email');
  var boxSugestao = document.createElement('p');
  boxSugestao.className = 'sugestao';
  boxSugestao.innerHTML = 'Você quis dizer <button type="button" id="corrigeEmail"></button>?';
  campoDe('f-email').appendChild(boxSugestao);
  var sugerido = '';

  email.addEventListener('input', function(e){
    e.target.value = e.target.value.replace(/\s/g,'').toLowerCase();
    campoDe('f-email').classList.remove('campo-sugestao');
    if (campoDe('f-email').classList.contains('campo-erro')) validaEmail();
  });
  email.addEventListener('blur', validaEmail);
  document.getElementById('corrigeEmail').addEventListener('click', function(){
    email.value = sugerido;
    campoDe('f-email').classList.remove('campo-sugestao');
    validaEmail();
  });

  function validaEmail(){
    var v = email.value.trim().toLowerCase();
    if (v === '') return marca('f-email','Informe seu e-mail.');
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v)) return marca('f-email','E-mail incompleto. Confira se falta o @ ou o final .com.');
    var dominio = v.split('@')[1];
    if (dominio.indexOf('..') !== -1 || dominio[0] === '.') return marca('f-email','Domínio do e-mail inválido.');
    if (DOMINIOS_ERRADOS[dominio]) {
      sugerido = v.split('@')[0] + '@' + DOMINIOS_ERRADOS[dominio];
      document.getElementById('corrigeEmail').textContent = sugerido;
      campoDe('f-email').classList.add('campo-sugestao');
    }
    return marca('f-email','');
  }

  /* --- cidade e UF --- */
  var cidade = elemento('f-cidade');
  cidade.addEventListener('input', function(e){
    e.target.value = e.target.value.replace(/[0-9!@#$%^&*_=+\[\]{}<>\/\\|]/g,'');
    if (campoDe('f-cidade').classList.contains('campo-erro')) validaCidade();
  });
  cidade.addEventListener('blur', function(){ cidade.value = cidade.value.trim(); validaCidade(); });
  function validaCidade(){
    var v = cidade.value.trim();
    if (v === '') return marca('f-cidade','Informe sua cidade.');
    if (v.length < 3) return marca('f-cidade','Cidade muito curta.');
    return marca('f-cidade','');
  }

  /* --- selects --- */
  var selects = ['f-uf','f-perfil','f-func','f-desafio'];
  var rotulos = { 'f-uf':'Selecione o estado.', 'f-perfil':'Selecione seu papel na oficina.',
                  'f-func':'Selecione o número de funcionários.', 'f-desafio':'Selecione seu principal desafio.' };
  selects.forEach(function(id){
    var el = elemento(id);
    el.addEventListener('change', function(){ marca(id, el.value ? '' : rotulos[id]); });
    el.addEventListener('blur', function(){ if (campoDe(id).classList.contains('campo-erro')) marca(id, el.value ? '' : rotulos[id]); });
  });

  /* --- envio: grava na planilha e leva para o checkout --- */
  // PREENCHER: cole aqui a URL do app da web publicado pelo Google Apps Script.
  var PLANILHA = '';
  var CHECKOUT = 'https://pay.hotmart.com/M102252055U';

  function parametro(nome){
    return new URLSearchParams(window.location.search).get(nome) || '';
  }

  function gravaNaPlanilha(dados){
    if (!PLANILHA) return;
    var corpo = new URLSearchParams(dados);
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(PLANILHA, new Blob([corpo.toString()], { type: 'application/x-www-form-urlencoded' }));
      } else {
        fetch(PLANILHA, { method: 'POST', mode: 'no-cors', keepalive: true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: corpo.toString() });
      }
    } catch (err) { /* nunca travar a venda por causa do registro */ }
  }

  document.getElementById('btnEnviar').addEventListener('click', function(){
    var ok = [validaNome(), validaZap(), validaEmail(), validaCidade()].every(Boolean);
    selects.forEach(function(id){ if (!marca(id, elemento(id).value ? '' : rotulos[id])) ok = false; });
    if (!ok) {
      var primeiro = document.querySelector('.campo-erro input, .campo-erro select');
      if (primeiro) { primeiro.focus(); primeiro.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }

    var digitos = zap.value.replace(/\D/g, '');
    var dados = {
      data: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome: nome.value.trim(),
      whatsapp: zap.value,
      whatsapp_e164: '55' + digitos,
      email: email.value.trim(),
      cidade: cidade.value.trim(),
      uf: elemento('f-uf').value,
      perfil: elemento('f-perfil').value,
      funcionarios: elemento('f-func').value,
      desafio: elemento('f-desafio').value,
      faturamento: elemento('f-fat').value,
      origem: parametro('utm_source'),
      campanha: parametro('utm_campaign'),
      conteudo: parametro('utm_content'),
      pagina: window.location.href,
      evento: '5EAM'
    };

    gravaNaPlanilha(dados);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'lead_5eam', perfil: dados.perfil, funcionarios: dados.funcionarios, desafio: dados.desafio, uf: dados.uf });
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', { content_name: '5EAM', value: 397, currency: 'BRL' });
      window.fbq('track', 'InitiateCheckout', { content_name: '5EAM', value: 397, currency: 'BRL' });
    }

    // checkout já preenchido com os dados da pessoa
    var url = CHECKOUT + '?name=' + encodeURIComponent(dados.nome)
            + '&email=' + encodeURIComponent(dados.email)
            + '&phonenumber=' + encodeURIComponent(dados.whatsapp_e164)
            + '&sck=' + encodeURIComponent(dados.origem ? 'site-5eam-' + dados.origem : 'site-5eam');

    var msg = 'Olá! Acabei de me inscrever no 5º EAM (R$ 397) e quero tirar uma dúvida.'
      + '\nNome: ' + dados.nome + '\nCidade: ' + dados.cidade + '/' + dados.uf;
    document.getElementById('linkZap').href = 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(msg);
    document.getElementById('linkCheckout').href = url;
    document.getElementById('camposForm').style.display = 'none';
    document.getElementById('formOk').style.display = 'block';

    setTimeout(function(){ window.location.href = url; }, 900);
  });

  /* --- Enter envia o formulário --- */
  document.querySelectorAll('#camposForm input, #camposForm select').forEach(function(el){
    el.addEventListener('keydown', function(e){
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btnEnviar').click(); }
    });
  });

})();
