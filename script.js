let currentUser = null;
let currentThreadId = null;
let isLoginMode = true;
let isLoading = false;

// 1. CHUYỂN CẢNH INTRO -> AUTH
function goToAuth() {
    document.getElementById("intro-screen").classList.add("hide");
    setTimeout(() => {
        document.getElementById("intro-screen").style.display = "none";
        document.getElementById("auth-container").classList.add("active");
    }, 800);
}

// 2. CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById("auth-title").innerText = isLoginMode ? "Đăng Nhập Học Viện" : "Tạo Tài Khoản Mới";
    document.getElementById("auth-btn").innerText = isLoginMode ? "Vào Học Ngay" : "Đăng Ký Tài Khoản";
    document.getElementById("auth-switch").innerHTML = isLoginMode ? 'Chưa có tài khoản? <span class="highlight">Đăng ký ngay</span>' : 'Đã có tài khoản? <span class="highlight">Đăng nhập</span>';
    document.getElementById("confirm-password").classList.toggle("hidden", isLoginMode);
}

// 3. XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ
function handleAuth() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const confirmPass = document.getElementById("confirm-password").value.trim();
    
    if (!user || !pass) return alert("Vui lòng điền đủ!");
    
    let users = JSON.parse(localStorage.getItem("chat_users") || "{}");
    
    if (isLoginMode) {
        if (users[user] && users[user].password === pass) {
            loginSuccess(user);
        } else {
            alert("Sai tài khoản hoặc mật khẩu!");
        }
    } else {
        if (users[user]) return alert("Tài khoản đã tồn tại!");
        if (pass !== confirmPass) return alert("Mật khẩu không khớp!");
        
        users[user] = { password: pass, threads: {} };
        localStorage.setItem("chat_users", JSON.stringify(users));
        alert("Đăng ký thành công!");
        toggleAuthMode();
    }
}

function loginSuccess(user) {
    currentUser = user;
    localStorage.setItem("current_session_user", user);
    document.getElementById("auth-container").classList.remove("active");
    document.getElementById("user-display").innerText = `Chào, ${user}`;
    
    let users = JSON.parse(localStorage.getItem("chat_users"));
    let ids = Object.keys(users[user].threads || {});
    
    if (ids.length > 0) {
        loadThread(ids[ids.length - 1]);
    } else {
        createNewThread();
    }
}

// 4. QUẢN LÝ LUỒNG CHAT (THREADS)
function createNewThread() {
    currentThreadId = "T-" + Date.now();
    let users = JSON.parse(localStorage.getItem("chat_users"));
    if (!users[currentUser].threads) users[currentUser].threads = {};
    
    users[currentUser].threads[currentThreadId] = { title: "Chủ đề mới", messages: [] };
    localStorage.setItem("chat_users", JSON.stringify(users));
    loadThread(currentThreadId);
}

function loadThread(id) {
    currentThreadId = id;
    let users = JSON.parse(localStorage.getItem("chat_users"));
    let messages = users[currentUser].threads[id].messages || [];
    const chatBody = document.getElementById("chat-body");
    chatBody.innerHTML = "";
    
    if (messages.length === 0) {
        chatBody.innerHTML = `
            <div class="welcome-container">
                <span class="material-symbols-outlined welcome-icon">auto_awesome</span>
                <h2>Chào ${currentUser}!</h2>
                <p>Mình hỗ trợ IT, Toán và Tiếng Anh. Chọn gợi ý bên dưới để bắt đầu:</p>
                <div class="features-grid">
                    <div class="feature-card" onclick="quickAsk('Giải thích về SQL')">💻 Học SQL</div>
                    <div class="feature-card" onclick="quickAsk('Học từ vựng IELTS')">🇬🇧 Tiếng Anh</div>
                    <div class="feature-card" onclick="quickAsk('Giải phương trình bậc 2')">📐 Toán học</div>
                    <div class="feature-card" onclick="quickAsk('Tóm tắt bài học')">📚 Tóm tắt</div>
                </div>
            </div>`;
    } else {
        messages.forEach(m => chatBody.appendChild(createMsg(m.content, m.role === "user" ? "user-message" : "bot-message")));
    }
    renderThreadList();
    chatBody.scrollTop = chatBody.scrollHeight;
}

