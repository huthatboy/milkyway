/* ═══════════════════════════════════════
   MKWAY — suggest.js  (mkway.co.kr/suggest)
   담당: 네비게이션, 인플루언서 검색/필터,
         인플루언서 선택, AI 제안 메시지 생성
═══════════════════════════════════════ */

// ──────────────────────────────────────
// 🔑 API KEY
// 실제 배포 시 서버(백엔드)에서 처리해야 합니다.
// ──────────────────────────────────────
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE";

// ──────────────────────────────────────
// 📦 목업 인플루언서 데이터
// 실제 서비스에서는 NoxInfluencer API로 대체
// ──────────────────────────────────────
const MOCK_INFLUENCERS = [
  { id:1, name:"뷰티위치 BeautyWitch", handle:"@beautywitch_kr", platform:"youtube", country:"KR",
    subscribers:1200000, avgViews:580000, tags:["뷰티","스킨케어","메이크업"],
    avatar:"B", email:"contact@beautywitch.kr", instagram:"@beautywitch_", engagementRate:"4.8%" },
  { id:2, name:"먹방킹 FoodKing", handle:"@foodking_eats", platform:"youtube", country:"KR",
    subscribers:850000, avgViews:320000, tags:["먹방","푸드","리뷰"],
    avatar:"F", email:"foodking@naver.com", instagram:"@foodking_official", engagementRate:"6.2%" },
  { id:3, name:"FitStar Mia", handle:"@fitstar_mia", platform:"tiktok", country:"KR",
    subscribers:780000, avgViews:2300000, tags:["피트니스","헬스","다이어트"],
    avatar:"M", email:"mia@fitstar.co.kr", instagram:"@fitstar_mia", engagementRate:"9.1%" },
  { id:4, name:"테크리뷰어 TechJun", handle:"@techjun_review", platform:"youtube", country:"KR",
    subscribers:2300000, avgViews:950000, tags:["테크","IT","가젯","리뷰"],
    avatar:"T", email:"techjun@gmail.com", instagram:"@techjun", engagementRate:"3.9%" },
  { id:5, name:"패션퀸 StyleQueen", handle:"@stylequeen_daily", platform:"instagram", country:"KR",
    subscribers:450000, avgViews:82000, tags:["패션","스타일","OOTD"],
    avatar:"S", email:"style@queenpr.kr", instagram:"@stylequeen_daily", engagementRate:"5.5%" },
  { id:6, name:"Travel Lena", handle:"@travellena_world", platform:"instagram", country:"US",
    subscribers:320000, avgViews:45000, tags:["여행","라이프스타일","브이로그"],
    avatar:"L", email:"lena@travelwithme.com", instagram:"@travellena_world", engagementRate:"7.3%" },
  { id:7, name:"홈쿡 HomeCook", handle:"@homecook_secret", platform:"youtube", country:"KR",
    subscribers:560000, avgViews:210000, tags:["요리","레시피","홈쿡"],
    avatar:"H", email:"homecook@kakao.com", instagram:"@homecook_secret", engagementRate:"5.1%" },
  { id:8, name:"댄스팀 DanceForce", handle:"@danceforce_kr", platform:"tiktok", country:"KR",
    subscribers:1800000, avgViews:5400000, tags:["댄스","K-POP","엔터테인먼트"],
    avatar:"D", email:"danceforce@agency.kr", instagram:"@danceforce_official", engagementRate:"12.4%" },
  { id:9, name:"Wellness Hana", handle:"@wellness_hana", platform:"instagram", country:"JP",
    subscribers:290000, avgViews:38000, tags:["웰니스","요가","명상"],
    avatar:"W", email:"hana@wellnesslife.jp", instagram:"@wellness_hana", engagementRate:"6.8%" },
];

