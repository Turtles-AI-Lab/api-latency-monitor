/**
 * API Latency Monitor - Core Monitoring Logic
 */

class LatencyMonitor {
    constructor() {
        if (typeof API_PROVIDERS === 'undefined' || !Array.isArray(API_PROVIDERS)) {
            console.error('API_PROVIDERS not found or invalid');
            this.providers = [];
        } else {
            this.providers = API_PROVIDERS.map(provider => {
                if (!provider) {
                    console.warn('Skipping null/undefined provider');
                    return null;
                }

                return {
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
                };
            }).filter(Boolean);
        }

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
        this.runTests().catch(error => {
            console.error('Error running initial tests:', error);
        });

        // Set up interval if not manual
        if (intervalMs !== 'manual') {
            const interval = parseInt(intervalMs, 10);
            if (isNaN(interval) || interval <= 0) {
                console.error('Invalid interval value:', intervalMs);
                return;
            }
            this.monitoringInterval = setInterval(() => {
                this.runTests().catch(error => {
                    console.error('Error running tests:', error);
                });
            }, interval);
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
        if (!this.providers || !Array.isArray(this.providers)) {
            console.error('Providers not initialized');
            return;
        }

        const promises = this.providers.map(provider =>
            this.testProvider(provider).catch(error => {
                console.error(`Error testing provider ${provider?.name || 'unknown'}:`, error);
                return { status: 'rejected', reason: error };
            })
        );

        try {
            await Promise.allSettled(promises);
            this.totalTests++;
        } catch (error) {
            console.error('Error in runTests:', error);
        }
    }

    /**
     * Test a single provider
     */
    async testProvider(provider) {
        if (!provider) {
            console.error('testProvider: provider is null or undefined');
            return;
        }

        provider.status = 'testing';
        this.notifyUpdate('testing', provider);

        try {
            if (typeof performance === 'undefined' || !performance.now) {
                throw new Error('Performance API not available');
            }

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

            if (typeof latency !== 'number' || isNaN(latency) || latency < 0) {
                throw new Error('Invalid latency measurement');
            }

            if (success) {
                this.updateStats(provider, latency, true);
                provider.status = 'online';
            } else {
                this.updateStats(provider, null, false);
                provider.status = 'offline';
            }

        } catch (error) {
            console.error(`Error testing provider ${provider.name || 'unknown'}:`, error);
            this.updateStats(provider, null, false);
            provider.status = 'offline';
        }

        this.notifyUpdate('complete', provider);
    }

    /**
     * Ping test - just check if endpoint is reachable
     */
    async pingTest(provider) {
        if (!provider || !provider.endpoint || !provider.pingPath) {
            console.error('Invalid provider configuration');
            return false;
        }

        try {
            if (typeof AbortController === 'undefined') {
                console.warn('AbortController not supported');
                // Fallback without timeout
                await fetch(provider.endpoint + provider.pingPath, {
                    method: 'GET',
                    mode: 'no-cors'
                });
                return true;
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(provider.endpoint + provider.pingPath, {
                    method: 'GET',
                    mode: 'no-cors', // Allow cross-origin requests
                    signal: controller.signal
                });

                clearTimeout(timeout);
                return true; // If we get here, endpoint is reachable
            } catch (error) {
                clearTimeout(timeout);
                if (error.name === 'AbortError') {
                    return false; // Timeout
                }
                // For no-cors mode, even errors mean the endpoint exists
                return true;
            }
        } catch (error) {
            console.error(`Ping test error for ${provider.name}:`, error);
            return false;
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
        if (!provider || !provider.stats) {
            console.error('Invalid provider or stats object');
            return;
        }

        const stats = provider.stats;

        stats.count = (stats.count || 0) + 1;

        if (success && typeof latency === 'number' && !isNaN(latency)) {
            stats.successes = (stats.successes || 0) + 1;
            stats.current = latency;
            stats.total = (stats.total || 0) + latency;

            if (stats.successes > 0) {
                stats.avg = Math.round(stats.total / stats.successes);
            }

            stats.min = Math.min(stats.min || Infinity, latency);
            stats.max = Math.max(stats.max || 0, latency);

            // Add to history (keep last 100)
            if (!Array.isArray(stats.history)) {
                stats.history = [];
            }

            stats.history.push({
                timestamp: Date.now(),
                latency: latency
            });

            if (stats.history.length > 100) {
                stats.history.shift();
            }
        } else {
            stats.failures = (stats.failures || 0) + 1;
            stats.current = null;
        }
    }

    /**
     * Get all provider statistics
     */
    getStats() {
        if (!Array.isArray(this.providers)) {
            console.error('Providers not initialized');
            return [];
        }

        return this.providers.map(provider => {
            if (!provider) return null;

            return {
                id: provider.id || 'unknown',
                name: provider.name || 'Unknown',
                color: provider.color || '#000000',
                status: provider.status || 'idle',
                stats: provider.stats ? { ...provider.stats } : {}
            };
        }).filter(Boolean);
    }

    /**
     * Get fastest provider
     */
    getFastestProvider() {
        if (!Array.isArray(this.providers)) return null;

        const online = this.providers.filter(p =>
            p && p.stats && typeof p.stats.current === 'number' && p.stats.current !== null
        );

        if (online.length === 0) return null;

        return online.reduce((fastest, current) => {
            if (!fastest || !fastest.stats || !current || !current.stats) return fastest;
            return current.stats.current < fastest.stats.current ? current : fastest;
        });
    }

    /**
     * Get average latency across all providers
     */
    getAverageLatency() {
        if (!Array.isArray(this.providers)) return null;

        const online = this.providers.filter(p =>
            p && p.stats && typeof p.stats.current === 'number' && p.stats.current !== null
        );

        if (online.length === 0) return null;

        const total = online.reduce((sum, p) => sum + p.stats.current, 0);
        const avg = total / online.length;

        return isNaN(avg) ? null : Math.round(avg);
    }

    /**
     * Clear all statistics
     */
    clearStats() {
        if (!Array.isArray(this.providers)) {
            console.error('Providers not initialized');
            return;
        }

        this.providers.forEach(provider => {
            if (!provider) return;

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
        if (typeof this.onUpdate === 'function') {
            try {
                this.onUpdate(event, provider);
            } catch (error) {
                console.error('Error in update callback:', error);
            }
        }
    }

    /**
     * Set update callback
     */
    setUpdateCallback(callback) {
        if (typeof callback === 'function') {
            this.onUpdate = callback;
        } else {
            console.error('setUpdateCallback expects a function');
        }
    }
}

// Export for use in app.js
window.LatencyMonitor = LatencyMonitor;
