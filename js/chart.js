/**
 * Chart.js - Latency Visualization
 */

class LatencyChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.dataRange = 20;
        this.providers = [];
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 400;
    }

    setProviders(providers) {
        this.providers = providers;
    }

    setDataRange(range) {
        this.dataRange = range === 'all' ? Infinity : parseInt(range);
    }

    draw() {
        if (!this.providers || this.providers.length === 0) {
            this.drawEmptyState();
            return;
        }

        this.clear();

        // Get max data points across all providers
        const maxDataPoints = Math.max(
            ...this.providers.map(p => p.stats.history.length),
            1
        );

        const displayPoints = Math.min(maxDataPoints, this.dataRange);

        if (displayPoints === 0) {
            this.drawEmptyState();
            return;
        }

        // Calculate chart dimensions
        const padding = { top: 40, right: 20, bottom: 60, left: 60 };
        const chartWidth = this.canvas.width - padding.left - padding.right;
        const chartHeight = this.canvas.height - padding.top - padding.bottom;

        // Find max latency for scaling
        let maxLatency = 0;
        this.providers.forEach(provider => {
            const history = provider.stats.history.slice(-displayPoints);
            history.forEach(point => {
                if (point.latency > maxLatency) maxLatency = point.latency;
            });
        });

        // Round up to nearest 100
        maxLatency = Math.ceil(maxLatency / 100) * 100 || 1000;

        // Draw grid and axes
        this.drawGrid(padding, chartWidth, chartHeight, maxLatency);

        // Draw lines for each provider
        this.providers.forEach(provider => {
            if (provider.stats.history.length > 0) {
                this.drawProviderLine(
                    provider,
                    padding,
                    chartWidth,
                    chartHeight,
                    maxLatency,
                    displayPoints
                );
            }
        });

        // Draw legend
        this.drawLegend(padding);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawEmptyState() {
        this.clear();
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'No data yet. Start monitoring to see latency history.',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }

    drawGrid(padding, width, height, maxLatency) {
        const ctx = this.ctx;

        // Grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;

        // Horizontal grid lines (latency)
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = padding.top + (height / ySteps) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + width, y);
            ctx.stroke();

            // Y-axis labels
            const latency = Math.round(maxLatency * (1 - i / ySteps));
            ctx.fillStyle = '#64748b';
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(latency + 'ms', padding.left - 10, y + 4);
        }

        // Axes
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + height);
        ctx.stroke();

        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + height);
        ctx.lineTo(padding.left + width, padding.top + height);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Latency (ms)', padding.left / 2, this.canvas.height / 2);
        ctx.fillText('Test Number', padding.left + width / 2, this.canvas.height - 20);
    }

    drawProviderLine(provider, padding, width, height, maxLatency, displayPoints) {
        const ctx = this.ctx;
        const history = provider.stats.history.slice(-displayPoints);

        if (history.length === 0) return;

        ctx.strokeStyle = provider.color;
        ctx.fillStyle = provider.color;
        ctx.lineWidth = 2;

        // Draw line
        ctx.beginPath();
        history.forEach((point, index) => {
            const x = padding.left + (width / (displayPoints - 1 || 1)) * index;
            const y = padding.top + height - (point.latency / maxLatency) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw points
        history.forEach((point, index) => {
            const x = padding.left + (width / (displayPoints - 1 || 1)) * index;
            const y = padding.top + height - (point.latency / maxLatency) * height;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawLegend(padding) {
        const ctx = this.ctx;
        const legendX = padding.left;
        const legendY = 10;
        const itemWidth = 120;

        this.providers.forEach((provider, index) => {
            const x = legendX + (index * itemWidth);

            // Color box
            ctx.fillStyle = provider.color;
            ctx.fillRect(x, legendY, 20, 15);

            // Provider name
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(provider.name, x + 25, legendY + 12);
        });
    }
}

// Export for use in app.js
window.LatencyChart = LatencyChart;
