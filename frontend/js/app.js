/**
 * App.js — Application orchestrator
 */
document.addEventListener('DOMContentLoaded', () => {
    // ─── Tab Navigation ─────────────────────────────────────────
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;

            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            item.classList.add('active');
            const target = document.getElementById('tab-' + tab);
            if (target) target.classList.add('active');

            // Lazy load modules
            if (tab === 'dashboard') DashboardModule.load();
            if (tab === 'management') { StudentManager.loadStudents(); CompanyManager.loadCompanies(); }
            if (tab === 'ai-analysis') AIModule.init();
            if (tab === 'admin') AdminModule.init();
        });
    });

    // ─── Sub-Tab Navigation (Management) ────────────────────────
    document.querySelectorAll('.sub-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const subtab = btn.dataset.subtab;
            document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(subtab);
            if (target) target.classList.add('active');
        });
    });

    // ─── AI Sub-Tab Navigation ──────────────────────────────────
    document.querySelectorAll('.ai-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const aitab = btn.dataset.aitab;
            document.querySelectorAll('.ai-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.ai-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(aitab);
            if (target) target.classList.add('active');
        });
    });

    // ─── Initialize ─────────────────────────────────────────────
    DashboardModule.load();
    StudentManager.init();
    CompanyManager.load();

    console.log('🎓 Student Analyzer loaded successfully!');
});

// ─── Modal Utilities ───────────────────────────────────────
window.openModal = function (title, bodyHtml) {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');

    if (modal && titleEl && bodyEl) {
        titleEl.textContent = title;
        bodyEl.innerHTML = bodyHtml;
        modal.classList.add('visible');
    }
};

window.closeModal = function () {
    const modal = document.getElementById('custom-modal');
    if (modal) modal.classList.remove('visible');
};
