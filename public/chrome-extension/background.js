// BamLead Chrome Extension - Background Service Worker
// Version 2.0.0 - Auth + Search + Auto-extract

const BAMLEAD_API = 'https://bamlead.com/api';

// Initialize on install
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({
    leadsCount: 0,
    todayCount: 0,
    savedLeads: [],
    savedEmails: [],
    lastDate: new Date().toDateString(),
    authToken: null,
    userEmail: null
  });
});

// Listen for messages
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'GET_STATS') {
    chrome.storage.local.get(['leadsCount', 'todayCount'], function(data) {
      sendResponse(data);
    });
    return true;
  }

  if (message.type === 'SAVE_LEAD') {
    saveLeadToStorage(message.lead).then(function() {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'ADD_EMAIL') {
    addEmailToStorage(message.email).then(function(result) {
      sendResponse(result);
    });
    return true;
  }

  if (message.type === 'LOGIN') {
    loginUser(message.email, message.password).then(function(result) {
      sendResponse(result);
    }).catch(function(err) {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  if (message.type === 'LOGOUT') {
    chrome.storage.local.set({ authToken: null, userEmail: null }, function() {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_AUTH') {
    chrome.storage.local.get(['authToken', 'userEmail'], function(data) {
      sendResponse(data);
    });
    return true;
  }

  if (message.type === 'AUTO_EXTRACT_RESULT') {
    // Update badge with contact count from auto-extract
    var count = message.count || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#14b8a6' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
    sendResponse({ success: true });
    return true;
  }
});

async function loginUser(email, password) {
  const response = await fetch(BAMLEAD_API + '/auth.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: email.trim(), password: password.trim() })
  });
  const data = await response.json();
  if (data.token) {
    await chrome.storage.local.set({ authToken: data.token, userEmail: email.trim() });
    return { success: true, email: email.trim() };
  }
  return { success: false, error: data.error || 'Login failed' };
}

function saveLeadToStorage(lead) {
  return new Promise(function(resolve) {
    chrome.storage.local.get(['savedLeads', 'leadsCount', 'todayCount'], function(storage) {
      var savedLeads = storage.savedLeads || [];
      savedLeads.push(Object.assign({}, lead, { savedAt: new Date().toISOString() }));
      chrome.storage.local.set({
        savedLeads: savedLeads,
        leadsCount: (storage.leadsCount || 0) + 1,
        todayCount: (storage.todayCount || 0) + 1
      }, function() {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
        setTimeout(function() { chrome.action.setBadgeText({ text: '' }); }, 2000);
        resolve({ success: true });
      });
    });
  });
}

function addEmailToStorage(email) {
  return new Promise(function(resolve) {
    if (!email || email.indexOf('@') === -1) {
      resolve({ success: false, error: 'Invalid email' });
      return;
    }
    chrome.storage.local.get(['savedEmails'], function(storage) {
      var savedEmails = storage.savedEmails || [];
      var trimmed = email.trim();
      if (savedEmails.indexOf(trimmed) === -1) {
        savedEmails.push(trimmed);
        chrome.storage.local.set({ savedEmails: savedEmails }, function() {
          chrome.action.setBadgeText({ text: '+1' });
          chrome.action.setBadgeBackgroundColor({ color: '#14b8a6' });
          setTimeout(function() { chrome.action.setBadgeText({ text: '' }); }, 2000);
          resolve({ success: true, email: trimmed });
        });
      } else {
        resolve({ success: false, error: 'Email already saved' });
      }
    });
  });
}
