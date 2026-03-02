/**
 * Dashboard Module — Loads stats and renders charts.
 * Role-aware: Admin sees full analytics, Student sees personal profile.
 */
const DashboardModule = {
    async load() {
        const user = Auth ? Auth.getUser() : null;
        if (user && user.role === 'student') {
            await this.loadStudentProfile(user);
        } else {
            this.loadStats();
            this.loadCharts();
        }
    },

    // ─── ADMIN DASHBOARD ────────────────────────────────────────────
    async loadStats() {
        try {
            const stats = await API.getStats();
            document.getElementById('stat-total-students').textContent = stats.total_students.toLocaleString();
            document.getElementById('stat-placed').textContent = stats.placed_students.toLocaleString();
            document.getElementById('stat-rate').textContent = stats.placement_rate + '%';
            document.getElementById('stat-avg-pkg').textContent = '₹' + stats.avg_package.toFixed(1);
            document.getElementById('stat-highest-pkg').textContent = '₹' + stats.highest_package.toFixed(1);
            document.getElementById('stat-companies').textContent = stats.total_companies;
        } catch (e) {
            console.error('Stats load error:', e);
        }
    },

    async loadCharts() {
        try {
            const [overview, salary, branch, companies, cgpa, skills, trends, gender] =
                await Promise.all([
                    API.getPlacementOverview(),
                    API.getSalaryDistribution(),
                    API.getBranchStats(),
                    API.getTopCompanies(),
                    API.getCgpaVsPackage(),
                    API.getTopSkills(),
                    API.getMonthlyTrends(),
                    API.getGenderDistribution()
                ]);

            chartManager.createDoughnut('chart-placement-overview', ['Placed', 'Not Placed'], [overview.placed, overview.not_placed]);
            chartManager.createBar('chart-salary-dist', salary.labels, [{ label: 'Students', data: salary.values }], { plugins: { legend: { display: false } } });
            chartManager.createBar('chart-branch-stats', branch.map(b => b.branch), [
                { label: 'Placed', data: branch.map(b => b.placed), backgroundColor: 'rgba(45, 212, 191, 0.7)', borderColor: '#2dd4bf' },
                { label: 'Not Placed', data: branch.map(b => b.not_placed), backgroundColor: 'rgba(251, 113, 133, 0.5)', borderColor: '#fb7185' }
            ]);
            chartManager.createHorizontalBar('chart-top-companies', companies.map(c => c.company), companies.map(c => c.hires));
            const branchGroups = {};
            cgpa.forEach(pt => {
                if (!branchGroups[pt.branch]) branchGroups[pt.branch] = [];
                branchGroups[pt.branch].push({ x: pt.cgpa, y: pt.package });
            });
            chartManager.createScatter('chart-cgpa-pkg', Object.entries(branchGroups).map(([label, data]) => ({ label, data, pointRadius: 4 })));
            chartManager.createBar('chart-top-skills', skills.labels, [{ label: 'Demand', data: skills.values }], { plugins: { legend: { display: false } } });
            chartManager.createLine('chart-monthly-trends', trends.labels, [
                { label: 'Placements', data: trends.placements },
                { label: 'Avg Package (LPA)', data: trends.avg_packages, yAxisID: 'y1' }
            ], { scales: { y1: { position: 'right', grid: { display: false }, beginAtZero: true } } });
            chartManager.createDoughnut('chart-gender', gender.labels, gender.values);
        } catch (e) {
            console.error('Charts load error:', e);
        }
    },

    // ─── STUDENT PERSONAL DASHBOARD ─────────────────────────────────
    async loadStudentProfile(user) {
        const tabEl = document.getElementById('tab-dashboard');
        if (!tabEl) return;

        tabEl.innerHTML = `
            <div class="section-header" style="margin-bottom:1.5rem">
                <h2 class="section-title"><i class="fas fa-user-circle"></i> My Profile</h2>
                <p class="section-subtitle">Your placement journey at a glance</p>
            </div>
            <div id="student-profile-content">
                <div class="loading"><div class="spinner"></div><span>Loading your profile...</span></div>
            </div>
        `;

        try {
            const s = await API.getStudent(user.student_id);
            const stats = await API.getStats();
            this.renderStudentProfile(s, stats);
        } catch (e) {
            document.getElementById('student-profile-content').innerHTML =
                `<p style="color:var(--accent-rose)">⚠ Could not load your profile. Please refresh the page.</p>`;
            console.error(e);
        }
    },

    renderStudentProfile(s, stats) {
        const placedBadge = s.placed
            ? `<span style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3);padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:600"><i class="fas fa-check-circle"></i> Placed</span>`
            : `<span style="background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3);padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:600"><i class="fas fa-clock"></i> Seeking Placement</span>`;

        const cgpaColor = s.cgpa >= 8.5 ? '#34d399' : s.cgpa >= 7 ? '#60a5fa' : '#fbbf24';
        const cgpaVsAvg = stats.avg_cgpa ? (s.cgpa - stats.avg_cgpa).toFixed(2) : null;
        const cgpaCompare = cgpaVsAvg !== null
            ? (parseFloat(cgpaVsAvg) >= 0
                ? `<span style="color:#34d399">▲ ${cgpaVsAvg} above class avg</span>`
                : `<span style="color:#f87171">▼ ${Math.abs(cgpaVsAvg)} below class avg</span>`)
            : '';

        document.getElementById('student-profile-content').innerHTML = `
            <!-- Profile Hero -->
            <div style="background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08));border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:2rem;margin-bottom:1.5rem;display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap">
                <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:2rem;color:white;flex-shrink:0">
                    ${(s.name || 'S')[0].toUpperCase()}
                </div>
                <div style="flex:1;min-width:200px">
                    <h2 style="margin:0 0 0.25rem;font-size:1.5rem;font-weight:800;color:#f0f4ff">${s.name}</h2>
                    <div style="color:#94a3b8;font-size:0.9rem;margin-bottom:0.5rem">${s.email} · ${s.branch}</div>
                    ${placedBadge}
                </div>
            </div>

            <!-- Stats Grid -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:1.5rem">
                ${this._statCard('fas fa-star', 'CGPA', s.cgpa, cgpaColor, cgpaCompare)}
                ${this._statCard('fas fa-code', 'Projects', s.projects || 0, '#60a5fa')}
                ${this._statCard('fas fa-briefcase', 'Internships', s.internships || 0, '#a78bfa')}
                ${this._statCard('fas fa-users', 'Batch Rank', this._estimateRank(s.cgpa, stats), '#34d399')}
            </div>

            <!-- Skills -->
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem">
                <h4 style="margin:0 0 1rem;color:#f0f4ff"><i class="fas fa-code" style="color:#6366f1;margin-right:0.5rem"></i>My Skills</h4>
                <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
                    ${(s.skills && s.skills.length)
                ? s.skills.map(sk => `<span class="skill-tag">${sk}</span>`).join('')
                : '<span style="color:#64748b">No skills listed. Update your profile.</span>'}
                </div>
            </div>

            <!-- Class Comparison -->
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem">
                <h4 style="margin:0 0 1rem;color:#f0f4ff"><i class="fas fa-chart-bar" style="color:#14b8a6;margin-right:0.5rem"></i>How You Compare to Your Class</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
                    ${this._compareBar('CGPA', s.cgpa, 10, stats.avg_cgpa || 7.5)}
                    ${this._compareBar('Projects', s.projects || 0, 10, 3)}
                    ${this._compareBar('Internships', s.internships || 0, 5, 1.5)}
                    ${this._compareBar('Placement Rate', stats.placement_rate || 0, 100, 100, '%')}
                </div>
            </div>

            <!-- AI CTA -->
            <div style="background:linear-gradient(135deg,rgba(20,184,166,0.1),rgba(16,185,129,0.07));border:1px solid rgba(20,184,166,0.25);border-radius:12px;padding:1.5rem;text-align:center">
                <i class="fas fa-robot" style="font-size:2rem;color:#14b8a6;margin-bottom:0.75rem;display:block"></i>
                <h4 style="margin:0 0 0.5rem;color:#f0f4ff">Unlock Your AI Career Insights</h4>
                <p style="color:#94a3b8;font-size:0.9rem;margin-bottom:1rem">Get personalized skill gap analysis, salary prediction, career roadmap, and job matches.</p>
                <button onclick="document.querySelector('.nav-item[data-tab=ai-analysis]').click()"
                    style="background:linear-gradient(135deg,#14b8a6,#10b981);border:none;color:white;padding:0.7rem 2rem;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.95rem">
                    <i class="fas fa-magic"></i> Go to AI Analysis
                </button>
            </div>
        `;
    },

    _statCard(icon, label, value, color, sub = '') {
        return `
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.25rem;text-align:center">
                <i class="${icon}" style="font-size:1.5rem;color:${color};margin-bottom:0.5rem;display:block"></i>
                <div style="font-size:1.75rem;font-weight:800;color:${color};line-height:1">${value}</div>
                <div style="font-size:0.75rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-top:0.25rem">${label}</div>
                ${sub ? `<div style="font-size:0.75rem;margin-top:0.4rem">${sub}</div>` : ''}
            </div>`;
    },

    _compareBar(label, value, max, avg, unit = '') {
        const pct = Math.min((value / max) * 100, 100);
        const avgPct = Math.min((avg / max) * 100, 100);
        const color = value >= avg ? '#34d399' : '#fbbf24';
        return `
            <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;font-size:0.82rem">
                    <span style="color:#94a3b8">${label}</span>
                    <span style="color:${color};font-weight:600">${value}${unit}</span>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:4px;height:8px;position:relative;overflow:hidden">
                    <div style="width:${pct}%;background:${color};height:100%;border-radius:4px;transition:width 0.8s ease"></div>
                </div>
                <div style="font-size:0.72rem;color:#64748b;margin-top:0.25rem">Class avg: ${avg}${unit}</div>
            </div>`;
    },

    _estimateRank(cgpa, stats) {
        if (!stats.avg_cgpa) return 'N/A';
        const diff = cgpa - stats.avg_cgpa;
        if (diff >= 1.5) return 'Top 10%';
        if (diff >= 0.8) return 'Top 25%';
        if (diff >= 0) return 'Above Avg';
        if (diff >= -0.5) return 'Below Avg';
        return 'Needs Work';
    }
};

window.DashboardModule = DashboardModule;
