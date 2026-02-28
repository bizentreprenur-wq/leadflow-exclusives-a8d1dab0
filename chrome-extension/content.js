// BamLead Chrome Extension - Content Script
// Version 2.0.0 - Draggable FAB + Auto-extract + Enrichment Panel

(function() {
  'use strict';
  if (window.bamLeadInitialized) return;
  window.bamLeadInitialized = true;

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'PING') sendResponse({ ready: true });
    return true;
  });

  if (['chrome:', 'edge:', 'about:', 'chrome-extension:', 'extension:'].indexOf(window.location.protocol) !== -1) return;

  var autoExtractData = null;

  // ─── Auto-extract on page load ─────────────────────────
  function autoExtract() {
    var data = quickExtract();
    autoExtractData = data;
    var count = (data.emails ? data.emails.length : 0) + (data.phones ? data.phones.length : 0);
    
    // Send count to background for badge
    chrome.runtime.sendMessage({ type: 'AUTO_EXTRACT_RESULT', count: count });
    
    // Update FAB badge
    var fab = document.getElementById('bamlead-fab');
    if (fab && count > 0) {
      var badge = document.getElementById('bamlead-fab-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'bamlead-fab-badge';
        badge.className = 'bamlead-fab-badge';
        fab.appendChild(badge);
      }
      badge.textContent = count;
    }
  }

  // ─── Enrichment Panel ──────────────────────────────────
  function createEnrichmentPanel() {
    if (document.getElementById('bamlead-panel')) return;

    var panel = document.createElement('div');
    panel.id = 'bamlead-panel';
    panel.className = 'bamlead-panel';
    panel.innerHTML = [
      '<div class="bamlead-panel-header">',
      '  <span class="bamlead-panel-title">🎯 BamLead Intel</span>',
      '  <button class="bamlead-panel-close" id="bamleadPanelClose">✕</button>',
      '</div>',
      '<div class="bamlead-panel-body" id="bamleadPanelBody">',
      '  <div class="bamlead-panel-loading">Scanning...</div>',
      '</div>'
    ].join('');
    
    panel.style.display = 'none';
    document.body.appendChild(panel);

    document.getElementById('bamleadPanelClose').addEventListener('click', function() {
      panel.style.display = 'none';
    });
  }

  function showEnrichmentPanel() {
    var panel = document.getElementById('bamlead-panel');
    if (!panel) { createEnrichmentPanel(); panel = document.getElementById('bamlead-panel'); }
    panel.style.display = 'block';

    var body = document.getElementById('bamleadPanelBody');
    var data = autoExtractData || quickExtract();

    // Quick analysis
    var html = document.documentElement.outerHTML.toLowerCase();
    var platform = 'Unknown';
    var platforms = { 'WordPress': ['wp-content'], 'Shopify': ['cdn.shopify.com', 'shopify'], 'Wix': ['wix.com', '_wix'], 'Squarespace': ['squarespace'], 'Webflow': ['webflow'], 'GoDaddy': ['godaddy'] };
    for (var name in platforms) {
      if (platforms[name].some(function(p) { return html.indexOf(p) !== -1; })) { platform = name; break; }
    }

    var hasSSL = window.location.protocol === 'https:';
    var hasMobile = !!document.querySelector('meta[name="viewport"]');

    var content = '<div class="bamlead-panel-section">';
    content += '<div class="bamlead-panel-row"><span class="bamlead-pl">🏢 Company</span><span class="bamlead-pv">' + esc(data.companyName) + '</span></div>';
    content += '<div class="bamlead-panel-row"><span class="bamlead-pl">🖥️ Platform</span><span class="bamlead-pv">' + platform + '</span></div>';
    content += '<div class="bamlead-panel-row"><span class="bamlead-pl">🔒 SSL</span><span class="bamlead-pv">' + (hasSSL ? '✅' : '❌') + '</span></div>';
    content += '<div class="bamlead-panel-row"><span class="bamlead-pl">📱 Mobile</span><span class="bamlead-pv">' + (hasMobile ? '✅' : '❌') + '</span></div>';
    content += '</div>';

    if (data.emails.length > 0) {
      content += '<div class="bamlead-panel-section"><div class="bamlead-panel-label">✉️ Emails</div>';
      data.emails.forEach(function(e) {
        content += '<div class="bamlead-panel-chip" data-copy="' + esc(e) + '">' + esc(e) + '</div>';
      });
      content += '</div>';
    }

    if (data.phones.length > 0) {
      content += '<div class="bamlead-panel-section"><div class="bamlead-panel-label">📞 Phones</div>';
      data.phones.forEach(function(p) {
        content += '<div class="bamlead-panel-chip" data-copy="' + esc(p) + '">' + esc(p) + '</div>';
      });
      content += '</div>';
    }

    if (data.socialLinks.length > 0) {
      content += '<div class="bamlead-panel-section"><div class="bamlead-panel-label">🔗 Social</div>';
      data.socialLinks.forEach(function(s) {
        content += '<a class="bamlead-panel-link" href="' + esc(s.url) + '" target="_blank">' + esc(s.platform) + '</a>';
      });
      content += '</div>';
    }

    if (data.emails.length === 0 && data.phones.length === 0) {
      content += '<div class="bamlead-panel-empty">No contacts found on this page</div>';
    }

    content += '<button class="bamlead-panel-save" id="bamleadPanelSave">💾 Save Lead</button>';

    body.innerHTML = content;

    // Click to copy chips
    body.querySelectorAll('[data-copy]').forEach(function(el) {
      el.addEventListener('click', function() {
        navigator.clipboard.writeText(el.dataset.copy);
        el.style.background = '#22c55e';
        setTimeout(function() { el.style.background = ''; }, 1000);
      });
    });

    // Save button
    var saveBtn = document.getElementById('bamleadPanelSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        chrome.runtime.sendMessage({
          type: 'SAVE_LEAD',
          lead: { url: window.location.href, title: document.title, companyName: data.companyName, emails: data.emails, phones: data.phones, socialLinks: data.socialLinks, website: window.location.href }
        });
        saveBtn.textContent = '✅ Saved!';
        saveBtn.disabled = true;
      });
    }
  }

  // ─── FAB ───────────────────────────────────────────────
  function createFAB() {
    if (document.getElementById('bamlead-fab')) return;

    var fab = document.createElement('button');
    fab.id = 'bamlead-fab';
    fab.className = 'bamlead-fab';
    fab.title = 'BamLead - Click to view, drag to move';
    fab.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="white"/></svg>';

    // Draggable logic
    var isDragging = false, wasDragged = false;
    var dragStartX = 0, dragStartY = 0, fabStartX = 0, fabStartY = 0;

    try {
      var saved = localStorage.getItem('bamlead-fab-pos');
      if (saved) { var pos = JSON.parse(saved); fab.style.right = 'auto'; fab.style.bottom = 'auto'; fab.style.left = Math.min(pos.x, window.innerWidth - 60) + 'px'; fab.style.top = Math.min(pos.y, window.innerHeight - 60) + 'px'; }
    } catch(e) {}

    fab.addEventListener('mousedown', function(e) {
      isDragging = true; wasDragged = false;
      dragStartX = e.clientX; dragStartY = e.clientY;
      var rect = fab.getBoundingClientRect(); fabStartX = rect.left; fabStartY = rect.top;
      fab.style.transition = 'none'; fab.classList.add('bamlead-fab-dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true;
      fab.style.right = 'auto'; fab.style.bottom = 'auto';
      fab.style.left = Math.max(0, Math.min(fabStartX + dx, window.innerWidth - 60)) + 'px';
      fab.style.top = Math.max(0, Math.min(fabStartY + dy, window.innerHeight - 60)) + 'px';
    });

    document.addEventListener('mouseup', function() {
      if (!isDragging) return;
      isDragging = false; fab.style.transition = ''; fab.classList.remove('bamlead-fab-dragging');
      try { var r = fab.getBoundingClientRect(); localStorage.setItem('bamlead-fab-pos', JSON.stringify({ x: r.left, y: r.top })); } catch(e) {}
    });

    // Touch
    fab.addEventListener('touchstart', function(e) {
      var t = e.touches[0]; isDragging = true; wasDragged = false;
      dragStartX = t.clientX; dragStartY = t.clientY;
      var rect = fab.getBoundingClientRect(); fabStartX = rect.left; fabStartY = rect.top;
      fab.style.transition = 'none'; fab.classList.add('bamlead-fab-dragging');
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      var t = e.touches[0], dx = t.clientX - dragStartX, dy = t.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true;
      fab.style.right = 'auto'; fab.style.bottom = 'auto';
      fab.style.left = Math.max(0, Math.min(fabStartX + dx, window.innerWidth - 60)) + 'px';
      fab.style.top = Math.max(0, Math.min(fabStartY + dy, window.innerHeight - 60)) + 'px';
    }, { passive: true });

    document.addEventListener('touchend', function() {
      if (!isDragging) return;
      isDragging = false; fab.style.transition = ''; fab.classList.remove('bamlead-fab-dragging');
      try { var r = fab.getBoundingClientRect(); localStorage.setItem('bamlead-fab-pos', JSON.stringify({ x: r.left, y: r.top })); } catch(e) {}
    });

    fab.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      if (wasDragged) { wasDragged = false; return; }
      showEnrichmentPanel();
    });

    document.body.appendChild(fab);
    createEnrichmentPanel();
  }

  // ─── Quick Extract ─────────────────────────────────────
  function quickExtract() {
    var bodyText = document.body.innerText || '';
    var htmlStr = document.body.innerHTML || '';
    var data = { emails: [], phones: [], socialLinks: [], companyName: '' };

    var emailMatches = bodyText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
    data.emails = emailMatches.filter(function(e, i, arr) { return arr.indexOf(e) === i && !e.match(/\.(png|jpg|gif|svg|webp)$/i); }).slice(0, 10);

    var phoneMatches = bodyText.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g) || [];
    data.phones = phoneMatches.filter(function(p, i, arr) { return arr.indexOf(p) === i; }).slice(0, 5);

    var ogName = document.querySelector('meta[property="og:site_name"]');
    data.companyName = ogName ? ogName.content : document.title.split('|')[0].split('-')[0].trim();

    [{ platform: 'linkedin', regex: /https?:\/\/(www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>)]+/gi },
     { platform: 'twitter', regex: /https?:\/\/(www\.)?(twitter|x)\.com\/[^\s"'<>)]+/gi },
     { platform: 'facebook', regex: /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>)]+/gi },
     { platform: 'instagram', regex: /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>)]+/gi }
    ].forEach(function(sp) {
      (htmlStr.match(sp.regex) || []).slice(0, 2).forEach(function(url) {
        data.socialLinks.push({ platform: sp.platform, url: url.replace(/[)"'].*$/, '') });
      });
    });

    return data;
  }

  function esc(str) { var d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

  // ─── Init ──────────────────────────────────────────────
  function init() {
    createFAB();
    // Auto-extract after a short delay to let page fully render
    setTimeout(autoExtract, 1500);
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
