/**
 * App.js - Main Application Logic
 */

class App {
    constructor() {
        try {
            this.monitor = new LatencyMonitor();
            this.chart = new LatencyChart('latencyChart');
            this.lastUpdateTime = null;
            this.eventListeners = [];

            this.initializeElements();
            this.attachEventListeners();
            this.monitor.setUpdateCallback((event, provider) => this.handleMonitorUpdate(event, provider));
            this.updateDisplay();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    destroy() {
        // Clean up event listeners to prevent memory leaks
        this.eventListeners.forEach(({ element, event, handler }) => {
            if (element && handler) {
                element.removeEventListener(event, handler);
            }
        });
        this.eventListeners = [];

        // Clean up chart
        if (this.chart && this.chart.destroy) {
            this.chart.destroy();
        }

        // Stop monitoring
        if (this.monitor && this.monitor.stop) {
            this.monitor.stop();
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px; z-index: 1000; font-family: sans-serif;';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    initializeElements() {
        // Control elements
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.testMode = document.getElementById('testMode');
        this.testInterval = document.getElementById('testInterval');
        this.statusText = document.getElementById('statusText');
        this.lastUpdate = document.getElementById('lastUpdate');

        // Stats elements
        this.totalTests = document.getElementById('totalTests');
        this.avgLatency = document.getElementById('avgLatency');
        this.fastestProvider = document.getElementById('fastestProvider');

        // Container elements
        this.providersGrid = document.getElementById('providersGrid');
        this.statsTableBody = document.getElementById('statsTableBody');

        // Validate critical elements
        const requiredElements = {
            startBtn: this.startBtn,
            stopBtn: this.stopBtn,
            clearBtn: this.clearBtn,
            testMode: this.testMode,
            testInterval: this.testInterval,
            statusText: this.statusText,
            providersGrid: this.providersGrid,
            statsTableBody: this.statsTableBody
        };

        const missing = Object.entries(requiredElements)
            .filter(([name, element]) => !element)
            .map(([name]) => name);

        if (missing.length > 0) {
            throw new Error(`Missing required DOM elements: ${missing.join(', ')}`);
        }
    }

    attachEventListeners() {
        const startHandler = () => this.startMonitoring();
        const stopHandler = () => this.stopMonitoring();
        const clearHandler = () => this.clearData();

        this.startBtn.addEventListener('click', startHandler);
        this.stopBtn.addEventListener('click', stopHandler);
        this.clearBtn.addEventListener('click', clearHandler);

        // Track event listeners for cleanup
        this.eventListeners.push(
            { element: this.startBtn, event: 'click', handler: startHandler },
            { element: this.stopBtn, event: 'click', handler: stopHandler },
            { element: this.clearBtn, event: 'click', handler: clearHandler }
        );

        // Chart range buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            const handler = (e) => {
                if (!e.target) return;
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const range = e.target.getAttribute('data-range');
                if (range && this.chart) {
                    this.chart.setDataRange(range);
                    this.updateChart();
                }
            };
            btn.addEventListener('click', handler);
            this.eventListeners.push({ element: btn, event: 'click', handler });
        });
    }

    startMonitoring() {
        if (!this.testInterval || !this.testMode || !this.monitor) {
            console.error('Cannot start monitoring: missing required elements');
            return;
        }

        const interval = this.testInterval.value;
        const mode = this.testMode.value;

        if (!interval || !mode) {
            console.error('Invalid interval or mode');
            return;
        }

        this.monitor.start(interval, mode);

        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.testMode.disabled = true;
        this.testInterval.disabled = true;

        const intervalText = interval === 'manual' ? 'manual' : `${parseInt(interval, 10) / 1000}s interval`;
        this.statusText.textContent = `Monitoring (${mode} mode, ${intervalText})`;
        this.statusText.classList.add('monitoring');
    }

    stopMonitoring() {
        if (!this.monitor) {
            console.error('Monitor not initialized');
            return;
        }

        this.monitor.stop();

        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.testMode.disabled = false;
        this.testInterval.disabled = false;

        this.statusText.textContent = 'Monitoring stopped';
        this.statusText.classList.remove('monitoring');
    }

