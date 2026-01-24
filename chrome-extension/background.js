// BamLead Chrome Extension - Background Service Worker
// Version 1.0.2 - Simplified for better installation compatibility

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('BamLead extension installing...');
  
  // Initialize storage
  try {
    await chrome.storage.local.set({
      leadsCount: 0,
      todayCount: 0,
      savedLeads: [],
      savedEmails: [],
      lastDate: new Date().toDateString()
    });
    console.log('Storage initialized');
  } catch (e) {
    console.error('Storage init error:', e);
  }

  console.log('BamLead extension installed successfully!');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATS') {
    chrome.storage.local.get(['leadsCount', 'todayCount'], (data) => {
      sendResponse(data);
    });
    return true; // Required for async response
  }

  if (message.type === 'SAVE_LEAD') {
    saveLeadToStorage(message.lead).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'ADD_EMAIL') {
    addEmailToStorage(message.email).then((result) => {
      sendResponse(result);
    });
    return true;
  }
});

async function saveLeadToStorage(lead) {
  const storage = await chrome.storage.local.get(['savedLeads', 'leadsCount', 'todayCount']);
  const savedLeads = storage.savedLeads || [];
  savedLeads.push({
    ...lead,
    savedAt: new Date().toISOString()
  });

  await chrome.storage.local.set({
    savedLeads,
    leadsCount: (storage.leadsCount || 0) + 1,
    todayCount: (storage.todayCount || 0) + 1
  });

  // Update badge
  await chrome.action.setBadgeText({ text: '✓' });
  await chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
  
  setTimeout(async () => {
    await chrome.action.setBadgeText({ text: '' });
  }, 2000);

  return { success: true };
}

async function addEmailToStorage(email) {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid email' };
  }

  const storage = await chrome.storage.local.get(['savedEmails']);
  const savedEmails = storage.savedEmails || [];
  
  if (!savedEmails.includes(email.trim())) {
    savedEmails.push(email.trim());
    await chrome.storage.local.set({ savedEmails });
    
    await chrome.action.setBadgeText({ text: '+1' });
    await chrome.action.setBadgeBackgroundColor({ color: '#14b8a6' });
    
    setTimeout(async () => {
      await chrome.action.setBadgeText({ text: '' });
    }, 2000);

    return { success: true, email: email.trim() };
  }

  return { success: false, error: 'Email already saved' };
}