// ──────────────────────────────────────
// 📌 상태
// ──────────────────────────────────────
let selectedInfluencer = null;


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
// 🔍 인플루언서 검색
// ══════════════════════════════════════
function searchInfluencers() {
  const keyword  = document.getElementById("searchKeyword").value.trim().toLowerCase();
  const searchBtn     = document.getElementById("searchBtn");
  const searchBtnText = document.getElementById("searchBtnText");

  const selectedPlatforms = Array.from(
    document.querySelectorAll("input[name='platform']:checked")
  ).map((el) => el.value);

  const country = document.getElementById("filterCountry").value;
  const subMin  = parseInt(document.getElementById("subMin").value)  || 0;
  const subMax  = parseInt(document.getElementById("subMax").value)  || Infinity;
  const viewMin = parseInt(document.getElementById("viewMin").value) || 0;
  const viewMax = parseInt(document.getElementById("viewMax").value) || Infinity;

  // 로딩 상태
  searchBtn.disabled   = true;
  searchBtnText.textContent = "검색 중...";

  // 목업 딜레이 (실제 API 연동 시 fetch()로 교체)
  setTimeout(() => {
    const results = MOCK_INFLUENCERS.filter((inf) => {
      const matchKeyword =
        !keyword ||
        inf.name.toLowerCase().includes(keyword) ||
        inf.tags.some((t) => t.toLowerCase().includes(keyword)) ||
        inf.handle.toLowerCase().includes(keyword);

      const matchPlatform =
        selectedPlatforms.length === 0 || selectedPlatforms.includes(inf.platform);

      const matchCountry = !country || inf.country === country;
      const matchSubs    = inf.subscribers >= subMin && inf.subscribers <= subMax;
      const matchViews   = inf.avgViews >= viewMin && inf.avgViews <= viewMax;

      return matchKeyword && matchPlatform && matchCountry && matchSubs && matchViews;
    });

    renderResults(results, keyword);

    searchBtn.disabled = false;
    searchBtnText.textContent = "검색하기";

    // 결과 섹션으로 스크롤
    document.getElementById("step02").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 600);
}

// Enter 키 검색
document.getElementById("searchKeyword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchInfluencers();
});


// ══════════════════════════════════════
// 🃏 결과 렌더링
// ══════════════════════════════════════
function renderResults(results, keyword) {
  const grid       = document.getElementById("resultsGrid");
  const meta       = document.getElementById("resultsMeta");
  const emptyState = document.getElementById("emptyState");

  grid.innerHTML = "";

  if (results.length === 0) {
    emptyState.style.display = "block";
    grid.style.display       = "none";
    meta.textContent         = "";
    return;
  }

  emptyState.style.display = "none";
  grid.style.display       = "grid";
  meta.textContent         = `"${keyword || "전체"}" 검색 결과 — ${results.length}명의 인플루언서를 찾았습니다.`;

  results.forEach((inf, i) => {
    const isSelected = selectedInfluencer?.id === inf.id;
    const card = document.createElement("article");
    card.className = "influencer-card" + (isSelected ? " selected" : "");
    card.setAttribute("data-id", inf.id);

    card.innerHTML = `
      <div class="influencer-card__selected-badge">✓ 선택됨</div>
      <div class="influencer-card__header">
        <div class="influencer-card__avatar">${inf.avatar}</div>
        <div>
          <div class="influencer-card__name">${inf.name}</div>
          <div class="influencer-card__platform">
            ${platformIcon(inf.platform)} ${inf.platform.toUpperCase()} · ${inf.country}
          </div>
        </div>
      </div>
      <div class="influencer-card__stats">
        <div class="stat-item">
          <div class="stat-item__label">구독자/팔로워</div>
          <div class="stat-item__value">${formatNum(inf.subscribers)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__label">평균 조회수</div>
          <div class="stat-item__value">${formatNum(inf.avgViews)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__label">참여율</div>
          <div class="stat-item__value">${inf.engagementRate}</div>
        </div>
      </div>
      <div class="influencer-card__tags">
        ${inf.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
      </div>
      <div class="influencer-card__contact">
        <div class="contact-info">
          <span>📧 <a href="mailto:${inf.email}">${inf.email}</a></span>
          <span>📱 ${inf.instagram}</span>
        </div>
      </div>
      <button class="influencer-card__select-btn" onclick="selectInfluencer(${inf.id})">
        ${isSelected ? "✓ 선택됨" : "이 인플루언서 선택"}
      </button>
    `;

    // 등장 애니메이션
    card.style.opacity   = "0";
    card.style.transform = "translateY(16px)";
    card.style.transition = `opacity 0.4s ease ${i * 0.07}s, transform 0.4s ease ${i * 0.07}s`;
    grid.appendChild(card);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        card.style.opacity   = "1";
        card.style.transform = "translateY(0)";
      })
    );
  });
}


