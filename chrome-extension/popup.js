// BamLead Chrome Extension - Popup Script
// Version 2.0.0 - Auth + Search A/B + Email + CRM

const BAMLEAD_API = 'https://bamlead.com/api';
let _leadsPage = 0;
const LEADS_PER_PAGE = 5;
let _searchMode = 'a'; // 'a' = GMB, 'b' = Agency
let _authToken = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check auth
    const auth = await chrome.runtime.sendMessage({ type: 'GET_AUTH' });
    if (auth.authToken) {
      _authToken = auth.authToken;
      showApp(auth.userEmail);
    } else {
      showLogin();
    }

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Search mode toggle
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => switchSearchMode(btn.dataset.mode));
    });

    // Login
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) loginPassword.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Search
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);

    // Page info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageUrl = document.getElementById('pageUrl');
    if (tab && tab.url) {
      try { pageUrl.textContent = new URL(tab.url).hostname + new URL(tab.url).pathname; }
      catch(e) { pageUrl.textContent = tab.url.substring(0, 40) + '...'; }
    }

    // Extract actions
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
    const bulkUrlsInput = document.getElementById('bulkUrlsInput');
    const bulkExtractBtn = document.getElementById('bulkExtractBtn');

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
    if (bulkUrlsInput) bulkUrlsInput.addEventListener('input', updateBulkCount);
    if (bulkExtractBtn) bulkExtractBtn.addEventListener('click', bulkExtract);

    // Email
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    if (sendEmailBtn) sendEmailBtn.addEventListener('click', handleSendEmail);
    const quickEmailBtn = document.getElementById('quickEmailBtn');
    if (quickEmailBtn) quickEmailBtn.addEventListener('click', handleQuickEmail);

    // CRM
    document.getElementById('pushGoogleSheets')?.addEventListener('click', () => pushToCRM('google-sheets'));
    document.getElementById('pushHubspot')?.addEventListener('click', () => pushToCRM('hubspot'));
    document.getElementById('pushSalesforce')?.addEventListener('click', () => pushToCRM('salesforce'));

    // Browser store link
    const storeLink = document.getElementById('storeLink');
    if (storeLink) {
      const ua = navigator.userAgent;
      if (ua.includes('Edg/')) { storeLink.href = 'https://microsoftedge.microsoft.com/addons/search/BamLead'; storeLink.textContent = '⭐ Edge'; }
      else if (ua.includes('OPR/')) { storeLink.href = 'https://addons.opera.com/search/?query=BamLead'; storeLink.textContent = '⭐ Opera'; }
    }

    // Disable on internal pages
    if (tab?.url?.match(/^(chrome|edge|brave|opera|about|chrome-extension):\/\//)) {
      if (extractBtn) extractBtn.disabled = true;
      if (analyzeBtn) analyzeBtn.disabled = true;
      if (highlightBtn) highlightBtn.disabled = true;
    }

    await loadStats();
    await renderLeadsViewer();
  } catch (error) {
    console.error('Popup init error:', error);
    showToast('Extension error - reload');
  }
});

// ─── Auth ────────────────────────────────────────────────

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
}

function showApp(email) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';
  const authDot = document.querySelector('.auth-dot');
  const authEmail = document.getElementById('authEmail');
  if (authDot) { authDot.classList.remove('offline'); authDot.classList.add('online'); }
  if (authEmail) authEmail.textContent = email || 'Connected';
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  if (!email || !password) { errorEl.textContent = 'Enter email and password'; errorEl.style.display = 'block'; return; }

  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Signing in...';
  errorEl.style.display = 'none';

  try {
    const result = await chrome.runtime.sendMessage({ type: 'LOGIN', email, password });
    if (result.success) {
      _authToken = (await chrome.runtime.sendMessage({ type: 'GET_AUTH' })).authToken;
      showApp(email);
      showToast('✅ Logged in!');
    } else {
      errorEl.textContent = result.error || 'Login failed';
      errorEl.style.display = 'block';
    }
  } catch (e) {
    errorEl.textContent = 'Connection error. Is bamlead.com reachable?';
    errorEl.style.display = 'block';
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">🚀</span> Sign In';
}

async function handleLogout() {
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  _authToken = null;
  showLogin();
  showToast('Logged out');
}

