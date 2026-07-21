// Listen for text selection — used for future inline UI if needed
document.addEventListener("mouseup", () => {
  const selected = window.getSelection()?.toString().trim();
  if (selected && selected.length > 20) {
    // Store in chrome.storage for popup to read if opened manually
    chrome.storage.local.set({ lastSelectedText: selected });
  }
});
