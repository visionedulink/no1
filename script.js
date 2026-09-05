// VisionEduLink Lab — Landing page interactions

/**
 * --------------------------------------------------------------------------
 * [구글 스프레드시트 연동 설정]
 * Google Apps Script를 웹 앱으로 배포한 후 발급받은 '웹 앱 URL'을 아래에 붙여넣으세요.
 * 스프레드시트 ID: 1xG7XdDSGzvyRDLcYGRx2DJC2NVgUbidgjp7mpP4t-No
 * --------------------------------------------------------------------------
 */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzirSbHMLV8fXv3PQa0QF-b6eESdf8kXyzHxR6IKukoZJ7OM7ChK0KXIYPunmwBGFuV/exec';

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
    const tryPlay = () => heroVideo.play().catch(() => { });
    tryPlay();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlay();
    });
  }

  /* Apply form: Google Sheets integration */
  const applyForm = document.getElementById('apply-form');
  const successPanel = document.getElementById('apply-success');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');

  if (applyForm && successPanel) {
    applyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!applyForm.checkValidity()) {
        applyForm.reportValidity();
        return;
      }

      // 폼 데이터 수집
      const selectedInterest = applyForm.querySelector('input[name="interest"]:checked');
      const formData = {
        name: applyForm.name.value.trim(),
        phone: applyForm.phone.value.trim(),
        email: applyForm.email.value.trim(),
        interest: selectedInterest ? selectedInterest.value : '',
        message: applyForm.message ? applyForm.message.value.trim() : ''
      };

      // 버튼 로딩 상태 전환
      const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
      const btnLoader = submitBtn ? submitBtn.querySelector('.btn-loader') : null;

      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoader) btnLoader.style.display = 'inline-flex';
      if (formError) formError.style.display = 'none';

      try {
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.trim() !== '') {
          // Google Apps Script 웹 앱으로 데이터 전송
          // 주의: mode:'no-cors' + Content-Type:'application/json' 조합은 브라우저가
          // 실제 요청을 조용히 실패시켜 데이터가 전달되지 않는 경우가 있어(응답은 항상
          // "성공"처럼 보이지만 시트에는 기록되지 않음), 사전 요청(preflight)이 필요 없는
          // text/plain으로 보내고 실제 응답을 확인하도록 수정함.
          const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(formData),
          });
          const resultJson = await res.json().catch(() => null);
          if (!res.ok || (resultJson && resultJson.result === 'error')) {
            throw new Error(resultJson && resultJson.error ? resultJson.error : 'Google Sheets 응답 오류');
          }
        } else {
          console.warn('[안내] GOOGLE_SCRIPT_URL이 설정되지 않았습니다. google_apps_script.js 배포 후 발급받은 URL을 script.js에 입력해 주세요.');
          // 시연용 딜레이
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        // 성공 화면 표시
        applyForm.classList.add('is-hidden');
        successPanel.classList.add('is-visible');
        successPanel.setAttribute('tabindex', '-1');
        successPanel.focus();
        successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 폼 리셋
        applyForm.reset();
      } catch (err) {
        console.error('신청서 제출 오류:', err);
        if (formError) {
          formError.textContent = '신청서 제출 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
          formError.style.display = 'block';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
      }
    });
  }
});
