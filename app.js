/**
 * NexusAPI Dashboard — app.js
 * ─────────────────────────────────────────────────
 * Modular, professional dashboard JS.
 * Sections:
 *   1. Utilities & Helpers
 *   2. Theme System
 *   3. Loading Screen
 *   4. Toast Notification System
 *   5. User Key System (localStorage)
 *   6. Stats & Counter Animation
 *   7. Network / Online-Offline Detector
 *   8. Form Validation & Submit
 *   9. Activity Log
 *  10. API Documentation (copy + language tabs)
 *  11. FAQ Accordion
 *  12. Navbar (scroll, active, mobile menu)
 *  13. Init
 *
 * To connect to a real backend (Node.js/Express):
 *   - Replace mock functions in sections 6 & 8
 *     with actual fetch() calls to your Express routes.
 *   - Example: await fetch('/api/v2/stats', { headers: ... })
 * ─────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════════
   1. UTILITIES & HELPERS
═══════════════════════════════════════════════ */

/**
 * Select a single DOM element.
 * @param {string} sel - CSS selector
 * @param {Element} [ctx=document]
 */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * Select multiple DOM elements.
 * @param {string} sel - CSS selector
 */
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Format a Date to a readable time string.
 * @param {Date} [d=new Date()]
 */
function formatTime(d = new Date()) {
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Generate a UUID-like key with a prefix.
 * @param {string} [prefix='nx']
 */
function generateKey(prefix = 'nx') {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const rand  = n => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}_${rand(8)}-${rand(4)}-${rand(4)}-${rand(12)}`;
}

/**
 * Animate a number from 0 to target over a duration.
 * @param {HTMLElement} el
 * @param {number} target
 * @param {number} [duration=1400]
 */
function animateCounter(el, target, duration = 1400) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.floor(eased * target).toLocaleString('id-ID');
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/* ══════════════════════════════════════════════
   2. THEME SYSTEM
   - Reads from localStorage key 'nexus_theme'
   - Default: 'dark'
   - Toggle via navbar button
═══════════════════════════════════════════════ */

const ThemeManager = {
  STORAGE_KEY: 'nexus_theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'dark';
    this.apply(saved);
    $('#themeToggle').addEventListener('click', () => this.toggle());
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    const label = next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
    Toast.show('info', 'Theme Changed', label);
  },
};

/* ══════════════════════════════════════════════
   3. LOADING SCREEN
   - Shows on page load
   - Auto-hides after 2 seconds
═══════════════════════════════════════════════ */

const LoadingScreen = {
  el: null,

  init() {
    this.el = $('#loadingScreen');
    // Minimum display: 1.8s so the animation is visible
    setTimeout(() => this.hide(), 1800);
  },

  hide() {
    this.el.classList.add('hidden');
    // Once hidden, initialize the rest of the dashboard
    Dashboard.postLoadInit();
  },
};

/* ══════════════════════════════════════════════
   4. TOAST NOTIFICATION SYSTEM
   Types: 'success' | 'error' | 'warning' | 'info'
═══════════════════════════════════════════════ */

const Toast = {
  container: null,
  DURATION:  4000, // ms

  icons: {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  },

  init() {
    this.container = $('#toastContainer');
  },

  /**
   * Display a toast notification.
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} title
   * @param {string} message
   */
  show(type = 'info', title = '', message = '') {
    const toast   = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${this.icons[type]}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="Toast.dismiss(this.parentElement)" aria-label="Dismiss">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="toast-progress"></div>
    `;
    this.container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => this.dismiss(toast), this.DURATION);
  },

  dismiss(toast) {
    if (!toast || !toast.parentElement) return;
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  },
};

/* ══════════════════════════════════════════════
   5. USER KEY SYSTEM
   - Auto-generate on first visit
   - Store in localStorage
   - Display + copy in dashboard
═══════════════════════════════════════════════ */

