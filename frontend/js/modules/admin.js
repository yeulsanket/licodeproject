/**
 * Admin Module — Database stats, exports, reset
 */
const AdminModule = {
    async init() {
        this.loadStats();
    },

    async loadStats() {
        try {
            const stats = await API.getAdminStats();
            const container = document.getElementById('admin-db-stats');
            if (!container) return;

            container.innerHTML = `
                <div class="admin-stat-row"><span class="label">Students</span><span class="value">${stats.total_students}</span></div>
                <div class="admin-stat-row"><span class="label">Placed</span><span class="value">${stats.placed_students}</span></div>
                <div class="admin-stat-row"><span class="label">Companies</span><span class="value">${stats.total_companies}</span></div>
                <div class="admin-stat-row"><span class="label">Placements</span><span class="value">${stats.total_placements}</span></div>
                <div class="admin-stat-row"><span class="label">Branches</span><span class="value">${(stats.branches || []).length}</span></div>
            `;
        } catch (e) {
            console.error('Admin stats error:', e);
        }
    },

    exportStudents() {
        window.open(API.exportStudents(), '_blank');
    },

    exportPlacements() {
        window.open(API.exportPlacements(), '_blank');
    },

    async resetDatabase() {
        if (!confirm('⚠️ This will permanently delete ALL data. Are you sure?')) return;
        if (!confirm('This action CANNOT be undone. Type OK to confirm.')) return;

        try {
            await API.resetDatabase();
            alert('✅ Database reset successfully.');
            this.loadStats();
        } catch (e) {
            alert('Error resetting database.');
        }
    }
};

window.AdminModule = AdminModule;
