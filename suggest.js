/* ═══════════════════════════════════════
   MKWAY — suggest.js  (mkway.co.kr/suggest)
   NoxInfluencer API 연동 버전
   흐름: 검색 → 연락처 조회 → 채널 상세 → AI 메시지 생성
═══════════════════════════════════════ */

// ──────────────────────────────────────
// 🔑 API 키 설정
// 실제 배포 시 서버(백엔드)에서 처리해야 합니다.
// ──────────────────────────────────────
const NOX_API_KEY    = "YOUR_NOX_API_KEY_HERE";
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE";
const NOX_BASE_URL   = "https://service.noxinfluencer.com";

// NOX API 키 설정 여부 (키 미설정 시 목업 데이터 사용)
const NOX_ENABLED = NOX_API_KEY !== "YOUR_NOX_API_KEY_HERE";


// ──────────────────────────────────────
// 📦 목업 데이터 (API 키 미설정 시 사용)
// ──────────────────────────────────────
const MOCK_INFLUENCERS = [
  { id:"mock_1", name:"뷰티위치 BeautyWitch", platform:"youtube", country:"KR",
    subscribers:1200000, last10AvgViews:580000, last10AvgEngagementRate:0.048,
    tags:["뷰티","스킨케어","메이크업"], avatar:"B",
    email:"contact@beautywitch.kr", socialLink:"@beautywitch_",
    url:"https://www.youtube.com/@beautywitch" },
  { id:"mock_2", name:"먹방킹 FoodKing", platform:"youtube", country:"KR",
    subscribers:850000, last10AvgViews:320000, last10AvgEngagementRate:0.062,
    tags:["먹방","푸드","리뷰"], avatar:"F",
    email:"foodking@naver.com", socialLink:"@foodking_official",
    url:"https://www.youtube.com/@foodking" },
  { id:"mock_3", name:"FitStar Mia", platform:"tiktok", country:"KR",
    subscribers:780000, last10AvgViews:2300000, last10AvgEngagementRate:0.091,
    tags:["피트니스","헬스","다이어트"], avatar:"M",
    email:"mia@fitstar.co.kr", socialLink:"@fitstar_mia",
    url:"https://www.tiktok.com/@fitstar_mia" },
  { id:"mock_4", name:"테크리뷰어 TechJun", platform:"youtube", country:"KR",
    subscribers:2300000, last10AvgViews:950000, last10AvgEngagementRate:0.039,
    tags:["테크","IT","리뷰"], avatar:"T",
    email:"techjun@gmail.com", socialLink:"@techjun",
    url:"https://www.youtube.com/@techjun" },
  { id:"mock_5", name:"패션퀸 StyleQueen", platform:"instagram", country:"KR",
    subscribers:450000, last10AvgViews:82000, last10AvgEngagementRate:0.055,
    tags:["패션","스타일","OOTD"], avatar:"S",
    email:"style@queenpr.kr", socialLink:"@stylequeen_daily",
    url:"https://www.instagram.com/stylequeen_daily" },
  { id:"mock_6", name:"홈쿡 HomeCook", platform:"youtube", country:"KR",
    subscribers:560000, last10AvgViews:210000, last10AvgEngagementRate:0.051,
    tags:["요리","레시피","홈쿡"], avatar:"H",
    email:"homecook@kakao.com", socialLink:"@homecook_secret",
    url:"https://www.youtube.com/@homecook" },
  { id:"mock_7", name:"댄스팀 DanceForce", platform:"tiktok", country:"KR",
    subscribers:1800000, last10AvgViews:5400000, last10AvgEngagementRate:0.124,
    tags:["댄스","K-POP","엔터테인먼트"], avatar:"D",
    email:"danceforce@agency.kr", socialLink:"@danceforce_official",
    url:"https://www.tiktok.com/@danceforce" },
  { id:"mock_8", name:"Wellness Hana", platform:"instagram", country:"JP",
    subscribers:290000, last10AvgViews:38000, last10AvgEngagementRate:0.068,
    tags:["웰니스","요가","명상"], avatar:"W",
    email:"hana@wellnesslife.jp", socialLink:"@wellness_hana",
    url:"https://www.instagram.com/wellness_hana" },
];