// ─── Tabs ────────────────────────────────────────────────

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + tabId));
}

function switchSearchMode(mode) {
  _searchMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('optionBFilters').style.display = mode === 'b' ? 'flex' : 'none';
}

// ─── Search ──────────────────────────────────────────────

async function handleSearch() {
  const service = document.getElementById('searchService').value.trim();
  const location = document.getElementById('searchLocation').value.trim();
  const limit = parseInt(document.getElementById('searchLimit').value, 10);
  const btn = document.getElementById('searchBtn');
  const statusEl = document.getElementById('searchStatus');
  const progressFill = document.getElementById('searchProgressFill');
  const progressText = document.getElementById('searchProgressText');
  const resultsEl = document.getElementById('searchResults');

  if (!service || !location) { showToast('Enter service and location'); return; }

  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Searching...';
  statusEl.style.display = 'flex';
  resultsEl.style.display = 'none';
  progressFill.style.width = '0%';
  progressText.textContent = 'Connecting...';

  const allResults = [];
  const endpoint = _searchMode === 'a' ? '/gmb-search-stream.php' : '/platform-search-stream.php';

  // Build filters for Option B
  const filters = {};
  if (_searchMode === 'b') {
    if (document.getElementById('filterNoWebsite')?.checked) filters.noWebsite = true;
    if (document.getElementById('filterNeedsUpgrade')?.checked) filters.needsUpgrade = true;
    if (document.getElementById('filterWeakMobile')?.checked) filters.weakMobile = true;
  }

  try {
    const params = new URLSearchParams({ service, location, limit: limit.toString() });
    Object.keys(filters).forEach(k => params.append(k, '1'));

    const response = await fetch(BAMLEAD_API + endpoint + '?' + params.toString(), {
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': 'Bearer ' + _authToken
      }
    });

    if (!response.ok) throw new Error('Search failed (' + response.status + ')');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.substring(6));
          if (event.type === 'results' && event.leads) {
            for (const lead of event.leads) {
              if (!allResults.find(r => r.name === lead.name && r.phone === lead.phone)) {
                allResults.push(lead);
              }
            }
            progressFill.style.width = Math.min(95, Math.round((allResults.length / limit) * 100)) + '%';
            progressText.textContent = allResults.length + ' leads...';
          } else if (event.type === 'complete') {
            progressFill.style.width = '100%';
            progressText.textContent = 'Done!';
          } else if (event.type === 'status') {
            progressText.textContent = event.message || 'Searching...';
          }
        } catch(e) {}
      }
    }

    // Save results
    if (allResults.length > 0) {
      const storage = await chrome.storage.local.get(['savedLeads', 'leadsCount', 'todayCount']);
      const savedLeads = storage.savedLeads || [];
      let leadsCount = storage.leadsCount || 0;
      let todayCount = storage.todayCount || 0;

      for (const lead of allResults) {
        savedLeads.push({
          companyName: lead.name || lead.businessName || '',
          url: lead.website || '', website: lead.website || '',
          emails: lead.email ? [lead.email] : [],
          phones: lead.phone ? [lead.phone] : [],
          address: lead.address || '',
          rating: lead.rating, reviews: lead.reviews,
          socialLinks: [], savedAt: new Date().toISOString(),
          source: _searchMode === 'a' ? 'search-a' : 'search-b'
        });
        leadsCount++; todayCount++;
      }
      await chrome.storage.local.set({ savedLeads, leadsCount, todayCount });
      await loadStats();
      await renderLeadsViewer();
    }

    // Show results summary
    resultsEl.style.display = 'block';
    if (allResults.length === 0) {
      resultsEl.innerHTML = '<div class="no-results">No leads found. Try different terms.</div>';
    } else {
      const top = allResults.slice(0, 15);
      resultsEl.innerHTML = `
        <div class="results-header">✅ ${allResults.length} leads found & saved!</div>
        ${top.map(r => `
          <div class="result-row">
            <div class="result-info">
              <span class="result-name">${esc(r.name || 'Unknown')}</span>
              <span class="result-detail">${esc(r.phone || r.email || r.address || '')}</span>
            </div>
            ${r.email ? `<button class="mini-email-btn" onclick="prefillEmail('${esc(r.email)}', '${esc(r.name || '')}')">✉️</button>` : ''}
          </div>
        `).join('')}
        ${allResults.length > 15 ? `<div class="results-more">+ ${allResults.length - 15} more in Leads tab</div>` : ''}
      `;
    }

    showToast(`🎯 ${allResults.length} leads found!`);
  } catch (error) {
    resultsEl.style.display = 'block';
    resultsEl.innerHTML = `<div class="no-results error">❌ ${error.message}</div>`;
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">🚀</span> Search';
  setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
}

