// VisionEduLink Lab — Landing page interactions

document.addEventListener('DOMContentLoaded', () => {
  /* Mobile nav toggle */
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Scroll reveal animations */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Hero video: ensure autoplay on mobile browsers that need a play() nudge */
  const heroVideo = document.querySelector('.hero__media');
  if (heroVideo) {
    const tryPlay = () => heroVideo.play().catch(() => {});
    tryPlay();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlay();
    });
  }

  /* Apply form: client-side handling (no backend configured yet) */
  const applyForm = document.getElementById('apply-form');
  const successPanel = document.getElementById('apply-success');

  if (applyForm && successPanel) {
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!applyForm.checkValidity()) {
        applyForm.reportValidity();
        return;
      }
      applyForm.classList.add('is-hidden');
      successPanel.classList.add('is-visible');
      successPanel.setAttribute('tabindex', '-1');
      successPanel.focus();
    });
  }
});