// ──────────────────────────────────────
// 📌 전역 상태
// ──────────────────────────────────────
let selectedInfluencer = null;
let searchResults      = [];
let debounceTimer      = null;


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
// 🌐 NoxInfluencer API 호출 함수
// ══════════════════════════════════════

// 상태 코드 → 사용자 안내 메시지
function noxErrorMsg(code) {
  const map = {
    20000: "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    20001: "API 권한이 없습니다. 담당자에게 문의해주세요.",
    30001: "이번 달 검색 한도에 도달했습니다. 담당자에게 문의해주세요.",
    40001: "필수 파라미터가 누락되었습니다.",
    40002: "파라미터 형식이 올바르지 않습니다.",
    40003: "API 키가 올바르지 않습니다. 설정을 확인해주세요.",
    40004: "데이터를 찾을 수 없습니다.",
    40005: "API 사용 한도가 소진되었습니다. 담당자에게 문의해주세요.",
    40008: "해당 채널을 찾을 수 없습니다.",
    50000: "서비스 처리 중 오류가 발생했습니다.",
    50001: "요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.",
  };
  return map[code] || "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.";
}

// 채널 검색 (플랫폼별 개별 호출)
async function noxSearch(platform, params) {
  const url = new URL(`${NOX_BASE_URL}/nox/v1/${platform}/search`);
  url.searchParams.set("noxKey", NOX_API_KEY);
  if (params.keywords)          url.searchParams.set("keywords",          params.keywords);
  if (params.countries)         url.searchParams.set("countries",         params.countries);
  if (params.subscribersMin)    url.searchParams.set("subscribersMin",    params.subscribersMin);
  if (params.subscribersMax)    url.searchParams.set("subscribersMax",    params.subscribersMax);
  if (params.last10AvgViewsMin) url.searchParams.set("last10AvgViewsMin", params.last10AvgViewsMin);
  if (params.last10AvgViewsMax) url.searchParams.set("last10AvgViewsMax", params.last10AvgViewsMax);

  // hasEmail: YouTube=number(1), TikTok/Instagram=boolean(true)
  url.searchParams.set("hasEmail", platform === "youtube" ? "1" : "true");
  url.searchParams.set("pageNum",  "1");
  url.searchParams.set("pageSize", "9");

  const res  = await fetch(url.toString(), { headers: { "Content-Type": "application/json" } });
  const data = await res.json();
  if (data.code !== 10000) throw new Error(noxErrorMsg(data.code));

  // 응답을 내부 공통 형식으로 변환
  return (data.items || []).map((item) => ({
    id:                      item.id,
    name:                    item.title,
    platform,
    country:                 item.country   || "",
    subscribers:             item.subscribers          || 0,
    last10AvgViews:          item.last10AvgViews       || 0,
    last10AvgEngagementRate: item.last10AvgEngagementRate || 0,
    tags:                    item.noxCategory ? [item.noxCategory] : [],
    avatar:                  item.avatar    || "",
    url:                     item.url       || "",
    email:                   null,
    socialLink:              null,
  }));
}

// 연락처 조회 → 이메일 반환
async function noxContactInfos(platform, channelId) {
  const url = new URL(`${NOX_BASE_URL}/nox/v1/${platform}/contactInfos`);
  url.searchParams.set("noxKey",     NOX_API_KEY);
  url.searchParams.set("channelId",  channelId);

  const res  = await fetch(url.toString(), { headers: { "Content-Type": "application/json" } });
  const data = await res.json();
  if (data.code !== 10000) return null;

  const emailEntry = data.items?.[0]?.contactInfos?.find(
    (c) => c.name?.toLowerCase() === "email"
  );
  return emailEntry?.value || null;
}

