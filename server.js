const express = require('express');
const path = require('path'); 
const cors = require('cors');
const fetch = require('node-fetch'); 
require('dotenv').config();
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- STATIC FILE -------------------
let publicPath = __dirname;

if (fs.existsSync(path.join(__dirname, 'public'))) {
    publicPath = path.join(__dirname, 'public');
}

app.use(express.static(publicPath));

app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Không tìm thấy file index.html!");
    }
});

// ------------------- API KEY -------------------
const API_KEY = process.env.OPENROUTER_API_KEY;

// ------------------- CHAT API -------------------
app.post('/api/chat', async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(500).json({ error: "Thiếu API KEY!" });
        }

        console.log("📩 Request:", req.body.messages);

        // Cập nhật danh sách model ở đây
        const models = [
            "openai/gpt-oss-120b:free",
            "google/gemma-2-9b-it:free", // Kiểm tra lại ID chính xác của Google
            "nvidia/llama-3.1-nemotron-70b-instruct:free", // Model cực mạnh và đang free
            "mistralai/pixtral-12b:free", // Model mới của Mistral
            "google/gemma-4-26b-a4b-it:free", //
            "openrouter/free" //
        ];

        let data = null;
        let lastError = null;

        for (const model of models) {
            try {
                console.log("🔄 Đang thử model:", model);

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: req.body.messages,
                        temperature: 0.7
                    })
                });

                data = await response.json();

                if (!data.error) {
                    console.log("✅ Thành công với model:", model);
                    break;
                } else {
                    console.log("❌ Model lỗi:", model, data.error);
                }

            } catch (err) {
                lastError = err;
                console.log("❌ Lỗi fetch:", model);
            }
        }

        // Nếu tất cả model đều lỗi
        if (!data || data.error) {
            return res.status(500).json({
                error: "Tất cả model đều lỗi!",
                detail: data || lastError
            });
        }

        res.json(data);

    } catch (error) {
        console.error("🔥 Lỗi server:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});