const UserKeyManager = {
  STORAGE_KEY: 'nexus_api_key',

  init() {
    let key = localStorage.getItem(this.STORAGE_KEY);
    if (!key) {
      key = generateKey('nx');
      localStorage.setItem(this.STORAGE_KEY, key);
    }
    this.display(key);
    return key;
  },

  display(key) {
    const el = $('#apiKeyDisplay');
    if (el) el.textContent = key;
  },

  get() {
    return localStorage.getItem(this.STORAGE_KEY) || '';
  },

  regenerate() {
    const newKey = generateKey('nx');
    localStorage.setItem(this.STORAGE_KEY, newKey);
    this.display(newKey);
    Toast.show('warning', 'Key Regenerated', 'Your API key has been replaced. Update integrations!');
  },

  copy() {
    const key = this.get();
    navigator.clipboard.writeText(key)
      .then(() => Toast.show('success', 'Copied!', 'API key copied to clipboard.'))
      .catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = key; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        Toast.show('success', 'Copied!', 'API key copied to clipboard.');
      });
  },
};

/* Public wrappers (called from HTML onclick) */
function regenerateKey() { UserKeyManager.regenerate(); }
function copyApiKey()    { UserKeyManager.copy(); }

/* ══════════════════════════════════════════════
   6. STATS & COUNTER ANIMATION
   NOTE: Replace `fetchStats()` with a real API call
   when connecting to your Node.js backend.
   e.g.: const data = await fetch('/api/v2/stats').then(r=>r.json())
═══════════════════════════════════════════════ */

const Stats = {
  // Mock data — swap with real API response
  mockData: {
    totalRequests:  18472,
    remainingLimit: 227,
    uptime:         '99.97%',
  },

  init() {
    this.render(this.mockData);
  },

  render(data) {
    const totalEl  = $('#totalRequests');
    const limitEl  = $('#remainingLimit');

    if (totalEl) animateCounter(totalEl, data.totalRequests);
    if (limitEl) animateCounter(limitEl, data.remainingLimit);

    const uptimeEl = $('#systemUptime');
    if (uptimeEl) uptimeEl.textContent = data.uptime;
  },

  refresh() {
    // Simulate new data — in real use, call your backend here
    const newTotal = this.mockData.totalRequests + Math.floor(Math.random() * 20 + 1);
    const newLimit = Math.max(0, this.mockData.remainingLimit - Math.floor(Math.random() * 5));
    this.mockData.totalRequests  = newTotal;
    this.mockData.remainingLimit = newLimit;
    this.render(this.mockData);
    Toast.show('info', 'Stats Updated', `Latest data fetched at ${formatTime()}`);
  },
};

/** Called by Refresh button in navbar section */
function refreshStats() {
  const icon = $('#refreshIcon');
  if (icon) icon.style.animation = 'spinIcon 0.8s linear';
  setTimeout(() => { if (icon) icon.style.animation = ''; }, 800);
  Stats.refresh();
}

/* ══════════════════════════════════════════════
   7. NETWORK / ONLINE-OFFLINE DETECTOR
═══════════════════════════════════════════════ */

const NetworkMonitor = {
  pill: null,
  dot:  null,
  label: null,

  init() {
    this.pill  = $('#statusPill');
    this.dot   = this.pill?.querySelector('.status-dot');
    this.label = this.pill?.querySelector('.status-label');

    this.update(navigator.onLine);

    window.addEventListener('online',  () => {
      this.update(true);
      Toast.show('success', 'Back Online', 'Network connection restored.');
    });
    window.addEventListener('offline', () => {
      this.update(false);
      Toast.show('error', 'Offline', 'No network connection detected.');
    });
  },

  update(isOnline) {
    if (!this.pill) return;
    this.pill.className  = `status-pill ${isOnline ? 'online' : 'offline'}`;
    this.label.textContent = isOnline ? 'Online' : 'Offline';

    const badge = $('#systemStatusBadge');
    if (badge) {
      badge.textContent  = isOnline ? 'Operational' : 'Degraded';
      badge.className    = `stat-badge ${isOnline ? 'positive' : 'warning'}`;
    }
  },
};

/* ══════════════════════════════════════════════
   8. FORM VALIDATION & SUBMIT
═══════════════════════════════════════════════ */

