const express = require('express');
const path = require('path'); 
const cors = require('cors');
const fetch = require('node-fetch'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- ĐOẠN CODE THÔNG MINH TỰ TÌM ĐƯỜNG DẪN ---
const fs = require('fs');
let publicPath = __dirname;

// Nếu tồn tại thư mục 'public', server sẽ ưu tiên dùng nó (Dành cho Local của bạn)
if (fs.existsSync(path.join(__dirname, 'public'))) {
    publicPath = path.join(__dirname, 'public');
}

app.use(express.static(publicPath));

app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Không tìm thấy file index.html! Hãy kiểm tra lại thư mục.");
    }
});
// ----------------------------------------------

const API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/api/chat', async (req, res) => {
    try {
        if (!API_KEY) return res.status(500).json({ error: "Thiếu API KEY!" });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "stepfun/step-3.5-flash:free",
                messages: req.body.messages,
                temperature: 0.7
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ error: "Lỗi kết nối API!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});