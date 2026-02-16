# BamLead Browser Extension - Installation Guide

## 🌐 Supported Browsers

This extension works on **all Chromium-based browsers**:
- ✅ Google Chrome
- ✅ Microsoft Edge
- ✅ Brave Browser
- ✅ Opera
- ✅ Vivaldi
- ✅ Arc Browser

> **Note:** Firefox uses a slightly different extension format. See the Firefox section below.

---

## ⚠️ Important: Manual Installation Required

This extension is **not yet published** to browser stores. You must install it manually using Developer Mode.

---

## 🔧 Chrome / Edge / Brave Installation

### Step 1: Download the Extension Files

1. Download or clone this repository
2. Locate the `chrome-extension` folder in the project
3. **Keep all files together** - do not rename or move individual files

### Step 2: Open Extensions Page

| Browser | URL |
|---------|-----|
| **Chrome** | `chrome://extensions` |
| **Edge** | `edge://extensions` |
| **Brave** | `brave://extensions` |
| **Opera** | `opera://extensions` |
| **Vivaldi** | `vivaldi://extensions` |

### Step 3: Enable Developer Mode

1. Look for the **"Developer mode"** toggle (usually top-right corner)
2. Click to turn it **ON** (it should turn blue/active)

### Step 4: Load the Extension

1. Click the **"Load unpacked"** button (appears after enabling developer mode)
2. A file browser will open
3. Navigate to and select the `chrome-extension` folder (containing `manifest.json`)
4. Click **"Select Folder"** (Windows) or **"Open"** (Mac)

### Step 5: Verify Installation

✅ You should see "BamLead - Lead Prospecting" in your extensions list  
✅ The extension icon should appear in your toolbar  
✅ If you don't see it, click the puzzle piece icon (🧩) and pin BamLead

---

## 🦊 Firefox Installation

Firefox requires converting the extension. For now, use a Chromium-based browser, or follow these steps:

### Option 1: Use Firefox Developer Edition
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `chrome-extension` folder

> **Note:** Temporary add-ons are removed when Firefox closes.

### Option 2: Future Firefox Support
We're working on a native Firefox extension. Check back for updates!

---

## 🎯 Using the Extension

### Extract Contact Info
1. Visit any business website
2. Click the BamLead extension icon in your toolbar
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
- Ensure all files are present (see Files Required section below)

### "Cannot access browser internal pages"
- This is normal - extensions cannot run on internal pages (`chrome://`, `edge://`, etc.)
- Navigate to a regular website (e.g., google.com) to test

### "Buttons don't work"
1. Refresh the target page after installing
2. Make sure you're on a regular website (not `chrome://`, `edge://`, or `file://`)
3. Check for errors: Right-click the extension popup → "Inspect" → Console tab

### "Service worker error" / "Background script failed"
1. Go to your browser's extensions page
2. Find BamLead and click "Remove"
3. Reload the extension using "Load unpacked"

### Extension disappears after browser restart
This can happen in Developer Mode. To fix:
1. Go to your browser's extensions page
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

## 🔄 Quick Reference

| Action | Chrome | Edge | Brave |
|--------|--------|------|-------|
| Extensions page | `chrome://extensions` | `edge://extensions` | `brave://extensions` |
| Developer mode | Top-right toggle | Bottom-left toggle | Top-right toggle |
| Load extension | "Load unpacked" button | "Load unpacked" button | "Load unpacked" button |

---

## 💬 Need Help?

Contact support at **support@bamlead.com** or use the chat on bamlead.com
