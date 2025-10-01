/**
 * App.js - Main Application Logic
 */

class App {
    constructor() {
        this.monitor = new LatencyMonitor();
        this.chart = new LatencyChart('latencyChart');
        this.lastUpdateTime = null;

        this.initializeElements();
        this.attachEventListeners();
        this.monitor.setUpdateCallback((event, provider) => this.handleMonitorUpdate(event, provider));
        this.updateDisplay();
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
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startMonitoring());
        this.stopBtn.addEventListener('click', () => this.stopMonitoring());
        this.clearBtn.addEventListener('click', () => this.clearData());

        // Chart range buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const range = e.target.getAttribute('data-range');
                this.chart.setDataRange(range);
                this.updateChart();
            });
        });
    }

    startMonitoring() {
        const interval = this.testInterval.value;
        const mode = this.testMode.value;

        this.monitor.start(interval, mode);

        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.testMode.disabled = true;
        this.testInterval.disabled = true;

        this.statusText.textContent = `Monitoring (${mode} mode, ${interval === 'manual' ? 'manual' : interval/1000 + 's interval'})`;
        this.statusText.classList.add('monitoring');
    }

    stopMonitoring() {
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
        const stats = this.monitor.getStats();

        // Update header stats
        this.totalTests.textContent = this.monitor.totalTests;

        const avgLatency = this.monitor.getAverageLatency();
        this.avgLatency.textContent = avgLatency !== null ? avgLatency : '--';

        const fastest = this.monitor.getFastestProvider();
        this.fastestProvider.textContent = fastest ? fastest.name : '--';

        // Update last update time
        if (this.lastUpdateTime) {
            this.lastUpdate.textContent = `Last update: ${this.lastUpdateTime.toLocaleTimeString()}`;
        }

        // Update providers grid
        this.updateProvidersGrid(stats);

        // Update statistics table
        this.updateStatsTable(stats);

        // Update chart with provider data
        this.chart.setProviders(this.monitor.providers);
    }

    updateProvidersGrid(stats) {
        this.providersGrid.innerHTML = '';

        stats.forEach(provider => {
            const card = this.createProviderCard(provider);
            this.providersGrid.appendChild(card);
        });
    }

    createProviderCard(provider) {
        const card = document.createElement('div');
        card.className = 'provider-card';

        // Add status class
        if (provider.status === 'testing') {
            card.classList.add('testing');
        } else if (provider.status === 'online') {
            card.classList.add('success');
        } else if (provider.status === 'offline') {
            card.classList.add('error');
        }

        // Header
        const header = document.createElement('div');
        header.className = 'provider-header';

        const name = document.createElement('div');
        name.className = 'provider-name';
        name.textContent = provider.name;
        name.style.color = provider.color;

        const statusIndicator = document.createElement('div');
        statusIndicator.className = `provider-status ${provider.status}`;

        header.appendChild(name);
        header.appendChild(statusIndicator);

        // Latency display
        const latencyDisplay = document.createElement('div');
        latencyDisplay.className = 'latency-display';

        const latencyValue = document.createElement('div');
        latencyValue.className = 'latency-value';
        latencyValue.textContent = provider.stats.current !== null ? provider.stats.current : '--';

        const latencyLabel = document.createElement('div');
        latencyLabel.className = 'latency-label';
        latencyLabel.textContent = 'Current Latency (ms)';

        latencyDisplay.appendChild(latencyValue);
        latencyDisplay.appendChild(latencyLabel);

        // Stats grid
        const statsGrid = document.createElement('div');
        statsGrid.className = 'provider-stats';

        const statItems = [
            { label: 'Average', value: provider.stats.avg ? provider.stats.avg + 'ms' : '--' },
            { label: 'Min', value: provider.stats.min !== Infinity ? provider.stats.min + 'ms' : '--' },
            { label: 'Max', value: provider.stats.max > 0 ? provider.stats.max + 'ms' : '--' },
            { label: 'Success', value: provider.stats.successes },
            { label: 'Failed', value: provider.stats.failures },
            { label: 'Total', value: provider.stats.count }
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
        this.statsTableBody.innerHTML = '';

        stats.forEach(provider => {
            const row = document.createElement('tr');

            // Provider name
            const nameCell = document.createElement('td');
            nameCell.style.color = provider.color;
            nameCell.style.fontWeight = '600';
            nameCell.textContent = provider.name;

            // Current latency
            const currentCell = document.createElement('td');
            if (provider.stats.current !== null) {
                currentCell.textContent = provider.stats.current + 'ms';
                currentCell.appendChild(this.createLatencyBadge(provider.stats.current));
            } else {
                currentCell.textContent = '--';
            }

            // Average latency
            const avgCell = document.createElement('td');
            avgCell.textContent = provider.stats.avg > 0 ? provider.stats.avg + 'ms' : '--';

            // Min latency
            const minCell = document.createElement('td');
            minCell.textContent = provider.stats.min !== Infinity ? provider.stats.min + 'ms' : '--';

            // Max latency
            const maxCell = document.createElement('td');
            maxCell.textContent = provider.stats.max > 0 ? provider.stats.max + 'ms' : '--';

            // Success rate
            const successRateCell = document.createElement('td');
            if (provider.stats.count > 0) {
                const rate = ((provider.stats.successes / provider.stats.count) * 100).toFixed(1);
                successRateCell.textContent = rate + '%';
                successRateCell.appendChild(this.createSuccessRateBadge(parseFloat(rate)));
            } else {
                successRateCell.textContent = '--';
            }

            // Total tests
            const testsCell = document.createElement('td');
            testsCell.textContent = provider.stats.count;

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
        this.chart.draw();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
