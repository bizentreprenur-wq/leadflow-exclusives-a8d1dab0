// BamLead Chrome Extension - Popup Script
// Version 1.2.0 - All services in-browser, CSV/PDF export, no external API calls

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Update page URL display
    const pageUrl = document.getElementById('pageUrl');
    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        pageUrl.textContent = url.hostname + url.pathname;
      } catch (e) {
        pageUrl.textContent = tab.url.substring(0, 40) + '...';
      }
    } else {
      pageUrl.textContent = 'No page detected';
    }

    await loadStats();
    await renderLeadsViewer();

    const extractBtn = document.getElementById('extractBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const highlightBtn = document.getElementById('highlightBtn');
    const saveBtn = document.getElementById('saveBtn');
    const sendBtn = document.getElementById('sendToBamLead');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const clearLeadsBtn = document.getElementById('clearLeadsBtn');
    const leadsSearchInput = document.getElementById('leadsSearchInput');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (extractBtn) extractBtn.addEventListener('click', () => extractContactInfo(tab));
    if (analyzeBtn) analyzeBtn.addEventListener('click', () => analyzeWebsite(tab));
    if (highlightBtn) highlightBtn.addEventListener('click', () => highlightContacts(tab));
    if (saveBtn) saveBtn.addEventListener('click', () => saveLead(tab));
    if (sendBtn) sendBtn.addEventListener('click', sendToBamLead);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportAsCSV);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportAsPDF);
    if (clearLeadsBtn) clearLeadsBtn.addEventListener('click', clearAllLeads);
    if (leadsSearchInput) leadsSearchInput.addEventListener('input', () => renderLeadsViewer());
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => { _leadsPage--; renderLeadsViewer(); });
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => { _leadsPage++; renderLeadsViewer(); });

    // Disable on chrome:// pages
    if (tab && tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:'))) {
      showToast('Cannot access browser internal pages');
      if (extractBtn) extractBtn.disabled = true;
      if (analyzeBtn) analyzeBtn.disabled = true;
      if (highlightBtn) highlightBtn.disabled = true;
    }
  } catch (error) {
    console.error('Popup init error:', error);
    showToast('Extension error - please reload');
  }
});

// ─── Stats ───────────────────────────────────────────────

async function loadStats() {
  try {
    const stats = await chrome.storage.local.get(['leadsCount', 'todayCount', 'lastDate']);
    const today = new Date().toDateString();

    if (stats.lastDate !== today) {
      await chrome.storage.local.set({ todayCount: 0, lastDate: today });
      stats.todayCount = 0;
    }

    const leadsCountEl = document.getElementById('leadsCount');
    const totalLeadsCountEl = document.getElementById('totalLeadsCount');
    const todayCountEl = document.getElementById('todayCount');

    if (leadsCountEl) leadsCountEl.textContent = stats.leadsCount || 0;
    if (totalLeadsCountEl) totalLeadsCountEl.textContent = stats.leadsCount || 0;
    if (todayCountEl) todayCountEl.textContent = stats.todayCount || 0;
  } catch (error) {
    console.error('Load stats error:', error);
  }
}

// ─── Saved Leads Viewer ─────────────────────────────────

let _leadsPage = 0;
const LEADS_PER_PAGE = 5;

