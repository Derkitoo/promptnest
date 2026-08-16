var o = "https://derkitoo.github.io/promptnest/";
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save-prompt",
      title: "Enregistrer dans PromptNest",
      contexts: ["selection", "page"]
    }), chrome.contextMenus.create({
      id: "open-vault",
      title: "Ouvrir PromptNest",
      contexts: ["all"]
    });
  });
});
chrome.contextMenus.onClicked.addListener(async (e, t) => {
  if (e.menuItemId === "open-vault") return chrome.tabs.create({ url: o });
  e.menuItemId === "save-prompt" && (await chrome.storage.local.set({ "promptnest.pendingCapture": {
    title: t?.title || "Nouvelle capture",
    url: t?.url || e.pageUrl || "",
    selection: e.selectionText || ""
  } }), t?.windowId && await chrome.action.openPopup({ windowId: t.windowId }).catch(() => {
  }));
});
