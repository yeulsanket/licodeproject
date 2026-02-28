/**
 * Company Manager Module
 */
const CompanyManager = {
    async load() {
        this.loadCompanies();
        this.bindEvents();
    },

    bindEvents() {
        const search = document.getElementById('company-search');
        if (search) {
            let timer;
            search.addEventListener('input', () => {
                clearTimeout(timer);
                timer = setTimeout(() => this.loadCompanies(), 300);
            });
        }
    },

    async loadCompanies() {
        const search = document.getElementById('company-search')?.value;
        const params = {};
        if (search) params.search = search;

        try {
            const companies = await API.getCompanies(params);
            this.renderGrid(companies);
        } catch (e) { console.error(e); }
    },

    renderGrid(companies) {
        const grid = document.getElementById('company-grid');
        if (!grid) return;

        grid.innerHTML = companies.map(c => `
            <div class="company-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start">
                    <h4>${c.name}</h4>
                    <div style="display:flex; gap:0.5rem">
                        <button class="action-btn" onclick="CompanyManager.showEditForm(${c.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="CompanyManager.deleteCompany(${c.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <span class="industry-badge">${c.industry}</span>
                <div class="pkg-range">
                    Package: <strong>₹${c.min_package} - ${c.max_package} LPA</strong>
                </div>
                ${c.requirements && c.requirements.length ? `
                <div style="margin-top:0.75rem">
                    ${c.requirements.slice(0, 4).map(r => `<span class="skill-tag">${r}</span>`).join('')}
                </div>` : ''}
            </div>
        `).join('');
    },

    async deleteCompany(id) {
        if (!window.confirm('Are you sure you want to delete this company?')) return;
        try {
            await API.deleteCompany(id);
            showNotification('Company deleted successfully.');
            this.loadCompanies();
        } catch (e) { showNotification('Error deleting company.', 'error'); }
    },

    showAddForm() {
        this.renderForm('Add New Company');
    },

    async showEditForm(id) {
        try {
            const c = await API.getCompany(id);
            this.renderForm(`Edit Company: ${c.name}`, c);
        } catch (e) { showNotification('Error loading company details.', 'error'); }
    },

    renderForm(title, data = null) {
        const isEdit = !!data;
        const html = `
            <form id="company-form" class="crud-form" onsubmit="event.preventDefault(); CompanyManager.saveCompany(${isEdit ? data.id : ''})">
                <div class="form-row">
                    <div class="form-group">
                        <label>Company Name</label>
                        <input type="text" id="comp-name" value="${data?.name || ''}" required placeholder="e.g. Google">
                    </div>
                    <div class="form-group">
                        <label>Industry</label>
                        <input type="text" id="comp-industry" value="${data?.industry || ''}" required placeholder="e.g. Technology">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Min Package (LPA)</label>
                        <input type="number" id="comp-min-pkg" value="${data?.min_package || ''}" step="0.1" required>
                    </div>
                    <div class="form-group">
                        <label>Max Package (LPA)</label>
                        <input type="number" id="comp-max-pkg" value="${data?.max_package || ''}" step="0.1" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Requirements (Comma separated)</label>
                    <input type="text" id="comp-reqs" value="${(data?.requirements || []).join(', ')}" placeholder="e.g. DSA, System Design, React">
                </div>
                <div class="form-group">
                    <label>Website</label>
                    <input type="url" id="comp-website" value="${data?.website || ''}" placeholder="https://example.com">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-glass" onclick="window.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update Company' : 'Save Company'}</button>
                </div>
            </form>
        `;
        window.openModal(title, html);
    },

    async saveCompany(id = null) {
        const payload = {
            name: document.getElementById('comp-name').value,
            industry: document.getElementById('comp-industry').value,
            min_package: parseFloat(document.getElementById('comp-min-pkg').value),
            max_package: parseFloat(document.getElementById('comp-max-pkg').value),
            requirements: document.getElementById('comp-reqs').value.split(',').map(s => s.trim()).filter(s => s),
            website: document.getElementById('comp-website').value
        };

        try {
            if (id) {
                await API.updateCompany(id, payload);
                showNotification('Company updated successfully.');
            } else {
                await API.createCompany(payload);
                showNotification('Company created successfully.');
            }
            window.closeModal();
            this.loadCompanies();
        } catch (e) {
            showNotification(e.message || 'Error saving company.', 'error');
        }
    }
};

window.CompanyManager = CompanyManager;
