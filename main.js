/* ═══════════════════════════════════════
   MKWAY — main.js  (mkway.co.kr / 소개 페이지)
   담당: 네비게이션, 캐러샐, 문의 폼, 스크롤 애니메이션
═══════════════════════════════════════ */

// ══════════════════════════════════════
// 🍔 햄버거 메뉴 (모바일)
// ══════════════════════════════════════
const hamburger = document.getElementById("hamburger");
const navMenu   = document.getElementById("navMenu");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  navMenu.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
    hamburger.classList.remove("open");
    navMenu.classList.remove("open");
  }
});

// 메뉴 링크 클릭 시 닫기 (앵커 이동 포함)
navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("open");
    navMenu.classList.remove("open");
  });
});


// ══════════════════════════════════════
// 📜 스크롤 — 네비게이션 그림자
// ══════════════════════════════════════
window.addEventListener("scroll", () => {
  document.getElementById("nav").classList.toggle("scrolled", window.scrollY > 20);
});


// ══════════════════════════════════════
// 🎠 포트폴리오 캐러샐
// ══════════════════════════════════════
(function initCarousel() {
  const track     = document.getElementById("carouselTrack");
  const container = document.getElementById("carouselContainer");
  const prevBtn   = document.getElementById("carouselPrev");
  const nextBtn   = document.getElementById("carouselNext");
  const dotsWrap  = document.getElementById("carouselDots");

  if (!track) return;

  const slides      = Array.from(track.querySelectorAll(".carousel-slide"));
  const totalSlides = slides.length; // 10

  let currentIndex = 0;
  let slidesPerView = getSlidesPerView();
  let maxIndex      = totalSlides - slidesPerView;

  /* 슬라이드 너비 계산 및 이동 */
  function getSlideWidth() {
    if (!slides[0]) return 0;
    return slides[0].getBoundingClientRect().width + 24; // gap: 24px
  }

  function moveTo(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    const offset = currentIndex * getSlideWidth();
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
    updateBtnState();
  }

  function updateBtnState() {
    prevBtn.style.opacity = currentIndex === 0 ? "0.35" : "1";
    nextBtn.style.opacity = currentIndex >= maxIndex ? "0.35" : "1";
  }

  /* 도트 생성 */
  function buildDots() {
    dotsWrap.innerHTML = "";
    const dotCount = maxIndex + 1;
    for (let i = 0; i <= maxIndex; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `${i + 1}번째 슬라이드`);
      dot.addEventListener("click", () => moveTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    const dots = dotsWrap.querySelectorAll(".carousel-dot");
    dots.forEach((d, i) => d.classList.toggle("active", i === currentIndex));
  }

  /* 반응형 재계산 */
  function getSlidesPerView() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function recalculate() {
    slidesPerView = getSlidesPerView();
    maxIndex      = Math.max(0, totalSlides - slidesPerView);
    currentIndex  = Math.min(currentIndex, maxIndex);
    buildDots();
    moveTo(currentIndex);
  }

  /* 버튼 이벤트 */
  prevBtn.addEventListener("click", () => moveTo(currentIndex - 1));
  nextBtn.addEventListener("click", () => moveTo(currentIndex + 1));

  /* 터치 스와이프 지원 */
  let touchStartX = 0;
  container.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? moveTo(currentIndex + 1) : moveTo(currentIndex - 1);
    }
  });

  /* 초기화 & 리사이즈 대응 */
  buildDots();
  moveTo(0);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(recalculate, 150);
  });
})();


// ══════════════════════════════════════
// 📬 문의 폼
// ══════════════════════════════════════
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name  = document.getElementById("cName").value.trim();
    const email = document.getElementById("cEmail").value.trim();

    if (!name || !email) {
      showToast("⚠️ 브랜드명과 이메일을 입력해주세요.");
      return;
    }

    showToast("✅ 문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다!");
    contactForm.reset();
  });
}


// ══════════════════════════════════════
// 🎞️ 스크롤 등장 애니메이션
// ══════════════════════════════════════
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity  = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".number-card, .about__text").forEach((el, i) => {
  el.style.opacity    = "0";
  el.style.transform  = "translateY(28px)";
  el.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;
  observer.observe(el);
});


// ══════════════════════════════════════
// 🔔 토스트 알림
// ══════════════════════════════════════
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}
