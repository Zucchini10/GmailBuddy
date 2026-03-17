function getGmailContext() {
  const context = {
    recipient: "",
    subject: "",
    threadBody: ""
  };

  // Get recipient name from the email header
  const senderEl = document.querySelector("h3.iw span[email]") ||
                   document.querySelector(".gD") ||
                   document.querySelector("span[email]");
  if (senderEl) {
    context.recipient = senderEl.getAttribute("name") ||
                        senderEl.innerText ||
                        "";
    // Just grab first name
    context.recipient = context.recipient.split(" ")[0];
  }

  // Get subject line
  const subjectEl = document.querySelector("h2.hP");
  if (subjectEl) {
    context.subject = subjectEl.innerText.trim();
  }

  // Get the original email body for context
  const emailBodies = document.querySelectorAll("div.a3s");
  if (emailBodies.length > 0) {
    // Get the most recent email in the thread
    const lastEmail = emailBodies[emailBodies.length - 1];
    context.threadBody = lastEmail.innerText.trim().slice(0, 800);
  }

  return context;
}

function injectPanel() {
  if (document.getElementById("ai-email-panel")) return;

  const panel = document.createElement("div");
  panel.id = "ai-email-panel";
  panel.innerHTML = `
    <div id="ai-header">
      <span class="ai-dot"></span>
      <span>AI Email Assistant</span>
      <span id="ai-toggle" style="margin-left:auto;cursor:pointer;font-size:16px">−</span>
    </div>
    <div id="ai-body">

      <div id="ai-context-bar" style="display:none">
        <span id="ai-context-label"></span>
        <button id="ai-refresh-context">↻ Refresh</button>
      </div>

      <p class="ai-label">Recipient name</p>
      <input id="ai-recipient" placeholder="Auto-detected or type manually" />

      <p class="ai-label">Subject</p>
      <input id="ai-subject-input" placeholder="Auto-detected or type manually" />

      <p class="ai-label">What do you want to say?</p>
      <textarea id="ai-input" placeholder="e.g. say yes Tuesday works, keep it short..."></textarea>

      <div class="ai-options">
        <select id="ai-tone">
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
        </select>
        <select id="ai-length">
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
      </div>

      <button id="ai-generate">✨ Generate Email</button>
      <div id="ai-output"></div>
    </div>
  `;

  document.body.appendChild(panel);

  // Toggle collapse
  document.getElementById("ai-toggle").addEventListener("click", () => {
    const body = document.getElementById("ai-body");
    const toggle = document.getElementById("ai-toggle");
    if (body.style.display === "none") {
      body.style.display = "block";
      toggle.innerText = "−";
    } else {
      body.style.display = "none";
      toggle.innerText = "+";
    }
  });

  // Load context on start
  loadContext();

  // Refresh button
  document.getElementById("ai-refresh-context").addEventListener("click", loadContext);

  // Watch for Gmail navigation (Gmail is a SPA — URL changes without page reload)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(loadContext, 1500);
    }
  }).observe(document.body, { subtree: true, childList: true });

  document.getElementById("ai-generate").addEventListener("click", generateEmail);
}

function loadContext() {
  setTimeout(() => {
    const ctx = getGmailContext();

    if (ctx.recipient) {
      document.getElementById("ai-recipient").value = ctx.recipient;
    }
    if (ctx.subject) {
      document.getElementById("ai-subject-input").value = ctx.subject;
    }

    const bar = document.getElementById("ai-context-bar");
    const label = document.getElementById("ai-context-label");

    if (ctx.recipient || ctx.subject) {
      bar.style.display = "flex";
      label.innerText = `✓ Detected: ${ctx.recipient || "?"} · ${ctx.subject.slice(0, 25) || "?"}...`;
    } else {
      bar.style.display = "none";
    }

    // Store thread body for use in prompt
    window._aiThreadBody = ctx.threadBody;

  }, 1000);
}

async function generateEmail() {
  const input = document.getElementById("ai-input").value;
  const recipient = document.getElementById("ai-recipient").value;
  const subject = document.getElementById("ai-subject-input").value;
  const tone = document.getElementById("ai-tone").value;
  const length = document.getElementById("ai-length").value;
  const threadBody = window._aiThreadBody || "";
  const output = document.getElementById("ai-output");

  if (!input.trim()) {
    output.innerText = "Please enter what you want to say!";
    return;
  }

  const btn = document.getElementById("ai-generate");
  btn.innerText = "Generating...";
  btn.disabled = true;

  try {
    const threadContext = threadBody
      ? `The email you are replying to:\n"""\n${threadBody}\n"""\n\n`
      : "";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "YOUR_API_KEY_HERE",
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are an email writing assistant.

${threadContext}Write a ${length}, ${tone} email reply based on these notes: "${input}"

Details:
- Recipient: ${recipient || "the recipient"}
- Subject: ${subject || "not specified"}

Respond in this exact format:
SUBJECT: ${subject ? "Re: " + subject : "[subject here]"}
BODY:
[email body here, starting with Dear ${recipient || "..."}, ending with a sign-off]

Only output the subject and body, nothing else.`
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;

    // Parse subject and body
    const subjectMatch = text.match(/SUBJECT:\s*(.+)/);
    const bodyMatch = text.match(/BODY:\n([\s\S]+)/);

    const generatedSubject = subjectMatch ? subjectMatch[1].trim() : subject;
    const body = bodyMatch ? bodyMatch[1].trim() : text;

    output.innerHTML = `
      <p class="ai-label" style="margin-top:12px">Subject:</p>
      <div class="ai-preview">${generatedSubject}</div>
      <p class="ai-label">Email:</p>
      <div id="ai-result">${body.replace(/\n/g, "<br>")}</div>
      <button id="ai-paste">⚡ Paste into Gmail</button>
      <button id="ai-copy">📋 Copy to clipboard</button>
    `;

    document.getElementById("ai-paste").addEventListener("click", () => {
      pasteIntoGmail(generatedSubject, body);
    });

    document.getElementById("ai-copy").addEventListener("click", () => {
      navigator.clipboard.writeText(`Subject: ${generatedSubject}\n\n${body}`);
      document.getElementById("ai-copy").innerText = "✓ Copied!";
    });

  } catch (err) {
    output.innerText = "Error: " + err.message;
  }

  btn.innerText = "✨ Generate Email";
  btn.disabled = false;
}

function pasteIntoGmail(subject, body) {
  // Subject field
  const subjectField = document.querySelector("input[name='subjectbox']");
  if (subjectField) {
    subjectField.value = subject;
    subjectField.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Body field
  const bodyField = document.querySelector("div[aria-label='Message Body']");
  if (bodyField) {
    bodyField.focus();
    bodyField.innerText = body;
    bodyField.dispatchEvent(new Event("input", { bubbles: true }));

    const btn = document.getElementById("ai-paste");
    btn.innerText = "✓ Pasted!";
    btn.style.background = "#34A853";
  } else {
    alert("Open a Gmail compose or reply window first!");
  }
}

setTimeout(injectPanel, 2000);