function renderThreadList() {
    let users = JSON.parse(localStorage.getItem("chat_users"));
    if(!users || !users[currentUser]) return;
    let threads = users[currentUser].threads;
    let list = document.getElementById("thread-list");
    list.innerHTML = "";
    
    Object.keys(threads).reverse().forEach(id => {
        let div = document.createElement("div");
        div.className = `thread-item ${id === currentThreadId ? 'active' : ''}`;
        div.innerText = threads[id].title;
        div.onclick = () => loadThread(id);
        list.appendChild(div);
    });
}

// 5. HIỂN THỊ TIN NHẮN
const createMsg = (content, type) => {
    let div = document.createElement("div"); 
    div.className = `message ${type}`;
    let inner = document.createElement("div"); 
    inner.className = "message-text";
    
    // Render Markdown nếu là tin nhắn từ bot
    if (type === "bot-message" && typeof marked !== 'undefined') {
        inner.innerHTML = marked.parse(content);
    } else {
        inner.innerText = content;
    }
    
    div.appendChild(inner); 
    return div;
};

// 6. GỬI TIN NHẮN TỚI SERVER (ĐÃ SỬA LỖI)
async function sendMessageAction() {
    let input = document.getElementById("message-input");
    let val = input.value.trim();
    if (!val || isLoading) return;

    const chatBody = document.getElementById("chat-body");
    chatBody.appendChild(createMsg(val, "user-message"));
    input.value = "";
    
    let users = JSON.parse(localStorage.getItem("chat_users"));
    let thread = users[currentUser].threads[currentThreadId];
    
    if (thread.title === "Chủ đề mới") {
        thread.title = val.substring(0, 15) + "...";
    }
    
    thread.messages.push({ role: "user", content: val });
    localStorage.setItem("chat_users", JSON.stringify(users));
    renderThreadList();
    
    isLoading = true;
    let loader = createMsg("✨ Đang suy nghĩ...", "bot-message");
    chatBody.appendChild(loader);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "Bạn là Giáo sư AI. Trả lời bằng tiếng Việt, súc tích, dùng bảng hoặc định dạng Markdown nếu cần." }, 
                    ...thread.messages.slice(-6) 
                ]
            })
        });

        const data = await res.json(); 
        loader.remove();

        // Kiểm tra lỗi từ phía Server
        if (!res.ok || data.error) {
            console.error("Lỗi Server:", data.error);
            throw new Error(typeof data.error === 'object' ? "Lỗi cấu hình API" : data.error);
        }

        // Lấy phản hồi từ OpenRouter
        if (data.choices && data.choices[0] && data.choices[0].message) {
            let reply = data.choices[0].message.content;
            chatBody.appendChild(createMsg(reply, "bot-message"));

            // Cập nhật lại lịch sử vào LocalStorage
            users = JSON.parse(localStorage.getItem("chat_users"));
            users[currentUser].threads[currentThreadId].messages.push({ role: "assistant", content: reply });
            localStorage.setItem("chat_users", JSON.stringify(users));

            // Render lại công thức toán nếu có MathJax
            if (window.MathJax) MathJax.typesetPromise();
        } else {
            throw new Error("Không nhận được phản hồi từ AI.");
        }

    } catch (e) { 
        loader.innerHTML = `<span style="color: #ff4d4d;">⚠️ Lỗi: ${e.message}</span>`; 
        console.error("Chi tiết lỗi:", e);
    } finally { 
        isLoading = false; 
        chatBody.scrollTop = chatBody.scrollHeight; 
    }
}

// 7. TIỆN ÍCH & SỰ KIỆN
function quickAsk(t) { 
    document.getElementById("message-input").value = t; 
    sendMessageAction(); 
}

document.getElementById("chat-form").onsubmit = (e) => { 
    e.preventDefault(); 
    sendMessageAction(); 
};

document.getElementById("message-input").onkeydown = (e) => { 
    if(e.key === "Enter" && !e.shiftKey) { 
        e.preventDefault(); 
        sendMessageAction(); 
    } 
};

function logout() { 
    localStorage.removeItem("current_session_user"); 
    location.reload(); 
}

window.onload = () => {
    const savedUser = localStorage.getItem("current_session_user");
    if (savedUser) {
        document.getElementById("intro-screen").style.display = "none";
        loginSuccess(savedUser);
    }
};