// ══════════════════════════════════════
// ✅ 인플루언서 선택
// ══════════════════════════════════════
function selectInfluencer(id) {
  const inf = MOCK_INFLUENCERS.find((i) => i.id === id);
  if (!inf) return;

  selectedInfluencer = inf;

  // 카드 UI 갱신
  document.querySelectorAll(".influencer-card").forEach((card) => {
    const isThis = parseInt(card.dataset.id) === id;
    card.classList.toggle("selected", isThis);
    card.querySelector(".influencer-card__select-btn").textContent =
      isThis ? "✓ 선택됨" : "이 인플루언서 선택";
  });

  // AI 폼 선택 정보 표시
  document.getElementById("selectedInfluencer").innerHTML = `
    <div class="selected-info">
      📌 선택된 인플루언서:
      <strong>${inf.name}</strong>
      (${inf.platform.toUpperCase()} · ${formatNum(inf.subscribers)} 팔로워)
    </div>
  `;

  // STEP 03으로 스크롤
  setTimeout(() => {
    document.getElementById("step03").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 300);

  showToast(`${inf.name} 선택 완료! 아래에서 메시지를 생성하세요.`);
}


// ══════════════════════════════════════
// ✨ AI 제안 메시지 생성
// ══════════════════════════════════════
async function generateProposal() {
  if (!selectedInfluencer) {
    showToast("⚠️ 먼저 인플루언서를 선택해주세요.");
    return;
  }

  const brandName    = document.getElementById("brandName").value.trim();
  const productName  = document.getElementById("productName").value.trim();
  const campaignGoal = document.getElementById("campaignGoal").value.trim();
  const messageType  = document.querySelector("input[name='messageType']:checked").value;

  if (!brandName || !productName) {
    showToast("⚠️ 브랜드명과 제품/서비스명을 입력해주세요.");
    return;
  }

  const generateBtn     = document.getElementById("generateBtn");
  const aiResult        = document.getElementById("aiResult");
  const aiResultContent = document.getElementById("aiResultContent");

  // 로딩
  generateBtn.disabled = true;
  generateBtn.innerHTML = `<span class="btn-icon">⏳</span> 생성 중...`;

  aiResult.classList.add("visible");
  aiResultContent.textContent = "";
  aiResultContent.classList.add("typing-cursor");

  const inf = selectedInfluencer;

  try {
    if (OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
      // API 키 미설정 → 목업 응답
      await mockTyping(inf, brandName, productName, campaignGoal, messageType, aiResultContent);
    } else {
      // 실제 ChatGPT API 호출 (스트리밍)
      const typeLabel = messageType === "dm" ? "DM (짧고 친근한 스타일)" : "이메일 (공식적이고 상세한 스타일)";
      const prompt = buildPrompt(inf, brandName, productName, campaignGoal, typeLabel, messageType);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 600,
          temperature: 0.8,
          stream: true,
        }),
      });

      const reader  = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const raw = line.replace("data: ", "");
          if (raw === "[DONE]") break;
          try {
            const token = JSON.parse(raw).choices?.[0]?.delta?.content || "";
            full += token;
            aiResultContent.textContent = full;
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error("API 오류:", err);
    await mockTyping(inf, brandName, productName, campaignGoal, messageType, aiResultContent);
  } finally {
    aiResultContent.classList.remove("typing-cursor");
    generateBtn.disabled = false;
    generateBtn.innerHTML = `<span class="btn-icon">✨</span> AI 제안 메시지 생성하기`;
  }
}

