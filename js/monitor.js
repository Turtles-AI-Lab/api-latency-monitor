/**
 * API Latency Monitor - Core Monitoring Logic
 */

class LatencyMonitor {
    constructor() {
        this.providers = API_PROVIDERS.map(provider => ({
            ...provider,
            stats: {
                current: null,
                min: Infinity,
                max: 0,
                avg: 0,
                total: 0,
                count: 0,
                successes: 0,
                failures: 0,
                history: []
            },
            status: 'idle' // idle, testing, online, offline
        }));

        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.testMode = 'ping';
        this.totalTests = 0;
    }

    /**
     * Start monitoring
     */
    start(intervalMs, testMode = 'ping') {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.testMode = testMode;

        // Run immediate test
        this.runTests();

        // Set up interval if not manual
        if (intervalMs !== 'manual') {
            this.monitoringInterval = setInterval(() => {
                this.runTests();
            }, parseInt(intervalMs));
        }
    }

    /**
     * Stop monitoring
     */
    stop() {
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    /**
     * Run tests on all providers
     */
    async runTests() {
        const promises = this.providers.map(provider =>
            this.testProvider(provider)
        );
        await Promise.allSettled(promises);
        this.totalTests++;
    }

    /**
     * Test a single provider
     */
    async testProvider(provider) {
        provider.status = 'testing';
        this.notifyUpdate('testing', provider);

        try {
            const startTime = performance.now();

            // Use appropriate test method
            let success = false;
            if (this.testMode === 'ping') {
                success = await this.pingTest(provider);
            } else if (this.testMode === 'simple') {
                success = await this.simpleRequest(provider);
            } else {
                success = await this.fullRequest(provider);
            }

            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);

            if (success) {
                this.updateStats(provider, latency, true);
                provider.status = 'online';
            } else {
                this.updateStats(provider, null, false);
                provider.status = 'offline';
            }

        } catch (error) {
            this.updateStats(provider, null, false);
            provider.status = 'offline';
        }

        this.notifyUpdate('complete', provider);
    }

    /**
     * Ping test - just check if endpoint is reachable
     */
    async pingTest(provider) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(provider.endpoint + provider.pingPath, {
                method: 'GET',
                mode: 'no-cors', // Allow cross-origin requests
                signal: controller.signal
            });

            clearTimeout(timeout);
            return true; // If we get here, endpoint is reachable
        } catch (error) {
            if (error.name === 'AbortError') {
                return false; // Timeout
            }
            // For no-cors mode, even errors mean the endpoint exists
            return true;
        }
    }

    /**
     * Simple request test
     */
    async simpleRequest(provider) {
        // Simplified - in real implementation, would make actual API calls
        // For demo, simulate with ping
        return await this.pingTest(provider);
    }

    /**
     * Full request test with authentication
     */
    async fullRequest(provider) {
        // Would require API keys - for demo, fallback to ping
        return await this.pingTest(provider);
    }

    /**
     * Update provider statistics
     */
    updateStats(provider, latency, success) {
        const stats = provider.stats;

        stats.count++;
        if (success) {
            stats.successes++;
            stats.current = latency;
            stats.total += latency;
            stats.avg = Math.round(stats.total / stats.successes);
            stats.min = Math.min(stats.min, latency);
            stats.max = Math.max(stats.max, latency);

            // Add to history (keep last 100)
            stats.history.push({
                timestamp: Date.now(),
                latency: latency
            });
            if (stats.history.length > 100) {
                stats.history.shift();
            }
        } else {
            stats.failures++;
            stats.current = null;
        }
    }

    /**
     * Get all provider statistics
     */
    getStats() {
        return this.providers.map(provider => ({
            id: provider.id,
            name: provider.name,
            color: provider.color,
            status: provider.status,
            stats: { ...provider.stats }
        }));
    }

    /**
     * Get fastest provider
     */
    getFastestProvider() {
        const online = this.providers.filter(p => p.stats.current !== null);
        if (online.length === 0) return null;

        return online.reduce((fastest, current) => {
            return current.stats.current < fastest.stats.current ? current : fastest;
        });
    }

    /**
     * Get average latency across all providers
     */
    getAverageLatency() {
        const online = this.providers.filter(p => p.stats.current !== null);
        if (online.length === 0) return null;

        const total = online.reduce((sum, p) => sum + p.stats.current, 0);
        return Math.round(total / online.length);
    }

    /**
     * Clear all statistics
     */
    clearStats() {
        this.providers.forEach(provider => {
            provider.stats = {
                current: null,
                min: Infinity,
                max: 0,
                avg: 0,
                total: 0,
                count: 0,
                successes: 0,
                failures: 0,
                history: []
            };
            provider.status = 'idle';
        });
        this.totalTests = 0;
    }

    /**
     * Notify update callback
     */
    notifyUpdate(event, provider) {
        if (this.onUpdate) {
            this.onUpdate(event, provider);
        }
    }

    /**
     * Set update callback
     */
    setUpdateCallback(callback) {
        this.onUpdate = callback;
    }
}

// Export for use in app.js
window.LatencyMonitor = LatencyMonitor;
