const mongoose = require("mongoose");

const TrendSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: [String],
  source: {
    type: String,
  },
  year: {
    type: Number,
    default: 2026,
  },
  embedding: {
    type: [Number],
  },
});

module.exports = mongoose.model("Trend", TrendSchema);