/**
 * Dashboard Module — Loads stats and renders charts
 */
const DashboardModule = {
    async load() {
        this.loadStats();
        this.loadCharts();
    },

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

            // 1. Placement Overview — Doughnut
            chartManager.createDoughnut('chart-placement-overview',
                ['Placed', 'Not Placed'],
                [overview.placed, overview.not_placed]
            );

            // 2. Salary Distribution — Bar
            chartManager.createBar('chart-salary-dist',
                salary.labels,
                [{ label: 'Students', data: salary.values }],
                { plugins: { legend: { display: false } } }
            );

            // 3. Branch Stats — Grouped Bar
            chartManager.createBar('chart-branch-stats',
                branch.map(b => b.branch),
                [
                    { label: 'Placed', data: branch.map(b => b.placed), backgroundColor: 'rgba(45, 212, 191, 0.7)', borderColor: '#2dd4bf' },
                    { label: 'Not Placed', data: branch.map(b => b.not_placed), backgroundColor: 'rgba(251, 113, 133, 0.5)', borderColor: '#fb7185' }
                ]
            );

            // 4. Top Companies — Horizontal Bar
            chartManager.createHorizontalBar('chart-top-companies',
                companies.map(c => c.company),
                companies.map(c => c.hires)
            );

            // 5. CGPA vs Package — Scatter
            const branchGroups = {};
            cgpa.forEach(pt => {
                if (!branchGroups[pt.branch]) branchGroups[pt.branch] = [];
                branchGroups[pt.branch].push({ x: pt.cgpa, y: pt.package });
            });
            chartManager.createScatter('chart-cgpa-pkg',
                Object.entries(branchGroups).map(([label, data]) => ({ label, data, pointRadius: 4 }))
            );

            // 6. Top Skills — Bar
            chartManager.createBar('chart-top-skills',
                skills.labels,
                [{ label: 'Demand', data: skills.values }],
                { plugins: { legend: { display: false } } }
            );

            // 7. Monthly Trends — Line
            chartManager.createLine('chart-monthly-trends',
                trends.labels,
                [
                    { label: 'Placements', data: trends.placements },
                    { label: 'Avg Package (LPA)', data: trends.avg_packages, yAxisID: 'y1' }
                ],
                { scales: { y1: { position: 'right', grid: { display: false }, beginAtZero: true } } }
            );

            // 8. Gender Distribution — Doughnut
            chartManager.createDoughnut('chart-gender',
                gender.labels,
                gender.values
            );
        } catch (e) {
            console.error('Charts load error:', e);
        }
    }
};

window.DashboardModule = DashboardModule;