    clearData() {
        if (confirm('Clear all statistics? This cannot be undone.')) {
            this.monitor.clearStats();
            this.updateDisplay();
            this.updateChart();
            this.statusText.textContent = 'Data cleared - ready to start monitoring';
        }
    }

    handleMonitorUpdate(event, provider) {
        if (event === 'complete') {
            this.lastUpdateTime = new Date();
            this.updateDisplay();
            this.updateChart();
        }
    }

    updateDisplay() {
        if (!this.monitor) {
            console.error('Monitor not initialized');
            return;
        }

        const stats = this.monitor.getStats();
        if (!stats) {
            console.warn('No stats available');
            return;
        }

        // Update header stats
        if (this.totalTests) {
            this.totalTests.textContent = this.monitor.totalTests || 0;
        }

        if (this.avgLatency) {
            const avgLatency = this.monitor.getAverageLatency();
            this.avgLatency.textContent = avgLatency !== null ? avgLatency : '--';
        }

        if (this.fastestProvider) {
            const fastest = this.monitor.getFastestProvider();
            this.fastestProvider.textContent = fastest && fastest.name ? fastest.name : '--';
        }

        // Update last update time
        if (this.lastUpdate && this.lastUpdateTime) {
            this.lastUpdate.textContent = `Last update: ${this.lastUpdateTime.toLocaleTimeString()}`;
        }

        // Update providers grid
        if (this.providersGrid) {
            this.updateProvidersGrid(stats);
        }

        // Update statistics table
        if (this.statsTableBody) {
            this.updateStatsTable(stats);
        }

        // Update chart with provider data
        if (this.chart && this.monitor.providers) {
            this.chart.setProviders(this.monitor.providers);
        }
    }

    updateProvidersGrid(stats) {
        if (!this.providersGrid) return;

        this.providersGrid.innerHTML = '';

        if (!Array.isArray(stats)) {
            console.warn('updateProvidersGrid: stats is not an array');
            return;
        }

        stats.forEach(provider => {
            if (provider) {
                const card = this.createProviderCard(provider);
                if (card) {
                    this.providersGrid.appendChild(card);
                }
            }
        });
    }

    createProviderCard(provider) {
        if (!provider) return null;

        const card = document.createElement('div');
        card.className = 'provider-card';

        // Add status class
        const status = provider.status || 'idle';
        if (status === 'testing') {
            card.classList.add('testing');
        } else if (status === 'online') {
            card.classList.add('success');
        } else if (status === 'offline') {
            card.classList.add('error');
        }

        // Header
        const header = document.createElement('div');
        header.className = 'provider-header';

        const name = document.createElement('div');
        name.className = 'provider-name';
        name.textContent = provider.name || 'Unknown';
        name.style.color = provider.color || '#000000';

        const statusIndicator = document.createElement('div');
        statusIndicator.className = `provider-status ${status}`;

        header.appendChild(name);
        header.appendChild(statusIndicator);

        // Latency display
        const latencyDisplay = document.createElement('div');
        latencyDisplay.className = 'latency-display';

        const latencyValue = document.createElement('div');
        latencyValue.className = 'latency-value';
        const currentLatency = provider.stats && provider.stats.current !== null ? provider.stats.current : '--';
        latencyValue.textContent = currentLatency;

        const latencyLabel = document.createElement('div');
        latencyLabel.className = 'latency-label';
        latencyLabel.textContent = 'Current Latency (ms)';

        latencyDisplay.appendChild(latencyValue);
        latencyDisplay.appendChild(latencyLabel);

        // Stats grid
        const statsGrid = document.createElement('div');
        statsGrid.className = 'provider-stats';

        const stats = provider.stats || {};
        const statItems = [
            { label: 'Average', value: stats.avg ? stats.avg + 'ms' : '--' },
            { label: 'Min', value: stats.min !== Infinity && stats.min !== undefined ? stats.min + 'ms' : '--' },
            { label: 'Max', value: stats.max > 0 ? stats.max + 'ms' : '--' },
            { label: 'Success', value: stats.successes || 0 },
            { label: 'Failed', value: stats.failures || 0 },
            { label: 'Total', value: stats.count || 0 }
        ];

        statItems.forEach(item => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';

            const label = document.createElement('span');
            label.className = 'stat-label';
            label.textContent = item.label;

            const value = document.createElement('span');
            value.className = 'stat-value';
            value.textContent = item.value;

            statItem.appendChild(label);
            statItem.appendChild(value);
            statsGrid.appendChild(statItem);
        });

