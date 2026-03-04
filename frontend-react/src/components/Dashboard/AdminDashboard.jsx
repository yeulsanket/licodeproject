import { useEffect, useState } from 'react';
import {
    Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement,
    CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js';
import { Doughnut, Bar, Line, Scatter } from 'react-chartjs-2';
import api from '../../services/api';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement,
    CategoryScale, LinearScale, Tooltip, Legend, Filler);

const CHART_DEFAULTS = {
    plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } } },
    scales: {
        x: { ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
    responsive: true, maintainAspectRatio: false,
};

const PALETTE = ['#6366f1', '#14b8a6', '#8b5cf6', '#f59e0b', '#10b981', '#fb7185', '#60a5fa'];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.getStats(),
            api.getPlacementOverview(),
            api.getSalaryDistribution(),
            api.getBranchStats(),
            api.getTopCompanies(),
            api.getCgpaVsPackage(),
            api.getTopSkills(),
            api.getMonthlyTrends(),
            api.getGenderDistribution(),
        ]).then(([s, overview, salary, branch, companies, cgpa, skills, trends, gender]) => {
            setStats(s);
            setCharts({ overview, salary, branch, companies, cgpa, skills, trends, gender });
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading analytics...</span></div>;

    const STAT_CARDS = [
        { label: 'Total Students', value: stats?.total_students?.toLocaleString(), icon: 'fas fa-users', c1: '#6366f1', c2: '#8b5cf6' },
        { label: 'Placed', value: stats?.placed_students?.toLocaleString(), icon: 'fas fa-briefcase', c1: '#10b981', c2: '#14b8a6' },
        { label: 'Placement Rate', value: stats?.placement_rate + '%', icon: 'fas fa-chart-line', c1: '#f59e0b', c2: '#ef4444' },
        { label: 'Avg Package', value: '₹' + stats?.avg_package?.toFixed(1) + ' LPA', icon: 'fas fa-rupee-sign', c1: '#14b8a6', c2: '#10b981' },
        { label: 'Highest Pkg', value: '₹' + stats?.highest_package?.toFixed(1) + ' LPA', icon: 'fas fa-trophy', c1: '#f59e0b', c2: '#f97316' },
        { label: 'Companies', value: stats?.total_companies, icon: 'fas fa-building', c1: '#8b5cf6', c2: '#6366f1' },
    ];

    // Chart data builders
    const branchColors = (charts.branch || []).map((_, i) => PALETTE[i % PALETTE.length]);

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title"><i className="fas fa-chart-pie" /> Dashboard</h2>
                <p className="section-subtitle">Placement analytics overview</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {STAT_CARDS.map(s => (
                    <div key={s.label} className="stat-card" style={{ '--card-color': s.c1, '--card-color2': s.c2 }}>
                        <div className="stat-icon" style={{ background: `linear-gradient(135deg,${s.c1},${s.c2})` }}>
                            <i className={s.icon} />
                        </div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-title">Placement Overview</div>
                    <div className="chart-canvas-wrap">
                        <Doughnut options={{ ...CHART_DEFAULTS, cutout: '70%' }} data={{
                            labels: ['Placed', 'Not Placed'],
                            datasets: [{
                                data: [charts.overview?.placed, charts.overview?.not_placed],
                                backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(251,113,133,0.6)'],
                                borderColor: ['#10b981', '#fb7185'], borderWidth: 2
                            }]
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Salary Distribution</div>
                    <div className="chart-canvas-wrap">
                        <Bar options={{ ...CHART_DEFAULTS, plugins: { legend: { display: false } } }} data={{
                            labels: charts.salary?.labels || [],
                            datasets: [{
                                label: 'Students', data: charts.salary?.values || [],
                                backgroundColor: 'rgba(99,102,241,0.7)', borderColor: '#6366f1', borderWidth: 1, borderRadius: 6
                            }]
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Branch-wise Placements</div>
                    <div className="chart-canvas-wrap">
                        <Bar options={CHART_DEFAULTS} data={{
                            labels: (charts.branch || []).map(b => b.branch),
                            datasets: [
                                { label: 'Placed', data: (charts.branch || []).map(b => b.placed), backgroundColor: 'rgba(45,212,191,0.7)', borderColor: '#2dd4bf', borderRadius: 4 },
                                { label: 'Not Placed', data: (charts.branch || []).map(b => b.not_placed), backgroundColor: 'rgba(251,113,133,0.5)', borderColor: '#fb7185', borderRadius: 4 },
                            ]
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Top Hiring Companies</div>
                    <div className="chart-canvas-wrap">
                        <Bar options={{ ...CHART_DEFAULTS, indexAxis: 'y', plugins: { legend: { display: false } } }} data={{
                            labels: (charts.companies || []).map(c => c.company),
                            datasets: [{
                                data: (charts.companies || []).map(c => c.hires),
                                backgroundColor: branchColors, borderRadius: 4
                            }]
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">CGPA vs Package</div>
                    <div className="chart-canvas-wrap">
                        <Scatter options={CHART_DEFAULTS} data={{
                            datasets: (() => {
                                const g = {};
                                (charts.cgpa || []).forEach(p => { if (!g[p.branch]) g[p.branch] = []; g[p.branch].push({ x: p.cgpa, y: p.package }); });
                                return Object.entries(g).map(([label, data], i) => ({
                                    label, data, backgroundColor: PALETTE[i % PALETTE.length] + '99', pointRadius: 4
                                }));
                            })()
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Top Skills in Demand</div>
                    <div className="chart-canvas-wrap">
                        <Bar options={{ ...CHART_DEFAULTS, plugins: { legend: { display: false } } }} data={{
                            labels: charts.skills?.labels || [],
                            datasets: [{
                                data: charts.skills?.values || [],
                                backgroundColor: 'rgba(139,92,246,0.7)', borderColor: '#8b5cf6', borderRadius: 4
                            }]
                        }} />
                    </div>
                </div>

                <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                    <div className="chart-title">Monthly Placement Trends</div>
                    <div className="chart-canvas-wrap">
                        <Line options={{
                            ...CHART_DEFAULTS, scales: {
                                ...CHART_DEFAULTS.scales,
                                y1: { position: 'right', grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }, beginAtZero: true }
                            }
                        }} data={{
                            labels: charts.trends?.labels || [],
                            datasets: [
                                { label: 'Placements', data: charts.trends?.placements || [], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.4, fill: true },
                                { label: 'Avg Package (LPA)', data: charts.trends?.avg_packages || [], borderColor: '#14b8a6', tension: 0.4, yAxisID: 'y1' },
                            ]
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Gender Distribution</div>
                    <div className="chart-canvas-wrap">
                        <Doughnut options={{ ...CHART_DEFAULTS, cutout: '65%' }} data={{
                            labels: charts.gender?.labels || [],
                            datasets: [{
                                data: charts.gender?.values || [],
                                backgroundColor: ['rgba(99,102,241,0.8)', 'rgba(251,113,133,0.7)', 'rgba(139,92,246,0.7)'],
                                borderWidth: 2
                            }]
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