// ─── Email Outreach ──────────────────────────────────────

function prefillEmail(email, name) {
  switchTab('tools');
  document.getElementById('emailTo').value = email;
  document.getElementById('emailSubject').value = `Quick question for ${name}`;
  document.getElementById('emailBody').focus();
}

function handleQuickEmail() {
  const dataList = document.getElementById('dataList');
  if (!dataList) return;
  const emailEl = dataList.querySelector('[data-type="email"]');
  if (emailEl) {
    const email = emailEl.dataset.value;
    prefillEmail(email, '');
  } else {
    showToast('No email found to send to');
  }
}

async function handleSendEmail() {
  const to = document.getElementById('emailTo').value.trim();
  const subject = document.getElementById('emailSubject').value.trim();
  const body = document.getElementById('emailBody').value.trim();
  const btn = document.getElementById('sendEmailBtn');

  if (!to || !subject || !body) { showToast('Fill in all fields'); return; }

  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Sending...';

  try {
    const response = await fetch(BAMLEAD_API + '/email-outreach.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _authToken },
      body: JSON.stringify({
        action: 'send_single',
        to: to,
        subject: subject,
        body: body
      })
    });
    const data = await response.json();
    if (data.success || data.sent) {
      showToast('✅ Email sent!');
      document.getElementById('emailBody').value = '';
    } else {
      showToast('❌ ' + (data.error || 'Send failed'));
    }
  } catch (e) {
    showToast('❌ Network error');
  }

  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">📤</span> Send via BamLead';
}

// ─── CRM Push ────────────────────────────────────────────

async function pushToCRM(platform) {
  const statusEl = document.getElementById('crmStatus');
  statusEl.style.display = 'block';
  statusEl.textContent = 'Preparing...';

  const storage = await chrome.storage.local.get(['savedLeads']);
  const leads = storage.savedLeads || [];

  if (leads.length === 0) {
    statusEl.innerHTML = '<span class="crm-error">No leads to push. Search or extract first.</span>';
    return;
  }

  if (platform === 'google-sheets') {
    // Open Google Drive export in dashboard
    const leadsJson = encodeURIComponent(JSON.stringify(leads.slice(0, 200)));
    window.open('https://bamlead.com/dashboard?action=export-sheets&leads=' + leadsJson.substring(0, 2000), '_blank');
    statusEl.innerHTML = '<span class="crm-success">✅ Opening Google Sheets export...</span>';
  } else if (platform === 'hubspot' || platform === 'salesforce') {
    try {
      const response = await fetch(BAMLEAD_API + '/crm-oauth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _authToken },
        body: JSON.stringify({ action: 'push_leads', platform, leads: leads.slice(0, 100) })
      });
      const data = await response.json();
      if (data.success) {
        statusEl.innerHTML = `<span class="crm-success">✅ ${data.count || leads.length} leads pushed to ${platform}!</span>`;
      } else if (data.authUrl) {
        window.open(data.authUrl, '_blank');
        statusEl.innerHTML = '<span class="crm-info">🔗 Connect your CRM in the new tab, then try again.</span>';
      } else {
        statusEl.innerHTML = `<span class="crm-error">❌ ${data.error || 'Push failed'}</span>`;
      }
    } catch (e) {
      statusEl.innerHTML = '<span class="crm-error">❌ Network error</span>';
    }
  }

  setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
}

// ─── Stats ───────────────────────────────────────────────

async function loadStats() {
  try {
    const stats = await chrome.storage.local.get(['leadsCount', 'todayCount', 'lastDate']);
    const today = new Date().toDateString();
    if (stats.lastDate !== today) {
      await chrome.storage.local.set({ todayCount: 0, lastDate: today });
      stats.todayCount = 0;
    }
    const el1 = document.getElementById('leadsCount');
    const el2 = document.getElementById('totalLeadsCount');
    const el3 = document.getElementById('todayCount');
    if (el1) el1.textContent = stats.leadsCount || 0;
    if (el2) el2.textContent = stats.leadsCount || 0;
    if (el3) el3.textContent = stats.todayCount || 0;
  } catch (e) {}
}

