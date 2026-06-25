(function () {
  'use strict';

  // --- Supabase Config ---
  const SUPABASE_URL = 'https://szhbifqlehwhzbujthil.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Y0X6ecwcRptSaG5RwdsSbg_hK0eZlJP';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Test connection on load
  supabase.from('guests').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) console.warn('Supabase connection test failed:', error.message);
      else console.log('Supabase connected, guests count:', count);
    });

  // --- Countdown Timer ---
  const WEDDING_DATE = new Date('2026-07-31T15:00:00').getTime();
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function updateCountdown() {
    const now = Date.now();
    let diff = WEDDING_DATE - now;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    const seconds = Math.floor(diff / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // --- Calendar Widget ---
  function renderCalendar() {
    const container = document.getElementById('calDays');
    if (!container) return;

    const today = new Date();
    const wedding = new Date(2026, 6, 31); // July 31, 2026 (month is 0-indexed)
    const year = 2026;
    const month = 6; // July

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Adjust for Monday start (1=Mon, 7=Sun)
    const startOffset = (firstDay + 6) % 7;

    let html = '';
    // Empty cells before 1st
    for (let i = 0; i < startOffset; i++) {
      html += '<span></span>';
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      const isWedding = d === 31;
      let cls = '';
      if (isWedding) cls = 'cal-wedding';
      else if (isToday) cls = 'cal-today';
      html += '<span class="' + cls + '">' + d + '</span>';
    }
    container.innerHTML = html;
  }

  renderCalendar();

  // --- RSVP Form ---
  const form = document.getElementById('rsvpForm');
  const thanksMsg = document.getElementById('thanksMsg');

  async function saveGuest(data) {
    const status = data.status === 'yes' ? 'Буду' : 'Не смогу';
    const { error } = await supabase
      .from('guests')
      .insert({ name: data.name, status: status });
    if (error) {
      console.error('Supabase insert error:', error);
      alert('Ошибка Supabase: ' + error.message + '\nПроверьте консоль (F12)');
      saveGuestLocal(data);
    } else {
      console.log('Saved to Supabase:', data.name, status);
    }
  }

  function saveGuestLocal(data) {
    const guests = JSON.parse(localStorage.getItem('nikahGuests') || '[]');
    guests.push({
      name: data.name,
      status: data.status === 'yes' ? 'Буду' : 'Не смогу',
      date: new Date().toLocaleString('ru-RU'),
    });
    localStorage.setItem('nikahGuests', JSON.stringify(guests));
  }

  const rsvpBtns = document.querySelectorAll('.rsvp-btn');
  const statusInput = document.getElementById('statusInput');
  const rsvpHint = document.getElementById('rsvpHint');

  rsvpBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      rsvpBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      statusInput.value = btn.dataset.value;
      rsvpHint.textContent = '';
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nameInput = form.querySelector('input[type="text"]');
    const name = nameInput.value.trim();

    if (!name) {
      rsvpHint.textContent = 'Пожалуйста, введите ваше имя';
      nameInput.focus();
      return;
    }

    if (!statusInput.value) {
      rsvpHint.textContent = 'Пожалуйста, выберите вариант ответа';
      return;
    }

    const data = { name: name, status: statusInput.value };

    saveGuest(data);
    form.reset();
    statusInput.value = '';
    rsvpBtns.forEach(function (b) { b.classList.remove('active'); });
    form.style.display = 'none';
    thanksMsg.classList.add('show');

    if (data.status === 'yes') {
      fireConfetti();
    }
  });

  // --- Confetti animation ---
  function fireConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#4a5b3a', '#7a8c5d', '#b5c4a3', '#d5e0c5', '#f7f6f2', '#e8d5b7'];

    for (let i = 0; i < 180; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 6;
      pieces.push({
        x: W / 2,
        y: H / 2,
        r: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 8,
        gravity: 0.25,
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      pieces.forEach(p => {
        if (p.alpha > 0) {
          alive++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.alpha -= 0.006;
          p.rotation += p.rotationSpeed;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation * Math.PI / 180);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      if (alive > 0) requestAnimationFrame(draw);
      else { canvas.remove(); }
    }
    requestAnimationFrame(draw);
  }

  // --- Map Card Click ---
  const mapLink = document.querySelector('.map-link');
  const eventCard = document.querySelector('.event-card');

  if (mapLink && eventCard) {
    eventCard.addEventListener('click', function (e) {
      if (e.target.tagName !== 'A') {
        mapLink.click();
      }
    });
    eventCard.style.cursor = 'pointer';
  }

  // --- Admin Panel ---
  const ADMIN_PASSWORD = 'Сельби123';
  const adminTrigger = document.getElementById('adminTrigger');
  const adminPanel = document.getElementById('adminPanel');
  const adminOverlay = document.getElementById('adminOverlay');
  const adminClose = document.getElementById('adminClose');
  const adminBody = document.getElementById('adminBody');
  const adminCount = document.getElementById('adminCount');
  const exportBtn = document.getElementById('exportXml');
  const exportCsvBtn = document.getElementById('exportCsv');
  const clearBtn = document.getElementById('clearData');

  let guestsCache = [];
  let channel = null;

  async function fetchGuests() {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase fetch error:', error);
      return JSON.parse(localStorage.getItem('nikahGuests') || '[]');
    }
    return data.map(g => ({
      name: g.name,
      status: g.status,
      date: new Date(g.created_at).toLocaleString('ru-RU')
    }));
  }

  function renderGuests(guests) {
    guestsCache = guests;
    adminBody.innerHTML = '';

    if (guests.length === 0) {
      adminBody.innerHTML = '<tr><td colspan="3" class="admin-empty">Пока никто не ответил</td></tr>';
      adminCount.textContent = 'Всего: 0';
      return;
    }

    guests.forEach(function (g) {
      const row = document.createElement('tr');
      const statusClass = g.status === 'Буду' ? 'status-yes' : 'status-no';
      row.innerHTML =
        '<td>' + g.name + '</td>' +
        '<td class="' + statusClass + '">' + g.status + '</td>' +
        '<td>' + g.date + '</td>';
      adminBody.appendChild(row);
    });

    adminCount.textContent = 'Всего: ' + guests.length;
  }

  function openAdmin() {
    loadAndRender();
    adminPanel.classList.add('open');
    adminOverlay.classList.add('open');
  }

  async function loadAndRender() {
    const guests = await fetchGuests();
    renderGuests(guests);
    subscribeRealtime();
  }

  function subscribeRealtime() {
    if (channel) channel.unsubscribe();
    channel = supabase
      .channel('guests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, async () => {
        const guests = await fetchGuests();
        renderGuests(guests);
      })
      .subscribe();
  }

  function closeAdmin() {
    adminPanel.classList.remove('open');
    adminOverlay.classList.remove('open');
  }

  adminTrigger.addEventListener('click', function () {
    const pwd = prompt('Введите пароль:');
    if (pwd === ADMIN_PASSWORD) {
      openAdmin();
    } else if (pwd !== null) {
      alert('Неверный пароль');
    }
  });

  adminClose.addEventListener('click', closeAdmin);
  adminOverlay.addEventListener('click', closeAdmin);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAdmin();
  });

  // --- Export XML ---
  exportBtn.addEventListener('click', function () {
    const guests = guestsCache;
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<guests>\n';

    guests.forEach(function (g) {
      xml += '  <guest>\n';
      xml += '    <name>' + g.name.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</name>\n';
      xml += '    <status>' + g.status + '</status>\n';
      xml += '    <date>' + g.date + '</date>\n';
      xml += '  </guest>\n';
    });

    xml += '</guests>';

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guests.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // --- Export CSV ---
  exportCsvBtn.addEventListener('click', function () {
    const guests = guestsCache;
    if (guests.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }
    // CSV заголовки
    var csv = '\uFEFF' + 'Имя,Статус,Дата\n';
    guests.forEach(function (g) {
      var name = '"' + g.name.replace(/"/g, '""') + '"';
      var status = '"' + g.status + '"';
      var date = '"' + g.date + '"';
      csv += name + ',' + status + ',' + date + '\n';
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'guests.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // --- Clear Data ---
  clearBtn.addEventListener('click', async function () {
    if (!confirm('Очистить все данные о гостях? Это действие необратимо.')) return;
    const { error } = await supabase.from('guests').delete().neq('id', 0);
    if (error) {
      console.error('Delete error:', error);
      alert('Ошибка при удалении: ' + error.message);
      return;
    }
    guestsCache = [];
    renderGuests([]);
  });

  // --- Scroll Reveal (repeatable) ---
  function isInView(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight - 60 && rect.bottom > 0;
  }

  const animatedElements = document.querySelectorAll(
    '.hero-title, .hero-names, .hero-date, .bismillah, .invite-text, .event-card, .section-title, .couple-photo, .countdown-item, .rsvp-form, .rsvp-subtitle'
  );

  function checkVisibility() {
    animatedElements.forEach(function (el) {
      if (isInView(el)) {
        el.classList.add('visible');
      } else {
        el.classList.remove('visible');
      }
    });
  }

  // --- Music Player ---
  const bgMusic = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');
  let isPlaying = false;

  bgMusic.volume = 0.04;

  function loadMusic(src) {
    bgMusic.src = src;
    bgMusic.load();
  }

  function doPlay() {
    bgMusic.play().then(function () {
      isPlaying = true;
      musicToggle.classList.add('playing');
    }).catch(function (err) {
      console.log('Play failed:', err);
    });
  }

  function stopMusic() {
    bgMusic.pause();
    musicToggle.classList.remove('playing');
    isPlaying = false;
  }

  function toggleMusic() {
    if (isPlaying) {
      stopMusic();
    } else {
      doPlay();
    }
  }

  musicToggle.addEventListener('click', toggleMusic);

  var audioUrl = window.location.href;
  var baseDir = audioUrl.substring(0, audioUrl.lastIndexOf('/') + 1);
  loadMusic(baseDir + 'Music.mp3');

  bgMusic.addEventListener('error', function () {
    console.log('Audio error:', bgMusic.error ? bgMusic.error.message : 'unknown');
    musicToggle.classList.add('disabled');
  });

  bgMusic.addEventListener('canplaythrough', function () {
    musicToggle.classList.remove('disabled');
    doPlay();
  }, { once: true });

  document.addEventListener('click', function firstPlay(e) {
    if (e.target.closest('.music-toggle') || e.target.closest('.admin-panel') || e.target.closest('.admin-overlay')) return;
    if (!isPlaying && bgMusic.src) {
      doPlay();
    }
    document.removeEventListener('click', firstPlay);
  }, { once: true });

  // --- Init ---
  checkVisibility();

  window.addEventListener('scroll', function () {
    checkVisibility();
  });

  window.addEventListener('load', function () {
    checkVisibility();
  });
})();
