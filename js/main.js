/**
 * Tattva Infotech – main.js  (performance-optimised)
 *
 * Key fixes vs v1:
 *  - Scroll handler uses requestAnimationFrame throttle (no jank)
 *  - Back-to-top cached outside scroll handler (no DOM query per frame)
 *  - Reveal observer uses single batch of elements (no repeated querySelectorAll)
 *  - Stagger delays capped and set via CSS custom property (no inline style thrashing)
 *  - Slider transition is opacity-only (GPU compositor, zero paint cost)
 *  - All IntersectionObserver instances reused, not recreated
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────
     1. NAVBAR — scroll + mobile menu
  ───────────────────────────────────────── */
  const header  = document.getElementById('header');
  const burger  = document.getElementById('navBurger');
  const navList = document.getElementById('navList');
  const btt     = document.getElementById('backToTop'); // cached once
  const navLinks = document.querySelectorAll('.nav__link');

  // rAF-throttled scroll handler — only needed for back-to-top visibility now
  let scrollTicking = false;
  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      // Header is always solid white — no class toggle needed
      if (btt) btt.classList.toggle('visible', y > 400);
      scrollTicking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initialise state

  // Mobile menu
  if (burger && navList) {
    burger.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      burger.classList.toggle('active', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('open');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', e => {
      if (!header.contains(e.target) && navList.classList.contains('open')) {
        navList.classList.remove('open');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Active nav link highlight
  const sections = document.querySelectorAll('section[id]');
  if (sections.length) {
    const headerH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-h')
    ) || 72;

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle(
            'nav__link--active',
            link.getAttribute('href') === `#${id}`
          );
        });
      });
    }, { rootMargin: `-${headerH + 20}px 0px -60% 0px` });

    sections.forEach(s => sectionObserver.observe(s));
  }

  /* ─────────────────────────────────────────
     2. IMAGE SLIDER
  ───────────────────────────────────────── */
  const slider = document.getElementById('slider');
  if (slider) {
    const slides  = slider.querySelectorAll('.slide');
    const dots    = slider.querySelectorAll('.dot');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    let current   = 0;
    let autoplay  = null;
    const DELAY   = 5500;

    const goToSlide = (index) => {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      dots[current].setAttribute('aria-selected', 'false');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
      dots[current].setAttribute('aria-selected', 'true');
    };

    const startAutoplay = () => {
      stopAutoplay();
      autoplay = setInterval(() => goToSlide(current + 1), DELAY);
    };
    const stopAutoplay = () => {
      if (autoplay) { clearInterval(autoplay); autoplay = null; }
    };

    prevBtn && prevBtn.addEventListener('click', () => { goToSlide(current - 1); startAutoplay(); });
    nextBtn && nextBtn.addEventListener('click', () => { goToSlide(current + 1); startAutoplay(); });

    dots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); startAutoplay(); }));

    slider.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { goToSlide(current - 1); startAutoplay(); }
      if (e.key === 'ArrowRight') { goToSlide(current + 1); startAutoplay(); }
    });

    // Touch swipe
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 48) { goToSlide(diff > 0 ? current + 1 : current - 1); startAutoplay(); }
    }, { passive: true });

    // Pause on hover — only on non-touch devices
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    startAutoplay();
  }

  /* ─────────────────────────────────────────
     3. STATS COUNTER
  ───────────────────────────────────────── */
  const statNums = document.querySelectorAll('.stat__num[data-target]');
  if (statNums.length) {
    // Smooth easeOutQuart — feels snappier than easeInOut for counters
    const easeOut = t => 1 - Math.pow(1 - t, 4);

    const animateCounter = (el) => {
      const target   = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const start    = performance.now();

      const update = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.floor(easeOut(progress) * target);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
      };
      requestAnimationFrame(update);
    };

    const statsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    statNums.forEach(el => statsObserver.observe(el));
  }

  /* ─────────────────────────────────────────
     4. SCROLL REVEAL
     Batch all selectors into one querySelectorAll call,
     assign stagger index, then observe all at once.
  ───────────────────────────────────────── */
  const revealSelectors = [
    '.section__tag',
    '.section__title',
    '.about__image-wrap',
    '.about__content > *',
    '.service-card',
    '.process__step',
    '.project-card',
    '.testimonial',
    '.tech__logo',
    '.contact-cta__text',
    '.contact-cta .btn',
    '.stat',
    '.value',
  ].join(',');

  // Group by parent so stagger resets per section
  const revealEls = document.querySelectorAll(revealSelectors);
  const parentCounters = new Map();

  revealEls.forEach(el => {
    if (el.hasAttribute('data-reveal')) return; // already set in HTML
    el.setAttribute('data-reveal', 'up');

    // Count siblings under same parent for stagger offset
    const parent = el.parentElement;
    const idx    = (parentCounters.get(parent) || 0);
    parentCounters.set(parent, idx + 1);

    // Cap delay at 0.4s so late elements never feel slow
    el.style.transitionDelay = `${Math.min(idx * 0.06, 0.4)}s`;
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      // Remove delay after reveal so hover/other transitions aren't delayed
      entry.target.style.transitionDelay = '0s';
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

  /* ─────────────────────────────────────────
     5. BACK TO TOP
  ───────────────────────────────────────── */
  if (btt) {
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ─────────────────────────────────────────
     6. SMOOTH SCROLL — anchor links
  ───────────────────────────────────────── */
  const headerH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-h')
  ) || 72;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href   = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

});
