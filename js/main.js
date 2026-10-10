/**
 * Tattva Infotech – main.js
 * Handles: navbar scroll, image slider, stats counter,
 *          scroll reveal, back-to-top, mobile menu
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────
     1. NAVBAR — scroll behaviour & mobile menu
  ───────────────────────────────────────── */
  const header   = document.getElementById('header');
  const burger   = document.getElementById('navBurger');
  const navList  = document.getElementById('navList');
  const navLinks = document.querySelectorAll('.nav__link');

  // Scroll: add solid background after 60px
  const handleScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    // Back-to-top button
    const btt = document.getElementById('backToTop');
    if (btt) {
      btt.classList.toggle('visible', window.scrollY > 400);
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  // Mobile menu toggle
  if (burger && navList) {
    burger.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      burger.classList.toggle('active', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('open');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close menu on outside click
    document.addEventListener('click', e => {
      if (!header.contains(e.target)) {
        navList.classList.remove('open');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Active nav link on scroll (only on index page)
  const sections = document.querySelectorAll('section[id]');
  if (sections.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'nav__link--active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    }, { rootMargin: `-${(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72) + 20}px 0px -60% 0px` });

    sections.forEach(s => observer.observe(s));
  }

  /* ─────────────────────────────────────────
     2. IMAGE SLIDER
  ───────────────────────────────────────── */
  const slider     = document.getElementById('slider');
  if (slider) {
    const slides     = slider.querySelectorAll('.slide');
    const dots       = slider.querySelectorAll('.dot');
    const prevBtn    = document.getElementById('sliderPrev');
    const nextBtn    = document.getElementById('sliderNext');
    let current      = 0;
    let autoplay;
    const DELAY      = 5000; // 5 seconds

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

    const stopAutoplay = () => clearInterval(autoplay);

    // Button controls
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToSlide(current - 1);
        startAutoplay();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goToSlide(current + 1);
        startAutoplay();
      });
    }

    // Dot controls
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goToSlide(i);
        startAutoplay();
      });
    });

    // Keyboard navigation
    slider.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { goToSlide(current - 1); startAutoplay(); }
      if (e.key === 'ArrowRight') { goToSlide(current + 1); startAutoplay(); }
    });

    // Touch swipe support
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    slider.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        goToSlide(diff > 0 ? current + 1 : current - 1);
        startAutoplay();
      }
    }, { passive: true });

    // Pause on hover
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    // Start
    startAutoplay();
  }

  /* ─────────────────────────────────────────
     3. STATS COUNTER ANIMATION
  ───────────────────────────────────────── */
  const statNums = document.querySelectorAll('.stat__num[data-target]');
  if (statNums.length) {
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut

    const animateCounter = (el) => {
      const target   = parseInt(el.dataset.target, 10);
      const duration = 2000; // ms
      const start    = performance.now();

      const update = (now) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        el.textContent = Math.floor(ease(progress) * target);
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
    }, { threshold: 0.5 });

    statNums.forEach(el => statsObserver.observe(el));
  }

  /* ─────────────────────────────────────────
     4. SCROLL REVEAL
  ───────────────────────────────────────── */
  // Auto-add data-reveal to common elements
  const revealTargets = [
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
  ];

  revealTargets.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      if (!el.hasAttribute('data-reveal')) {
        el.setAttribute('data-reveal', 'up');
        el.style.transitionDelay = `${Math.min(i * 0.07, 0.5)}s`;
      }
    });
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

  /* ─────────────────────────────────────────
     5. BACK TO TOP
  ───────────────────────────────────────── */
  const btt = document.getElementById('backToTop');
  if (btt) {
    btt.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ─────────────────────────────────────────
     6. SMOOTH SCROLL for anchor links
  ───────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerH = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '72'
        );
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
