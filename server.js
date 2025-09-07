// server.js (ES module)
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors({
  origin: [
    "https://frontend-chat-pi.vercel.app", // domain frontend của bạn
    "http://localhost:3000" // cho local dev
  ]
}));
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY; // trong .env: GEMINI_API_KEY=AIzaSy...
const MODEL = "gemini-1.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

app.get("/", (req, res) => res.send("Gemini proxy OK"));

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });

    // gửi API key bằng query param ?key=...
    const url = `${BASE_URL}?key=${encodeURIComponent(API_KEY)}`;

    const apiResp = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: message }] }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          // Nếu bạn muốn thay cách khác, có thể dùng header 'x-goog-api-key': API_KEY
          // "x-goog-api-key": API_KEY
        },
        timeout: 20000,
      }
    );

    return res.json(apiResp.data);
  } catch (err) {
    // log chi tiết để debug (KHÔNG paste API key ra nơi công khai!)
    console.error("Gemini API Error:", err.response?.status, err.response?.data || err.message);
    const status = err.response?.status || 500;
    const body = err.response?.data || { message: err.message };
    return res.status(status).json({ error: body });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
