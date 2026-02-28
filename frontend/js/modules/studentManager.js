/**
 * Student Manager Module — CRUD, search, filter, pagination
 */
const StudentManager = {
    currentPage: 1,
    perPage: 20,
    debounceTimer: null,

    async init() {
        this.bindEvents();
        this.loadBranches();
        this.loadStudents();
    },

    bindEvents() {
        const search = document.getElementById('student-search');
        const branchFilter = document.getElementById('branch-filter');
        const placedFilter = document.getElementById('placed-filter');

        if (search) {
            search.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => { this.currentPage = 1; this.loadStudents(); }, 300);
            });
        }
        if (branchFilter) branchFilter.addEventListener('change', () => { this.currentPage = 1; this.loadStudents(); });
        if (placedFilter) placedFilter.addEventListener('change', () => { this.currentPage = 1; this.loadStudents(); });
    },

    async loadBranches() {
        try {
            const branches = await API.getBranches();
            const select = document.getElementById('branch-filter');
            branches.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                opt.textContent = b;
                select.appendChild(opt);
            });
        } catch (e) { console.error(e); }
    },

    async loadStudents() {
        const params = { page: this.currentPage, per_page: this.perPage };
        const search = document.getElementById('student-search')?.value;
        const branch = document.getElementById('branch-filter')?.value;
        const placed = document.getElementById('placed-filter')?.value;

        if (search) params.search = search;
        if (branch) params.branch = branch;
        if (placed) params.placed = placed;

        try {
            const data = await API.getStudents(params);
            this.renderTable(data.students);
            this.renderPagination(data.pages, data.current_page);
        } catch (e) {
            console.error('Load students error:', e);
        }
    },

    renderTable(students) {
        const tbody = document.querySelector('#students-table tbody');
        if (!tbody) return;

        tbody.innerHTML = students.map(s => `
            <tr>
                <td>
                    <div style="font-weight:600;color:var(--text-primary)">${s.name}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted)">${s.email}</div>
                </td>
                <td>${s.branch}</td>
                <td><strong style="color:${s.cgpa >= 8 ? 'var(--accent-emerald)' : s.cgpa >= 6 ? 'var(--accent-amber)' : 'var(--accent-rose)'}">${s.cgpa.toFixed(2)}</strong></td>
                <td>${(s.skills || []).slice(0, 3).map(sk => `<span class="skill-tag">${sk}</span>`).join('')}${s.skills.length > 3 ? `<span class="skill-tag" style="opacity:0.6">+${s.skills.length - 3}</span>` : ''}</td>
                <td>${s.projects}</td>
                <td>${s.placed ? '<span class="badge badge-placed"><i class="fas fa-check"></i> Placed</span>' : '<span class="badge badge-not-placed"><i class="fas fa-times"></i> Not Placed</span>'}</td>
                <td>
                    <button class="action-btn" title="View" onclick="StudentManager.viewStudent(${s.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn" title="Edit" style="color:var(--accent-amber)" onclick="StudentManager.showEditForm(${s.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" title="AI Insights" style="color:var(--accent-indigo)" onclick="StudentManager.viewAiInsights(${s.id})"><i class="fas fa-brain"></i></button>
                    <button class="action-btn delete" title="Delete" onclick="StudentManager.deleteStudent(${s.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    },

    renderPagination(totalPages, currentPage) {
        const container = document.getElementById('students-pagination');
        if (!container) return;

        let html = '';
        if (currentPage > 1) {
            html += `<button onclick="StudentManager.goToPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
        }
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="StudentManager.goToPage(${i})">${i}</button>`;
        }
        if (currentPage < totalPages) {
            html += `<button onclick="StudentManager.goToPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
        }
        container.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.loadStudents();
    },

    async viewStudent(id) {
        try {
            const s = await API.getStudent(id);
            alert(`📋 ${s.name}\n\n📧 ${s.email}\n🎓 ${s.branch} | CGPA: ${s.cgpa}\n🔧 Skills: ${s.skills.join(', ')}\n📁 Projects: ${s.projects} | Internships: ${s.internships}\n✅ Placed: ${s.placed ? 'Yes' : 'No'}`);
        } catch (e) { alert('Error loading student details.'); }
    },

    async viewAiInsights(id) {
        try {
            const s = await API.getStudent(id);
            // We'll reuse the Skill Gap and Salary Predictor logic to show a quick summary
            const [gap, salary] = await Promise.all([
                API.skillGap({ student_id: id, target_role: 'Software Engineer' }),
                API.predictSalary({
                    cgpa: s.cgpa,
                    branch: s.branch,
                    projects: s.projects,
                    internships: s.internships,
                    skills: s.skills
                })
            ]);

            const insightHtml = `
<div class="ai-insight-content">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color)">
        <div>
            <h4 style="margin:0; color:var(--text-primary)">Placement Profile: ${s.name}</h4>
            <div style="font-size:0.85rem; color:var(--text-muted)">${s.branch} • CGPA: ${s.cgpa}</div>
        </div>
        <div style="text-align:right">
            <div style="font-size:1.5rem; font-weight:700; color:var(--accent-emerald)">${gap.match_percentage}%</div>
            <div style="font-size:0.75rem; color:var(--text-secondary)">Readiness Score</div>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem">
        <div>
            <h5 style="color:var(--accent-teal); margin-bottom:0.8rem"><i class="fas fa-chart-line"></i> Salary Prediction</h5>
            <div style="font-size:1.25rem; font-weight:600; color:var(--text-primary)">₹${salary.predicted_avg_lpa} LPA</div>
            <p style="font-size:0.85rem; color:var(--text-muted)">Estimated based on projects (${s.projects}) and skills.</p>
        </div>
        <div>
            <h5 style="color:var(--accent-amber); margin-bottom:0.8rem"><i class="fas fa-check-circle"></i> Key Strengths</h5>
            <ul style="padding-left:1.2rem; margin:0; font-size:0.9rem; color:var(--text-secondary)">
                ${(gap.skills_to_improve || []).slice(0, 3).map(sk => `<li>${sk}</li>`).join('')}
            </ul>
        </div>
    </div>

    <div style="margin-top:1.5rem; padding:1.2rem; background:rgba(99, 102, 241, 0.05); border-radius:var(--radius-md)">
        <h5 style="color:var(--accent-indigo); margin-bottom:0.5rem"><i class="fas fa-lightbulb"></i> Top Recommendations</h5>
        <ul style="padding-left:1.2rem; margin:0; font-size:0.9rem; color:var(--text-secondary)">
            ${(gap.recommendations || []).slice(0, 2).map(r => `<li>${r}</li>`).join('')}
        </ul>
    </div>

    <div style="margin-top:1.5rem; text-align:center; font-size:0.8rem; color:var(--text-muted)">
        For a detailed roadmap and job matching, please visit the <strong>AI Analysis</strong> tab.
    </div>
</div>
            `;
            window.openModal(`AI Insights: ${s.name}`, insightHtml);
        } catch (e) {
            console.error(e);
            showNotification('AI Insights requires a valid API key.', 'error');
        }
    },

    async deleteStudent(id) {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            await API.deleteStudent(id);
            showNotification('Student deleted successfully.');
            this.loadStudents();
        } catch (e) { showNotification('Error deleting student.', 'error'); }
    },

    showAddForm() {
        this.renderForm('Add New Student');
    },

    async showEditForm(id) {
        try {
            const s = await API.getStudent(id);
            this.renderForm(`Edit Student: ${s.name}`, s);
        } catch (e) { showNotification('Error loading student details.', 'error'); }
    },

    renderForm(title, data = null) {
        const isEdit = !!data;
        const html = `
            <form id="student-form" class="crud-form" onsubmit="event.preventDefault(); StudentManager.saveStudent(${isEdit ? data.id : ''})">
                <div class="form-row">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="std-name" value="${data?.name || ''}" required placeholder="e.g. John Doe">
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="std-email" value="${data?.email || ''}" required placeholder="e.g. john@example.com">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Branch</label>
                        <input type="text" id="std-branch" value="${data?.branch || ''}" required placeholder="e.g. Computer Science">
                    </div>
                    <div class="form-group">
                        <label>CGPA</label>
                        <input type="number" id="std-cgpa" value="${data?.cgpa || ''}" step="0.01" min="0" max="10" required placeholder="e.g. 8.5">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Projects</label>
                        <input type="number" id="std-projects" value="${data?.projects || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Internships</label>
                        <input type="number" id="std-internships" value="${data?.internships || 0}" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Skills (Comma separated)</label>
                    <input type="text" id="std-skills" value="${(data?.skills || []).join(', ')}" placeholder="e.g. React, Node.js, Python">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-glass" onclick="window.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update Student' : 'Save Student'}</button>
                </div>
            </form>
        `;
        window.openModal(title, html);
    },

    async saveStudent(id = null) {
        const payload = {
            name: document.getElementById('std-name').value,
            email: document.getElementById('std-email').value,
            branch: document.getElementById('std-branch').value,
            cgpa: parseFloat(document.getElementById('std-cgpa').value),
            projects: parseInt(document.getElementById('std-projects').value) || 0,
            internships: parseInt(document.getElementById('std-internships').value) || 0,
            skills: document.getElementById('std-skills').value.split(',').map(s => s.trim()).filter(s => s),
            placed: false
        };

        try {
            if (id) {
                await API.updateStudent(id, payload);
                showNotification('Student updated successfully.');
            } else {
                await API.createStudent(payload);
                showNotification('Student created successfully.');
            }
            window.closeModal();
            this.loadStudents();
        } catch (e) {
            showNotification(e.message || 'Error saving student.', 'error');
        }
    }
};

window.StudentManager = StudentManager;