const FormManager = {
  selectedMethod: 'GET',
  MAX_CHARS: 500,

  init() {
    // URL validation
    const urlInput = $('#urlInput');
    if (urlInput) {
      urlInput.addEventListener('input', () => this.validateUrl(urlInput));
      urlInput.addEventListener('blur',  () => this.validateUrl(urlInput, true));
    }

    // Text / char counter
    const textInput = $('#textInput');
    if (textInput) {
      textInput.addEventListener('input', () => this.validateText(textInput));
    }

    // Method selector
    $$('.method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.method-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedMethod = btn.dataset.method;
      });
    });
  },

  validateUrl(input, strict = false) {
    const val       = input.value.trim();
    const indicator = $('#urlIndicator');
    const hint      = $('#urlHint');

    if (!val) {
      input.className  = 'form-input';
      indicator.innerHTML = '';
      hint.textContent = '';
      hint.className   = 'form-hint';
      return false;
    }

    const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
    const valid = urlPattern.test(val);

    if (valid) {
      input.className  = 'form-input valid';
      indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      hint.textContent = 'Valid URL';
      hint.className   = 'form-hint success';
    } else if (strict) {
      input.className  = 'form-input invalid';
      indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      hint.textContent = 'Please enter a valid URL (https://…)';
      hint.className   = 'form-hint error';
    } else {
      input.className  = 'form-input';
      indicator.innerHTML = '';
      hint.textContent = '';
      hint.className   = 'form-hint';
    }
    return valid;
  },

  validateText(textarea) {
    const len     = textarea.value.length;
    const counter = $('#charCount');
    if (!counter) return len <= this.MAX_CHARS;

    counter.textContent = `${len} / ${this.MAX_CHARS}`;
    if (len > this.MAX_CHARS) {
      counter.className = 'char-count over';
    } else if (len > this.MAX_CHARS * 0.85) {
      counter.className = 'char-count warn';
    } else {
      counter.className = 'char-count';
    }
    return len <= this.MAX_CHARS;
  },

  /**
   * Handle form submission.
   * NOTE: Replace the setTimeout mock below with a real fetch() call:
   *
   *   const res = await fetch('/api/v2/request', {
   *     method: 'POST',
   *     headers: {
   *       'Authorization': `Bearer ${UserKeyManager.get()}`,
   *       'Content-Type':  'application/json',
   *     },
   *     body: JSON.stringify({ url, message, method: this.selectedMethod }),
   *   });
   *   const data = await res.json();
   */
  async submit() {
    const urlInput  = $('#urlInput');
    const textInput = $('#textInput');
    const submitBtn = $('#submitBtn');

    const url     = urlInput?.value.trim()  || '';
    const message = textInput?.value.trim() || '';

    // Validate URL
    if (!this.validateUrl(urlInput, true)) {
      Toast.show('error', 'Validation Error', 'Please enter a valid URL.');
      urlInput?.focus();
      return;
    }

    // Validate text
    if (!message) {
      const hint = $('#textHint');
      if (hint) { hint.textContent = 'Message cannot be empty.'; hint.className = 'form-hint error'; }
      Toast.show('error', 'Validation Error', 'Please enter a message or emoji.');
      textInput?.focus();
      return;
    }

    if (!this.validateText(textInput)) {
      Toast.show('error', 'Validation Error', `Message exceeds ${this.MAX_CHARS} characters.`);
      return;
    }

    // UI: loading state
    submitBtn.disabled = true;
    const btnText    = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    const btnIcon    = submitBtn.querySelector('svg:last-child');
    btnText.textContent = 'Sending…';
    btnSpinner.classList.remove('hidden');
    if (btnIcon) btnIcon.style.display = 'none';

    // ── MOCK API CALL (replace with real fetch above) ──
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));

    const success = Math.random() > 0.2; // 80% success rate in mock

    // Restore button
    submitBtn.disabled = false;
    btnText.textContent = 'Send Request';
    btnSpinner.classList.add('hidden');
    if (btnIcon) btnIcon.style.display = '';

    if (success) {
      const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
      Toast.show('success', 'Request Sent!', `ID: ${requestId} · Delivered successfully.`);
      ActivityLog.add('success', `${this.selectedMethod} ${url.substring(0, 45)}…`, message.substring(0, 30));

      // Update stats
      Stats.mockData.totalRequests++;
      Stats.mockData.remainingLimit = Math.max(0, Stats.mockData.remainingLimit - 1);
      $('#totalRequests').textContent = Stats.mockData.totalRequests.toLocaleString('id-ID');
      $('#remainingLimit').textContent = Stats.mockData.remainingLimit.toLocaleString('id-ID');

      // Clear form
      urlInput.value  = '';
      textInput.value = '';
      urlInput.className   = 'form-input';
      $('#urlIndicator').innerHTML  = '';
      $('#urlHint').textContent     = '';
      $('#textHint').textContent    = '';
      $('#charCount').textContent   = `0 / ${this.MAX_CHARS}`;
    } else {
      Toast.show('error', 'Request Failed', 'Server returned a 500 error. Please retry.');
      ActivityLog.add('error', `${this.selectedMethod} ${url.substring(0, 45)}…`, 'Server error 500');
    }
  },
};

