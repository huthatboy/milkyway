require("dotenv").config();
const mongoose = require("mongoose");
const OpenAI   = require("openai");
const Trend    = require("./models/Trend");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbeddings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB 연결 성공");

    const trends = await Trend.find({ embedding: { $size: 0 } });
    console.log(`📦 임베딩 생성 대상: ${trends.length}개`);

    for (const trend of trends) {
      // 제목 + 요약 + 내용을 합쳐서 임베딩 생성
      const text = `${trend.title} ${trend.summary} ${trend.content}`;

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      const embedding = response.data[0].embedding;

      await Trend.updateOne(
        { _id: trend._id },
        { $set: { embedding } }
      );

      console.log(`✅ 임베딩 완료: ${trend.title}`);
    }

    console.log("🎉 전체 임베딩 생성 완료");

  } catch (err) {
    console.error("❌ 오류:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB 연결 종료");
  }
}

generateEmbeddings();