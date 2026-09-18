/*!
 * Gamifica E-commerce — Widget de captura de leads (v1)
 * Script único e leve (<15KB), sem dependências externas.
 * Instalado via GTM (tag HTML personalizado) na loja do lojista.
 */
(function () {
  'use strict';

  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var CHAVE_PUBLICA = scriptTag.getAttribute('data-gamifica-key');
  var API_ORIGEM = (function () {
    try {
      return new URL(scriptTag.src).origin;
    } catch {
      return '';
    }
  })();

  if (!CHAVE_PUBLICA || !API_ORIGEM) {
    console.warn('[Gamifica] Chave pública ou origem da API ausente. Widget não iniciado.');
    return;
  }

  window.dataLayer = window.dataLayer || [];

  var COOKIE_ORIGEM = 'gmf_origem';
  var COOKIE_CONVERTEU = 'gmf_convertido';
  var DIAS_EXPIRACAO_ORIGEM = 7;

  // ---------------------------------------------------------------------
  // Cookies first-party
  // ---------------------------------------------------------------------
  function setCookie(nome, valor, dias) {
    var expira = '';
    if (dias) {
      var d = new Date();
      d.setTime(d.getTime() + dias * 24 * 60 * 60 * 1000);
      expira = '; expires=' + d.toUTCString();
    }
    document.cookie = nome + '=' + encodeURIComponent(valor) + expira + '; path=/; SameSite=Lax';
  }

  function getCookie(nome) {
    var partes = document.cookie.split('; ');
    for (var i = 0; i < partes.length; i++) {
      var par = partes[i].split('=');
      if (par[0] === nome) return decodeURIComponent(par[1] || '');
    }
    return null;
  }

  // ---------------------------------------------------------------------
  // UTMs
  // ---------------------------------------------------------------------
  function lerUtms() {
    var params = new URLSearchParams(window.location.search);
    var utms = {
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmTerm: params.get('utm_term') || '',
      utmContent: params.get('utm_content') || '',
      campanhaId: params.get('gmf_campanha') || ''
    };
    var temUtm = utms.utmSource || utms.utmMedium || utms.utmCampaign;
    if (temUtm) {
      setCookie(COOKIE_ORIGEM, JSON.stringify(utms), DIAS_EXPIRACAO_ORIGEM);
      return utms;
    }
    var salvo = getCookie(COOKIE_ORIGEM);
    if (salvo) {
      try { return JSON.parse(salvo); } catch { /* ignora JSON invalido */ }
    }
    return utms;
  }

  var origem = lerUtms();

  // ---------------------------------------------------------------------
  // Eventos no dataLayer
  // ---------------------------------------------------------------------
  window.dataLayer.push({
    event: 'page_view',
    gamifica: {
      chavePublica: CHAVE_PUBLICA,
      utmSource: origem.utmSource,
      utmMedium: origem.utmMedium,
      utmCampaign: origem.utmCampaign
    }
  });

  if (origem.campanhaId) {
    window.dataLayer.push({
      event: 'campaign_viewed',
      gamifica: { campanhaId: origem.campanhaId }
    });
  }

  // ---------------------------------------------------------------------
  // Pop-up de demonstração (Shadow DOM — estilos isolados da página host)
  // ---------------------------------------------------------------------
  function jaConverteu() {
    return getCookie(COOKIE_CONVERTEU) === '1';
  }

  function montarPopup() {
    if (jaConverteu()) return;
    if (document.getElementById('gmf-host')) return;

    var host = document.createElement('div');
    host.id = 'gmf-host';
    document.body.appendChild(host);
    var raiz = host.attachShadow({ mode: 'open' });

    raiz.innerHTML =
      '<style>' +
      ':host{all:initial}' +
      '.gmf-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:2147483000;font-family:-apple-system,Segoe UI,Roboto,sans-serif;animation:gmf-fade .2s ease}' +
      '@keyframes gmf-fade{from{opacity:0}to{opacity:1}}' +
      '.gmf-card{background:#fff;border-radius:16px;max-width:360px;width:calc(100% - 32px);padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative}' +
      '.gmf-close{position:absolute;top:12px;right:12px;border:none;background:#f1f5f9;color:#334155;width:28px;height:28px;border-radius:50%;font-size:16px;line-height:1;cursor:pointer}' +
      '.gmf-title{font-size:18px;font-weight:700;color:#0f172a;margin:0 0 6px}' +
      '.gmf-sub{font-size:13px;color:#64748b;margin:0 0 16px}' +
      '.gmf-field{margin-bottom:10px}' +
      '.gmf-field input[type=text],.gmf-field input[type=email],.gmf-field input[type=tel]{width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px}' +
      '.gmf-check{display:flex;gap:8px;align-items:flex-start;font-size:12px;color:#475569;margin-bottom:8px}' +
      '.gmf-check input{margin-top:2px}' +
      '.gmf-btn{width:100%;background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer}' +
      '.gmf-btn:disabled{opacity:.6;cursor:default}' +
      '.gmf-msg{font-size:13px;margin-top:10px;text-align:center}' +
      '.gmf-msg.ok{color:#059669}' +
      '.gmf-msg.err{color:#dc2626}' +
      '.gmf-hp{position:absolute;left:-9999px;opacity:0}' +
      '</style>' +
      '<div class="gmf-overlay" id="gmf-overlay">' +
      '<div class="gmf-card">' +
      '<button class="gmf-close" id="gmf-close" aria-label="Fechar">&times;</button>' +
      '<p class="gmf-title">Ganhe um cupom exclusivo!</p>' +
      '<p class="gmf-sub">Deixe seu contato e receba uma oferta especial.</p>' +
      '<form id="gmf-form">' +
      '<div class="gmf-field"><input type="text" name="nome" placeholder="Seu nome" autocomplete="name"></div>' +
      '<div class="gmf-field"><input type="email" name="email" placeholder="Seu e-mail" required autocomplete="email"></div>' +
      '<div class="gmf-field"><input type="tel" name="telefone" placeholder="Telefone (opcional)" autocomplete="tel"></div>' +
      '<input class="gmf-hp" type="text" name="empresa" tabindex="-1" autocomplete="off">' +
      '<label class="gmf-check"><input type="checkbox" name="consentimentoParticipacao" required> Concordo em participar desta campanha.</label>' +
      '<label class="gmf-check"><input type="checkbox" name="consentimentoMarketing"> Quero receber novidades e ofertas por e-mail.</label>' +
      '<button class="gmf-btn" type="submit" id="gmf-submit">Quero meu cupom</button>' +
      '<div class="gmf-msg" id="gmf-msg"></div>' +
      '</form>' +
      '</div>' +
      '</div>';

    function fechar() {
      host.remove();
    }

    raiz.getElementById('gmf-close').addEventListener('click', fechar);
    raiz.getElementById('gmf-overlay').addEventListener('click', function (e) {
      if (e.target && e.target.id === 'gmf-overlay') fechar();
    });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        fechar();
        document.removeEventListener('keydown', onEsc);
      }
    });

    raiz.getElementById('gmf-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      var botao = raiz.getElementById('gmf-submit');
      var msg = raiz.getElementById('gmf-msg');
      botao.disabled = true;
      msg.textContent = '';
      msg.className = 'gmf-msg';

      var payload = {
        nome: form.nome.value || undefined,
        email: form.email.value,
        telefone: form.telefone.value || undefined,
        empresa: form.empresa.value,
        consentimentoParticipacao: form.consentimentoParticipacao.checked,
        consentimentoMarketing: form.consentimentoMarketing.checked,
        campanhaId: origem.campanhaId || undefined,
        utmSource: origem.utmSource || undefined,
        utmMedium: origem.utmMedium || undefined,
        utmCampaign: origem.utmCampaign || undefined,
        utmTerm: origem.utmTerm || undefined,
        utmContent: origem.utmContent || undefined
      };

      fetch(API_ORIGEM + '/v1/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gamifica-Public-Key': CHAVE_PUBLICA
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('erro_' + res.status);
          return res.json();
        })
        .then(function () {
          setCookie(COOKIE_CONVERTEU, '1', 30);
          window.dataLayer.push({
            event: 'lead_captured',
            gamifica: { chavePublica: CHAVE_PUBLICA, campanhaId: origem.campanhaId || null }
          });
          msg.textContent = 'Recebemos seus dados! Confira seu e-mail em breve.';
          msg.className = 'gmf-msg ok';
          setTimeout(fechar, 2500);
        })
        .catch(function () {
          msg.textContent = 'Não foi possível enviar agora. Tente novamente.';
          msg.className = 'gmf-msg err';
          botao.disabled = false;
        });
    });
  }

  // ---------------------------------------------------------------------
  // Lazy-init: primeira interação do usuário OU 5s de inatividade,
  // o que ocorrer primeiro — nunca bloqueia o LCP inicial da página.
  // ---------------------------------------------------------------------
  var iniciado = false;
  function iniciarPopupUmaVez() {
    if (iniciado) return;
    iniciado = true;
    montarPopup();
    ['scroll', 'click', 'keydown', 'touchstart', 'mousemove'].forEach(function (evt) {
      window.removeEventListener(evt, iniciarPopupUmaVez);
    });
  }

  ['scroll', 'click', 'keydown', 'touchstart', 'mousemove'].forEach(function (evt) {
    window.addEventListener(evt, iniciarPopupUmaVez, { once: true, passive: true });
  });
  setTimeout(iniciarPopupUmaVez, 5000);
})();
