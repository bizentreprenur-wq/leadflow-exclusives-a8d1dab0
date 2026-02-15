// BamLead Chrome Extension - Background Service Worker
// Version 1.4.0 - Compatible with Chrome, Edge, Brave, Opera

// Initialize on install
chrome.runtime.onInstalled.addListener(function() {
  console.log('BamLead extension installing...');
  
  chrome.storage.local.set({
    leadsCount: 0,
    todayCount: 0,
    savedLeads: [],
    savedEmails: [],
    lastDate: new Date().toDateString()
  }, function() {
    console.log('Storage initialized');
  });

  console.log('BamLead extension installed successfully!');
});

// Listen for messages from content script or popup
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
});

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
        
        setTimeout(function() {
          chrome.action.setBadgeText({ text: '' });
        }, 2000);

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
          
          setTimeout(function() {
            chrome.action.setBadgeText({ text: '' });
          }, 2000);

          resolve({ success: true, email: trimmed });
        });
      } else {
        resolve({ success: false, error: 'Email already saved' });
      }
    });
  });
}