async function renderLeadsViewer() {
  const viewer = document.getElementById('leadsViewer');
  const emptyEl = document.getElementById('leadsEmpty');
  const pagination = document.getElementById('leadsPagination');
  const searchInput = document.getElementById('leadsSearchInput');
  const query = (searchInput?.value || '').toLowerCase().trim();

  const storage = await chrome.storage.local.get(['savedLeads']);
  let leads = (storage.savedLeads || []).slice().reverse(); // newest first

  // Filter
  if (query) {
    leads = leads.filter(l => {
      const text = [
        l.companyName, l.title, l.url, l.website,
        ...(l.emails || []), ...(l.phones || []),
        l.address, l.analysis?.platform
      ].filter(Boolean).join(' ').toLowerCase();
      return text.includes(query);
    });
  }

  viewer.innerHTML = '';

  if (leads.length === 0) {
    viewer.innerHTML = `<div class="leads-empty">${query ? 'No leads match your search' : 'No leads saved yet'}</div>`;
    pagination.style.display = 'none';
    return;
  }

  const totalPages = Math.ceil(leads.length / LEADS_PER_PAGE);
  _leadsPage = Math.max(0, Math.min(_leadsPage, totalPages - 1));
  const start = _leadsPage * LEADS_PER_PAGE;
  const pageLeads = leads.slice(start, start + LEADS_PER_PAGE);

  pageLeads.forEach((lead, idx) => {
    const globalIdx = leads.length - 1 - (start + idx); // reverse index back to original
    const card = document.createElement('div');
    card.className = 'lead-card';
    const name = lead.companyName || lead.title || new URL(lead.url || lead.website || 'https://unknown').hostname;
    const date = lead.savedAt ? new Date(lead.savedAt).toLocaleDateString() : '';
    const emails = (lead.emails || []).slice(0, 2);
    const phones = (lead.phones || []).slice(0, 1);

    card.innerHTML = `
      <div class="lead-card-header">
        <span class="lead-card-name" title="${esc(name)}">${esc(name)}</span>
        <span class="lead-card-date">${date}</span>
      </div>
      <div class="lead-card-details">
        ${emails.map(e => `<span class="lead-card-tag">✉️ ${esc(e)}</span>`).join('')}
        ${phones.map(p => `<span class="lead-card-tag">📞 ${esc(p)}</span>`).join('')}
        ${lead.analysis?.platform ? `<span class="lead-card-tag">🖥️ ${esc(lead.analysis.platform)}</span>` : ''}
      </div>
      <div class="lead-card-expanded">
        ${lead.url ? `<div class="lead-detail-row"><span>URL</span><span class="val" title="${esc(lead.url)}">${esc(lead.url)}</span></div>` : ''}
        ${lead.address ? `<div class="lead-detail-row"><span>Address</span><span class="val">${esc(lead.address)}</span></div>` : ''}
        ${(lead.socialLinks || []).map(s => `<div class="lead-detail-row"><span>${esc(s.platform || 'Social')}</span><span class="val">${esc(s.url)}</span></div>`).join('')}
        ${lead.analysis?.seoScore != null ? `<div class="lead-detail-row"><span>SEO</span><span class="val">${lead.analysis.seoScore}/100</span></div>` : ''}
        <div class="lead-card-actions">
          <button onclick="copyLeadData(${start + idx})">📋 Copy</button>
          <button class="delete-btn" onclick="deleteLead(${start + idx})">🗑️ Delete</button>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      card.classList.toggle('expanded');
    });

    viewer.appendChild(card);
  });

  // Pagination
  if (totalPages > 1) {
    pagination.style.display = 'flex';
    document.getElementById('pageInfo2').textContent = `${_leadsPage + 1}/${totalPages}`;
    document.getElementById('prevPageBtn').disabled = _leadsPage === 0;
    document.getElementById('nextPageBtn').disabled = _leadsPage >= totalPages - 1;
  } else {
    pagination.style.display = 'none';
  }
}

async function copyLeadData(reversedIdx) {
  const storage = await chrome.storage.local.get(['savedLeads']);
  const leads = (storage.savedLeads || []).slice().reverse();
  const lead = leads[reversedIdx];
  if (!lead) return;
  const text = [
    lead.companyName || lead.title,
    lead.url || lead.website,
    ...(lead.emails || []),
    ...(lead.phones || []),
    lead.address
  ].filter(Boolean).join('\n');
  navigator.clipboard.writeText(text);
  showToast('Lead copied to clipboard');
}

async function deleteLead(reversedIdx) {
  const storage = await chrome.storage.local.get(['savedLeads', 'leadsCount']);
  const leads = (storage.savedLeads || []).slice().reverse();
  leads.splice(reversedIdx, 1);
  const restored = leads.reverse();
  const newCount = Math.max((storage.leadsCount || 1) - 1, 0);
  await chrome.storage.local.set({ savedLeads: restored, leadsCount: newCount });
  document.getElementById('leadsCount').textContent = newCount;
  const totalEl = document.getElementById('totalLeadsCount');
  if (totalEl) totalEl.textContent = newCount;
  await renderLeadsViewer();
  showToast('Lead deleted');
}

// ─── Extract Contact Info (runs in page context) ────────

async function extractContactInfo(tab) {
  const btn = document.getElementById('extractBtn');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Extracting...';

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: _scrapeContacts
    });

    const data = results[0].result;
    displayExtractedData(data);
    showToast('Contact info extracted!');
  } catch (error) {
    console.error('Extraction error:', error);
    showToast('Could not extract data from this page');
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">🔍</span> Extract Contacts';
}

// Injected into the page — extracts emails, phones, socials, company name, address
function _scrapeContacts() {
  const data = {
    emails: [],
    phones: [],
    socialLinks: [],
    companyName: '',
    website: window.location.href,
    pageTitle: document.title
  };

  const bodyText = document.body.innerText;
  const html = document.body.innerHTML;

  // Emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = bodyText.match(emailRegex) || [];
  data.emails = [...new Set(emails)]
    .filter(e => !e.includes('.png') && !e.includes('.jpg') && !e.includes('.gif'))
    .slice(0, 10);

  // Phone numbers (US / international)
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  const phones = bodyText.match(phoneRegex) || [];
  data.phones = [...new Set(phones)].slice(0, 5);

  // Social media links
  const socialPatterns = {
    linkedin: /https?:\/\/(www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>)]+/gi,
    twitter: /https?:\/\/(www\.)?(twitter|x)\.com\/[^\s"'<>)]+/gi,
    facebook: /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>)]+/gi,
    instagram: /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>)]+/gi
  };

  Object.entries(socialPatterns).forEach(([platform, pattern]) => {
    const matches = html.match(pattern) || [];
    matches.slice(0, 2).forEach(url => {
      data.socialLinks.push({ platform, url: url.replace(/[)"'].*$/, '') });
    });
  });

  // Company name
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const schemaOrg = document.querySelector('script[type="application/ld+json"]');

  if (ogSiteName) {
    data.companyName = ogSiteName.content;
  } else if (ogTitle) {
    data.companyName = ogTitle.content.split('|')[0].split('-')[0].trim();
  } else if (schemaOrg) {
    try {
      const schema = JSON.parse(schemaOrg.textContent);
      data.companyName = schema.name || schema.organization?.name || '';
    } catch (e) { /* ignore */ }
  } else {
    data.companyName = document.title.split('|')[0].split('-')[0].trim();
  }

  // Address
  const addressPattern = /\d{1,5}\s[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)[,.\s]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/gi;
  const addrMatches = bodyText.match(addressPattern);
  if (addrMatches && addrMatches.length > 0) {
    data.address = addrMatches[0];
  }

  return data;
}

// ─── Analyze Website (runs in page context) ─────────────

async function analyzeWebsite(tab) {
  const btn = document.getElementById('analyzeBtn');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: _analyzePageInBrowser
    });

    const analysis = results[0].result;
    await chrome.storage.local.set({ pageAnalysis: analysis });
    displayAnalysis(analysis);
    showToast(`Platform: ${analysis.platform}`);
  } catch (error) {
    console.error('Analysis error:', error);
    showToast('Could not analyze this page');
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">📊</span> Analyze Website';
}

// Injected into the page — full website analysis done entirely in the browser
function _analyzePageInBrowser() {
  const html = document.documentElement.outerHTML.toLowerCase();

  // Platform detection
  const platformIndicators = {
    'WordPress': ['wp-content', 'wp-includes', 'wordpress'],
    'Shopify': ['shopify', 'cdn.shopify.com'],
    'Wix': ['wix.com', 'wixsite.com', '_wix'],
    'Squarespace': ['squarespace', 'static1.squarespace'],
    'Webflow': ['webflow', 'assets.website-files.com'],
    'Joomla': ['joomla', '/components/com_'],
    'Drupal': ['drupal', 'sites/default/files'],
    'Magento': ['magento', 'mage/cookies'],
    'GoDaddy': ['godaddy', 'secureserver.net'],
    'Weebly': ['weebly', 'weeblycloud.com']
  };

  let platform = 'Custom / Unknown';
  for (const [name, patterns] of Object.entries(platformIndicators)) {
    if (patterns.some(p => html.includes(p))) {
      platform = name;
      break;
    }
  }

  // Analytics detection
  const analytics = {
    googleAnalytics: html.includes('google-analytics.com') || html.includes('gtag') || html.includes('ga.js'),
    facebookPixel: html.includes('facebook.com/tr') || html.includes('fbq('),
    hotjar: html.includes('hotjar.com'),
    mixpanel: html.includes('mixpanel.com')
  };

  // Load time via modern API
  let loadTime = 0;
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      loadTime = Math.round(navEntries[0].loadEventEnd - navEntries[0].startTime);
    }
  } catch (e) { /* ignore */ }

  // SEO score
  let seoScore = 0;
  const title = document.querySelector('title');
  if (title && title.textContent.length > 10 && title.textContent.length < 60) seoScore += 15;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && metaDesc.content.length > 50 && metaDesc.content.length < 160) seoScore += 15;
  if (document.querySelector('h1')) seoScore += 10;
  const imgs = document.querySelectorAll('img');
  const imgsAlt = document.querySelectorAll('img[alt]:not([alt=""])');
  seoScore += imgs.length > 0 ? Math.round((imgsAlt.length / imgs.length) * 15) : 15;
  if (window.location.protocol === 'https:') seoScore += 15;
  if (document.querySelector('meta[name="viewport"]')) seoScore += 10;
  if (document.querySelector('link[rel="canonical"]')) seoScore += 10;
  if (document.querySelector('meta[property="og:title"]')) seoScore += 10;
  seoScore = Math.min(seoScore, 100);

  // Issues
  const issues = [];
  if (window.location.protocol !== 'https:') issues.push('Missing SSL certificate');
  if (!document.querySelector('meta[name="viewport"]')) issues.push('Not mobile optimized');
  if (loadTime > 3000) issues.push('Slow page load (' + loadTime + 'ms)');
  if (seoScore < 50) issues.push('Poor SEO optimization');
  if (!metaDesc) issues.push('Missing meta description');
  if (!document.querySelector('h1')) issues.push('Missing H1 tag');

  return {
    platform,
    hasSSL: window.location.protocol === 'https:',
    hasMobileOptimization: !!document.querySelector('meta[name="viewport"]'),
    hasAnalytics: analytics,
    loadTime,
    seoScore,
    issues
  };
}

// ─── Highlight Contacts on Page (runs in page context) ──

async function highlightContacts(tab) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: _highlightContactsOnPage
    });
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      css: `
        .bamlead-highlight {
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.3) 0%, rgba(13, 148, 136, 0.3) 100%) !important;
          border-radius: 2px;
          padding: 1px 3px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .bamlead-highlight:hover {
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.5) 0%, rgba(13, 148, 136, 0.5) 100%) !important;
        }
      `
    });
    showToast('Contacts highlighted on page!');
  } catch (error) {
    console.error('Highlight error:', error);
    showToast('Could not highlight contacts');
  }
}

function _highlightContactsOnPage() {
  if (window._bamleadHighlighted) return;
  window._bamleadHighlighted = true;

  function highlightMatches(regex) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while (n = walker.nextNode()) {
      if (regex.test(n.textContent)) nodes.push(n);
      regex.lastIndex = 0;
    }

    nodes.forEach(textNode => {
      const text = textNode.textContent;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      regex.lastIndex = 0;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const span = document.createElement('span');
        span.className = 'bamlead-highlight';
        span.textContent = match[0];
        span.title = 'Click to copy';
        const val = match[0];
        span.addEventListener('click', (e) => {
          e.preventDefault();
          navigator.clipboard.writeText(val);
          span.style.background = 'rgba(34, 197, 94, 0.5)';
          setTimeout(() => { span.style.background = ''; }, 500);
        });
        fragment.appendChild(span);
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      textNode.parentNode.replaceChild(fragment, textNode);
    });
  }

  highlightMatches(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  highlightMatches(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g);
}

// ─── Display helpers ─────────────────────────────────────

function displayExtractedData(data) {
  const dataSection = document.getElementById('dataSection');
  const dataList = document.getElementById('dataList');
  dataList.innerHTML = '';

  if (data.companyName) addDataItem(dataList, '🏢 Company', data.companyName);
  if (data.address) addDataItem(dataList, '📍 Address', data.address);
  data.emails.forEach(email => addDataItem(dataList, '✉️ Email', email));
  data.phones.forEach(phone => addDataItem(dataList, '📞 Phone', phone));
  data.socialLinks.forEach(link => {
    const icons = { linkedin: '💼', twitter: '🐦', facebook: '📘', instagram: '📸' };
    addDataItem(dataList, `${icons[link.platform] || '🔗'} ${link.platform}`, link.url);
  });

  if (dataList.children.length > 0) {
    dataSection.style.display = 'block';
    chrome.storage.local.set({ extractedData: data });
  } else {
    showToast('No contact info found on this page');
  }
}

function displayAnalysis(analysis) {
  const analysisSection = document.getElementById('analysisSection');
  const analysisList = document.getElementById('analysisList');
  analysisList.innerHTML = '';

  addDataItem(analysisList, '🖥️ Platform', analysis.platform);
  addDataItem(analysisList, '🔒 SSL', analysis.hasSSL ? '✅ Yes' : '❌ No');
  addDataItem(analysisList, '📱 Mobile', analysis.hasMobileOptimization ? '✅ Yes' : '❌ No');
  addDataItem(analysisList, '⏱️ Load Time', analysis.loadTime + 'ms');
  addDataItem(analysisList, '📈 SEO Score', analysis.seoScore + '/100');

  // Analytics
  const activeAnalytics = Object.entries(analysis.hasAnalytics || {})
    .filter(([, v]) => v).map(([k]) => k);
  addDataItem(analysisList, '📊 Analytics', activeAnalytics.length > 0 ? activeAnalytics.join(', ') : 'None detected');

  // Issues
  if (analysis.issues && analysis.issues.length > 0) {
    analysis.issues.forEach(issue => addDataItem(analysisList, '⚠️ Issue', issue));
  }

  analysisSection.style.display = 'block';
}

function addDataItem(container, label, value) {
  const item = document.createElement('div');
  item.className = 'data-item';
  item.innerHTML = `
    <span class="data-label">${label}</span>
    <span class="data-value" title="${value}">${value}</span>
  `;
  // Click to copy
  item.style.cursor = 'pointer';
  item.addEventListener('click', () => {
    navigator.clipboard.writeText(String(value)).then(() => {
      item.style.background = '#0d9488';
      setTimeout(() => { item.style.background = ''; }, 400);
    });
  });
  container.appendChild(item);
}

// ─── Save & Send ─────────────────────────────────────────

async function saveLead(tab) {
  const data = await chrome.storage.local.get(['extractedData', 'pageAnalysis']);

  const lead = {
    url: tab.url,
    title: tab.title,
    ...data.extractedData,
    analysis: data.pageAnalysis,
    savedAt: new Date().toISOString()
  };

  const storage = await chrome.storage.local.get(['savedLeads', 'leadsCount', 'todayCount']);
  const savedLeads = storage.savedLeads || [];
  savedLeads.push(lead);

  const newLeadsCount = (storage.leadsCount || 0) + 1;
  const newTodayCount = (storage.todayCount || 0) + 1;

  await chrome.storage.local.set({
    savedLeads,
    leadsCount: newLeadsCount,
    todayCount: newTodayCount,
    lastDate: new Date().toDateString()
  });

  document.getElementById('leadsCount').textContent = newLeadsCount;
  const totalEl = document.getElementById('totalLeadsCount');
  if (totalEl) totalEl.textContent = newLeadsCount;
  document.getElementById('todayCount').textContent = newTodayCount;

  await renderLeadsViewer();
  showToast('Lead saved locally!');
}

async function sendToBamLead() {
  const btn = document.getElementById('sendToBamLead');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Sending...';

  try {
    const data = await chrome.storage.local.get(['extractedData', 'pageAnalysis']);

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

// ─── Toast ───────────────────────────────────────────────

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─── CSV Export (in-browser) ─────────────────────────────

async function exportAsCSV() {
  const storage = await chrome.storage.local.get(['savedLeads']);
  const leads = storage.savedLeads || [];

  if (leads.length === 0) {
    showToast('No saved leads to export');
    return;
  }

  const headers = ['Company', 'Website', 'Emails', 'Phones', 'Social Links', 'Address', 'Platform', 'SEO Score', 'SSL', 'Saved At'];
  const rows = leads.map(lead => [
    csvEscape(lead.companyName || lead.title || ''),
    csvEscape(lead.url || lead.website || ''),
    csvEscape((lead.emails || []).join('; ')),
    csvEscape((lead.phones || []).join('; ')),
    csvEscape((lead.socialLinks || []).map(l => typeof l === 'string' ? l : l.url).join('; ')),
    csvEscape(lead.address || ''),
    csvEscape(lead.analysis?.platform || ''),
    lead.analysis?.seoScore ?? '',
    lead.analysis?.hasSSL ? 'Yes' : 'No',
    csvEscape(lead.savedAt || '')
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, 'bamlead-leads.csv', 'text/csv');
  showToast(`Exported ${leads.length} leads as CSV`);
}

function csvEscape(val) {
  const s = String(val).replace(/"/g, '""');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
}

// ─── PDF Export (in-browser, no library) ─────────────────

async function exportAsPDF() {
  const storage = await chrome.storage.local.get(['savedLeads']);
  const leads = storage.savedLeads || [];

  if (leads.length === 0) {
    showToast('No saved leads to export');
    return;
  }

  // Build a printable HTML document and trigger browser print-to-PDF
  const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>BamLead - Exported Leads</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
  h1 { color: #0d9488; font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #0d9488; color: #fff; padding: 8px 6px; text-align: left; }
  td { padding: 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
</style></head><body>
<h1>🎯 BamLead Lead Report</h1>
<p class="subtitle">Generated ${new Date().toLocaleDateString()} — ${leads.length} leads</p>
<table>
  <tr><th>#</th><th>Company</th><th>Website</th><th>Emails</th><th>Phones</th><th>Platform</th><th>SEO</th><th>Saved</th></tr>
  ${leads.map((lead, i) => `<tr>
    <td>${i + 1}</td>
    <td>${esc(lead.companyName || lead.title || '-')}</td>
    <td>${esc(lead.url || lead.website || '-')}</td>
    <td>${esc((lead.emails || []).join(', ') || '-')}</td>
    <td>${esc((lead.phones || []).join(', ') || '-')}</td>
    <td>${esc(lead.analysis?.platform || '-')}</td>
    <td>${lead.analysis?.seoScore ?? '-'}</td>
    <td>${lead.savedAt ? new Date(lead.savedAt).toLocaleDateString() : '-'}</td>
  </tr>`).join('')}
</table>
<p class="footer">BamLead Lead Prospecting — bamlead.com</p>
</body></html>`;

  // Open as a new tab and trigger print (user can Save as PDF)
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printTab = await chrome.tabs.create({ url });

  // Give tab time to load, then trigger print
  chrome.scripting.executeScript({
    target: { tabId: printTab.id },
    func: () => { setTimeout(() => window.print(), 500); }
  });

  showToast('PDF print dialog opening...');
}

function esc(val) {
  return String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Clear All Leads ─────────────────────────────────────

async function clearAllLeads() {
  const storage = await chrome.storage.local.get(['savedLeads']);
  const count = (storage.savedLeads || []).length;

  if (count === 0) {
    showToast('No leads to clear');
    return;
  }

  if (!confirm(`Delete all ${count} saved leads? This cannot be undone.`)) return;

  await chrome.storage.local.set({ savedLeads: [], leadsCount: 0, todayCount: 0 });
  document.getElementById('leadsCount').textContent = '0';
  const totalEl = document.getElementById('totalLeadsCount');
  if (totalEl) totalEl.textContent = '0';
  document.getElementById('todayCount').textContent = '0';
  await renderLeadsViewer();
  showToast(`Cleared ${count} leads`);
}

// ─── Download helper ─────────────────────────────────────

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}