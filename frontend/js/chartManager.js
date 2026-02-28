/**
 * ChartManager — Consistent Chart.js dark-theme configuration
 */
class ChartManager {
    constructor() {
        this.charts = {};
        this.colors = {
            indigo: { bg: 'rgba(129, 140, 248, 0.7)', border: '#818cf8', light: 'rgba(129, 140, 248, 0.15)' },
            teal: { bg: 'rgba(45, 212, 191, 0.7)', border: '#2dd4bf', light: 'rgba(45, 212, 191, 0.15)' },
            purple: { bg: 'rgba(167, 139, 250, 0.7)', border: '#a78bfa', light: 'rgba(167, 139, 250, 0.15)' },
            amber: { bg: 'rgba(251, 191, 36, 0.7)', border: '#fbbf24', light: 'rgba(251, 191, 36, 0.15)' },
            rose: { bg: 'rgba(251, 113, 133, 0.7)', border: '#fb7185', light: 'rgba(251, 113, 133, 0.15)' },
            cyan: { bg: 'rgba(34, 211, 238, 0.7)', border: '#22d3ee', light: 'rgba(34, 211, 238, 0.15)' },
            emerald: { bg: 'rgba(52, 211, 153, 0.7)', border: '#34d399', light: 'rgba(52, 211, 153, 0.15)' },
            orange: { bg: 'rgba(251, 146, 60, 0.7)', border: '#fb923c', light: 'rgba(251, 146, 60, 0.15)' },
        };
        this.palette = Object.values(this.colors);
        this.setDefaults();
    }

    setDefaults() {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.pointStyle = 'rectRounded';
        Chart.defaults.plugins.legend.labels.padding = 16;
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
        Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
        Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
        Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.cornerRadius = 10;
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.displayColors = true;
        Chart.defaults.plugins.tooltip.boxPadding = 4;
    }

    destroy(id) {
        if (this.charts[id]) {
            this.charts[id].destroy();
            delete this.charts[id];
        }
    }

    getColors(count) {
        const bgs = [], borders = [];
        for (let i = 0; i < count; i++) {
            const c = this.palette[i % this.palette.length];
            bgs.push(c.bg);
            borders.push(c.border);
        }
        return { bgs, borders };
    }

    createDoughnut(canvasId, labels, data, options = {}) {
        this.destroy(canvasId);
        const { bgs, borders } = this.getColors(labels.length);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: bgs,
                    borderColor: borders,
                    borderWidth: 2,
                    hoverBorderWidth: 3,
                    hoverOffset: 8,
                    spacing: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 20, font: { size: 12 } }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                ...options
            }
        });
        return this.charts[canvasId];
    }

    createBar(canvasId, labels, datasets, options = {}) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const styledDatasets = datasets.map((ds, i) => ({
            ...ds,
            backgroundColor: ds.backgroundColor || this.palette[i % this.palette.length].bg,
            borderColor: ds.borderColor || this.palette[i % this.palette.length].border,
            borderWidth: ds.borderWidth || 2,
            borderRadius: ds.borderRadius ?? 6,
            borderSkipped: false,
        }));

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: styledDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: datasets.length > 1, position: 'top' }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        beginAtZero: true,
                        ticks: { font: { size: 11 } }
                    }
                },
                animation: { duration: 1000, easing: 'easeOutQuart' },
                ...options
            }
        });
        return this.charts[canvasId];
    }

    createHorizontalBar(canvasId, labels, data, options = {}) {
        this.destroy(canvasId);
        const { bgs, borders } = this.getColors(labels.length);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: bgs,
                    borderColor: borders,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        beginAtZero: true,
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                },
                animation: { duration: 1200, easing: 'easeOutQuart' },
                ...options
            }
        });
        return this.charts[canvasId];
    }

    createLine(canvasId, labels, datasets, options = {}) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const styledDatasets = datasets.map((ds, i) => {
            const color = this.palette[i % this.palette.length];
            return {
                ...ds,
                borderColor: ds.borderColor || color.border,
                backgroundColor: ds.backgroundColor || color.light,
                borderWidth: ds.borderWidth || 3,
                pointBackgroundColor: ds.pointBackgroundColor || color.border,
                pointBorderColor: '#0a0e1a',
                pointBorderWidth: 2,
                pointRadius: ds.pointRadius ?? 5,
                pointHoverRadius: ds.pointHoverRadius ?? 8,
                tension: ds.tension ?? 0.4,
                fill: ds.fill ?? true,
            };
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: styledDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        beginAtZero: true,
                        ticks: { font: { size: 11 } }
                    }
                },
                animation: { duration: 1500, easing: 'easeOutQuart' },
                ...options
            }
        });
        return this.charts[canvasId];
    }

    createScatter(canvasId, datasets, options = {}) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const styledDatasets = datasets.map((ds, i) => {
            const color = this.palette[i % this.palette.length];
            return {
                ...ds,
                backgroundColor: ds.backgroundColor || color.bg,
                borderColor: ds.borderColor || color.border,
                borderWidth: 2,
                pointRadius: ds.pointRadius ?? 5,
                pointHoverRadius: ds.pointHoverRadius ?? 8,
            };
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: styledDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        title: { display: true, text: 'CGPA', color: '#94a3b8' },
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        title: { display: true, text: 'Package (LPA)', color: '#94a3b8' },
                        beginAtZero: true,
                        ticks: { font: { size: 11 } }
                    }
                },
                animation: { duration: 1200 },
                ...options
            }
        });
        return this.charts[canvasId];
    }
}

const chartManager = new ChartManager();
