// BamLead Chrome Extension - Content Script
// Version 1.5.0 - Draggable FAB + message listener

(function() {
  'use strict';

  if (window.bamLeadInitialized) return;
  window.bamLeadInitialized = true;

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'PING') {
      sendResponse({ ready: true });
    }
    return true;
  });

  // Don't inject on internal browser pages
  if (window.location.protocol === 'chrome:' || 
      window.location.protocol === 'edge:' || 
      window.location.protocol === 'about:' ||
      window.location.protocol === 'chrome-extension:' ||
      window.location.protocol === 'extension:') {
    return;
  }

  // Create floating action button (draggable)
  function createFAB() {
    if (document.getElementById('bamlead-fab')) return;

    var fab = document.createElement('button');
    fab.id = 'bamlead-fab';
    fab.className = 'bamlead-fab';
    fab.title = 'BamLead - Extract Leads (drag to move)';
    fab.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="white"/></svg>';
    
    // Tooltip
    var tooltip = document.createElement('div');
    tooltip.className = 'bamlead-tooltip';
    tooltip.textContent = 'Extract leads from this page';
    document.body.appendChild(tooltip);

    // --- Draggable logic ---
    var isDragging = false;
    var wasDragged = false;
    var dragStartX = 0, dragStartY = 0;
    var fabStartX = 0, fabStartY = 0;

    // Load saved position
    try {
      var saved = localStorage.getItem('bamlead-fab-pos');
      if (saved) {
        var pos = JSON.parse(saved);
        fab.style.right = 'auto';
        fab.style.bottom = 'auto';
        fab.style.left = Math.min(pos.x, window.innerWidth - 60) + 'px';
        fab.style.top = Math.min(pos.y, window.innerHeight - 60) + 'px';
      }
    } catch(e) {}

    fab.addEventListener('mousedown', function(e) {
      isDragging = true;
      wasDragged = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      var rect = fab.getBoundingClientRect();
      fabStartX = rect.left;
      fabStartY = rect.top;
      fab.style.transition = 'none';
      fab.classList.add('bamlead-fab-dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true;
      var newX = Math.max(0, Math.min(fabStartX + dx, window.innerWidth - 60));
      var newY = Math.max(0, Math.min(fabStartY + dy, window.innerHeight - 60));
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
      fab.style.left = newX + 'px';
      fab.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', function() {
      if (!isDragging) return;
      isDragging = false;
      fab.style.transition = '';
      fab.classList.remove('bamlead-fab-dragging');
      // Save position
      try {
        var rect = fab.getBoundingClientRect();
        localStorage.setItem('bamlead-fab-pos', JSON.stringify({ x: rect.left, y: rect.top }));
      } catch(e) {}
    });

    // Touch support for mobile
    fab.addEventListener('touchstart', function(e) {
      var touch = e.touches[0];
      isDragging = true;
      wasDragged = false;
      dragStartX = touch.clientX;
      dragStartY = touch.clientY;
      var rect = fab.getBoundingClientRect();
      fabStartX = rect.left;
      fabStartY = rect.top;
      fab.style.transition = 'none';
      fab.classList.add('bamlead-fab-dragging');
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      var touch = e.touches[0];
      var dx = touch.clientX - dragStartX;
      var dy = touch.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true;
      var newX = Math.max(0, Math.min(fabStartX + dx, window.innerWidth - 60));
      var newY = Math.max(0, Math.min(fabStartY + dy, window.innerHeight - 60));
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
      fab.style.left = newX + 'px';
      fab.style.top = newY + 'px';
    }, { passive: true });

    document.addEventListener('touchend', function() {
      if (!isDragging) return;
      isDragging = false;
      fab.style.transition = '';
      fab.classList.remove('bamlead-fab-dragging');
      try {
        var rect = fab.getBoundingClientRect();
        localStorage.setItem('bamlead-fab-pos', JSON.stringify({ x: rect.left, y: rect.top }));
      } catch(e) {}
    });

    fab.addEventListener('mouseenter', function() {
      if (isDragging) return;
      var rect = fab.getBoundingClientRect();
      tooltip.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
      tooltip.style.right = (window.innerWidth - rect.right + rect.width / 2) + 'px';
      tooltip.classList.add('visible');
    });

    fab.addEventListener('mouseleave', function() {
      tooltip.classList.remove('visible');
    });

    fab.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // If user just dragged, don't trigger extract
      if (wasDragged) {
        wasDragged = false;
        return;
      }

      // Quick-extract contacts and show notification
      var data = quickExtract();
      var count = (data.emails ? data.emails.length : 0) + (data.phones ? data.phones.length : 0);
      
      if (count > 0) {
        chrome.runtime.sendMessage({
          type: 'SAVE_LEAD',
          lead: {
            url: window.location.href,
            title: document.title,
            companyName: data.companyName,
            emails: data.emails,
            phones: data.phones,
            socialLinks: data.socialLinks,
            website: window.location.href
          }
        });
        showNotification('✅ Found ' + count + ' contacts! Lead saved.');
      } else {
        showNotification('No contacts found on this page. Try the full extract from the popup.');
      }
    });

    document.body.appendChild(fab);
  }

  // Quick contact extraction (lightweight version)
  function quickExtract() {
    var bodyText = document.body.innerText || '';
    var html = document.body.innerHTML || '';
    var data = { emails: [], phones: [], socialLinks: [], companyName: '' };

    // Emails
    var emailMatches = bodyText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
    data.emails = emailMatches.filter(function(e, i, arr) {
      return arr.indexOf(e) === i && !e.match(/\.(png|jpg|gif|svg|webp)$/i);
    }).slice(0, 10);

    // Phones
    var phoneMatches = bodyText.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g) || [];
    data.phones = phoneMatches.filter(function(p, i, arr) { return arr.indexOf(p) === i; }).slice(0, 5);

    // Company name
    var ogName = document.querySelector('meta[property="og:site_name"]');
    if (ogName) {
      data.companyName = ogName.content;
    } else {
      data.companyName = document.title.split('|')[0].split('-')[0].trim();
    }

    // Social links
    var socialPatterns = [
      { platform: 'linkedin', regex: /https?:\/\/(www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>)]+/gi },
      { platform: 'twitter', regex: /https?:\/\/(www\.)?(twitter|x)\.com\/[^\s"'<>)]+/gi },
      { platform: 'facebook', regex: /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>)]+/gi },
      { platform: 'instagram', regex: /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>)]+/gi }
    ];

    socialPatterns.forEach(function(sp) {
      var matches = html.match(sp.regex) || [];
      matches.slice(0, 2).forEach(function(url) {
        data.socialLinks.push({ platform: sp.platform, url: url.replace(/[)"'].*$/, '') });
      });
    });

    return data;
  }

  // Show on-page notification
  function showNotification(text) {
    var existing = document.querySelector('.bamlead-notification');
    if (existing) existing.remove();

    var notif = document.createElement('div');
    notif.className = 'bamlead-notification';
    notif.textContent = text;
    document.body.appendChild(notif);

    setTimeout(function() {
      if (notif.parentNode) notif.remove();
    }, 4000);
  }

  // Wait for body to be ready then inject FAB
  if (document.body) {
    createFAB();
  } else {
    document.addEventListener('DOMContentLoaded', createFAB);
  }
})();
