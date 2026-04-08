/**
 * api.js — طبقة الاتصال بـ Google Apps Script
 * يعتمد على Fetch + CORS فقط — بدون JSONP
 */

const API = (() => {
  // ─── Cache داخلي ───────────────────────────────────
  const _cache = new Map();

  function _cacheGet(key) {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > (CONFIG.CACHE_TTL[key] || 60000)) {
      _cache.delete(key);
      return null;
    }
    return entry.data;
  }

  function _cacheSet(key, data) {
    _cache.set(key, { data, ts: Date.now() });
  }

  // ─── Fetch المساعد ─────────────────────────────────
  async function _get(params) {
    const url = new URL(CONFIG.SCRIPT_URL);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function _post(body) {
    const res = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // ─── دوال القراءة ───────────────────────────────────
  async function getInitData(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = _cacheGet('init');
      if (cached) return cached;
    }
    const data = await _get({ action: 'InitData' });
    _cacheSet('init', data);
    return data;
  }

  async function getStudents(params = {}) {
    return _get({ action: 'Students', ...params });
  }

  async function getStudent(id) {
    return _get({ action: 'Student', id });
  }

  async function getStudentRecords(id) {
    return _get({ action: 'Records', id });
  }

  async function getStats() {
    return _get({ action: 'Stats' });
  }

  async function checkDuplicate({ passport, phone1, phone2 }) {
    return _get({ action: 'CheckDuplicate', passport, phone1, phone2 });
  }

  // ─── دوال الكتابة ───────────────────────────────────
  async function register(data) {
    return _post({ action: 'Register', ...data });
  }

  async function uploadFile({ fileData, fileName, mimeType, studentName, requestId, fileType }) {
    return _post({ action: 'UploadFile', fileData, fileName, mimeType, studentName, requestId, fileType });
  }

  async function updateStatus({ requestId, newStatus, note }) {
    const user = AUTH.getUser()?.username || 'نظام';
    return _post({ action: 'UpdateStatus', requestId, newStatus, note, user });
  }

  async function addPayment({ requestId, amount, paymentType, note }) {
    const user = AUTH.getUser()?.username || 'نظام';
    return _post({ action: 'AddPayment', requestId, amount, paymentType, note, user });
  }

  async function createInvoice(requestId) {
    const user = AUTH.getUser()?.username || 'نظام';
    return _post({ action: 'CreateInvoice', requestId, user });
  }

  async function addNote({ requestId, note }) {
    const user = AUTH.getUser()?.username || 'نظام';
    return _post({ action: 'AddNote', requestId, note, user });
  }

  async function login({ username, password }) {
    return _post({ action: 'Login', username, password });
  }

  async function saveSettings(settings) {
    const user = AUTH.getUser()?.username || 'نظام';
    return _post({ action: 'SaveSettings', settings, user });
  }

  async function savePackage(data) {
    return _post({ action: 'SavePackage', ...data });
  }

  async function saveYear(data) {
    return _post({ action: 'SaveYear', ...data });
  }

  // ─── رفع الملف (تحويل File إلى base64) ─────────────
  async function uploadFileFromInput(file, studentName, requestId, fileType) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        try {
          const result = await uploadFile({
            fileData: base64,
            fileName: file.name,
            mimeType: file.type,
            studentName,
            requestId,
            fileType,
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return {
    getInitData, getStudents, getStudent,
    getStudentRecords, getStats, checkDuplicate,
    register, uploadFile, uploadFileFromInput,
    updateStatus, addPayment, createInvoice,
    addNote, login, saveSettings,
    savePackage, saveYear,
  };
})();

// ═══════════════════════════════════════════════════════
//  AUTH — إدارة جلسة المستخدم
// ═══════════════════════════════════════════════════════
const AUTH = (() => {
  const KEY = 'le_session';

  function save(user) {
    sessionStorage.setItem(KEY, JSON.stringify(user));
  }

  function getUser() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY));
    } catch {
      return null;
    }
  }

  function logout() {
    sessionStorage.removeItem(KEY);
  }

  function requireLogin(roles = []) {
    const user = getUser();
    if (!user) {
      window.location.href = 'staff-login.html';
      return null;
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
      window.location.href = 'admin.html';
      return null;
    }
    return user;
  }

  function hasRole(...roles) {
    const user = getUser();
    return user && roles.includes(user.role);
  }

  return { save, getUser, logout, requireLogin, hasRole };
})();

// ═══════════════════════════════════════════════════════
//  UTILS — دوال مساعدة مشتركة
// ═══════════════════════════════════════════════════════
const UTILS = {
  formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-SA');
  },

  badgeHtml(status) {
    const cfg = STATUS_COLORS[status] || { bg: '#e2e3e5', text: '#41464b', icon: 'fa-circle' };
    return `<span class="badge" style="background:${cfg.bg};color:${cfg.text};padding:4px 10px;border-radius:20px;font-size:12px;">
      <i class="fa ${cfg.icon} me-1"></i>${status}
    </span>`;
  },

  whatsappUrl(phone, message) {
    const clean = String(phone).replace(/\D/g, '');
    const num = clean.startsWith('0') ? '966' + clean.slice(1) : clean;
    return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  },

  fillTemplate(template, vars) {
    let out = template;
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, v || '');
    }
    return out;
  },

  loading(show = true) {
    const el = document.getElementById('global-loader');
    if (el) el.style.display = show ? 'flex' : 'none';
  },

  async toast(msg, type = 'success') {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true, position: 'top-end',
        icon: type, title: msg,
        showConfirmButton: false,
        timer: 3000, timerProgressBar: true,
      });
    }
  },

  async confirm(msg, type = 'warning') {
    if (typeof Swal === 'undefined') return window.confirm(msg);
    const res = await Swal.fire({
      title: 'تأكيد', text: msg,
      icon: type,
      showCancelButton: true,
      confirmButtonText: 'نعم',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#fbc70d',
    });
    return res.isConfirmed;
  },

  formatMoney(n) {
    return Number(n || 0).toLocaleString('ar-SA') + ' ريال';
  },

  calcAge(dobStr) {
    if (!dobStr) return '';
    const dob = new Date(dobStr);
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  },
};
