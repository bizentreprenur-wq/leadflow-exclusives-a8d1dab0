// BamLead Chrome Extension - Content Script
// Version 1.4.0 - Floating action button + message listener

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

  // Create floating action button
  function createFAB() {
    if (document.getElementById('bamlead-fab')) return;

    var fab = document.createElement('button');
    fab.id = 'bamlead-fab';
    fab.className = 'bamlead-fab';
    fab.title = 'BamLead - Extract Leads';
    fab.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="white"/></svg>';
    
    // Tooltip
    var tooltip = document.createElement('div');
    tooltip.className = 'bamlead-tooltip';
    tooltip.textContent = 'Extract leads from this page';
    document.body.appendChild(tooltip);

    fab.addEventListener('mouseenter', function() {
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
      
      // Quick-extract contacts and show notification
      var data = quickExtract();
      var count = (data.emails ? data.emails.length : 0) + (data.phones ? data.phones.length : 0);
      
      if (count > 0) {
        // Save to storage
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
