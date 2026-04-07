const express = require('express');
const path = require('path'); 
const cors = require('cors');
const fetch = require('node-fetch'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Phục vụ file từ thư mục 'public' (nơi chứa index, script, styles)
app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/api/chat', async (req, res) => {
    try {
        // Kiểm tra xem Key có tồn tại không
        if (!API_KEY || API_KEY === "") {
            return res.status(401).json({ error: "Chưa cấu hình API Key trên Server!" });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000", // Bắt buộc cho OpenRouter
                "X-Title": "AI Learning Hub"
            },
            body: JSON.stringify({
                model: "stepfun/step-3.5-flash:free",
                messages: req.body.messages,
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        // Nếu OpenRouter trả về lỗi (như lỗi 401 bạn đang gặp)
        if (data.error) {
            console.error("Lỗi từ OpenRouter:", data.error);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        res.status(500).json({ error: "Không thể kết nối tới server AI!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});