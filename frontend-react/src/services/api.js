// API Service — centralised fetch wrapper
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = {
    getToken: () => localStorage.getItem('auth_token'),

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            },
            ...(options.body ? { body: options.body } : {}),
        };
        const res = await fetch(`${API_BASE}${endpoint}`, config);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            if (res.status === 401 && !endpoint.includes('/auth/')) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                window.location.replace('/login');
            }
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('text/csv')) return res.blob();
        return res.json();
    },

    // Auth
    login: (d) => api.request('/api/auth/login', { method: 'POST', body: JSON.stringify(d) }),
    studentLogin: (d) => api.request('/api/auth/student/login', { method: 'POST', body: JSON.stringify(d) }),
    verifyToken: () => api.request('/api/auth/verify'),

    // Analytics
    getStats: () => api.request('/api/analytics/stats'),
    getPlacementOverview: () => api.request('/api/analytics/placement-overview'),
    getSalaryDistribution: () => api.request('/api/analytics/salary-distribution'),
    getBranchStats: () => api.request('/api/analytics/branch-stats'),
    getTopCompanies: () => api.request('/api/analytics/top-companies'),
    getCgpaVsPackage: () => api.request('/api/analytics/cgpa-vs-package'),
    getTopSkills: () => api.request('/api/analytics/top-skills'),
    getMonthlyTrends: () => api.request('/api/analytics/monthly-trends'),
    getGenderDistribution: () => api.request('/api/analytics/gender-distribution'),

    // Students
    getStudents: (p = {}) => api.request(`/api/students?${new URLSearchParams(p)}`),
    getStudent: (id) => api.request(`/api/students/${id}`),
    addStudent: (d) => api.request('/api/students', { method: 'POST', body: JSON.stringify(d) }),
    updateStudent: (id, d) => api.request(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deleteStudent: (id) => api.request(`/api/students/${id}`, { method: 'DELETE' }),

    // Companies
    getCompanies: (p = {}) => api.request(`/api/companies?${new URLSearchParams(p)}`),
    addCompany: (d) => api.request('/api/companies', { method: 'POST', body: JSON.stringify(d) }),
    updateCompany: (id, d) => api.request(`/api/companies/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deleteCompany: (id) => api.request(`/api/companies/${id}`, { method: 'DELETE' }),

    // AI
    analyzeResume: (d) => api.request('/api/ai/analyze-resume', { method: 'POST', body: JSON.stringify(d) }),
    skillGap: (d) => api.request('/api/ai/skill-gap', { method: 'POST', body: JSON.stringify(d) }),
    predictSalary: (d) => api.request('/api/ai/predict-salary', { method: 'POST', body: JSON.stringify(d) }),
    generateRoadmap: (d) => api.request('/api/ai/roadmap', { method: 'POST', body: JSON.stringify(d) }),
    getJobRecommendations: (id) => api.request(`/api/ai/job-recommendations/${id}`),
    chatWithAI: (d) => api.request('/api/ai/chat', { method: 'POST', body: JSON.stringify(d) }),
    generateTest: (diff, sub, id) => api.request('/api/ai/generate-test', { method: 'POST', body: JSON.stringify({ difficulty: diff, subject: sub, student_id: id }) }),
    saveTestResult: (d) => api.request('/api/ai/save-test-result', { method: 'POST', body: JSON.stringify(d) }),
    getTestHistory: (id) => api.request(`/api/ai/test-history/${id}`),

    // Admin
    getAdminStudents: (p = {}) => api.request(`/api/admin/students?${new URLSearchParams(p)}`),
    ping: () => fetch('/api/ping'),
};

export default api;
