const API_BASE = "http://localhost:5000/api"; // Change to Render URL after deployment

// Create context menu item on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "devbrand-generate",
    title: "✨ Turn into social post (DevBrand)",
    contexts: ["selection"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "devbrand-generate") return;

  const selectedText = info.selectionText?.trim();
  if (!selectedText) return;

  // Store selected text and open popup
  await chrome.storage.local.set({
    pendingText: selectedText,
    sourceUrl: tab.url,
    sourceTitle: tab.title,
  });

  // Open popup by triggering extension action
  chrome.action.openPopup?.().catch(() => {
    // openPopup not supported in all browsers — notify user instead
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "DevBrand",
      message: "Click the DevBrand extension icon to create your post!",
    });
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GENERATE_POST") {
    generatePost(message.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (message.type === "SCHEDULE_POST") {
    schedulePost(message.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "CHECK_AUTH") {
    chrome.storage.local.get(["accessToken"], (result) => {
      sendResponse({ loggedIn: !!result.accessToken });
    });
    return true;
  }
});

// Call Gemini via DevBrand backend
async function generatePost(payload) {
  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  if (!accessToken) throw new Error("Not logged in. Please log in on DevBrand first.");

  const response = await fetch(`${API_BASE}/ai/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      context: payload.text,
      platform: payload.platform || "linkedin",
      tone: payload.tone || "professional",
      audience: "developers",
    }),
  });

  if (response.status === 401) {
    // Try token refresh
    const refreshed = await tryRefreshToken();
    if (!refreshed) throw new Error("Session expired. Please log in again.");
    return generatePost(payload); // Retry
  }

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Generation failed");
  }

  return response.json();
}

// Schedule post via DevBrand backend
async function schedulePost(payload) {
  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  if (!accessToken) throw new Error("Not logged in.");

  const response = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Scheduling failed");
  }

  return response.json();
}

// Refresh access token
async function tryRefreshToken() {
  try {
    const { refreshToken } = await chrome.storage.local.get(["refreshToken"]);
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    await chrome.storage.local.set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return true;
  } catch {
    return false;
  }
}
