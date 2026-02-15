// BamLead Chrome Extension - Content Script
// Version 1.1.0 - Minimal: only listens for messages from popup/background
// All heavy logic now lives in popup.js and runs on-demand via chrome.scripting.executeScript

(function() {
  'use strict';

  if (window.bamLeadInitialized) return;
  window.bamLeadInitialized = true;

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      sendResponse({ ready: true });
    }
    return true;
  });
})();