/** Called from HTML onclick */
function handleSubmit() { FormManager.submit(); }

/* ══════════════════════════════════════════════
   9. ACTIVITY LOG
═══════════════════════════════════════════════ */

const ActivityLog = {
  entries: [],
  MAX_ENTRIES: 50,

  /**
   * Add a new log entry.
   * @param {'success'|'error'|'warning'} status
   * @param {string} message
   * @param {string} [detail]
   */
  add(status, message, detail = '') {
    const entry = { status, message, detail, time: formatTime() };
    this.entries.unshift(entry);
    if (this.entries.length > this.MAX_ENTRIES) this.entries.pop();
    this.render();
  },

  render() {
    const container = $('#activityLog');
    const countEl   = $('#logCount');
    if (!container) return;

    // Update count
    if (countEl) countEl.textContent = `${this.entries.length} entr${this.entries.length === 1 ? 'y' : 'ies'}`;

    if (this.entries.length === 0) {
      container.innerHTML = `
        <div class="log-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>No activity yet</p>
        </div>`;
      return;
    }

    container.innerHTML = this.entries.map((e, i) => `
      <div class="log-item" style="animation-delay: ${i * 0.04}s">
        <div class="log-dot ${e.status}"></div>
        <div class="log-body">
          <div class="log-msg">${e.message}</div>
          <div class="log-meta">
            <span class="log-time">${e.time}</span>
            <span class="log-status ${e.status}">${e.status === 'success' ? '✓ Success' : '✗ Failed'}</span>
            ${e.detail ? `<span class="log-time" style="color: var(--text-muted)">${e.detail}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  clear() {
    this.entries = [];
    this.render();
    if ($('#logCount')) $('#logCount').textContent = '0 entries';
  },
};

/** Called from HTML onclick */
function clearLog() {
  ActivityLog.clear();
  Toast.show('info', 'Log Cleared', 'Activity history has been cleared.');
}

/* ══════════════════════════════════════════════
   10. API DOCUMENTATION — Copy & Language Tabs
═══════════════════════════════════════════════ */

const DocsManager = {
  snippets: {
    js: `// JavaScript — Fetch API
const response = await fetch('https://api.nexus.io/v2/request', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://target.example.com',
    message: 'Hello World 🚀'
  })
});

const data = await response.json();
console.log(data);`,

    py: `# Python — requests library
import requests

response = requests.post(
  'https://api.nexus.io/v2/request',
  headers={
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type':  'application/json'
  },
  json={
    'url':     'https://target.example.com',
    'message': 'Hello World 🚀'
  }
)

data = response.json()
print(data)`,

    curl: `# cURL
curl -X POST https://api.nexus.io/v2/request \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://target.example.com",
    "message": "Hello World 🚀"
  }'`,
  },

  init() {
    $$('.lang-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.lang-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.setSnippet(tab.dataset.lang);
      });
    });
  },

  setSnippet(lang) {
    const codeEl = $('#integrationCodeContent');
    if (codeEl) codeEl.textContent = this.snippets[lang] || '';
  },
};