// 채널 상세 조회 → 태그, 소셜 링크 반환
async function noxProfile(platform, channelId) {
  const url = new URL(`${NOX_BASE_URL}/nox/v1/${platform}/profile`);
  url.searchParams.set("noxKey",    NOX_API_KEY);
  url.searchParams.set("channelId", channelId);

  const res  = await fetch(url.toString(), { headers: { "Content-Type": "application/json" } });
  const data = await res.json();
  if (data.code !== 10000) return null;

  const item = data.items?.[0];
  if (!item) return null;

  // 소셜 링크: Instagram 우선, 없으면 첫 번째
  const links = Array.isArray(item.socialMediaLink) ? item.socialMediaLink : [];
  const igLink = links.find((s) => s.platformName?.toLowerCase() === "instagram");
  const socialLink = igLink?.link || links[0]?.link || null;

  // 태그 정규화
  const tags = (item.tags || [])
    .map((t) => (typeof t === "object" ? t.tagName : t))
    .filter(Boolean)
    .slice(0, 4);

  return { tags, socialLink };
}


// ══════════════════════════════════════
// 🔍 인플루언서 검색 (STEP 01)
// ══════════════════════════════════════
function searchInfluencers() {
  // 디바운스: 연속 클릭 방지 (0.5초)
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(_doSearch, 500);
}

async function _doSearch() {
  const keyword = document.getElementById("searchKeyword").value.trim();
  const searchBtn     = document.getElementById("searchBtn");
  const searchBtnText = document.getElementById("searchBtnText");

  const selectedPlatforms = Array.from(
    document.querySelectorAll("input[name='platform']:checked")
  ).map((el) => el.value);

  const country = document.getElementById("filterCountry").value;
  const subMin  = document.getElementById("subMin").value;
  const subMax  = document.getElementById("subMax").value;
  const viewMin = document.getElementById("viewMin").value;
  const viewMax = document.getElementById("viewMax").value;

  if (selectedPlatforms.length === 0) {
    showToast("⚠️ 플랫폼을 하나 이상 선택해주세요.");
    return;
  }

  searchBtn.disabled        = true;
  searchBtnText.textContent = "검색 중...";

  try {
    let results = [];

    if (!NOX_ENABLED) {
      // ── 목업 모드 (API 키 미설정 시) ──
      await sleep(600);
      const kw = keyword.toLowerCase();
      results = MOCK_INFLUENCERS.filter((inf) => {
        const matchKw       = !kw || inf.name.toLowerCase().includes(kw) ||
                              inf.tags.some((t) => t.toLowerCase().includes(kw));
        const matchPlatform = selectedPlatforms.includes(inf.platform);
        const matchCountry  = !country || inf.country === country;
        const matchSubs     = (!subMin || inf.subscribers >= Number(subMin)) &&
                              (!subMax || inf.subscribers <= Number(subMax));
        const matchViews    = (!viewMin || inf.last10AvgViews >= Number(viewMin)) &&
                              (!viewMax || inf.last10AvgViews <= Number(viewMax));
        return matchKw && matchPlatform && matchCountry && matchSubs && matchViews;
      });

    } else {
      // ── 실제 NoxInfluencer API 호출 ──
      const params = {
        keywords:          keyword   || undefined,
        countries:         country   || undefined,
        subscribersMin:    subMin    || undefined,
        subscribersMax:    subMax    || undefined,
        last10AvgViewsMin: viewMin   || undefined,
        last10AvgViewsMax: viewMax   || undefined,
      };

      // 선택된 플랫폼 병렬 호출
      const settled = await Promise.allSettled(
        selectedPlatforms.map((p) => noxSearch(p, params))
      );

      settled.forEach((r, i) => {
        if (r.status === "fulfilled") {
          results.push(...r.value);
        } else {
          console.warn(`${selectedPlatforms[i]} 검색 오류:`, r.reason?.message);
        }
      });

      if (results.length === 0 && settled.every((r) => r.status === "rejected")) {
        throw new Error(settled[0].reason?.message || "검색 중 오류가 발생했습니다.");
      }
    }

    searchResults = results;
    renderResults(results, keyword);
    document.getElementById("step02").scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    showToast(`⚠️ ${err.message}`);
  } finally {
    searchBtn.disabled        = false;
    searchBtnText.textContent = "검색하기";
  }
}

// Enter 키로 검색
document.getElementById("searchKeyword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchInfluencers();
});


