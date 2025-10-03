/**
 * Chart.js - Latency Visualization
 */

class LatencyChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Failed to get 2D context from canvas');
        }
        this.dataRange = 20;
        this.providers = [];
        this.resizeHandler = () => this.resizeCanvas();
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);
    }

    destroy() {
        // Clean up event listener to prevent memory leaks
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) {
            console.warn('Canvas parent element not found');
            return;
        }
        this.canvas.width = container.clientWidth || 800;
        this.canvas.height = 400;
    }

    setProviders(providers) {
        if (!Array.isArray(providers)) {
            console.warn('setProviders expects an array');
            this.providers = [];
            return;
        }
        this.providers = providers;
    }

    setDataRange(range) {
        if (range === 'all') {
            this.dataRange = Infinity;
        } else {
            const parsed = parseInt(range, 10);
            this.dataRange = isNaN(parsed) || parsed <= 0 ? 20 : parsed;
        }
    }

    draw() {
        try {
            if (!this.providers || this.providers.length === 0) {
                this.drawEmptyState();
                return;
            }

            if (!this.ctx || !this.canvas) {
                console.error('Canvas or context not initialized');
                return;
            }

            this.clear();

            // Get max data points across all providers with safety checks
            const maxDataPoints = Math.max(
                ...this.providers
                    .filter(p => p && p.stats && Array.isArray(p.stats.history))
                    .map(p => p.stats.history.length),
                1
            );

            const displayPoints = Math.min(maxDataPoints, this.dataRange);

            if (displayPoints === 0) {
                this.drawEmptyState();
                return;
            }

            // Calculate chart dimensions
            const padding = { top: 40, right: 20, bottom: 60, left: 60 };
            const chartWidth = Math.max(this.canvas.width - padding.left - padding.right, 0);
            const chartHeight = Math.max(this.canvas.height - padding.top - padding.bottom, 0);

            if (chartWidth <= 0 || chartHeight <= 0) {
                console.warn('Invalid chart dimensions');
                return;
            }

            // Find max latency for scaling with safety checks
            let maxLatency = 0;
            this.providers.forEach(provider => {
                if (!provider || !provider.stats || !Array.isArray(provider.stats.history)) return;

                const history = provider.stats.history.slice(-displayPoints);
                history.forEach(point => {
                    if (point && typeof point.latency === 'number' && point.latency > maxLatency) {
                        maxLatency = point.latency;
                    }
                });
            });

            // Round up to nearest 100
            maxLatency = Math.ceil(maxLatency / 100) * 100 || 1000;

            // Draw grid and axes
            this.drawGrid(padding, chartWidth, chartHeight, maxLatency);

            // Draw lines for each provider
            this.providers.forEach(provider => {
                if (provider && provider.stats && Array.isArray(provider.stats.history) && provider.stats.history.length > 0) {
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
        } catch (error) {
            console.error('Error drawing chart:', error);
        }
    }

    clear() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawEmptyState() {
        this.clear();
        if (!this.ctx || !this.canvas) return;

        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'center';
        const centerX = (this.canvas.width || 800) / 2;
        const centerY = (this.canvas.height || 400) / 2;
        this.ctx.fillText(
            'No data yet. Start monitoring to see latency history.',
            centerX,
            centerY
        );
    }

    drawGrid(padding, width, height, maxLatency) {
        const ctx = this.ctx;
        if (!ctx) return;

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
        if (!ctx || !provider || !provider.stats || !provider.stats.history) return;

        const history = provider.stats.history.slice(-displayPoints);
        if (history.length === 0) return;

        ctx.strokeStyle = provider.color;
        ctx.fillStyle = provider.color;
        ctx.lineWidth = 2;

        // Draw line
        ctx.beginPath();
        const divisor = Math.max(displayPoints - 1, 1);
        history.forEach((point, index) => {
            if (!point || typeof point.latency !== 'number') return;

            const x = padding.left + (width / divisor) * index;
            const latencyRatio = maxLatency > 0 ? (point.latency / maxLatency) : 0;
            const y = padding.top + height - latencyRatio * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw points
        history.forEach((point, index) => {
            if (!point || typeof point.latency !== 'number') return;

            const x = padding.left + (width / divisor) * index;
            const latencyRatio = maxLatency > 0 ? (point.latency / maxLatency) : 0;
            const y = padding.top + height - latencyRatio * height;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawLegend(padding) {
        const ctx = this.ctx;
        if (!ctx || !this.providers) return;

        const legendX = padding.left;
        const legendY = 10;
        const itemWidth = 120;

        this.providers.forEach((provider, index) => {
            if (!provider) return;

            const x = legendX + (index * itemWidth);

            // Color box
            ctx.fillStyle = provider.color || '#000000';
            ctx.fillRect(x, legendY, 20, 15);

            // Provider name
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(provider.name || 'Unknown', x + 25, legendY + 12);
        });
    }
}

// Export for use in app.js
window.LatencyChart = LatencyChart;
