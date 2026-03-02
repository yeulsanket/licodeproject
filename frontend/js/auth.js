/**
 * Auth Module — Handles login, logout, session management, and role-based UI
 */
const Auth = {
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'auth_user',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null');
        } catch {
            return null;
        }
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    isStudent() {
        const user = this.getUser();
        return user && user.role === 'student';
    },

    getStudentId() {
        const user = this.getUser();
        return user ? user.student_id : null;
    },

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.href = '/login.html';
    },

    /**
     * Apply role-based UI restrictions after login.
     * Students can only see Dashboard and AI Analysis.
     */
    applyRoleRestrictions() {
        const user = this.getUser();
        if (!user) return;

        // Update sidebar username
        const usernameEl = document.getElementById('sidebar-username');
        if (usernameEl) usernameEl.textContent = user.username;

        const roleEl = document.getElementById('sidebar-role');
        if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Student';

        if (user.role === 'student') {
            this._applyStudentRestrictions(user);
        }
    },

    _applyStudentRestrictions(user) {
        // Hide nav items not allowed for students
        const hiddenTabs = ['management', 'admin', 'settings'];
        hiddenTabs.forEach(tab => {
            const navEl = document.querySelector(`.nav-item[data-tab="${tab}"]`);
            if (navEl) navEl.style.display = 'none';
        });

        // Activate Dashboard by default (safe tab for students)
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

        const dashNav = document.querySelector('.nav-item[data-tab="dashboard"]');
        const dashTab = document.getElementById('tab-dashboard');
        if (dashNav) dashNav.classList.add('active');
        if (dashTab) dashTab.classList.add('active');

        // Show student welcome banner
        this._injectStudentBanner(user.username);

        // Pre-fill AI Analysis selects with this student's id if available
        if (user.student_id) {
            this._prefillStudentInAI(user.student_id);
        }
    },

    _injectStudentBanner(name) {
        const header = document.querySelector('#tab-dashboard .section-header');
        if (!header) return;
        const banner = document.createElement('div');
        banner.style.cssText = `
            background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08));
            border: 1px solid rgba(99,102,241,0.25);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        `;
        banner.innerHTML = `
            <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fas fa-user-graduate" style="color:white;font-size:1rem;"></i>
            </div>
            <div>
                <div style="font-weight:700;color:#f0f4ff;font-size:0.95rem;">Welcome back, ${name}!</div>
                <div style="font-size:0.8rem;color:#94a3b8;">You are viewing your student dashboard. Go to <strong>AI Analysis</strong> to explore your career insights.</div>
            </div>
        `;
        header.parentNode.insertBefore(banner, header.nextSibling);
    },

    _prefillStudentInAI(studentId) {
        // Try to pre-select the student in AI analysis dropdowns after a short delay
        setTimeout(() => {
            ['skillgap-student', 'roadmap-student', 'jobmatch-student'].forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    select.value = studentId;
                    // Disable changing selection for students (they can only analyze themselves)
                    select.disabled = true;
                    select.title = 'You can only analyze your own profile';
                }
            });
        }, 1500);
    }
};

window.Auth = Auth;
