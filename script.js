/* =========================================================
   Rodrigues Advocacia — scripts
   ========================================================= */

// Marca que o JS está ativo (as animações só rodam com JS)
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const menuToggle = document.getElementById('menuToggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu mobile ---------- */
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    menuToggle.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };

  menuToggle.addEventListener('click', () => {
    setMenu(!nav.classList.contains('is-open'));
  });

  // Fecha ao clicar num link
  nav.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => setMenu(false))
  );

  // Fecha com ESC ou clique fora
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) setMenu(false);
  });

  /* ---------- Sombra no cabeçalho ao rolar ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Link ativo no menu conforme a seção ---------- */
  // Só na página inicial (links do tipo "#areas")
  const navLinks = [...document.querySelectorAll('.nav__link')]
    .filter((link) => link.getAttribute('href').startsWith('#'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        navLinks.forEach((link) =>
          link.classList.toggle('is-active', link.getAttribute('href') === id)
        );
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- Animação de entrada ---------- */
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    },
    // Aparece assim que o topo do bloco entra na tela
    // (funciona também para blocos muito altos, como o texto das áreas no celular)
    { threshold: 0, rootMargin: '0px 0px -60px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ---------- Contadores animados ---------- */
  const formatNumber = (n) => n.toLocaleString('pt-BR');

  const animateCounter = (el) => {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const render = (value) => (el.textContent = prefix + formatNumber(value) + suffix);

    if (reduceMotion) return render(target);

    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      render(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));

  /* ---------- Carrossel ---------- */
  const carousel = document.getElementById('carousel');
  if (carousel) {
    const slides = [...carousel.querySelectorAll('.carousel__slide')];
    const dotsBox = carousel.querySelector('.carousel__dots');
    const INTERVAL = 5000; // tempo de cada foto (ms)
    let current = 0;
    let timer = null;

    // Cria as bolinhas automaticamente (uma por foto)
    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir para a foto ${i + 1}`);
      dot.addEventListener('click', () => { goTo(i); restart(); });
      dotsBox.appendChild(dot);
      return dot;
    });

    const goTo = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((s, i) => {
        const active = i === current;
        s.classList.toggle('is-active', active);
        s.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === current);
        d.setAttribute('aria-selected', String(i === current));
      });
    };

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    const start = () => {
      if (reduceMotion || timer) return;
      timer = setInterval(next, INTERVAL);
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const restart = () => { stop(); start(); };

    carousel.querySelector('.carousel__arrow--next').addEventListener('click', () => { next(); restart(); });
    carousel.querySelector('.carousel__arrow--prev').addEventListener('click', () => { prev(); restart(); });

    // Pausa quando o mouse está em cima ou quando algo dentro dele tem foco
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);

    // Setas do teclado
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { next(); restart(); }
      if (e.key === 'ArrowLeft') { prev(); restart(); }
    });

    // Arrastar com o dedo (celular)
    let touchX = null;
    carousel.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; stop(); }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const diff = e.changedTouches[0].clientX - touchX;
      if (Math.abs(diff) > 40) (diff < 0 ? next : prev)();
      touchX = null;
      start();
    });

    // Pausa quando a aba não está visível
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    goTo(0);
    start();
  }

  /* ---------- Formulário de contato ----------
     Para receber as mensagens por e-mail, crie um formulário grátis em
     https://formspree.io e cole o endereço dele aqui, por exemplo:
     const FORM_ENDPOINT = 'https://formspree.io/f/abcdwxyz';           */
  const FORM_ENDPOINT = '';

  const form = document.getElementById('contactForm');
  if (form) {
    const status = form.querySelector('.form__status');
    const submitBtn = form.querySelector('.form__submit');
    const phone = form.querySelector('#telefone');

    // Se veio de uma página de área, já deixa a área selecionada
    const areaFromUrl = new URLSearchParams(window.location.search).get('area');
    const areaSelect = form.querySelector('#area');
    if (areaFromUrl && areaSelect.querySelector(`option[value="${areaFromUrl}"]`)) {
      areaSelect.value = areaFromUrl;
    }

    // Máscara do telefone: (11) 91234-5678
    phone.addEventListener('input', () => {
      const d = phone.value.replace(/\D/g, '').slice(0, 11);
      let v = d;
      if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      phone.value = v;
    });

    const messages = {
      nome: 'Informe o seu nome.',
      email: 'Informe um e-mail válido.',
      telefone: 'Informe um telefone com DDD.',
      perfil: 'Selecione uma opção.',
    };

    const validate = (field) => {
      let ok = field.checkValidity();
      if (field.id === 'telefone') ok = field.value.replace(/\D/g, '').length >= 10;
      field.classList.toggle('is-invalid', !ok);
      const error = field.parentElement.querySelector('.form__error');
      if (error) error.textContent = ok ? '' : messages[field.id];
      return ok;
    };

    const required = [...form.querySelectorAll('[required]')];
    required.forEach((field) => {
      field.addEventListener('blur', () => validate(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) validate(field);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form__status';
      status.textContent = '';

      const invalid = required.filter((f) => !validate(f));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }

      if (!FORM_ENDPOINT) {
        status.classList.add('is-error');
        status.textContent = 'O envio ainda não foi configurado (veja FORM_ENDPOINT no script.js).';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error();
        form.reset();
        status.classList.add('is-success');
        status.textContent = 'Mensagem enviada! Em breve um dos nossos advogados entrará em contato.';
      } catch {
        status.classList.add('is-error');
        status.textContent = 'Não foi possível enviar agora. Tente novamente em alguns minutos.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
      }
    });
  }

  /* ---------- Login de usuário ----------
     Funciona de dois jeitos:
     1) SEM configurar nada: as contas ficam salvas no próprio navegador
        do visitante (bom para testar o fluxo; não serve para produção).
     2) COM Supabase (grátis em https://supabase.com): crie um projeto,
        rode o arquivo supabase.sql no SQL Editor, vá em
        Project Settings > API e cole aqui a URL e a "anon public key".
        Aí as contas e os casos passam a ficar num servidor de verdade.
        Veja o passo a passo no arquivo LEIA-ME-LOGIN.txt.              */
  const AUTH_CONFIG = {
    supabaseUrl: '',
    supabaseAnonKey: '',
  };

  initLogin(AUTH_CONFIG);

  /* ---------- Ano no rodapé ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});


/* =========================================================
   Login (cliente e advogado) — sessão e "backends"
   Os dois backends têm as mesmas funções:
     getUser, signIn, signUp, signOut, resetPassword,
     getCases, getClients, saveCase, addStep
   ========================================================= */
// Primeiro nome para exibir ("Dra. Ana Rodrigues" → "Dra. Ana")
const firstName = (name) => {
  const p = String(name || '').trim().split(/\s+/);
  return /^(dra?|sra?)\.?$/i.test(p[0]) && p[1] ? `${p[0]} ${p[1]}` : p[0];
};

// Cor de cada área (usada para destacar os casos)
const AREA_CORES = {
  'Direito tributário': '#1b8a6b',
  'Direito trabalhista': '#3a6fa5',
  'Direito civil': '#7b4fb0',
  'Direito empresarial': '#2c4f7c',
  'Direito previdenciário': '#c27c0e',
  'Família e sucessões': '#c2185b',
  'Direito penal': '#b23a3a',
  'Direito do consumidor': '#0f8fa8',
  'Direito imobiliário': '#8a5a2b',
  'Contencioso de grande volume': '#5b6573',
};
const corDaArea = (a) => AREA_CORES[a] || '#26727f';

const AREAS_DIREITO = [
  'Direito tributário', 'Direito trabalhista', 'Direito civil', 'Direito empresarial',
  'Direito previdenciário', 'Família e sucessões', 'Direito penal',
  'Direito do consumidor', 'Direito imobiliário', 'Contencioso de grande volume',
];

/* ----- Backend local (tudo salvo no navegador — só para testar) ----- */
function makeLocalBackend() {
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sem armazenamento */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch { /* sem armazenamento */ }
    },
  };

  const hash = async (text) => {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 0; // alternativa simples se o navegador não tiver crypto.subtle
    for (const c of text) h = (h * 31 + c.charCodeAt(0)) | 0;
    return String(h);
  };
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const addUser = async (users, email, name, password, tipo) => {
    const salt = Math.random().toString(36).slice(2);
    users[email] = { name, tipo, salt, hash: await hash(salt + password) };
  };

  // Conta do escritório e casos iniciais (criados uma única vez em cada navegador)
  const SEED_USERS = {
    "rodrigues@advocacia.sp.br": {
      "name": "Dr. Rodrigues",
      "tipo": "advogado",
      "salt": "r0dr1gu3s",
      "hash": "abc52a6f86d2328c50dbb181185680c2337bc368d1b57bd97c0c7f3820e23b4d"
    },
    "marcos.almeida@exemplo.com": {
      "name": "Marcos Almeida",
      "tipo": "cliente",
      "salt": "wj3degzdpc",
      "hash": "d9e683d0089ee3ca448ddc0b77c18e6058c6dc7d3330fcc082d7a8e675a62eac"
    },
    "fernanda.costa@exemplo.com": {
      "name": "Fernanda Costa",
      "tipo": "cliente",
      "salt": "d3dqciu4jh",
      "hash": "d2a81e26163bb5d879bf5803ab4d907586704a2c3a57cccfdc653e1f1a5415a5"
    },
    "construtora.horizonte@exemplo.com": {
      "name": "Construtora Horizonte Ltda.",
      "tipo": "cliente",
      "salt": "dp95w77zvr",
      "hash": "38fb5e673a1c08d130e31f108bd55c7274a75e803a692dbe7f7901887a00063e"
    },
    "helena.martins@exemplo.com": {
      "name": "Helena Martins",
      "tipo": "cliente",
      "salt": "eh4kxj94ce",
      "hash": "7276458dbd84c2845b543b6870cd5df8c0180228302c1cb20832e312102de401"
    },
    "roberto.nunes@exemplo.com": {
      "name": "Roberto Nunes",
      "tipo": "cliente",
      "salt": "ft8edv6u2y",
      "hash": "416cfcb401891907320498b920259238c95ce88d088e556a09f3b795000e8543"
    },
    "patricia.lima@exemplo.com": {
      "name": "Patrícia Lima",
      "tipo": "cliente",
      "salt": "39fk63ti5t",
      "hash": "8b052046efdeaeba695c147a1303dc11d7555a51aeb33a36fac5df67465bd360"
    },
    "tech.solucoes@exemplo.com": {
      "name": "Tech Soluções S.A.",
      "tipo": "cliente",
      "salt": "9msuaj4zwi",
      "hash": "27be941f59c507a5365f153a3cd1dbfc0d6fa0ab98791ebad424d6371dcb9095"
    },
    "juliana.ramos@exemplo.com": {
      "name": "Juliana Ramos",
      "tipo": "cliente",
      "salt": "3333g83dne",
      "hash": "1d83e95aeaf13724c99bbe4d7e70356623e2faa4c115d773dded16762cd38c2b"
    }
  };
  const SEED_CASES = [
    {
      "id": "caso01",
      "cliente_id": "construtora.horizonte@exemplo.com",
      "numero": "5012345-88.2025.4.03.6100",
      "titulo": "Recuperação de créditos de PIS/COFINS",
      "area": "Direito tributário",
      "status": "andamento",
      "resultado": "",
      "data_inicio": "2025-02-17",
      "data_fim": "",
      "advogado": "Dr. Rodrigues",
      "descricao": "Ação para exclusão do ICMS da base de cálculo do PIS/COFINS e restituição dos valores pagos nos últimos 5 anos.",
      "andamentos": [
        {
          "data": "2026-10-06",
          "texto": "Parecer contábil apresentado: crédito estimado de R$ 1,2 milhão."
        },
        {
          "data": "2025-11-20",
          "texto": "Contestação da Fazenda Nacional apresentada."
        },
        {
          "data": "2025-02-17",
          "texto": "Mandado de segurança impetrado."
        }
      ]
    },
    {
      "id": "caso02",
      "cliente_id": "marcos.almeida@exemplo.com",
      "numero": "1001876-45.2024.5.02.0045",
      "titulo": "Reclamação trabalhista — rescisão indireta",
      "area": "Direito trabalhista",
      "status": "andamento",
      "resultado": "",
      "data_inicio": "2024-08-05",
      "data_fim": "",
      "advogado": "Dr. Rodrigues",
      "descricao": "Pedido de rescisão indireta por atrasos salariais recorrentes, com verbas rescisórias e FGTS.",
      "andamentos": [
        {
          "data": "2026-09-23",
          "texto": "Audiência de instrução designada para 10/12/2026."
        },
        {
          "data": "2025-03-12",
          "texto": "Audiência inicial sem acordo."
        },
        {
          "data": "2024-08-05",
          "texto": "Reclamação protocolada."
        }
      ]
    },
    {
      "id": "caso03",
      "cliente_id": "fernanda.costa@exemplo.com",
      "numero": "1034567-12.2023.8.26.0100",
      "titulo": "Indenização por danos morais e materiais",
      "area": "Direito civil",
      "status": "encerrado",
      "resultado": "Ganho de causa — R$ 48 mil",
      "data_inicio": "2023-04-11",
      "data_fim": "2025-06-30",
      "advogado": "Dr. Rodrigues",
      "descricao": "Ação de indenização por acidente causado por queda de marquise em estabelecimento comercial.",
      "andamentos": [
        {
          "data": "2025-06-30",
          "texto": "Valor da condenação depositado e levantado pela cliente."
        },
        {
          "data": "2024-10-15",
          "texto": "Sentença de procedência confirmada pelo Tribunal."
        },
        {
          "data": "2023-04-11",
          "texto": "Petição inicial protocolada."
        }
      ]
    },
    {
      "id": "caso04",
      "cliente_id": "tech.solucoes@exemplo.com",
      "numero": "",
      "titulo": "Reorganização societária e acordo de sócios",
      "area": "Direito empresarial",
      "status": "encerrado",
      "resultado": "Acordo de sócios assinado",
      "data_inicio": "2024-01-22",
      "data_fim": "2024-05-10",
      "advogado": "Dr. Rodrigues",
      "descricao": "Transformação de Ltda. em S.A., entrada de investidor e redação do acordo de sócios.",
      "andamentos": [
        {
          "data": "2024-05-10",
          "texto": "Atos registrados na Junta Comercial."
        },
        {
          "data": "2024-03-28",
          "texto": "Acordo de sócios assinado por todas as partes."
        },
        {
          "data": "2024-01-22",
          "texto": "Início da due diligence."
        }
      ]
    },
    {
      "id": "caso05",
      "cliente_id": "roberto.nunes@exemplo.com",
      "numero": "5003210-77.2024.4.03.6183",
      "titulo": "Aposentadoria especial — atividade insalubre",
      "area": "Direito previdenciário",
      "status": "andamento",
      "resultado": "",
      "data_inicio": "2024-06-03",
      "data_fim": "",
      "advogado": "Dr. Rodrigues",
      "descricao": "Reconhecimento de 25 anos de trabalho com exposição a ruído e agentes químicos para concessão de aposentadoria especial.",
      "andamentos": [
        {
          "data": "2026-08-14",
          "texto": "Perícia técnica realizada na antiga empresa."
        },
        {
          "data": "2024-06-03",
          "texto": "Ação ajuizada após negativa do INSS."
        }
      ]
    },
    {
      "id": "caso06",
      "cliente_id": "helena.martins@exemplo.com",
      "numero": "1009988-30.2022.8.26.0002",
      "titulo": "Inventário e partilha de bens",
      "area": "Família e sucessões",
      "status": "encerrado",
      "resultado": "Partilha homologada",
      "data_inicio": "2022-09-19",
      "data_fim": "2023-12-04",
      "advogado": "Dr. Rodrigues",
      "descricao": "Inventário judicial com dois imóveis e aplicações financeiras, partilhado entre três herdeiros.",
      "andamentos": [
        {
          "data": "2023-12-04",
          "texto": "Formal de partilha expedido."
        },
        {
          "data": "2023-07-21",
          "texto": "Plano de partilha aprovado pelos herdeiros."
        },
        {
          "data": "2022-09-19",
          "texto": "Abertura do inventário."
        }
      ]
    },
    {
      "id": "caso07",
      "cliente_id": "patricia.lima@exemplo.com",
      "numero": "1502233-61.2025.8.26.0050",
      "titulo": "Defesa criminal — estelionato",
      "area": "Direito penal",
      "status": "andamento",
      "resultado": "",
      "data_inicio": "2025-05-08",
      "data_fim": "",
      "advogado": "Dr. Rodrigues",
      "descricao": "Defesa em ação penal por suposto estelionato em transação comercial, com tese de ausência de dolo.",
      "andamentos": [
        {
          "data": "2026-10-20",
          "texto": "Resposta à acusação apresentada com rol de testemunhas."
        },
        {
          "data": "2025-05-08",
          "texto": "Constituição da defesa no inquérito policial."
        }
      ]
    },
    {
      "id": "caso08",
      "cliente_id": "juliana.ramos@exemplo.com",
      "numero": "0012345-90.2025.8.26.0016",
      "titulo": "Cobrança indevida de plano de saúde",
      "area": "Direito do consumidor",
      "status": "encerrado",
      "resultado": "Acordo — R$ 12 mil",
      "data_inicio": "2025-01-13",
      "data_fim": "2025-09-02",
      "advogado": "Dr. Rodrigues",
      "descricao": "Reajuste abusivo e negativa de cobertura de exame. Pedido de restituição e danos morais.",
      "andamentos": [
        {
          "data": "2025-09-02",
          "texto": "Acordo homologado e valor pago."
        },
        {
          "data": "2025-04-16",
          "texto": "Liminar deferida garantindo o exame."
        },
        {
          "data": "2025-01-13",
          "texto": "Ação protocolada no Juizado Especial."
        }
      ]
    },
    {
      "id": "caso09",
      "cliente_id": "fernanda.costa@exemplo.com",
      "numero": "1045678-23.2025.8.26.0100",
      "titulo": "Rescisão de contrato de compra de imóvel na planta",
      "area": "Direito imobiliário",
      "status": "andamento",
      "resultado": "",
      "data_inicio": "2025-07-28",
      "data_fim": "",
      "advogado": "Dr. Rodrigues",
      "descricao": "Atraso de mais de 180 dias na entrega do apartamento. Pedido de rescisão com devolução integral dos valores pagos.",
      "andamentos": [
        {
          "data": "2026-07-09",
          "texto": "Construtora apresentou proposta de acordo, em análise."
        },
        {
          "data": "2025-07-28",
          "texto": "Petição inicial protocolada."
        }
      ]
    }
  ];
  const seeded = (async () => {
    if (store.get('ra_seed', 0) >= 4) return;
    store.set('ra_users', { ...SEED_USERS });
    store.set('ra_cases', SEED_CASES);
    store.remove('ra_session');
    store.set('ra_seed', 4);
  })();

  const toUser = (email, u) => ({ id: email, email, name: u.name, tipo: u.tipo || 'cliente' });
  const session = () => store.get('ra_session', null);
  const requireLawyer = () => {
    if (session()?.tipo !== 'advogado') throw new Error('Apenas advogados podem fazer isso.');
  };
  const withClient = (cases) => {
    const users = store.get('ra_users', {});
    return cases.map((c) => ({ ...c, cliente: { nome: users[c.cliente_id]?.name || c.cliente_id, email: c.cliente_id } }));
  };

  return {
    isDemo: true,
    async getUser() { await seeded; return session(); },
    async signIn(email, password) {
      await seeded;
      const u = store.get('ra_users', {})[email];
      if (!u || u.hash !== (await hash(u.salt + password))) throw new Error('E-mail ou senha incorretos.');
      const user = toUser(email, u);
      store.set('ra_session', user);
      return user;
    },
    async signUp(name, email, password) {
      await seeded;
      const users = store.get('ra_users', {});
      if (users[email]) throw new Error('Já existe uma conta com este e-mail.');
      await addUser(users, email, name, password, 'cliente'); // cadastro pelo site é sempre de cliente
      store.set('ra_users', users);
      const user = toUser(email, users[email]);
      store.set('ra_session', user);
      return user;
    },
    async signOut() { store.remove('ra_session'); },
    async resetPassword() {
      throw new Error('A recuperação de senha funciona depois de configurar o Supabase no script.js.');
    },
    async getCases() {
      await seeded;
      const me = session();
      if (!me) return [];
      const all = store.get('ra_cases', []);
      return withClient(me.tipo === 'advogado' ? all : all.filter((c) => c.cliente_id === me.email));
    },
    async getClients() {
      requireLawyer();
      return Object.entries(store.get('ra_users', {}))
        .filter(([, u]) => (u.tipo || 'cliente') === 'cliente')
        .map(([email, u]) => ({ id: email, nome: u.name, email }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
    },
    async saveCase(data) {
      requireLawyer();
      const all = store.get('ra_cases', []);
      if (data.id) {
        const i = all.findIndex((c) => c.id === data.id);
        all[i] = { ...all[i], ...data };
      } else {
        all.push({ ...data, id: newId(), andamentos: [] });
      }
      store.set('ra_cases', all);
    },
    async deleteCase(caseId) {
      requireLawyer();
      store.set('ra_cases', store.get('ra_cases', []).filter((c) => c.id !== caseId));
    },
    async addStep(caseId, step) {
      requireLawyer();
      const all = store.get('ra_cases', []);
      const c = all.find((x) => x.id === caseId);
      c.andamentos = [step, ...(c.andamentos || [])];
      store.set('ra_cases', all);
    },
  };
}

/* ----- Backend Supabase (servidor de verdade) ----- */
async function makeSupabaseBackend(config) {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
  const sb = createClient(config.supabaseUrl, config.supabaseAnonKey);
  const translate = (msg) => ({
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'User already registered': 'Já existe uma conta com este e-mail.',
    'Email not confirmed': 'Confirme o seu e-mail antes de entrar (veja a sua caixa de entrada).',
  }[msg] || msg);
  const fail = (error, text) => { if (error) throw new Error(text || translate(error.message)); };

  // O tipo (cliente/advogado) vem da tabela "perfis", que só o escritório altera
  const toUser = async (u) => {
    if (!u) return null;
    const { data } = await sb.from('perfis').select('nome, tipo').eq('id', u.id).maybeSingle();
    return {
      id: u.id, email: u.email,
      name: data?.nome || u.user_metadata?.name || u.email.split('@')[0],
      tipo: data?.tipo || 'cliente',
    };
  };

  return {
    isDemo: false,
    async getUser() { const { data } = await sb.auth.getSession(); return toUser(data.session?.user); },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      fail(error);
      return toUser(data.user);
    },
    async signUp(name, email, password) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
      fail(error);
      if (!data.session) return { pendingConfirmation: true };
      return toUser(data.user);
    },
    async signOut() { await sb.auth.signOut(); },
    async resetPassword(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href });
      fail(error);
    },
    // As regras do banco (supabase.sql) garantem que o cliente só recebe os próprios casos
    async getCases() {
      const { data, error } = await sb.from('casos')
        .select('*, cliente:perfis(nome, email)')
        .order('data_inicio', { ascending: false });
      fail(error, 'Não foi possível carregar os casos.');
      return data;
    },
    async getClients() {
      const { data, error } = await sb.from('perfis').select('id, nome, email').eq('tipo', 'cliente').order('nome');
      fail(error, 'Não foi possível carregar a lista de clientes.');
      return data;
    },
    async saveCase(c) {
      const row = { ...c };
      delete row.id; delete row.cliente; delete row.andamentos;
      ['data_inicio', 'data_fim'].forEach((k) => { if (!row[k]) row[k] = null; });
      const { error } = c.id
        ? await sb.from('casos').update(row).eq('id', c.id)
        : await sb.from('casos').insert(row);
      fail(error, 'Não foi possível salvar o caso.');
    },
    async deleteCase(caseId) {
      const { error } = await sb.from('casos').delete().eq('id', caseId);
      fail(error, 'Não foi possível apagar o caso.');
    },
    async addStep(caseId, step) {
      const { data, error } = await sb.from('casos').select('andamentos').eq('id', caseId).single();
      fail(error, 'Não foi possível salvar o andamento.');
      const { error: e2 } = await sb.from('casos')
        .update({ andamentos: [step, ...(data.andamentos || [])] }).eq('id', caseId);
      fail(e2, 'Não foi possível salvar o andamento.');
    },
  };
}

/* =========================================================
   Botão "Entrar", janela de login e menu do usuário
   ========================================================= */
function initLogin(config) {
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;
  const label = loginBtn.querySelector('.login-btn__label');
  const PORTAL = 'area-do-cliente.html';
  const onPortal = !!document.getElementById('caseList');

  const backendReady = (config.supabaseUrl && config.supabaseAnonKey)
    ? makeSupabaseBackend(config).catch((err) => { console.error(err); return makeLocalBackend(); })
    : Promise.resolve(makeLocalBackend());

  /* ----- Janela de login ----- */
  const modal = document.createElement('div');
  modal.className = 'auth-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="auth-modal__box" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button type="button" class="auth-modal__close" aria-label="Fechar">&times;</button>
      <h2 id="authTitle">Área restrita</h2>
      <p class="auth-modal__sub">Acesse a sua conta da Rodrigues Advocacia.</p>
      <div class="auth-tabs" role="tablist" aria-label="Tipo de acesso">
        <button type="button" class="is-active" data-role="cliente" role="tab">Sou cliente</button>
        <button type="button" data-role="advogado" role="tab">Sou advogado</button>
      </div>
      <form class="auth-form" novalidate>
        <div data-only="signup" hidden>
          <label for="authName">Nome completo</label>
          <input id="authName" type="text" autocomplete="name">
        </div>
        <label for="authEmail">E-mail</label>
        <input id="authEmail" type="email" autocomplete="email" required>
        <label for="authPass">Senha</label>
        <input id="authPass" type="password" autocomplete="current-password" required minlength="6">
        <p class="auth-form__msg" role="status"></p>
        <button type="submit" class="auth-form__submit">Entrar</button>
        <div class="auth-form__links">
          <a href="#" data-link="forgot">Esqueci a minha senha</a>
          <a href="#" data-link="toggle">Não tem conta? <strong>Criar conta</strong></a>
        </div>
        <p class="auth-form__note" data-only="advogado" hidden>
          As contas de advogado são criadas pelo escritório. Fale com o administrador do site se ainda não tiver acesso.
        </p>
      </form>
    </div>`;
  document.body.appendChild(modal);

  const $ = (sel) => modal.querySelector(sel);
  const form = $('.auth-form');
  const msg = $('.auth-form__msg');
  const submit = $('.auth-form__submit');
  const passInput = $('#authPass');
  const toggleLink = $('[data-link="toggle"]');
  let role = 'cliente';
  let signup = false;

  const setMsg = (text, type = '') => { msg.textContent = text; msg.className = 'auth-form__msg' + (type ? ' is-' + type : ''); };

  const refresh = () => {
    modal.querySelectorAll('.auth-tabs button').forEach((b) => {
      const on = b.dataset.role === role;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    if (role === 'advogado') signup = false;
    $('[data-only="signup"]').hidden = !signup;
    $('[data-only="advogado"]').hidden = role !== 'advogado';
    toggleLink.hidden = role === 'advogado';
    toggleLink.innerHTML = signup ? 'Já tem conta? <strong>Entrar</strong>' : 'Não tem conta? <strong>Criar conta</strong>';
    $('[data-link="forgot"]').hidden = signup;
    submit.textContent = signup ? 'Criar conta' : (role === 'advogado' ? 'Entrar como advogado' : 'Entrar');
    passInput.autocomplete = signup ? 'new-password' : 'current-password';
    $('#authTitle').textContent = role === 'advogado' ? 'Acesso do advogado' : (signup ? 'Criar conta de cliente' : 'Área do cliente');
    setMsg('');
  };

  modal.querySelectorAll('.auth-tabs button').forEach((b) =>
    b.addEventListener('click', () => { role = b.dataset.role; refresh(); }));
  toggleLink.addEventListener('click', (e) => { e.preventDefault(); signup = !signup; refresh(); });

  const openModal = (asRole = 'cliente') => {
    role = asRole; signup = false;
    form.reset();
    refresh();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#authEmail').focus(), 30);
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    loginBtn.focus();
  };
  $('.auth-modal__close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  // Permite que a página da área restrita use o login
  window.RA_AUTH = { open: openModal, backend: backendReady, current: null, ready: false };

  /* ----- Menu do usuário logado ----- */
  const menu = document.createElement('div');
  menu.className = 'user-menu';
  menu.hidden = true;
  loginBtn.parentElement.style.position = 'relative';
  loginBtn.insertAdjacentElement('afterend', menu);
  let currentUser = null;

  const render = (user) => {
    currentUser = user;
    const lawyer = user?.tipo === 'advogado';
    loginBtn.classList.toggle('is-logged', !!user);
    label.textContent = user ? firstName(user.name) : 'Entrar';
    loginBtn.title = user ? `Conectado como ${user.email}` : 'Área do cliente';
    loginBtn.setAttribute('aria-haspopup', user ? 'menu' : 'dialog');
    menu.innerHTML = user
      ? `<div class="user-menu__who"><strong></strong><small></small><span class="user-menu__role"></span></div>
         <a href="${PORTAL}" class="user-menu__link">${lawyer ? 'Painel do advogado' : 'Meus casos'}</a>
         <button type="button" data-action="logout">Sair</button>`
      : '';
    if (user) {
      menu.querySelector('strong').textContent = user.name;
      menu.querySelector('small').textContent = user.email;
      menu.querySelector('.user-menu__role').textContent = lawyer ? 'Advogado' : 'Cliente';
    }
    menu.hidden = true;
    window.RA_AUTH.current = user;
    window.RA_AUTH.ready = true;
    document.dispatchEvent(new CustomEvent('auth:change', { detail: user }));
  };

  menu.addEventListener('click', async (e) => {
    if (e.target.dataset.action !== 'logout') return;
    await (await backendReady).signOut();
    render(null);
  });

  loginBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) menu.hidden = !menu.hidden;
    else openModal();
  });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target)) menu.hidden = true; });

  /* ----- Envio do formulário ----- */
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#authName').value.trim();
    const email = $('#authEmail').value.trim().toLowerCase();
    const password = passInput.value;

    if (signup && !name) return setMsg('Informe o seu nome.', 'error');
    if (!isEmail(email)) return setMsg('Informe um e-mail válido.', 'error');
    if (password.length < 6) return setMsg('A senha precisa ter pelo menos 6 caracteres.', 'error');

    submit.disabled = true;
    setMsg('Aguarde...');
    try {
      const backend = await backendReady;
      const user = signup ? await backend.signUp(name, email, password) : await backend.signIn(email, password);
      if (user && user.pendingConfirmation) {
        setMsg('Conta criada! Enviamos um link de confirmação para o seu e-mail.', 'success');
        return;
      }
      // Confere se a conta é do tipo escolhido na aba
      if (user.tipo !== role) {
        await backend.signOut();
        throw new Error(user.tipo === 'advogado'
          ? 'Esta é uma conta de advogado. Use a aba "Sou advogado".'
          : 'Esta conta não é de advogado. Use a aba "Sou cliente".');
      }
      if (!onPortal) { location.href = PORTAL; return; }
      render(user);
      closeModal();
    } catch (err) {
      setMsg(err.message || 'Não foi possível concluir. Tente novamente.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  $('[data-link="forgot"]').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = $('#authEmail').value.trim().toLowerCase();
    if (!isEmail(email)) return setMsg('Digite o seu e-mail acima e clique de novo.', 'error');
    try {
      await (await backendReady).resetPassword(email);
      setMsg('Enviamos um link para redefinir a sua senha.', 'success');
    } catch (err) {
      setMsg(err.message, 'error');
    }
  });


  /* ----- Mantém o usuário conectado ao trocar de página ----- */
  backendReady.then((b) => b.getUser()).then(render).catch(() => render(null));
}

