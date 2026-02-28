/**
 * API Service — Centralized fetch wrapper for Student Analyzer backend
 */
const API_BASE = window.location.origin || 'http://localhost:5000';

const API = {
    async request(endpoint, options = {}) {
        try {
            const url = `${API_BASE}${endpoint}`;
            const config = {
                headers: { 'Content-Type': 'application/json' },
                ...options
            };
            const res = await fetch(url, config);
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('text/csv')) {
                return await res.blob();
            }
            return await res.json();
        } catch (err) {
            console.error(`API Error [${endpoint}]:`, err);
            throw err;
        }
    },

    // ─── Students ───
    getStudents(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/api/students${qs ? '?' + qs : ''}`);
    },
    getStudent(id) { return this.request(`/api/students/${id}`); },
    createStudent(data) { return this.request('/api/students', { method: 'POST', body: JSON.stringify(data) }); },
    updateStudent(id, data) { return this.request(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteStudent(id) { return this.request(`/api/students/${id}`, { method: 'DELETE' }); },
    getBranches() { return this.request('/api/students/branches'); },

    // ─── Companies ───
    getCompanies(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/api/companies${qs ? '?' + qs : ''}`);
    },
    getCompany(id) { return this.request(`/api/companies/${id}`); },
    createCompany(data) { return this.request('/api/companies', { method: 'POST', body: JSON.stringify(data) }); },
    updateCompany(id, data) { return this.request(`/api/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteCompany(id) { return this.request(`/api/companies/${id}`, { method: 'DELETE' }); },

    // ─── Analytics ───
    getStats() { return this.request('/api/analytics/stats'); },
    getPlacementOverview() { return this.request('/api/analytics/placement-overview'); },
    getSalaryDistribution() { return this.request('/api/analytics/salary-distribution'); },
    getBranchStats() { return this.request('/api/analytics/branch-stats'); },
    getTopCompanies() { return this.request('/api/analytics/top-companies'); },
    getCgpaVsPackage() { return this.request('/api/analytics/cgpa-vs-package'); },
    getTopSkills() { return this.request('/api/analytics/top-skills'); },
    getMonthlyTrends() { return this.request('/api/analytics/monthly-trends'); },
    getGenderDistribution() { return this.request('/api/analytics/gender-distribution'); },

    // ─── AI ───
    analyzeResume(data) { return this.request('/api/ai/analyze-resume', { method: 'POST', body: JSON.stringify(data) }); },
    skillGap(data) { return this.request('/api/ai/skill-gap', { method: 'POST', body: JSON.stringify(data) }); },
    predictSalary(data) { return this.request('/api/ai/predict-salary', { method: 'POST', body: JSON.stringify(data) }); },
    generateRoadmap(data) { return this.request('/api/ai/roadmap', { method: 'POST', body: JSON.stringify(data) }); },
    // ─── SETTINGS & CONFIG ────────────────────────────────────
    async getConfig() {
        return this.request('/api/config');
    },

    async updateConfig(config) {
        return this.request('/api/config', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    },

    // ─── JOBS & RECOMMENDATIONS ─────────────────────────────
    async getJobRecommendations(studentId) {
        // This will call the new job recommendations endpoint
        return this.request(`/api/jobs/recommendations/${studentId}`);
    },
    chat(data) { return this.request('/api/ai/chat', { method: 'POST', body: JSON.stringify(data) }); },

    // ─── Admin ───
    getAdminStats() { return this.request('/api/admin/stats'); },
    exportStudents() { return `${API_BASE}/api/admin/export/students`; },
    exportPlacements() { return `${API_BASE}/api/admin/export/placements`; },
    resetDatabase() { return this.request('/api/admin/reset-database', { method: 'POST', body: JSON.stringify({ confirm: true }) }); }
};
