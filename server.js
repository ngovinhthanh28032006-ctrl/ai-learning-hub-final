const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Sử dụng bản v2 đã cài
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Lệnh này giúp Node.js tự tìm các file html, css, js trong thư mục public
app.use(express.static('public')); 

const API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "stepfun/step-3.5-flash:free",
                messages: req.body.messages, // Lấy tin nhắn từ giao diện gửi lên
                temperature: 0.5
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ error: "Lỗi kết nối API rồi bạn ơi!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Tuyệt vời! Server của bạn đang chạy tại: http://localhost:${PORT}`);
});