// ══════════════════════════════════════
// 🃏 검색 결과 렌더링
// ══════════════════════════════════════
function renderResults(results, keyword) {
  const grid       = document.getElementById("resultsGrid");
  const meta       = document.getElementById("resultsMeta");
  const emptyState = document.getElementById("emptyState");

  grid.innerHTML = "";

  if (results.length === 0) {
    emptyState.style.display = "block";
    grid.style.display       = "none";
    meta.textContent = keyword ? `"${keyword}"에 해당하는 인플루언서를 찾지 못했습니다.` : "";
    return;
  }

  emptyState.style.display = "none";
  grid.style.display       = "grid";
  meta.textContent = `"${keyword || "전체"}" 검색 결과 — ${results.length}명의 인플루언서를 찾았습니다.`;

  results.forEach((inf, i) => {
    const isSelected = selectedInfluencer?.id === inf.id;
    const card = document.createElement("article");
    card.className = "influencer-card" + (isSelected ? " selected" : "");
    card.setAttribute("data-id", inf.id);

    // 아바타: 이미지 URL이면 img, 아니면 이니셜
    const avatarHtml = inf.avatar && inf.avatar.startsWith("http")
      ? `<img src="${inf.avatar}" alt="${inf.name}"
             style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
      : (inf.name || "?").charAt(0).toUpperCase();

    const emailHtml = inf.email
      ? `<span>📧 <a href="mailto:${inf.email}">${inf.email}</a></span>`
      : `<span style="color:var(--gray)">📧 이메일 정보 없음</span>`;

    const socialHtml = inf.socialLink
      ? `<span>🔗 ${inf.socialLink}</span>`
      : "";

    card.innerHTML = `
      <div class="influencer-card__selected-badge">✓ 선택됨</div>
      <div class="influencer-card__header">
        <div class="influencer-card__avatar">${avatarHtml}</div>
        <div>
          <div class="influencer-card__name">${inf.name}</div>
          <div class="influencer-card__platform">
            ${platformIcon(inf.platform)} ${inf.platform.toUpperCase()} · ${inf.country || "—"}
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
          <div class="stat-item__value">${formatNum(inf.last10AvgViews)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__label">참여율</div>
          <div class="stat-item__value">${toPercent(inf.last10AvgEngagementRate)}</div>
        </div>
      </div>
      <div class="influencer-card__tags">
        ${(inf.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}
      </div>
      <div class="influencer-card__contact">
        <div class="contact-info">
          ${emailHtml}
          ${socialHtml}
        </div>
      </div>
      <button class="influencer-card__select-btn" onclick="selectInfluencer('${inf.id}')">
        ${isSelected ? "✓ 선택됨" : "이 인플루언서 선택"}
      </button>
    `;

    card.style.opacity    = "0";
    card.style.transform  = "translateY(16px)";
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
// ✅ 인플루언서 선택 + 연락처/상세 자동 조회
// ══════════════════════════════════════
async function selectInfluencer(id) {
  const inf = searchResults.find((i) => i.id === id);
  if (!inf) return;

  // 버튼 즉시 로딩 상태로 변경
  document.querySelectorAll(".influencer-card").forEach((card) => {
    const isThis = card.dataset.id === String(id);
    card.classList.toggle("selected", isThis);
    const btn = card.querySelector(".influencer-card__select-btn");
    if (btn) btn.textContent = isThis ? "⏳ 정보 조회 중..." : "이 인플루언서 선택";
  });

  try {
    if (NOX_ENABLED) {
      // 연락처 + 상세 프로필 병렬 조회
      const [email, profile] = await Promise.all([
        noxContactInfos(inf.platform, id),
        noxProfile(inf.platform, id),
      ]);

      if (email)               inf.email      = email;
      if (profile?.tags?.length) inf.tags     = profile.tags;
      if (profile?.socialLink)   inf.socialLink = profile.socialLink;

      // 카드 연락처 영역 업데이트
      const card = document.querySelector(`[data-id="${id}"]`);
      const contactDiv = card?.querySelector(".contact-info");
      if (contactDiv) {
        contactDiv.innerHTML = `
          ${inf.email
            ? `<span>📧 <a href="mailto:${inf.email}">${inf.email}</a></span>`
            : `<span style="color:var(--gray)">📧 이메일 정보 없음</span>`}
          ${inf.socialLink ? `<span>🔗 ${inf.socialLink}</span>` : ""}
        `;
      }
    }

    selectedInfluencer = inf;

    // 버튼 최종 상태
    document.querySelectorAll(".influencer-card").forEach((card) => {
      const isThis = card.dataset.id === String(id);
      const btn = card.querySelector(".influencer-card__select-btn");
      if (btn) btn.textContent = isThis ? "✓ 선택됨" : "이 인플루언서 선택";
    });

    // AI 폼 선택 정보 표시
    document.getElementById("selectedInfluencer").innerHTML = `
      <div class="selected-info">
        📌 선택된 인플루언서:
        <strong>${inf.name}</strong>
        (${inf.platform.toUpperCase()} · ${formatNum(inf.subscribers)} 팔로워)
      </div>
    `;

    setTimeout(() => {
      document.getElementById("step03").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

    showToast(`${inf.name} 선택 완료! 아래에서 메시지를 생성하세요.`);

  } catch (err) {
    showToast("⚠️ 정보 조회 중 오류가 발생했습니다.");
    console.error(err);
  }
}


// ══════════════════════════════════════
// ✨ AI 제안 메시지 생성 (STEP 03)
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

  generateBtn.disabled  = true;
  generateBtn.innerHTML = `<span class="btn-icon">⏳</span> 생성 중...`;
  aiResult.classList.add("visible");
  aiResultContent.textContent = "";
  aiResultContent.classList.add("typing-cursor");

  const inf = selectedInfluencer;

  try {
    if (OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
      await mockTyping(inf, brandName, productName, campaignGoal, messageType, aiResultContent);
    } else {
      const typeLabel = messageType === "dm"
        ? "DM (짧고 친근한 스타일, 150자 내외)"
        : "이메일 (공식적이고 상세한 스타일, 300~500자)";

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model:       "gpt-4o-mini",
          messages:    [{ role: "user", content: buildPrompt(inf, brandName, productName, campaignGoal, typeLabel, messageType) }],
          max_tokens:  600,
          temperature: 0.8,
          stream:      true,
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
    console.error("AI 생성 오류:", err);
    await mockTyping(inf, brandName, productName, campaignGoal, messageType, aiResultContent);
  } finally {
    aiResultContent.classList.remove("typing-cursor");
    generateBtn.disabled  = false;
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
- 평균 조회수: ${formatNum(inf.last10AvgViews)}
- 참여율: ${toPercent(inf.last10AvgEngagementRate)}
- 주요 콘텐츠: ${(inf.tags || []).join(", ") || "라이프스타일"}

[메시지 유형]
- ${typeLabel}

[작성 지침]
- 인플루언서의 콘텐츠 특성을 반영하여 친근하고 설득력 있게 작성
- 협업의 구체적 내용과 혜택을 명확히 전달
- 한국어로 작성`;
}

async function mockTyping(inf, brand, product, goal, type, el) {
  const msgs = {
    dm:
`안녕하세요, ${inf.name}님! 👋

저는 ${brand} 브랜드 담당자입니다.
평소 ${(inf.tags || [])[0] || "콘텐츠"} 관련 영상을 통해 많은 영감을 받고 있어요.

저희 ${product}와 콜라보레이션을 제안드리고 싶습니다.
${inf.name}님의 진정성 있는 스타일이 저희 방향과 잘 맞을 것 같아요.

자세한 내용은 이메일로 보내드려도 될까요? 😊`,

    email:
`안녕하세요, ${inf.name}님.

${brand} 마케팅 담당자 김민지입니다.

평소 ${inf.platform.toUpperCase()}에서 ${(inf.tags || []).join(", ") || "다양한"} 콘텐츠를 통해 많은 분들과 진솔하게 소통하시는 모습에 깊은 인상을 받아 연락드리게 되었습니다.

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
    await sleep(15);
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
// 🔧 유틸 함수
// ══════════════════════════════════════
function formatNum(n) {
  if (!n || isNaN(n)) return "—";
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000)     return Math.round(n / 10000) + "만";
  if (n >= 1000)      return (n / 1000).toFixed(1) + "천";
  return Number(n).toLocaleString();
}

// 0.048 → "4.8%"
function toPercent(val) {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return (val * 100).toFixed(1) + "%";
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