        card.appendChild(header);
        card.appendChild(latencyDisplay);
        card.appendChild(statsGrid);

        return card;
    }

    updateStatsTable(stats) {
        if (!this.statsTableBody) return;

        this.statsTableBody.innerHTML = '';

        if (!Array.isArray(stats)) {
            console.warn('updateStatsTable: stats is not an array');
            return;
        }

        stats.forEach(provider => {
            if (!provider) return;
            const row = document.createElement('tr');

            // Provider name
            const nameCell = document.createElement('td');
            nameCell.style.color = provider.color || '#000000';
            nameCell.style.fontWeight = '600';
            nameCell.textContent = provider.name || 'Unknown';

            // Current latency
            const currentCell = document.createElement('td');
            const stats = provider.stats || {};
            if (stats.current !== null && stats.current !== undefined) {
                currentCell.textContent = stats.current + 'ms';
                const badge = this.createLatencyBadge(stats.current);
                if (badge) currentCell.appendChild(badge);
            } else {
                currentCell.textContent = '--';
            }

            // Average latency
            const avgCell = document.createElement('td');
            avgCell.textContent = stats.avg > 0 ? stats.avg + 'ms' : '--';

            // Min latency
            const minCell = document.createElement('td');
            minCell.textContent = stats.min !== Infinity && stats.min !== undefined ? stats.min + 'ms' : '--';

            // Max latency
            const maxCell = document.createElement('td');
            maxCell.textContent = stats.max > 0 ? stats.max + 'ms' : '--';

            // Success rate
            const successRateCell = document.createElement('td');
            if (stats.count > 0) {
                const rate = ((stats.successes / stats.count) * 100).toFixed(1);
                successRateCell.textContent = rate + '%';
                const badge = this.createSuccessRateBadge(parseFloat(rate));
                if (badge) successRateCell.appendChild(badge);
            } else {
                successRateCell.textContent = '--';
            }

            // Total tests
            const testsCell = document.createElement('td');
            testsCell.textContent = stats.count || 0;

            row.appendChild(nameCell);
            row.appendChild(currentCell);
            row.appendChild(avgCell);
            row.appendChild(minCell);
            row.appendChild(maxCell);
            row.appendChild(successRateCell);
            row.appendChild(testsCell);

            this.statsTableBody.appendChild(row);
        });
    }

    createLatencyBadge(latency) {
        if (typeof latency !== 'number' || isNaN(latency)) {
            return null;
        }

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.style.marginLeft = '8px';

        if (latency < 200) {
            badge.classList.add('fast');
            badge.textContent = 'Fast';
        } else if (latency < 500) {
            badge.classList.add('normal');
            badge.textContent = 'Normal';
        } else {
            badge.classList.add('slow');
            badge.textContent = 'Slow';
        }

        return badge;
    }

    createSuccessRateBadge(rate) {
        if (typeof rate !== 'number' || isNaN(rate)) {
            return null;
        }

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.style.marginLeft = '8px';

        if (rate >= 95) {
            badge.classList.add('excellent');
            badge.textContent = 'Excellent';
        } else if (rate >= 80) {
            badge.classList.add('good');
            badge.textContent = 'Good';
        } else {
            badge.classList.add('poor');
            badge.textContent = 'Poor';
        }

        return badge;
    }

    updateChart() {
        if (!this.chart) {
            console.warn('Chart not initialized');
            return;
        }
        try {
            this.chart.draw();
        } catch (error) {
            console.error('Error drawing chart:', error);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Clean up resources when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.destroy) {
        window.app.destroy();
    }
});
