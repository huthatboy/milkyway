/* ═══════════════════════════════════════
   MKWAY — suggest.js  (mkway.co.kr/suggest)
   AI 콘텐츠 생성 페이지 전용 JS
   RAG + OpenAI 백엔드 연동 버전
═══════════════════════════════════════ */

// ──────────────────────────────────────
// 🔧 백엔드 서버 주소
// 배포 시 실제 서버 주소로 교체
// ──────────────────────────────────────
const API_BASE_URL = "https://milkyway-production-562d.up.railway.app";


// ──────────────────────────────────────
// 📌 전역 상태
// ──────────────────────────────────────
let selectedGoal    = null; // "전략" or "스크립트"
let selectedPurpose = null; // "브랜드 인지도 상승" etc.


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
navMenu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    hamburger.classList.remove("open");
    navMenu.classList.remove("open");
  })
);


// ══════════════════════════════════════
// 📜 스크롤 — 네비게이션 그림자
// ══════════════════════════════════════
window.addEventListener("scroll", () => {
  document.getElementById("nav").classList.toggle("scrolled", window.scrollY > 20);
});


// ══════════════════════════════════════
// 🎯 STEP 01 — 작성 목표 선택
// ══════════════════════════════════════
function selectGoal(goal) {
  selectedGoal = goal;

  // 카드 선택 상태 업데이트
  document.getElementById("goalCard-strategy").classList.toggle("selected", goal === "전략");
  document.getElementById("goalCard-script").classList.toggle("selected",   goal === "스크립트");

  // 라디오 버튼 체크
  document.querySelector(`input[name="goalType"][value="${goal}"]`).checked = true;

  // STEP 02로 부드럽게 스크롤
  setTimeout(() => {
    document.getElementById("step02").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 200);
}


// ══════════════════════════════════════
// 🎯 STEP 02 — 캠페인 목적 선택
// ══════════════════════════════════════
function selectPurpose(purpose, el) {
  selectedPurpose = purpose;

  // 라디오 선택 상태 업데이트
  document.querySelectorAll(".purpose-item").forEach((item) => {
    item.classList.remove("selected");
  });
  el.classList.add("selected");

  // 라디오 버튼 체크
  document.querySelector(`input[name="purpose"][value="${purpose}"]`).checked = true;
}


// ══════════════════════════════════════
// ✨ STEP 03 — AI 콘텐츠 생성
// ══════════════════════════════════════
async function generateContent() {
  // 입력값 수집
  const goalType    = selectedGoal;
  const purpose     = selectedPurpose;
  const sellingPoint = document.getElementById("sellingPoint").value.trim();
  const benefit     = document.getElementById("benefit").value.trim();
  const caution     = document.getElementById("caution").value.trim();

  // 유효성 검사
  if (!goalType) {
    showToast("⚠️ 작성 목표를 선택해주세요.");
    document.getElementById("step01").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (!purpose) {
    showToast("⚠️ 캠페인 목적을 선택해주세요.");
    document.getElementById("step02").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (!sellingPoint) {
    showToast("⚠️ 핵심 셀링 포인트를 입력해주세요.");
    document.getElementById("sellingPoint").focus();
    return;
  }

  // UI 상태 변경
  const generateBtn   = document.getElementById("generateBtn");
  const resultSection = document.getElementById("resultSection");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const resultCard    = document.getElementById("resultCard");
  const resultContent = document.getElementById("resultContent");
  const resultTitle   = document.getElementById("resultTitle");
  const trendsList    = document.getElementById("trendsList");

  generateBtn.disabled  = true;
  generateBtn.innerHTML = `<span class="generate-btn__icon">⏳</span> 생성 중...`;

  // 결과 섹션 표시 + 로딩 시작
  resultSection.classList.add("visible");
  loadingOverlay.classList.add("visible");
  resultCard.style.display = "none";

  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });

  // 로딩 메시지 순환
  const loadingMessages = [
    "2026 트렌드 분석 중...",
    "관련 트렌드 검색 중...",
    "AI가 콘텐츠를 작성 중...",
    "최적화 적용 중...",
  ];
  let msgIdx = 0;
  const loadingText = document.getElementById("loadingText");
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[msgIdx];
  }, 1500);

  try {
    // 백엔드 API 호출
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalType, purpose, sellingPoint, benefit, caution }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "서버 오류가 발생했습니다.");
    }

    const data = await response.json();

    // 결과 표시
    clearInterval(msgInterval);
    loadingOverlay.classList.remove("visible");
    resultCard.style.display = "block";

    // 제목 설정
    resultTitle.textContent = goalType === "전략"
      ? "📊 마케팅 전략 문서"
      : "🎬 영상 촬영 스크립트";

    // 타이핑 효과로 결과 출력
    await typeText(resultContent, data.result);

    // 반영된 트렌드 태그 표시
    trendsList.innerHTML = "";
    if (data.usedTrends && data.usedTrends.length > 0) {
      data.usedTrends.forEach((trend) => {
        const tag = document.createElement("span");
        tag.className = "trend-tag";
        tag.textContent = trend;
        trendsList.appendChild(tag);
      });
    }

    showToast("✅ 콘텐츠 생성 완료!");

  } catch (err) {
    clearInterval(msgInterval);
    loadingOverlay.classList.remove("visible");
    console.error("생성 오류:", err);
    showToast(`⚠️ ${err.message}`);
    resultSection.classList.remove("visible");
  } finally {
    generateBtn.disabled  = false;
    generateBtn.innerHTML = `<span class="generate-btn__icon">✨</span> AI 콘텐츠 생성하기`;
  }
}


// ══════════════════════════════════════
// ⌨️ 타이핑 효과
// ══════════════════════════════════════
async function typeText(el, text) {
  el.textContent = "";
  let current = "";
  for (const ch of text) {
    current += ch;
    el.textContent = current;
    await sleep(10);
  }
}


// ══════════════════════════════════════
// 📋 결과 복사
// ══════════════════════════════════════
function copyResult() {
  const content = document.getElementById("resultContent").textContent;
  if (!content) return;

  navigator.clipboard.writeText(content)
    .then(() => {
      showToast("✅ 클립보드에 복사되었습니다!");
    })
    .catch(() => {
      const ta = document.createElement("textarea");
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("✅ 복사되었습니다!");
    });
}


// ══════════════════════════════════════
// 🔧 유틸 함수
// ══════════════════════════════════════
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
