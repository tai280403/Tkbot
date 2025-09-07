// server.js (ES module)
    import express from "express";
    import axios from "axios";
    import dotenv from "dotenv";
    import cors from "cors";

    dotenv.config();
    const app = express();
    app.use(cors({
      origin: [
        "https://frontend-chat-pi.vercel.app", // Thay đổi domain frontend của bạn tại đây
        "http://localhost:3000" // Dành cho dev local
      ]
    }));
    app.use(express.json());

    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL = "gemini-1.5-flash";
    const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    // Thêm một middleware để log tất cả các request
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
      next();
    });

    app.get("/", (req, res) => res.send("Gemini proxy OK"));

    app.post("/api/chat", async (req, res) => {
      try {
        // Kiểm tra xem API_KEY đã được thiết lập chưa
        if (!API_KEY) {
          console.error("Lỗi: GEMINI_API_KEY chưa được thiết lập trong biến môi trường.");
          return res.status(500).json({ error: "Lỗi cấu hình server: API Key bị thiếu." });
        }

        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Missing message" });

        const url = `${BASE_URL}?key=${encodeURIComponent(API_KEY)}`;

        const apiResp = await axios.post(url, {
          contents: [{ parts: [{ text: message }] }],
        }, {
          timeout: 20000,
        });

        // Kiểm tra nếu phản hồi không phải là JSON hoặc có lỗi
        if (apiResp.status !== 200 || !apiResp.data || !apiResp.data.candidates) {
          console.error("Phản hồi từ Gemini không hợp lệ:", apiResp.data);
          return res.status(500).json({ error: "Lỗi từ API Gemini." });
        }

        return res.json(apiResp.data);
      } catch (err) {
        console.error("Gemini API Error:", err.response?.status, err.response?.data?.error || err.message);
        const status = err.response?.status || 500;
        const body = err.response?.data?.error || { message: "Internal server error" };
        return res.status(status).json({ error: body });
      }
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