// ─── Leads Viewer ────────────────────────────────────────

async function renderLeadsViewer() {
  const viewer = document.getElementById('leadsViewer');
  const pagination = document.getElementById('leadsPagination');
  const searchInput = document.getElementById('leadsSearchInput');
  const query = (searchInput?.value || '').toLowerCase().trim();

  const storage = await chrome.storage.local.get(['savedLeads']);
  let leads = (storage.savedLeads || []).slice().reverse();

  if (query) {
    leads = leads.filter(l => {
      const text = [l.companyName, l.title, l.url, l.website, ...(l.emails||[]), ...(l.phones||[]), l.address].filter(Boolean).join(' ').toLowerCase();
      return text.includes(query);
    });
  }

  viewer.innerHTML = '';
  if (leads.length === 0) {
    viewer.innerHTML = `<div class="leads-empty">${query ? 'No matches' : 'No leads yet'}</div>`;
    pagination.style.display = 'none';
    return;
  }

  const totalPages = Math.ceil(leads.length / LEADS_PER_PAGE);
  _leadsPage = Math.max(0, Math.min(_leadsPage, totalPages - 1));
  const start = _leadsPage * LEADS_PER_PAGE;
  const pageLeads = leads.slice(start, start + LEADS_PER_PAGE);

  pageLeads.forEach((lead, idx) => {
    const card = document.createElement('div');
    card.className = 'lead-card';
    const name = lead.companyName || lead.title || 'Unknown';
    const date = lead.savedAt ? new Date(lead.savedAt).toLocaleDateString() : '';
    const emails = (lead.emails || []).slice(0, 2);
    const phones = (lead.phones || []).slice(0, 1);
    const source = lead.source === 'search-a' ? '🗺️' : lead.source === 'search-b' ? '🏢' : '🔍';

    card.innerHTML = `
      <div class="lead-card-header">
        <span class="lead-card-name" title="${esc(name)}">${source} ${esc(name)}</span>
        <span class="lead-card-date">${date}</span>
      </div>
      <div class="lead-card-details">
        ${emails.map(e => `<span class="lead-card-tag">✉️ ${esc(e)}</span>`).join('')}
        ${phones.map(p => `<span class="lead-card-tag">📞 ${esc(p)}</span>`).join('')}
      </div>
      <div class="lead-card-expanded">
        ${lead.url ? `<div class="lead-detail-row"><span>URL</span><span class="val">${esc(lead.url)}</span></div>` : ''}
        ${lead.address ? `<div class="lead-detail-row"><span>Address</span><span class="val">${esc(lead.address)}</span></div>` : ''}
        ${lead.rating ? `<div class="lead-detail-row"><span>Rating</span><span class="val">⭐ ${lead.rating}</span></div>` : ''}
        <div class="lead-card-actions">
          <button onclick="copyLeadData(${start + idx})">📋 Copy</button>
          ${emails.length ? `<button class="email-action" onclick="prefillEmail('${esc(emails[0])}', '${esc(name)}')">✉️ Email</button>` : ''}
          <button class="delete-btn" onclick="deleteLead(${start + idx})">🗑️</button>
        </div>
      </div>
    `;
    card.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') return; card.classList.toggle('expanded'); });
    viewer.appendChild(card);
  });

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
  const text = [lead.companyName || lead.title, lead.url || lead.website, ...(lead.emails || []), ...(lead.phones || []), lead.address].filter(Boolean).join('\n');
  navigator.clipboard.writeText(text);
  showToast('Copied!');
}

async function deleteLead(reversedIdx) {
  const storage = await chrome.storage.local.get(['savedLeads', 'leadsCount']);
  const leads = (storage.savedLeads || []).slice().reverse();
  leads.splice(reversedIdx, 1);
  const restored = leads.reverse();
  const newCount = Math.max((storage.leadsCount || 1) - 1, 0);
  await chrome.storage.local.set({ savedLeads: restored, leadsCount: newCount });
  const el = document.getElementById('leadsCount'); if (el) el.textContent = newCount;
  const el2 = document.getElementById('totalLeadsCount'); if (el2) el2.textContent = newCount;
  await renderLeadsViewer();
  showToast('Deleted');
}

