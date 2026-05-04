// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Nova Community Bot — Dashboard JS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {

  // ─── Command Tabs ────────────────────────────────────
  const tabs = document.querySelectorAll('.cmd-tab');
  const grids = document.querySelectorAll('.cmd-grid');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;
      tabs.forEach(t => t.classList.remove('active'));
      grids.forEach(g => g.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.cmd-grid[data-cat="${cat}"]`)?.classList.add('active');
    });
  });

  // ─── Navbar Toggle (Mobile) ──────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle?.addEventListener('click', () => navLinks?.classList.toggle('open'));

  // ─── Scroll Animations ───────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .cmd-item, .guild-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  // ─── Live Stats (homepage) ───────────────────────────
  const statGuilds = document.getElementById('stat-guilds');
  if (statGuilds) {
    setInterval(async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        animateNumber(document.getElementById('stat-guilds'), data.guilds);
        animateNumber(document.getElementById('stat-users'), data.users);
      } catch {}
    }, 10000);
  }
});

function animateNumber(el, target) {
  if (!el) return;
  const start = parseInt(el.textContent.replace(/\D/g, '')) || 0;
  const duration = 800;
  const startTime = performance.now();
  const update = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const val = Math.round(start + (target - start) * easeOut(progress));
    el.textContent = val.toLocaleString('ar');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// ─── Toast Notification ──────────────────────────────
window.showToast = (message, type = 'success') => {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
};