function buildPrompt(inf, brand, product, goal, typeLabel, type) {
  return `당신은 인플루언서 마케팅 전문가입니다.

아래 정보를 바탕으로 인플루언서에게 보낼 협업 제안 메시지를 작성해주세요.

[브랜드 정보]
- 브랜드명: ${brand}
- 제품/서비스: ${product}
- 캠페인 목표: ${goal || "브랜드 인지도 향상 및 제품 홍보"}

[인플루언서 정보]
- 이름: ${inf.name}
- 플랫폼: ${inf.platform.toUpperCase()}
- 팔로워: ${formatNum(inf.subscribers)}
- 주요 콘텐츠: ${inf.tags.join(", ")}

[메시지 유형]
- ${typeLabel}

[작성 지침]
- 인플루언서의 콘텐츠 특성을 반영하여 친근하고 설득력 있게 작성
- 협업의 구체적 내용과 혜택을 명확히 전달
- 한국어로 작성
- ${type === "dm" ? "150자 내외의 짧은 DM 형식" : "300~500자의 이메일 형식"}`;
}

// 목업 타이핑 효과
async function mockTyping(inf, brand, product, goal, type, el) {
  const msgs = {
    dm:
`안녕하세요, ${inf.name}님! 👋

저는 ${brand} 브랜드 담당자입니다.
평소 ${inf.tags[0]} 관련 콘텐츠를 통해 많은 영감을 받고 있어요.

저희 ${product}와 콜라보레이션을 제안드리고 싶습니다.
${inf.name}님의 진정성 있는 스타일이 저희 방향과 잘 맞을 것 같아요.

자세한 내용은 이메일로 보내드려도 될까요? 😊`,

    email:
`안녕하세요, ${inf.name}님.

${brand} 마케팅 담당자 김민지입니다.

평소 ${inf.platform.toUpperCase()}에서 ${inf.tags.join(", ")} 콘텐츠를 통해 많은 분들과 진솔하게 소통하시는 모습에 깊은 인상을 받아 연락드리게 되었습니다.

저희 브랜드 ${brand}에서 출시한 ${product}는 ${goal || "많은 분들의 일상에 긍정적인 변화를 드리고자 개발된 제품"}입니다. ${inf.name}님의 ${formatNum(inf.subscribers)} 팔로워 분들께 진정성 있게 전달될 수 있을 것이라 생각합니다.

협업 형태는 유연하게 협의 가능하며, 제품 제공은 물론 합리적인 보상도 제안드릴 예정입니다.

바쁘신 중에도 긍정적인 검토 부탁드립니다. 편한 시간에 미팅 가능하시다면 언제든지 연락 주세요.

감사합니다.
${brand} 마케팅팀 드림`,
  };

  const text = msgs[type];
  let current = "";
  for (const ch of text) {
    current += ch;
    el.textContent = current;
    await sleep(16);
  }
}


// ══════════════════════════════════════
// 📋 메시지 복사
// ══════════════════════════════════════
function copyMessage() {
  const content = document.getElementById("aiResultContent").textContent;
  if (!content) return;

  navigator.clipboard.writeText(content)
    .then(() => showToast("✅ 메시지가 클립보드에 복사되었습니다!"))
    .catch(() => {
      const ta = document.createElement("textarea");
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("✅ 메시지가 복사되었습니다!");
    });
}


// ══════════════════════════════════════
// 🔧 유틸
// ══════════════════════════════════════
function formatNum(n) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000)     return Math.round(n / 10000) + "만";
  if (n >= 1000)      return (n / 1000).toFixed(1) + "천";
  return n.toString();
}

function platformIcon(p) {
  return { youtube: "▶", tiktok: "♪", instagram: "◆" }[p] || "•";
}

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