/**
 * Copy a code block's content to clipboard.
 * @param {HTMLButtonElement} btn
 */
function copyCode(btn) {
  const block = btn.closest('.code-block');
  let text;

  // Integration block uses a <code> element
  const codeEl = block.querySelector('code');
  text = codeEl ? codeEl.textContent.trim() : (block.dataset.code || '');

  navigator.clipboard.writeText(text)
    .then(() => {
      btn.classList.add('copied');
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
      }, 2000);
      Toast.show('success', 'Copied!', 'Code snippet copied to clipboard.');
    })
    .catch(() => Toast.show('error', 'Copy Failed', 'Unable to access clipboard.'));
}

/* ══════════════════════════════════════════════
   11. FAQ ACCORDION
═══════════════════════════════════════════════ */

/**
 * Toggle an accordion item.
 * @param {HTMLButtonElement} trigger
 */
function toggleAccordion(trigger) {
  const body    = trigger.nextElementSibling;
  const isOpen  = trigger.classList.contains('open');

  // Close all
  $$('.accordion-trigger.open').forEach(t => {
    t.classList.remove('open');
    t.nextElementSibling.classList.remove('open');
  });

  // Open clicked (if it was closed)
  if (!isOpen) {
    trigger.classList.add('open');
    body.classList.add('open');
  }
}

/* ══════════════════════════════════════════════
   12. NAVBAR — Scroll Shadow, Active Link, Mobile
═══════════════════════════════════════════════ */

const NavbarManager = {
  navbar:     null,
  menuBtn:    null,
  mobileMenu: null,
  navLinks:   [],

  init() {
    this.navbar     = $('#navbar');
    this.menuBtn    = $('#menuBtn');
    this.mobileMenu = $('#mobileMenu');
    this.navLinks   = $$('.nav-link, .mobile-link');

    // Scroll shadow
    window.addEventListener('scroll', () => {
      this.navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Mobile menu
    this.menuBtn.addEventListener('click', () => {
      const isHidden = this.mobileMenu.classList.contains('hidden');
      this.mobileMenu.classList.toggle('hidden', !isHidden);
    });

    // Nav link clicks
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // Close mobile menu
        this.mobileMenu.classList.add('hidden');
      });
    });

    // Scroll spy
    this.initScrollSpy();
  },

  initScrollSpy() {
    const sections = $$('section[id]');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          $$('.nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.section === id);
          });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    sections.forEach(s => observer.observe(s));
  },
};

/* ══════════════════════════════════════════════
   13. DASHBOARD — MAIN INIT
═══════════════════════════════════════════════ */

const Dashboard = {
  init() {
    // Initialize loading screen first
    LoadingScreen.init();
    // Toast and theme can start immediately
    Toast.init();
    ThemeManager.init();
  },

  /** Called after loading screen hides */
  postLoadInit() {
    // Core systems
    UserKeyManager.init();
    NetworkMonitor.init();
    Stats.init();

    // UI managers
    FormManager.init();
    DocsManager.init();
    NavbarManager.init();

    // Seed activity log with demo entries
    this.seedDemoLog();

    // Welcome toast
    setTimeout(() => {
      Toast.show('success', 'Dashboard Ready', 'All systems operational. Welcome back!');
    }, 500);
  },

  /** Add demo entries to show the log on load */
  seedDemoLog() {
    const demos = [
      { status: 'success', msg: 'GET https://api.example.com/users', detail: 'Returned 200' },
      { status: 'success', msg: 'POST https://hooks.example.com/notify', detail: 'Delivered' },
      { status: 'error',   msg: 'PUT https://api.example.com/data',   detail: 'Timeout 504' },
      { status: 'success', msg: 'GET https://api.example.com/status',  detail: '42ms' },
    ];
    // Add in reverse so newest appears first
    [...demos].reverse().forEach(d => ActivityLog.add(d.status, d.msg, d.detail));
  },
};

/* ── Kick off on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => Dashboard.init());