/* =========================================================
   Área restrita — "Meus casos" (cliente) e painel do advogado
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('caseList');
  if (!list) return; // só roda na página area-do-cliente.html

  const el = (id) => document.getElementById(id);
  const locked = el('casesLocked');
  const area = el('casesArea');
  const empty = el('casesEmpty');
  const summary = el('casesSummary');
  const search = el('casesSearch');
  const newCaseBtn = el('newCaseBtn');
  let cases = [];
  let filter = 'todos';
  let areaFilter = '';
  let user = null;
  let backend = null;
  const isLawyer = () => user?.tipo === 'advogado';

  const fmtDate = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '');
  const today = () => new Date().toISOString().slice(0, 10);
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ----- Lista de casos ----- */
  const draw = () => {
    const q = search.value.trim().toLowerCase();
    const shown = cases
      .filter((c) => filter === 'todos' || c.status === filter)
      .filter((c) => !areaFilter || c.area === areaFilter)
      .filter((c) => !q || [c.titulo, c.numero, c.area, c.cliente?.nome, c.cliente?.email]
        .some((v) => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'andamento' ? -1 : 1)
        || String(b.data_inicio).localeCompare(String(a.data_inicio)));

    drawAreas();
    const openIds = [...list.querySelectorAll('details[open]')].map((d) => d.parentElement.dataset.id);
    empty.hidden = shown.length > 0;
    empty.textContent = cases.length ? 'Nenhum caso encontrado neste filtro.'
      : (isLawyer() ? 'Nenhum caso cadastrado ainda. Clique em "+ Novo caso".' : 'Ainda não há casos vinculados à sua conta.');

    list.innerHTML = shown.map((c) => {
      const open = c.status === 'andamento';
      const steps = (c.andamentos || []).map((a) =>
        `<li><time>${fmtDate(a.data)}</time><span>${esc(a.texto)}</span></li>`).join('');
      return `
        <li class="case" data-id="${esc(c.id)}" style="--area: ${corDaArea(c.area)}">
          <details>
            <summary>
              <div class="case__main">
                <span class="case__area">${esc(c.area)}</span>
                <strong class="case__title">${esc(c.titulo)}</strong>
                ${c.numero ? `<span class="case__num">Processo nº ${esc(c.numero)}</span>` : ''}
                ${isLawyer() ? `<span class="case__client">Cliente: ${esc(c.cliente?.nome || '—')}</span>` : ''}
              </div>
              <div class="case__side">
                <span class="case__status case__status--${open ? 'open' : 'closed'}">${open ? 'Em andamento' : 'Encerrado'}</span>
                <span class="case__dates">${fmtDate(c.data_inicio)}${c.data_fim ? ' – ' + fmtDate(c.data_fim) : ''}</span>
              </div>
            </summary>
            <div class="case__body">
              ${c.descricao ? `<p>${esc(c.descricao)}</p>` : ''}
              <dl class="case__info">
                ${c.advogado ? `<div><dt>Advogado responsável</dt><dd>${esc(c.advogado)}</dd></div>` : ''}
                ${c.resultado ? `<div><dt>Resultado</dt><dd>${esc(c.resultado)}</dd></div>` : ''}
                ${isLawyer() && c.cliente?.email ? `<div><dt>E-mail do cliente</dt><dd>${esc(c.cliente.email)}</dd></div>` : ''}
              </dl>
              <p class="case__steps-title">Andamentos</p>
              ${steps ? `<ol class="case__steps">${steps}</ol>` : '<p class="case__no-steps">Nenhum andamento registrado.</p>'}
              ${isLawyer() ? `
                <form class="case__add-step">
                  <input type="date" name="data" value="${today()}" required aria-label="Data do andamento">
                  <input type="text" name="texto" placeholder="Novo andamento (ex.: audiência marcada para...)" required aria-label="Descrição do andamento">
                  <button type="submit" class="btn btn--primary">Adicionar</button>
                </form>
                <div class="case__actions">
                  <button type="button" class="btn btn--ghost case__edit">Editar caso</button>
                  <button type="button" class="btn case__delete">Apagar caso</button>
                </div>` : ''}
            </div>
          </details>
        </li>`;
    }).join('');
    openIds.forEach((id) => list.querySelector(`.case[data-id="${CSS.escape(id)}"] details`)?.setAttribute('open', ''));
  };

  /* ----- Resumo por área (também funciona como filtro) ----- */
  const areasBox = el('casesAreas');
  const drawAreas = () => {
    const count = {};
    cases.forEach((c) => (count[c.area] = (count[c.area] || 0) + 1));
    const names = Object.keys(count).sort((a, b) => count[b] - count[a] || a.localeCompare(b));
    areasBox.hidden = names.length < 2;
    areasBox.innerHTML = `<span class="cases__areas-label">${names.length} áreas do direito:</span>` +
      `<button type="button" class="area-chip${areaFilter ? '' : ' is-active'}" data-area="">Todas <b>${cases.length}</b></button>` +
      names.map((a) => `<button type="button" class="area-chip${areaFilter === a ? ' is-active' : ''}" data-area="${esc(a)}" style="--area: ${corDaArea(a)}">
        <i aria-hidden="true"></i>${esc(a)} <b>${count[a]}</b></button>`).join('');
  };
  areasBox.addEventListener('click', (e) => {
    const b = e.target.closest('.area-chip');
    if (!b) return;
    areaFilter = areaFilter === b.dataset.area ? '' : b.dataset.area;
    draw();
  });

  const load = async () => {
    summary.textContent = 'Carregando os casos...';
    try {
      cases = (await backend.getCases()) || [];
      const ativos = cases.filter((c) => c.status === 'andamento').length;
      summary.textContent = cases.length
        ? `${cases.length} caso(s) no total · ${ativos} em andamento · ${cases.length - ativos} encerrado(s)`
        : (isLawyer() ? 'Nenhum caso cadastrado ainda.' : 'Ainda não há casos vinculados à sua conta.');
      draw();
    } catch (err) {
      summary.textContent = err.message;
    }
  };

  document.querySelectorAll('.cases__filters button').forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.filter;
      document.querySelectorAll('.cases__filters button').forEach((x) => x.classList.toggle('is-active', x === b));
      draw();
    }));
  search.addEventListener('input', draw);
  document.querySelectorAll('[data-open-login]').forEach((b) =>
    b.addEventListener('click', () => window.RA_AUTH && window.RA_AUTH.open(b.dataset.openLogin)));

  /* ----- Advogado: adicionar andamento e editar caso ----- */
  list.addEventListener('submit', async (e) => {
    const f = e.target.closest('.case__add-step');
    if (!f) return;
    e.preventDefault();
    const id = f.closest('.case').dataset.id;
    const texto = f.texto.value.trim();
    if (!texto) return;
    f.querySelector('button').disabled = true;
    try {
      await backend.addStep(id, { data: f.data.value || today(), texto });
      await load();
    } catch (err) {
      alertBox(err.message);
      f.querySelector('button').disabled = false;
    }
  });
  // Apagar: o primeiro clique pede confirmação, o segundo apaga
  list.addEventListener('click', async (e) => {
    const del = e.target.closest('.case__delete');
    if (!del) return;
    if (!del.classList.contains('is-confirm')) {
      del.classList.add('is-confirm');
      del.textContent = 'Clique de novo para apagar';
      setTimeout(() => {
        if (!del.isConnected) return;
        del.classList.remove('is-confirm');
        del.textContent = 'Apagar caso';
      }, 4000);
      return;
    }
    del.disabled = true;
    try {
      await backend.deleteCase(del.closest('.case').dataset.id);
      await load();
    } catch (err) {
      alertBox(err.message);
      del.disabled = false;
    }
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.case__edit');
    if (b) openCaseForm(cases.find((c) => String(c.id) === b.closest('.case').dataset.id));
  });
  newCaseBtn.addEventListener('click', () => openCaseForm(null));

  const alertBox = (text) => { summary.textContent = text; summary.classList.add('is-error'); };

  /* ----- Janela de cadastro/edição de caso ----- */
  const caseModal = document.createElement('div');
  caseModal.className = 'auth-modal';
  caseModal.hidden = true;
  caseModal.innerHTML = `
    <div class="auth-modal__box auth-modal__box--wide" role="dialog" aria-modal="true" aria-labelledby="caseFormTitle">
      <button type="button" class="auth-modal__close" aria-label="Fechar">&times;</button>
      <h2 id="caseFormTitle">Novo caso</h2>
      <p class="auth-modal__sub">O cliente verá este caso na área dele.</p>
      <form class="auth-form case-form" novalidate>
        <label for="cfCliente">Cliente *</label>
        <select id="cfCliente" name="cliente_id" required></select>
        <p class="case-form__hint">O cliente precisa ter criado a conta dele no site para aparecer nesta lista.</p>
        <label for="cfTitulo">Título do caso *</label>
        <input id="cfTitulo" name="titulo" required placeholder="Ex.: Revisão de contrato de aluguel">
        <div class="case-form__row">
          <div><label for="cfNumero">Nº do processo</label><input id="cfNumero" name="numero" placeholder="0000000-00.0000.0.00.0000"></div>
          <div><label for="cfArea">Área *</label><select id="cfArea" name="area" required>
            ${AREAS_DIREITO.map((a) => `<option>${a}</option>`).join('')}</select></div>
        </div>
        <div class="case-form__row">
          <div><label for="cfStatus">Situação</label><select id="cfStatus" name="status">
            <option value="andamento">Em andamento</option><option value="encerrado">Encerrado</option></select></div>
          <div><label for="cfAdvogado">Advogado responsável</label><input id="cfAdvogado" name="advogado"></div>
        </div>
        <div class="case-form__row">
          <div><label for="cfInicio">Início</label><input id="cfInicio" name="data_inicio" type="date"></div>
          <div><label for="cfFim">Encerramento</label><input id="cfFim" name="data_fim" type="date"></div>
        </div>
        <label for="cfResultado">Resultado</label>
        <input id="cfResultado" name="resultado" placeholder="Ex.: Acordo homologado, ganho de causa...">
        <label for="cfDescricao">Descrição</label>
        <textarea id="cfDescricao" name="descricao" rows="3"></textarea>
        <p class="auth-form__msg" role="status"></p>
        <button type="submit" class="auth-form__submit">Salvar caso</button>
      </form>
    </div>`;
  document.body.appendChild(caseModal);
  const cf = caseModal.querySelector('form');
  const cfMsg = caseModal.querySelector('.auth-form__msg');
  let editing = null;

  const closeCaseForm = () => { caseModal.hidden = true; document.body.style.overflow = ''; };
  caseModal.querySelector('.auth-modal__close').addEventListener('click', closeCaseForm);
  caseModal.addEventListener('click', (e) => { if (e.target === caseModal) closeCaseForm(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !caseModal.hidden) closeCaseForm(); });

  const openCaseForm = async (c) => {
    editing = c;
    cf.reset();
    cfMsg.textContent = ''; cfMsg.className = 'auth-form__msg';
    caseModal.querySelector('#caseFormTitle').textContent = c ? 'Editar caso' : 'Novo caso';
    const sel = cf.cliente_id;
    sel.innerHTML = '<option value="">Carregando clientes...</option>';
    caseModal.hidden = false;
    document.body.style.overflow = 'hidden';
    try {
      const clients = await backend.getClients();
      sel.innerHTML = '<option value="">Selecione o cliente</option>' +
        clients.map((k) => `<option value="${esc(k.id)}">${esc(k.nome)} — ${esc(k.email)}</option>`).join('');
    } catch (err) {
      sel.innerHTML = '<option value="">Erro ao carregar clientes</option>';
    }
    const v = c || { status: 'andamento', advogado: user.name, data_inicio: today(), area: AREAS_DIREITO[0] };
    ['cliente_id', 'titulo', 'numero', 'area', 'status', 'advogado', 'data_inicio', 'data_fim', 'resultado', 'descricao']
      .forEach((k) => { if (v[k] != null) cf[k].value = v[k]; });
    cf.titulo.focus();
  };

  cf.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(cf).entries());
    Object.keys(data).forEach((k) => (data[k] = data[k].trim()));
    if (!data.cliente_id) { cfMsg.textContent = 'Selecione o cliente.'; cfMsg.className = 'auth-form__msg is-error'; return; }
    if (!data.titulo) { cfMsg.textContent = 'Informe o título do caso.'; cfMsg.className = 'auth-form__msg is-error'; return; }
    if (data.status === 'encerrado' && !data.data_fim) data.data_fim = today();
    if (data.status === 'andamento') data.data_fim = '';
    const btn = cf.querySelector('.auth-form__submit');
    btn.disabled = true;
    try {
      await backend.saveCase(editing ? { ...data, id: editing.id } : data);
      closeCaseForm();
      await load();
    } catch (err) {
      cfMsg.textContent = err.message; cfMsg.className = 'auth-form__msg is-error';
    } finally {
      btn.disabled = false;
    }
  });

  /* ----- Mostra a visão certa para cada tipo de usuário ----- */
  const apply = async (u) => {
    user = u;
    locked.hidden = !!user;
    area.hidden = !user;
    const lawyer = isLawyer();
    el('portalTitle').textContent = lawyer ? 'Painel do advogado' : 'Meus casos';
    el('portalCrumb').textContent = lawyer ? 'Painel do advogado' : 'Área do cliente';
    if (!user) return;
    backend = await window.RA_AUTH.backend;
    el('casesName').textContent = firstName(user.name);
    el('casesRole').textContent = lawyer ? 'Advogado' : 'Cliente';
    newCaseBtn.hidden = !lawyer;
    search.hidden = !lawyer;
    summary.classList.remove('is-error');
    load();
  };
  document.addEventListener('auth:change', (e) => apply(e.detail));
  // Se o login já tiver sido verificado antes desta parte rodar
  if (window.RA_AUTH && window.RA_AUTH.ready) apply(window.RA_AUTH.current);
});