// ─── Extract ─────────────────────────────────────────────

async function extractContactInfo(tab) {
  const btn = document.getElementById('extractBtn');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Extracting...';
  try {
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: _scrapeContacts });
    const data = results[0].result;
    displayExtractedData(data);
    showToast('Contacts extracted!');
  } catch (e) {
    showToast('Cannot extract from this page');
  }
  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">🔍</span> Extract Contacts';
}

function _scrapeContacts() {
  const data = { emails: [], phones: [], socialLinks: [], companyName: '', website: window.location.href, pageTitle: document.title };
  const bodyText = document.body.innerText;
  const html = document.body.innerHTML;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  data.emails = [...new Set(bodyText.match(emailRegex) || [])].filter(e => !e.match(/\.(png|jpg|gif)$/i)).slice(0, 10);
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  data.phones = [...new Set(bodyText.match(phoneRegex) || [])].slice(0, 5);
  const socialPatterns = { linkedin: /https?:\/\/(www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>)]+/gi, twitter: /https?:\/\/(www\.)?(twitter|x)\.com\/[^\s"'<>)]+/gi, facebook: /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>)]+/gi, instagram: /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>)]+/gi };
  Object.entries(socialPatterns).forEach(([platform, pattern]) => { (html.match(pattern) || []).slice(0, 2).forEach(url => { data.socialLinks.push({ platform, url: url.replace(/[)"'].*$/, '') }); }); });
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  data.companyName = ogSiteName ? ogSiteName.content : document.title.split('|')[0].split('-')[0].trim();
  const addrMatches = bodyText.match(/\d{1,5}\s[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)[,.\s]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/gi);
  if (addrMatches) data.address = addrMatches[0];
  return data;
}

function displayExtractedData(data) {
  const section = document.getElementById('dataSection');
  const list = document.getElementById('dataList');
  const quickEmailBtn = document.getElementById('quickEmailBtn');
  section.style.display = 'block';
  list.innerHTML = '';

  const items = [];
  if (data.companyName) items.push({ label: 'Company', value: data.companyName });
  if (data.website) items.push({ label: 'Website', value: data.website });
  data.emails.forEach(e => items.push({ label: '✉️ Email', value: e, type: 'email' }));
  data.phones.forEach(p => items.push({ label: '📞 Phone', value: p }));
  data.socialLinks.forEach(s => items.push({ label: '🔗 ' + s.platform, value: s.url }));
  if (data.address) items.push({ label: '📍 Address', value: data.address });

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'data-item';
    el.innerHTML = `<span class="data-label">${item.label}</span><span class="data-value" title="${esc(item.value)}">${esc(item.value)}</span>`;
    if (item.type) { el.dataset.type = item.type; el.dataset.value = item.value; }
    el.addEventListener('click', () => { navigator.clipboard.writeText(item.value); showToast('Copied!'); });
    list.appendChild(el);
  });

  if (data.emails.length > 0 && quickEmailBtn) quickEmailBtn.style.display = 'flex';
}

// ─── Analyze ─────────────────────────────────────────────

async function analyzeWebsite(tab) {
  const btn = document.getElementById('analyzeBtn');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
  try {
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: _analyzePageInBrowser });
    const analysis = results[0].result;
    displayAnalysis(analysis);
    showToast('Platform: ' + analysis.platform);
  } catch (e) {
    showToast('Cannot analyze this page');
  }
  btn.classList.remove('loading');
  btn.innerHTML = '<span class="btn-icon">📊</span> Analyze Website';
}

function _analyzePageInBrowser() {
  const html = document.documentElement.outerHTML.toLowerCase();
  const platformIndicators = { 'WordPress': ['wp-content', 'wp-includes'], 'Shopify': ['shopify', 'cdn.shopify.com'], 'Wix': ['wix.com', '_wix'], 'Squarespace': ['squarespace'], 'Webflow': ['webflow'], 'Joomla': ['joomla'], 'Drupal': ['drupal'], 'GoDaddy': ['godaddy', 'secureserver.net'], 'Weebly': ['weebly'] };
  let platform = 'Custom / Unknown';
  for (const [name, patterns] of Object.entries(platformIndicators)) { if (patterns.some(p => html.includes(p))) { platform = name; break; } }
  let loadTime = 0;
  try { const nav = performance.getEntriesByType('navigation'); if (nav.length) loadTime = Math.round(nav[0].loadEventEnd - nav[0].startTime); } catch(e) {}
  let seoScore = 0;
  const title = document.querySelector('title');
  if (title && title.textContent.length > 10 && title.textContent.length < 60) seoScore += 15;
  if (document.querySelector('meta[name="description"]')) seoScore += 15;
  if (document.querySelector('h1')) seoScore += 10;
  if (window.location.protocol === 'https:') seoScore += 15;
  if (document.querySelector('meta[name="viewport"]')) seoScore += 10;
  if (document.querySelector('link[rel="canonical"]')) seoScore += 10;
  if (document.querySelector('meta[property="og:title"]')) seoScore += 10;
  const issues = [];
  if (window.location.protocol !== 'https:') issues.push('No SSL');
  if (!document.querySelector('meta[name="viewport"]')) issues.push('Not mobile-friendly');
  if (loadTime > 3000) issues.push('Slow (' + loadTime + 'ms)');
  if (seoScore < 50) issues.push('Poor SEO');
  return { platform, hasSSL: window.location.protocol === 'https:', loadTime, seoScore: Math.min(seoScore, 100), issues };
}

function displayAnalysis(analysis) {
  const section = document.getElementById('analysisSection');
  const list = document.getElementById('analysisList');
  section.style.display = 'block';
  list.innerHTML = '';
  const items = [
    { label: 'Platform', value: analysis.platform },
    { label: 'SSL', value: analysis.hasSSL ? '✅ Yes' : '❌ No' },
    { label: 'Load Time', value: analysis.loadTime + 'ms' },
    { label: 'SEO Score', value: analysis.seoScore + '/100' }
  ];
  if (analysis.issues.length) items.push({ label: '⚠️ Issues', value: analysis.issues.join(', ') });
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'data-item';
    el.innerHTML = `<span class="data-label">${item.label}</span><span class="data-value">${esc(item.value)}</span>`;
    list.appendChild(el);
  });
}

// ─── Highlight ───────────────────────────────────────────

async function highlightContacts(tab) {
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: _highlightContactsOnPage });
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, css: `.bamlead-highlight { background: linear-gradient(135deg, rgba(20,184,166,0.3) 0%, rgba(13,148,136,0.3) 100%) !important; border-radius: 2px; padding: 1px 3px; cursor: pointer; } .bamlead-highlight:hover { background: linear-gradient(135deg, rgba(20,184,166,0.5) 0%, rgba(13,148,136,0.5) 100%) !important; }` });
    showToast('Contacts highlighted!');
  } catch(e) { showToast('Cannot highlight on this page'); }
}

