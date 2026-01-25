# BamLead Chrome Extension - Installation Guide

## ⚠️ Important: Manual Installation Required

This extension is **not yet published** to the Chrome Web Store. You must install it manually using Developer Mode.

---

## 🔧 Step-by-Step Installation

### Step 1: Download the Extension Files

1. Download or clone this repository
2. Locate the `chrome-extension` folder in the project
3. **Keep all files together** - do not rename or move individual files

### Step 2: Open Chrome Extensions Page

**Option A:** Type `chrome://extensions` in the address bar and press Enter

**Option B:** Go to Menu (⋮) → More Tools → Extensions

### Step 3: Enable Developer Mode

1. Look for the **"Developer mode"** toggle in the **top-right corner**
2. Click to turn it **ON** (it should turn blue)

### Step 4: Load the Extension

1. Click the **"Load unpacked"** button (appears after enabling developer mode)
2. A file browser will open
3. Navigate to and select the `chrome-extension` folder (the one containing `manifest.json`)
4. Click **"Select Folder"** (Windows) or **"Open"** (Mac)

### Step 5: Verify Installation

✅ You should see "BamLead - Lead Prospecting" in your extensions list  
✅ The extension icon should appear in your toolbar  
✅ If you don't see it, click the puzzle piece icon (🧩) and pin BamLead

---

## 🎯 Using the Extension

### Extract Contact Info
1. Visit any business website
2. Click the BamLead extension icon
3. Click **"Extract Contact Info"** to find emails, phones, and social links

### Analyze Website
1. Click **"Analyze Website"** to detect the platform (WordPress, Wix, Shopify, etc.)
2. See mobile optimization status and load time

### Save & Send Leads
1. After extracting info, click **"Save as Lead"** to store locally
2. Click **"Send to BamLead"** to open in the dashboard with the data pre-filled

---

## ❌ Troubleshooting

### "Extension won't load" / "Manifest file is missing"
- Make sure you selected the **folder** containing `manifest.json`, not a parent folder
- Ensure all files are present: `manifest.json`, `popup.html`, `popup.js`, `popup.css`, `background.js`, `content.js`, `content.css`, and all icon files

### "Cannot access chrome:// pages"
- This is normal - Chrome extensions cannot run on internal Chrome pages
- Navigate to a regular website (e.g., google.com) to test

### "Buttons don't work"
1. Refresh the target page after installing
2. Make sure you're on a regular website (not chrome://, edge://, or file://)
3. Check for errors: Right-click the extension popup → "Inspect" → Console tab

### "Service worker error" / "Background script failed"
1. Go to `chrome://extensions`
2. Find BamLead and click "Remove"
3. Reload the extension using "Load unpacked"

### Extension disappears after Chrome restart
This can happen in Developer Mode. To fix:
1. Go to `chrome://extensions`
2. Make sure "Developer mode" is still ON
3. Click "Load unpacked" again and reselect the folder

---

## 📦 Files Required

Make sure these files are all in your `chrome-extension` folder:

```
chrome-extension/
├── manifest.json       (required - extension config)
├── popup.html          (required - extension popup UI)
├── popup.js            (required - popup logic)
├── popup.css           (required - popup styles)
├── background.js       (required - service worker)
├── content.js          (required - page scripts)
├── content.css         (required - page styles)
├── icon16.png          (required - small icon)
├── icon32.png          (required - medium icon)
├── icon48.png          (required - large icon)
└── icon128.png         (required - extra large icon)
```

---

## 🌐 Microsoft Edge Installation

The extension also works in Microsoft Edge:

1. Open `edge://extensions`
2. Enable "Developer mode" (bottom-left toggle)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder

---

## 💬 Need Help?

Contact support at **support@bamlead.com** or use the chat on bamlead.com
