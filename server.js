// server.js (ES module)
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

// Cấu hình CORS
app.use(cors({
  origin: [
    "https://frontend-chat-pi.vercel.app", // Thay bằng domain frontend
    "http://localhost:3000"               // Cho dev local
  ]
}));
app.use(express.json());

// Lấy API_KEY và MODEL từ biến môi trường
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.MODEL || "gemini-1.5-flash-latest"; // ✅ Dùng model mới nhất
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

// Middleware log request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Route test
app.get("/", (req, res) => res.send("✅ Gemini proxy OK"));

// Route chat
app.post("/api/chat", async (req, res) => {
  try {
    if (!API_KEY) {
      console.error("❌ Lỗi: GEMINI_API_KEY chưa được thiết lập.");
      return res.status(500).json({ error: "Server chưa cấu hình API Key" });
    }

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Thiếu message" });

    const url = `${BASE_URL}?key=${encodeURIComponent(API_KEY)}`;

    const apiResp = await axios.post(
      url,
      { contents: [{ parts: [{ text: message }] }] },
      { timeout: 20000 }
    );

    if (apiResp.status !== 200 || !apiResp.data?.candidates) {
      console.error("⚠️ Phản hồi Gemini không hợp lệ:", apiResp.data);
      return res.status(500).json({ error: "Lỗi từ API Gemini" });
    }

    return res.json(apiResp.data);
  } catch (err) {
    console.error("Gemini API Error:", err.response?.status, err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      error: err.response?.data || { message: "Internal server error" }
    });
  }
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
