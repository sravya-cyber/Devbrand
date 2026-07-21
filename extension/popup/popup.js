const API_BASE = "http://localhost:5000/api";

// ─── DOM refs ──────────────────────────────────────────────────────────────
const notLoggedIn  = document.getElementById("not-logged-in");
const mainScreen   = document.getElementById("main-screen");
const authStatus   = document.getElementById("auth-status");
const emailInput   = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn     = document.getElementById("login-btn");
const loginError   = document.getElementById("login-error");
const contextInput = document.getElementById("context-input");
const platformSel  = document.getElementById("platform-select");
const toneSel      = document.getElementById("tone-select");
const generateBtn  = document.getElementById("generate-btn");
const variantsSection = document.getElementById("variants-section");
const variantsList = document.getElementById("variants-list");
const postPreview  = document.getElementById("post-preview");
const postContent  = document.getElementById("post-content");
const scheduleTime = document.getElementById("schedule-time");
const scheduleBtn  = document.getElementById("schedule-btn");
const statusMsg    = document.getElementById("status-msg");
const logoutBtn    = document.getElementById("logout-btn");

// ─── Init ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const { accessToken, userName } = await chrome.storage.local.get(["accessToken", "userName"]);

  if (accessToken) {
    showMain(userName);
    loadPendingText();
  } else {
    showNotLoggedIn();
  }

  // Set default schedule time to 30 min from now
  const defaultTime = new Date(Date.now() + 30 * 60 * 1000);
  scheduleTime.value = defaultTime.toISOString().slice(0, 16);
});

// Load text highlighted on the page (set by context menu or content script)
async function loadPendingText() {
  const { pendingText, lastSelectedText } = await chrome.storage.local.get([
    "pendingText",
    "lastSelectedText",
  ]);
  const text = pendingText || lastSelectedText || "";
  if (text) {
    contextInput.value = text;
    chrome.storage.local.remove(["pendingText"]);
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────
function showNotLoggedIn() {
  notLoggedIn.classList.remove("hidden");
  mainScreen.classList.add("hidden");
}

function showMain(userName) {
  notLoggedIn.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  if (userName) authStatus.textContent = `✓ ${userName}`;
}

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return showError(loginError, "Enter email and password");

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";
  loginError.classList.add("hidden");

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    await chrome.storage.local.set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userName: data.user.name,
    });

    showMain(data.user.name);
    loadPendingText();
  } catch (err) {
    showError(loginError, err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign in";
  }
});

logoutBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(["accessToken", "refreshToken", "userName"]);
  showNotLoggedIn();
});

// ─── Generate variants ─────────────────────────────────────────────────────
generateBtn.addEventListener("click", async () => {
  const text = contextInput.value.trim();
  if (!text) return showStatus("Paste or type some context first", "error");

  generateBtn.disabled = true;
  generateBtn.textContent = "✨ Generating...";
  variantsSection.classList.add("hidden");
  postPreview.classList.add("hidden");
  hideStatus();

  try {
    const response = await sendToBackground("GENERATE_POST", {
      text,
      platform: platformSel.value,
      tone: toneSel.value,
    });

    if (!response.success) throw new Error(response.error);

    renderVariants(response.data.variants || []);
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "✨ Generate 3 Variants";
  }
});

function renderVariants(variants) {
  variantsList.innerHTML = "";

  variants.forEach((v, idx) => {
    const card = document.createElement("div");
    card.className = "variant-card";
    card.innerHTML = `
      <div class="variant-tone">${v.tone || `Variant ${idx + 1}`}</div>
      <div class="variant-text">${v.content}</div>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll(".variant-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");

      const full = v.hashtags?.length
        ? `${v.content}\n\n${v.hashtags.join(" ")}`
        : v.content;

      postContent.value = full;
      postPreview.classList.remove("hidden");
      postPreview.scrollIntoView({ behavior: "smooth" });
    });
    variantsList.appendChild(card);
  });

  variantsSection.classList.remove("hidden");
}

// ─── Schedule post ─────────────────────────────────────────────────────────
scheduleBtn.addEventListener("click", async () => {
  const content = postContent.value.trim();
  const time = scheduleTime.value;

  if (!content) return showStatus("Post content is empty", "error");
  if (!time) return showStatus("Pick a schedule time", "error");
  if (new Date(time) <= new Date()) return showStatus("Schedule time must be in the future", "error");

  scheduleBtn.disabled = true;
  scheduleBtn.textContent = "Scheduling...";

  try {
    const response = await sendToBackground("SCHEDULE_POST", {
      content,
      platforms: [platformSel.value],
      scheduledAt: new Date(time).toISOString(),
      aiGenerated: true,
    });

    if (!response.success) throw new Error(response.error);

    showStatus("✅ Post scheduled successfully!", "success");
    postPreview.classList.add("hidden");
    variantsSection.classList.add("hidden");
    contextInput.value = "";
    variantsList.innerHTML = "";
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    scheduleBtn.disabled = false;
    scheduleBtn.textContent = "📅 Schedule Post";
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────────
function sendToBackground(type, payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, resolve);
  });
}

function showStatus(msg, type = "success") {
  statusMsg.textContent = msg;
  statusMsg.className = `status ${type}`;
  statusMsg.classList.remove("hidden");
}

function hideStatus() {
  statusMsg.classList.add("hidden");
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}
