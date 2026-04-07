const express = require("express");
const router  = express.Router();
const OpenAI  = require("openai");
const Trend   = require("../models/Trend");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 벡터 유사도 계산 (코사인 유사도)
function cosineSimilarity(a, b) {
  const dot    = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA   = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB   = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

router.post("/", async (req, res) => {
  try {
    const {
      goalType,      // "전략" or "스크립트"
      purpose,       // 캠페인 목적
      sellingPoint,  // 핵심 셀링 포인트
      benefit,       // 제공 혜택
      caution,       // 주의사항
    } = req.body;

    // 입력값 검증
    if (!goalType || !purpose || !sellingPoint) {
      return res.status(400).json({
        error: "goalType, purpose, sellingPoint는 필수 입력값입니다."
      });
    }

    // ── STEP 1: 사용자 입력값을 벡터로 변환 ──
    const queryText = `${goalType} ${purpose} ${sellingPoint} ${benefit} ${caution}`;
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: queryText,
    });
    const queryVector = embeddingRes.data[0].embedding;

    // ── STEP 2: MongoDB에서 트렌드 전체 조회 후 유사도 계산 ──
    const trends = await Trend.find({});
    const scored = trends
      .map((trend) => ({
        trend,
        score: cosineSimilarity(queryVector, trend.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // 상위 3개 추출

    const relevantTrends = scored.map((s) => s.trend);

    // ── STEP 3: 프롬프트 조립 ──
    const trendContext = relevantTrends
      .map((t, i) => `[트렌드 ${i + 1}] ${t.title}\n${t.content}`)
      .join("\n\n");

    const isStrategy = goalType === "전략";

    const systemPrompt = `당신은 인플루언서 마케팅 전문가입니다.
최신 인플루언서 마케팅 트렌드를 반영하여 브랜드에 최적화된 ${isStrategy ? "마케팅 전략" : "영상 촬영 스크립트"}를 작성합니다.
아래 트렌드 데이터를 반드시 참고하여 작성하세요.

[2026 인플루언서 마케팅 트렌드]
${trendContext}`;

    const userPrompt = `아래 정보를 바탕으로 ${isStrategy ? "인플루언서 마케팅 전략" : "인플루언서용 영상 촬영 스크립트"}를 작성해주세요.

- 캠페인 목적: ${purpose}
- 핵심 셀링 포인트: ${sellingPoint}
- 제공 혜택: ${benefit || "미입력"}
- 주의사항: ${caution || "미입력"}

${isStrategy
  ? `[마케팅 전략 작성 형식]
1. 전략 요약 (2~3줄)
2. 추천 인플루언서 유형
3. 콘텐츠 방향성
4. 채널별 활용 전략
5. 예상 성과 지표`
  : `[영상 스크립트 작성 형식]
- 총 영상 길이: 60초 기준
- 훅(Hook): 첫 3초 시선 끌기
- 본문: 제품 소개 및 셀링 포인트
- CTA(Call to Action): 마지막 행동 유도
- 주의사항 반영 여부 명시`}

한국어로 작성해주세요.`;

    // ── STEP 4: OpenAI Chat API 호출 ──
    const completion = await openai.chat.completions.create({
      model:    "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      max_tokens:  1000,
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;

    res.json({
      success: true,
      result,
      usedTrends: relevantTrends.map((t) => t.title),
    });

  } catch (err) {
    console.error("❌ 생성 오류:", err.message);
    res.status(500).json({ error: "생성 중 오류가 발생했습니다." });
  }
});

module.exports = router;