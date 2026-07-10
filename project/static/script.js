/* =========================================================================
   AI IT Help Desk Assistant - Frontend logic
   Handles: category sidebar, sending/receiving chat messages, typing
   indicator, chat history (saved in localStorage), copy-to-clipboard,
   timestamps, clear chat, and dark/light mode toggle.
   ========================================================================= */

// ---- IT categories shown in the sidebar, each with a ready-made sample
// prompt so users can click one to try the assistant instantly. ----------
const CATEGORIES = [
  { icon: "🔑", label: "Password Reset", prompt: "I forgot my Windows login password and can't get back into my laptop." },
  { icon: "🖨️", label: "Printer Issues", prompt: "My office printer shows online but won't print any documents." },
  { icon: "📶", label: "Wi-Fi Connectivity", prompt: "My laptop keeps disconnecting from the office Wi-Fi every few minutes." },
  { icon: "🔄", label: "Windows Update", prompt: "Windows Update is stuck at 40% and has been there for over an hour." },
  { icon: "💥", label: "Blue Screen (BSOD)", prompt: "My PC crashed with a blue screen showing error code MEMORY_MANAGEMENT." },
  { icon: "📦", label: "Software Install", prompt: "I'm trying to install a company app but the installer fails halfway through." },
  { icon: "✉️", label: "Email Issues", prompt: "Outlook is not syncing new emails since this morning." },
  { icon: "🔒", label: "VPN Connectivity", prompt: "I can't connect to the company VPN from home, it times out." },
  { icon: "🐢", label: "Slow Performance", prompt: "My computer has become very slow to open apps over the last week." },
  { icon: "🗄️", label: "Network Drive Access", prompt: "I can't access the shared network drive (Z:) anymore." },
  { icon: "⚠️", label: "Application Crashes", prompt: "Excel keeps crashing every time I open a large spreadsheet." },
  { icon: "🛠️", label: "Hardware Diagnostics", prompt: "My monitor turns on but shows no signal from my desktop." },
];

const STORAGE_KEY = "it_help_desk_chat_history";

const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const categoryList = document.getElementById("categoryList");
const clearChatBtn = document.getElementById("clearChatBtn");
const newChatBtn = document.getElementById("newChatBtn");
const darkModeBtn = document.getElementById("darkModeBtn");
const ticketIdEl = document.getElementById("ticketId");

let messages = []; // { role: 'user' | 'assistant', text, time }

// ---------------------------------------------------------------------
// Setup: render categories, restore saved chat, restore theme
// ---------------------------------------------------------------------
function init() {
  renderCategories();
  restoreTheme();
  restoreHistory();
  ticketIdEl.textContent = "HD-" + Math.floor(1000 + Math.random() * 9000);

  if (messages.length === 0) {
    addMessage(
      "assistant",
      "Hi, I'm your AI IT Help Desk Assistant. Tell me what's going wrong, " +
      "or pick a category from the sidebar to get started.",
      false
    );
  }
}

function renderCategories() {
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "category-item";
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span><span>${cat.label}</span>`;
    btn.addEventListener("click", () => {
      chatInput.value = cat.prompt;
      chatInput.focus();
      autoResize();
    });
    categoryList.appendChild(btn);
  });
}

// ---------------------------------------------------------------------
// Sending a message
// ---------------------------------------------------------------------
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage("user", text, true);
  chatInput.value = "";
  autoResize();
  setSending(true);
  showTyping(true);

  try {
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history }),
    });
    const data = await res.json();

    showTyping(false);

    if (!res.ok || data.error) {
      addMessage("assistant", "⚠️ " + (data.error || "Something went wrong."), true);
    } else {
      addMessage("assistant", data.reply, true);
    }
  } catch (err) {
    showTyping(false);
    addMessage("assistant", "⚠️ Could not reach the server. Is app.py running?", true);
  } finally {
    setSending(false);
  }
});

// Enter to send, Shift+Enter for a new line
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});
chatInput.addEventListener("input", autoResize);

function autoResize() {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + "px";
}

function setSending(isSending) {
  sendBtn.disabled = isSending;
  sendBtn.textContent = isSending ? "Sending…" : "Send";
}

function showTyping(visible) {
  typingIndicator.style.display = visible ? "flex" : "none";
  if (visible) chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ---------------------------------------------------------------------
// Rendering messages
// ---------------------------------------------------------------------
function addMessage(role, text, persist) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const msg = { role, text, time };
  messages.push(msg);
  renderMessage(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  if (persist) saveHistory();
}

function renderMessage(msg) {
  const row = document.createElement("div");
  row.className = "message-row " + msg.role;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = msg.role === "user" ? "You" : "IT";

  const content = document.createElement("div");
  content.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = msg.text;

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const time = document.createElement("span");
  time.textContent = msg.time;
  meta.appendChild(time);

  if (msg.role === "assistant") {
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(msg.text).then(() => {
        copyBtn.textContent = "Copied";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
      });
    });
    meta.appendChild(copyBtn);
  }

  content.appendChild(bubble);
  content.appendChild(meta);
  row.appendChild(avatar);
  row.appendChild(content);
  chatWindow.appendChild(row);
}

// ---------------------------------------------------------------------
// Chat history persistence (localStorage)
// ---------------------------------------------------------------------
function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function restoreHistory() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    messages = JSON.parse(saved);
    messages.forEach(renderMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (e) {
    messages = [];
  }
}

function clearChat() {
  messages = [];
  localStorage.removeItem(STORAGE_KEY);
  chatWindow.innerHTML = "";
  addMessage(
    "assistant",
    "Chat cleared. What IT issue can I help you with next?",
    false
  );
}

clearChatBtn.addEventListener("click", clearChat);
newChatBtn.addEventListener("click", clearChat);

// ---------------------------------------------------------------------
// Dark / light mode toggle
// ---------------------------------------------------------------------
function restoreTheme() {
  const saved = localStorage.getItem("it_help_desk_theme");
  if (saved === "light") document.body.classList.add("light-mode");
}

darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  localStorage.setItem("it_help_desk_theme", isLight ? "light" : "dark");
});

init();
