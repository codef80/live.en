/**
 * config.js — إعدادات نظام Live English
 * ضع رابط Apps Script Web App في SCRIPT_URL
 */

const CONFIG = {
  // ← ضع هنا رابط Apps Script بعد النشر
  SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

  APP_NAME: 'Live English',
  YEAR: 2026,

  CACHE_TTL: {
    init:     5 * 60 * 1000,  // 5 دقائق
    students: 2 * 60 * 1000,  // دقيقتان
  },
};

// ═══════════════════════
//  حالات الطلب
// ═══════════════════════
const STATUS = {
  REGISTERED:   'تسجيل أولي',
  REVIEWING:    'تحت المراجعة',
  ACCEPTED:     'مقبول مبدئياً وبانتظار السداد',
  PARTIAL:      'سداد جزئي',
  DEFERRED:     'مؤجل السداد',
  PAID:         'مكتمل السداد',
  ACTIVE:       'طالب نشط',
  REJECTED:     'مرفوض',
  WITHDRAWN:    'منسحب',
};

const STATUS_COLORS = {
  [STATUS.REGISTERED]:  { bg: '#fff3cd', text: '#856404', icon: 'fa-clock' },
  [STATUS.REVIEWING]:   { bg: '#cff4fc', text: '#055160', icon: 'fa-search' },
  [STATUS.ACCEPTED]:    { bg: '#d1ecf1', text: '#0c5460', icon: 'fa-check-circle' },
  [STATUS.PARTIAL]:     { bg: '#fff3cd', text: '#856404', icon: 'fa-circle-half-stroke' },
  [STATUS.DEFERRED]:    { bg: '#e2e3e5', text: '#41464b', icon: 'fa-pause-circle' },
  [STATUS.PAID]:        { bg: '#d4edda', text: '#155724', icon: 'fa-check-double' },
  [STATUS.ACTIVE]:      { bg: '#cfe2ff', text: '#084298', icon: 'fa-user-check' },
  [STATUS.REJECTED]:    { bg: '#f8d7da', text: '#842029', icon: 'fa-times-circle' },
  [STATUS.WITHDRAWN]:   { bg: '#e2e3e5', text: '#41464b', icon: 'fa-minus-circle' },
};
