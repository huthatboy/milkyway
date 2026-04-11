const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
require("dotenv").config();

console.log("MONGODB_URI 존재 여부:", !!process.env.MONGODB_URI);
console.log("OPENAI_API_KEY 존재 여부:", !!process.env.OPENAI_API_KEY);

const generateRoute = require("./routes/generate");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

app.use("/api/generate", generateRoute);

app.get("/", (req, res) => {
  res.json({ message: "MKWAY 서버 정상 작동 중" });
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});