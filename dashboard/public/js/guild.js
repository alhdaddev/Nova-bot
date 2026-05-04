// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Nova Community Bot — Guild Dashboard JS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {
  const guildId = window.GUILD_ID;

  // ─── Sidebar Navigation ──────────────────────────────
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
  const sections = document.querySelectorAll('.dash-section');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      sidebarLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      link.classList.add('active');
      document.getElementById(`section-${section}`)?.classList.add('active');

      // Load leaderboard when navigated to
      if (section === 'leaderboard') loadLeaderboard(guildId);
    });
  });

  // ─── Change Tracking ─────────────────────────────────
  const saveBar = document.getElementById('saveBar');
  const inputs = document.querySelectorAll('.setting-input, .setting-select, .setting-textarea, input[type="checkbox"]');

  inputs.forEach(input => {
    input.addEventListener('change', () => {
      saveBar?.classList.add('visible');
    });
  });

  // ─── Save Button ──────────────────────────────────────
  document.getElementById('saveBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

    const payload = {
      prefix: document.getElementById('prefix')?.value,
      logChannel: document.getElementById('logChannel')?.value,
      welcomeChannel: document.getElementById('welcomeChannel')?.value,
      leaveChannel: document.getElementById('leaveChannel')?.value,
      welcomeMessage: document.getElementById('welcomeMessage')?.value,
      leaveMessage: document.getElementById('leaveMessage')?.value,
      maxWarnings: document.getElementById('maxWarnings')?.value,
      warnAction: document.getElementById('warnAction')?.value,
      leveling: document.getElementById('leveling')?.checked ? 'on' : 'off',
      automod: document.getElementById('automod')?.checked ? 'on' : 'off',
      antiSpam: document.getElementById('antiSpam')?.checked ? 'on' : 'off',
      antiLinks: document.getElementById('antiLinks')?.checked ? 'on' : 'off',
    };

    try {
      const res = await fetch(`/dashboard/${guildId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast('✅ تم حفظ الإعدادات بنجاح!', 'success');
        saveBar?.classList.remove('visible');
      } else {
        showToast('❌ ' + data.message, 'error');
      }
    } catch (e) {
      showToast('❌ خطأ في الاتصال!', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> حفظ التغييرات';
  });

  // ─── Leaderboard Loader ───────────────────────────────
  async function loadLeaderboard(guildId) {
    const container = document.getElementById('leaderboard-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';

    try {
      const res = await fetch(`/api/guild/${guildId}/members`);
      const data = await res.json();

      if (!data.success || !data.data.length) {
        container.innerHTML = '<div class="loading-spinner">😕 لا توجد بيانات بعد — ابدأ بالتحدث لكسب XP!</div>';
        return;
      }

      const medals = ['🥇', '🥈', '🥉'];
      const rows = data.data.map((u, i) => `
        <tr>
          <td class="lb-rank">${medals[i] || i + 1}</td>
          <td><@${u.userId}><code style="font-size:0.75rem;margin-right:8px;opacity:0.6">${u.userId}</code></td>
          <td><span class="lb-badge">⭐ ${u.level}</span></td>
          <td>${u.totalXp?.toLocaleString('ar') || 0} XP</td>
          <td>${u.messages?.toLocaleString('ar') || 0}</td>
        </tr>
      `).join('');

      container.innerHTML = `
        <div style="overflow-x:auto">
          <table class="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>العضو</th>
                <th>المستوى</th>
                <th>XP</th>
                <th>الرسائل</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch {
      container.innerHTML = '<div class="loading-spinner">❌ حدث خطأ في تحميل البيانات</div>';
    }
  }
});
