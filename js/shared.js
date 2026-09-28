/* KhelSetu — Shared Session State & Navigation Helpers */

const KhelSetu = {
  STORAGE_KEY: 'khelsetu_session',

  getDefaultSession() {
    return {
      role: null,           // 'athlete' | 'scout'
      authComplete: false,
      profileComplete: false,
      user: {
        name: 'Rahul Verma',
        age: '18y 5m',
        gender: 'Male',
        height: 172,
        weight: 64,
        bmi: '21.6 (Normal)',
        state: 'Haryana',
        district: 'Rohtak',
        sport: 'Track & Field',
        score: 78,
        phone: '+91 98765-43210'
      },
      currentTest: null,
      notifications: [
        { id: 1, scout: 'City Lions Scout', status: 'pending' },
        { id: 2, scout: 'Eagles United Scout', status: 'pending' }
      ],
      shortlist: []
    };
  },

  getSession() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return this.getDefaultSession();
  },

  saveSession(data) {
    const session = this.getSession();
    Object.assign(session, data);
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session)); } catch (e) { /* ignore */ }
    return session;
  },

  updateSession(partial) {
    const session = this.getSession();
    Object.assign(session, partial);
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session)); } catch (e) { /* ignore */ }
    return session;
  },

  clearSession() {
    try { localStorage.removeItem(this.STORAGE_KEY); } catch (e) { /* ignore */ }
  },

  navigate(page) {
    window.location.href = page;
  },

  requireAuth(redirectIfMissing) {
    const s = this.getSession();
    if (!s.authComplete) {
      this.navigate(redirectIfMissing || 'auth-phone.html');
      return false;
    }
    return true;
  },

  requireRole(role, redirectIfWrong) {
    const s = this.getSession();
    if (s.role !== role) {
      this.navigate(redirectIfWrong || '../index.html');
      return false;
    }
    return true;
<<<<<<< HEAD
  },

  // Formats a date (ISO string like "2008-04-12", a Date object, or anything
  // Date() can parse) into Indian format DD/MM/YY. Parses "YYYY-MM-DD" strings
  // manually to avoid UTC/local timezone day-shift bugs.
  formatDateIN(dateInput) {
    if (!dateInput) return '';

    let y, m, d;
    const isoMatch = typeof dateInput === 'string' && dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (isoMatch) {
      [, y, m, d] = isoMatch;
    } else {
      const parsed = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
      if (isNaN(parsed.getTime())) return String(dateInput); // give up, show original
      y = parsed.getFullYear();
      m = parsed.getMonth() + 1;
      d = parsed.getDate();
    }

    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const yy = String(y).slice(-2);
    return `${dd}/${mm}/${yy}`;
=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  }
};