function _highlightContactsOnPage() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const text = node.textContent;
    if (emailRegex.test(text) || phoneRegex.test(text)) {
      const span = document.createElement('span');
      span.className = 'bamlead-highlight';
      span.textContent = text;
      span.title = 'Click to copy';
      span.addEventListener('click', () => { navigator.clipboard.writeText(text.trim()); });
      if (node.parentNode) node.parentNode.replaceChild(span, node);
    }
    emailRegex.lastIndex = 0;
    phoneRegex.lastIndex = 0;
  });
}

// ─── Save / Send ─────────────────────────────────────────

async function saveLead(tab) {
  try {
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: _scrapeContacts });
    const data = results[0].result;
    await chrome.runtime.sendMessage({
      type: 'SAVE_LEAD',
      lead: { url: data.website, title: data.pageTitle, companyName: data.companyName, emails: data.emails, phones: data.phones, socialLinks: data.socialLinks, website: data.website, address: data.address }
    });
    await loadStats();
    await renderLeadsViewer();
    showToast('Lead saved!');
  } catch(e) { showToast('Could not save lead'); }
}

function sendToBamLead() {
  window.open('https://bamlead.com/dashboard', '_blank');
}

// ─── Export ──────────────────────────────────────────────

async function exportAsCSV() {
  const storage = await chrome.storage.local.get(['savedLeads']);
  const leads = storage.savedLeads || [];
  if (!leads.length) { showToast('No leads to export'); return; }
  let csv = 'Company,Website,Email,Phone,Address,Source,Date\n';
  leads.forEach(l => {
    csv += `"${(l.companyName||'').replace(/"/g,'""')}","${l.website||''}","${(l.emails||[]).join('; ')}","${(l.phones||[]).join('; ')}","${(l.address||'').replace(/"/g,'""')}","${l.source||'manual'}","${l.savedAt||''}"\n`;
  });
  downloadFile(csv, 'bamlead-leads.csv', 'text/csv');
  showToast('CSV downloaded!');
}

