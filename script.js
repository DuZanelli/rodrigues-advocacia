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
    { threshold: 0.15 }
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

  /* ---------- Ano no rodapé ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});
