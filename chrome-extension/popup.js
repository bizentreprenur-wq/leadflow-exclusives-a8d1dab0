// BamLead Chrome Extension - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Update page URL display
  const pageUrl = document.getElementById('pageUrl');
  if (tab && tab.url) {
    const url = new URL(tab.url);
    pageUrl.textContent = url.hostname + url.pathname;
  }

  // Load saved stats
  loadStats();

  // Button handlers
  document.getElementById('extractBtn').addEventListener('click', () => extractContactInfo(tab));
  document.getElementById('analyzeBtn').addEventListener('click', () => analyzeWebsite(tab));
  document.getElementById('saveBtn').addEventListener('click', () => saveLead(tab));
  document.getElementById('sendToBamLead').addEventListener('click', sendToBamLead);
});

async function loadStats() {
  const stats = await chrome.storage.local.get(['leadsCount', 'todayCount', 'lastDate']);
  const today = new Date().toDateString();
  
  // Reset today count if it's a new day
  if (stats.lastDate !== today) {
    await chrome.storage.local.set({ todayCount: 0, lastDate: today });
    stats.todayCount = 0;
  }
  
  document.getElementById('leadsCount').textContent = stats.leadsCount || 0;
  document.getElementById('todayCount').textContent = stats.todayCount || 0;
}

async function extractContactInfo(tab) {
  const btn = document.getElementById('extractBtn');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Extracting...';

  try {
    // Execute content script to extract info
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeContactInfo
    });

    const data = results[0].result;
    displayExtractedData(data);
    showToast('Contact info extracted!');
  } catch (error) {
    console.error('Extraction error:', error);
    showToast('Could not extract data from this page');
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">🔍</span> Extract Contact Info';
}

function scrapeContactInfo() {
  const data = {
    emails: [],
    phones: [],
    socialLinks: [],
    companyName: '',
    website: window.location.href
  };

  // Get page text content
  const bodyText = document.body.innerText;
  const html = document.body.innerHTML;

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = bodyText.match(emailRegex) || [];
  data.emails = [...new Set(emails)].slice(0, 5);

  // Extract phone numbers
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  const phones = bodyText.match(phoneRegex) || [];
  data.phones = [...new Set(phones)].slice(0, 3);

  // Extract social links
  const socialPatterns = [
    /https?:\/\/(www\.)?linkedin\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(www\.)?twitter\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>]+/gi
  ];

  socialPatterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    data.socialLinks.push(...matches.slice(0, 2));
  });
  data.socialLinks = [...new Set(data.socialLinks)].slice(0, 5);

  // Try to get company name from various sources
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  const title = document.querySelector('title');
  
  if (ogSiteName) {
    data.companyName = ogSiteName.content;
  } else if (title) {
    data.companyName = title.innerText.split('|')[0].split('-')[0].trim();
  }

  return data;
}

function displayExtractedData(data) {
  const dataSection = document.getElementById('dataSection');
  const dataList = document.getElementById('dataList');
  
  dataList.innerHTML = '';

  if (data.companyName) {
    addDataItem(dataList, 'Company', data.companyName);
  }

  data.emails.forEach(email => {
    addDataItem(dataList, 'Email', email);
  });

  data.phones.forEach(phone => {
    addDataItem(dataList, 'Phone', phone);
  });

  data.socialLinks.forEach(link => {
    const platform = link.includes('linkedin') ? 'LinkedIn' :
                     link.includes('twitter') ? 'Twitter' :
                     link.includes('facebook') ? 'Facebook' :
                     link.includes('instagram') ? 'Instagram' : 'Social';
    addDataItem(dataList, platform, link);
  });

  if (dataList.children.length > 0) {
    dataSection.style.display = 'block';
    // Store data for later
    chrome.storage.local.set({ extractedData: data });
  } else {
    showToast('No contact info found on this page');
  }
}

function addDataItem(container, label, value) {
  const item = document.createElement('div');
  item.className = 'data-item';
  item.innerHTML = `
    <span class="data-label">${label}</span>
    <span class="data-value" title="${value}">${value}</span>
  `;
  container.appendChild(item);
}

async function analyzeWebsite(tab) {
  const btn = document.getElementById('analyzeBtn');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: analyzePageTech
    });

    const analysis = results[0].result;
    
    // Store analysis
    await chrome.storage.local.set({ pageAnalysis: analysis });
    
    showToast(`Platform: ${analysis.platform || 'Custom'}`);
  } catch (error) {
    console.error('Analysis error:', error);
    showToast('Could not analyze this page');
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">📊</span> Analyze Website';
}

function analyzePageTech() {
  const analysis = {
    platform: null,
    hasMobileOptimization: false,
    hasSSL: window.location.protocol === 'https:',
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
  };

  // Detect platform
  const html = document.documentElement.outerHTML.toLowerCase();
  
  if (html.includes('wp-content') || html.includes('wordpress')) {
    analysis.platform = 'WordPress';
  } else if (html.includes('shopify')) {
    analysis.platform = 'Shopify';
  } else if (html.includes('wix.com')) {
    analysis.platform = 'Wix';
  } else if (html.includes('squarespace')) {
    analysis.platform = 'Squarespace';
  } else if (html.includes('webflow')) {
    analysis.platform = 'Webflow';
  }

  // Check mobile optimization
  const viewport = document.querySelector('meta[name="viewport"]');
  analysis.hasMobileOptimization = !!viewport;

  return analysis;
}

async function saveLead(tab) {
  const data = await chrome.storage.local.get(['extractedData', 'pageAnalysis']);
  
  const lead = {
    url: tab.url,
    title: tab.title,
    ...data.extractedData,
    analysis: data.pageAnalysis,
    savedAt: new Date().toISOString()
  };

  // Get existing leads
  const storage = await chrome.storage.local.get(['savedLeads', 'leadsCount', 'todayCount']);
  const savedLeads = storage.savedLeads || [];
  
  // Add new lead
  savedLeads.push(lead);
  
  // Update counts
  const newLeadsCount = (storage.leadsCount || 0) + 1;
  const newTodayCount = (storage.todayCount || 0) + 1;

  await chrome.storage.local.set({
    savedLeads,
    leadsCount: newLeadsCount,
    todayCount: newTodayCount,
    lastDate: new Date().toDateString()
  });

  // Update UI
  document.getElementById('leadsCount').textContent = newLeadsCount;
  document.getElementById('todayCount').textContent = newTodayCount;

  showToast('Lead saved locally!');
}

async function sendToBamLead() {
  const btn = document.getElementById('sendToBamLead');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Sending...';

  try {
    const data = await chrome.storage.local.get(['extractedData', 'pageAnalysis']);
    
    // In production, this would send to the BamLead API
    // For now, open dashboard with data in URL params
    const params = new URLSearchParams({
      source: 'extension',
      company: data.extractedData?.companyName || '',
      email: data.extractedData?.emails?.[0] || '',
      phone: data.extractedData?.phones?.[0] || '',
      website: data.extractedData?.website || ''
    });

    chrome.tabs.create({
      url: `https://bamlead.com/dashboard?${params.toString()}`
    });

    showToast('Opening BamLead dashboard...');
  } catch (error) {
    console.error('Send error:', error);
    showToast('Could not send to BamLead');
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">🚀</span> Send to BamLead';
}

function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}