async function exportAsPDF() {
  const storage = await chrome.storage.local.get(['savedLeads']);
  const leads = storage.savedLeads || [];
  if (!leads.length) { showToast('No leads'); return; }
  let html = '<html><head><title>BamLead Leads</title><style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px;}th{background:#14b8a6;color:white;}</style></head><body><h1>BamLead Leads Export</h1><table><tr><th>Company</th><th>Website</th><th>Email</th><th>Phone</th><th>Source</th></tr>';
  leads.forEach(l => { html += `<tr><td>${esc(l.companyName||'')}</td><td>${esc(l.website||'')}</td><td>${(l.emails||[]).join(', ')}</td><td>${(l.phones||[]).join(', ')}</td><td>${l.source||'manual'}</td></tr>`; });
  html += '</table></body></html>';
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  chrome.tabs.create({ url: url });
  showToast('PDF view opened');
}

async function clearAllLeads() {
  if (!confirm('Delete all saved leads?')) return;
  await chrome.storage.local.set({ savedLeads: [], leadsCount: 0 });
  await loadStats();
  await renderLeadsViewer();
  showToast('All leads cleared');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Bulk Import ─────────────────────────────────────────

function updateBulkCount() {
  const input = document.getElementById('bulkUrlsInput');
  const count = document.getElementById('bulkCount');
  const urls = parseUrls(input.value);
  count.textContent = urls.length + ' URL' + (urls.length !== 1 ? 's' : '');
}

function parseUrls(text) {
  return text.split('\n').map(l => l.trim()).filter(l => l.match(/^https?:\/\//i)).slice(0, 50);
}

async function bulkExtract() {
  const urls = parseUrls(document.getElementById('bulkUrlsInput').value);
  if (!urls.length) { showToast('No valid URLs'); return; }
  const progress = document.getElementById('bulkProgress');
  const fill = document.getElementById('bulkProgressFill');
  const text = document.getElementById('bulkProgressText');
  const results = document.getElementById('bulkResults');
  progress.style.display = 'flex';
  results.style.display = 'flex';
  results.innerHTML = '';

  for (let i = 0; i < urls.length; i++) {
    fill.style.width = ((i + 1) / urls.length * 100) + '%';
    text.textContent = `${i + 1}/${urls.length}`;
    try {
      const tab = await chrome.tabs.create({ url: urls[i], active: false });
      await waitForTabLoad(tab.id, 10000);
      const res = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: _scrapeContacts });
      const data = res[0].result;
      const count = (data.emails?.length || 0) + (data.phones?.length || 0);
      if (count > 0) {
        await chrome.runtime.sendMessage({ type: 'SAVE_LEAD', lead: { url: urls[i], companyName: data.companyName, emails: data.emails, phones: data.phones, socialLinks: data.socialLinks, website: urls[i] } });
      }
      addBulkResult(results, count > 0 ? '✅' : '⚠️', data.companyName || new URL(urls[i]).hostname, count + ' contacts');
      chrome.tabs.remove(tab.id);
    } catch(e) {
      addBulkResult(results, '❌', new URL(urls[i]).hostname, 'Failed');
    }
  }
  await loadStats();
  await renderLeadsViewer();
  showToast(`Bulk extract done!`);
}

function waitForTabLoad(tabId, timeout) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(), timeout);
    chrome.tabs.onUpdated.addListener(function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(resolve, 500);
      }
    });
  });
}

function addBulkResult(container, icon, name, detail) {
  const row = document.createElement('div');
  row.className = 'bulk-result-row';
  row.innerHTML = `<span>${icon}</span><span class="bulk-result-name">${esc(name)}</span><span class="bulk-result-detail">${detail}</span>`;
  container.appendChild(row);
}

// ─── Helpers ─────────────────────────────────────────────

function esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 3000);
}
