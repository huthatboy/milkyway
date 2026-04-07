require("dotenv").config();
const mongoose = require("mongoose");
const Trend = require("./models/Trend");

const trends = [
  {
    title: "AI 기반 인플루언서 매칭 확산",
    summary: "브랜드들이 AI 도구를 활용해 캠페인 목적에 맞는 인플루언서를 자동으로 매칭하는 방식이 주류로 자리잡고 있다.",
    content: "2026년 인플루언서 마케팅의 가장 큰 변화는 AI 매칭 플랫폼의 보편화다. 과거에는 담당자가 수작업으로 인플루언서를 탐색했지만, 현재는 브랜드 톤앤매너, 타겟 오디언스, 예산을 입력하면 AI가 최적 후보를 자동 추천한다. 참여율, 가짜 팔로워 비율, 과거 협업 성과까지 종합 분석해 매칭 정확도가 크게 높아졌다.",
    tags: ["브랜드 인지도", "직접 판매", "앱 설치"],
    source: "Influencer Marketing Hub 2026 Report",
    year: 2026,
  },
  {
    title: "마이크로 인플루언서 ROI 우위 지속",
    summary: "팔로워 1만~10만 규모의 마이크로 인플루언서가 대형 인플루언서 대비 3~5배 높은 참여율과 전환율을 기록하고 있다.",
    content: "2026년에도 마이크로 인플루언서의 성과 우위는 뚜렷하다. 팔로워와의 신뢰 관계가 깊어 제품 추천의 진정성이 높고, 특정 니치 커뮤니티에 강한 영향력을 발휘한다. 브랜드 입장에서는 예산 대비 효율이 높아 중소 브랜드를 중심으로 마이크로 인플루언서 다수 활용 전략이 확산되고 있다.",
    tags: ["직접 판매", "브랜드 인지도"],
    source: "Sprout Social Influencer Report 2026",
    year: 2026,
  },
  {
    title: "숏폼 영상 중심의 콘텐츠 전략 고착화",
    summary: "TikTok, Instagram Reels, YouTube Shorts가 인플루언서 캠페인의 핵심 채널로 완전히 자리잡았으며 15~60초 포맷이 표준이 되었다.",
    content: "2026년 인플루언서 캠페인의 80% 이상이 숏폼 영상을 주요 포맷으로 채택하고 있다. 특히 훅(Hook) 구간인 첫 3초의 중요성이 더욱 강조되며, 제품 노출보다 스토리텔링 방식의 자연스러운 삽입이 효과적인 것으로 나타났다. 긴 영상은 유튜브 채널에서 심층 리뷰 목적으로만 활용되는 경향이다.",
    tags: ["브랜드 인지도", "직접 판매", "앱 설치"],
    source: "HubSpot Social Media Trends 2026",
    year: 2026,
  },
  {
    title: "성과 기반 보상 모델 확산",
    summary: "고정 단가 계약 대신 판매 전환, 앱 설치 수 등 실제 성과에 연동한 보상 구조가 업계 표준으로 자리잡고 있다.",
    content: "브랜드와 인플루언서 간 계약 구조가 고정 단가에서 성과 기반으로 빠르게 전환되고 있다. 전용 할인 코드, 어필리에이트 링크, CPA(Cost Per Action) 방식을 통해 실제 전환을 추적하고 그에 비례한 보상을 지급하는 구조다. 인플루언서 입장에서도 높은 성과를 낼수록 수익이 늘어나는 구조여서 양측 모두 적극적으로 수용하는 추세다.",
    tags: ["직접 판매", "앱 설치"],
    source: "Forbes Influencer Economy Report 2026",
    year: 2026,
  },
  {
    title: "진정성 콘텐츠와 UGC 결합 전략",
    summary: "브랜드가 제작한 광고보다 인플루언서가 자연스럽게 사용하는 UGC(User Generated Content) 방식의 콘텐츠가 소비자 신뢰를 더 높인다.",
    content: "2026년 소비자들은 과도하게 연출된 광고 콘텐츠에 피로감을 느끼며 진정성 있는 콘텐츠에 더 반응한다. 브랜드들은 인플루언서에게 엄격한 스크립트를 제공하는 대신 핵심 메시지만 전달하고 표현 방식은 자유롭게 맡기는 방향으로 전환하고 있다. 실사용 후기, 언박싱, 일상 삽입형 콘텐츠가 높은 성과를 기록한다.",
    tags: ["브랜드 인지도", "직접 판매"],
    source: "Nielsen Consumer Trust Report 2026",
    year: 2026,
  },
  {
    title: "라이브 커머스와 인플루언서 결합 가속",
    summary: "실시간 라이브 방송 중 제품을 소개하고 즉시 구매로 연결하는 라이브 커머스가 인플루언서 마케팅의 핵심 전환 채널로 부상했다.",
    content: "인스타그램 라이브, 네이버 쇼핑라이브, TikTok Shop을 중심으로 인플루언서 라이브 커머스가 폭발적으로 성장하고 있다. 실시간 소통으로 신뢰를 형성하고 한정 혜택을 제공해 즉각적인 구매를 유도하는 방식이다. 특히 뷰티, 패션, 식품 카테고리에서 전환율이 일반 광고 대비 10배 이상 높은 것으로 나타났다.",
    tags: ["직접 판매"],
    source: "McKinsey Commerce Report 2026",
    year: 2026,
  },
  {
    title: "인플루언서 장기 파트너십 선호 증가",
    summary: "단발성 협업보다 3개월 이상의 장기 파트너십이 브랜드 인지도와 소비자 신뢰 구축에 효과적인 것으로 나타났다.",
    content: "브랜드들이 단발 협업의 낮은 지속 효과를 인식하면서 장기 앰버서더 계약이 빠르게 늘고 있다. 인플루언서가 지속적으로 같은 브랜드를 언급할수록 팔로워들의 브랜드 신뢰도가 높아지며, 인플루언서 본인도 브랜드에 대한 이해도가 깊어져 더 자연스러운 콘텐츠를 생산한다. 계약 기간은 평균 3~6개월이 가장 일반적이다.",
    tags: ["브랜드 인지도"],
    source: "Influencer Marketing Hub 2026 Report",
    year: 2026,
  },
  {
    title: "데이터 프라이버시 강화와 퍼스트파티 데이터 중요성 부상",
    summary: "쿠키 규제 강화로 인해 인플루언서를 통한 퍼스트파티 데이터 수집 전략이 중요해지고 있다.",
    content: "글로벌 개인정보 보호 규제가 강화되면서 서드파티 쿠키 기반 타겟팅이 어려워졌다. 이에 따라 인플루언서를 통해 자체 랜딩페이지, 앱 설치, 뉴스레터 구독 등 퍼스트파티 데이터를 직접 수집하는 전략이 주목받고 있다. 특히 앱 설치 캠페인에서 인플루언서 전용 링크를 통한 데이터 수집이 효과적인 방법으로 활용된다.",
    tags: ["앱 설치", "직접 판매"],
    source: "Gartner Marketing Technology Report 2026",
    year: 2026,
  },
  {
    title: "버추얼 인플루언서 활용 증가",
    summary: "AI로 만들어진 가상 인플루언서가 브랜드 이미지 리스크 없이 일관된 메시지를 전달하는 채널로 주목받고 있다.",
    content: "실제 인물 인플루언서의 사생활 논란, 발언 실수 등 리스크를 피하기 위해 AI 버추얼 인플루언서 활용이 늘고 있다. 24시간 콘텐츠 생산이 가능하고 브랜드가 원하는 이미지를 완벽하게 구현할 수 있다는 장점이 있다. 특히 10~20대 타겟의 패션, 뷰티, 게임 브랜드에서 활발하게 도입되고 있다.",
    tags: ["브랜드 인지도"],
    source: "Business Insider Virtual Influencer Report 2026",
    year: 2026,
  },
  {
    title: "멀티플랫폼 동시 배포 전략 표준화",
    summary: "하나의 캠페인을 YouTube, TikTok, Instagram에 동시 최적화하여 배포하는 멀티플랫폼 전략이 업계 표준이 되었다.",
    content: "단일 플랫폼 중심의 인플루언서 협업에서 벗어나, 같은 캠페인 메시지를 각 플랫폼 특성에 맞게 재가공하여 동시 배포하는 전략이 표준화되었다. YouTube는 심층 리뷰, TikTok은 챌린지형 숏폼, Instagram은 감성적 이미지와 Reels로 각각 최적화한다. 이를 통해 도달 범위를 극대화하면서 일관된 브랜드 메시지를 유지할 수 있다.",
    tags: ["브랜드 인지도", "앱 설치", "직접 판매"],
    source: "Hootsuite Digital Trends 2026",
    year: 2026,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB 연결 성공");

    await Trend.deleteMany({});
    console.log("🗑️ 기존 트렌드 데이터 삭제");

    await Trend.insertMany(trends);
    console.log("✅ 트렌드 데이터 10개 삽입 완료");

  } catch (err) {
    console.error("❌ 오류:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB 연결 종료");
  }
}

seed();