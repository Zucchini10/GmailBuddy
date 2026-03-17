# GmailBuddy ✨

An AI-powered Chrome extension that helps you compose and reply to emails directly inside Gmail using Claude AI.

---

## Features

- **Auto-detects context** – Automatically reads the recipient name, subject line, and email thread when you open an email
- **AI-generated replies** – Describe what you want to say in a few words and let Claude write the full email
- **Tone & length control** – Choose from Professional, Friendly, Formal, or Casual tones; Short, Medium, or Long lengths
- **One-click paste** – Instantly inserts the generated email into Gmail's compose window
- **Copy to clipboard** – Copy the email with a single click
- **Collapsible panel** – Minimise the assistant panel when you don't need it

---

## Installation

1. **Clone or download** this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer Mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the project folder
5. Open [Gmail](https://mail.google.com) — the assistant panel will appear in the bottom-right corner

---

## Setup

Before using the extension, add your Anthropic API key to `content.js`:

```js
"x-api-key": "YOUR_API_KEY_HERE",
```

You can get an API key from [console.anthropic.com](https://console.anthropic.com).

---

## Usage

1. Open any email thread in Gmail
2. The **GmailGenie** panel will auto-detect the recipient and subject
3. Type a short note describing what you want to say (e.g. *"say yes, Tuesday works, keep it brief"*)
4. Select your preferred **tone** and **length**
5. Click **✨ Generate Email**
6. Click **⚡ Paste into Gmail** to insert it into the compose window, or **📋 Copy to clipboard**

---

## File Structure

```
├── manifest.json   # Chrome extension configuration
├── content.js      # Main extension logic and Claude API integration
├── styles.css      # Panel UI styles
└── README.md       # This file
```

---

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Read email context from the current Gmail tab |
| `host_permissions: mail.google.com` | Inject the assistant panel into Gmail |

---

## Tech Stack

- **Manifest V3** Chrome Extension
- **Claude API** (`claude-haiku-4-5`) via Anthropic
- Vanilla JavaScript & CSS

---

## Notes

- Your API key is stored locally in `content.js` — do not share or publish the file with your key in it
- The extension only activates on `mail.google.com`
- Gmail's DOM is updated frequently; selectors in `content.js` may occasionally need updating if context detection breaks

---

## License

MIT
