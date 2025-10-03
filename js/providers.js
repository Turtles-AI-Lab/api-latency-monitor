/**
 * API Providers Configuration
 */

const API_PROVIDERS = [
    {
        id: 'openai',
        name: 'OpenAI',
        endpoint: 'https://api.openai.com',
        pingPath: '/v1/models',
        color: '#10a37f',
        requiresAuth: false // For ping test
    },
    {
        id: 'anthropic',
        name: 'Anthropic (Claude)',
        endpoint: 'https://api.anthropic.com',
        pingPath: '/v1/models',
        color: '#d4a373',
        requiresAuth: false
    },
    {
        id: 'google',
        name: 'Google AI',
        endpoint: 'https://generativelanguage.googleapis.com',
        pingPath: '/v1beta/models',
        color: '#4285f4',
        requiresAuth: false
    },
    {
        id: 'azure',
        name: 'Azure OpenAI',
        endpoint: 'https://azure.microsoft.com',
        pingPath: '/',
        color: '#0078d4',
        requiresAuth: false
    },
    {
        id: 'cohere',
        name: 'Cohere',
        endpoint: 'https://api.cohere.ai',
        pingPath: '/v1/models',
        color: '#39594d',
        requiresAuth: false
    },
    {
        id: 'huggingface',
        name: 'Hugging Face',
        endpoint: 'https://api-inference.huggingface.co',
        pingPath: '/',
        color: '#ff9d0b',
        requiresAuth: false
    }
];

// Validate provider configuration
(function validateProviders() {
    if (!Array.isArray(API_PROVIDERS)) {
        console.error('API_PROVIDERS must be an array');
        return;
    }

    API_PROVIDERS.forEach((provider, index) => {
        if (!provider) {
            console.error(`Provider at index ${index} is null or undefined`);
            return;
        }

        const requiredFields = ['id', 'name', 'endpoint', 'pingPath', 'color'];
        const missing = requiredFields.filter(field => !provider[field]);

        if (missing.length > 0) {
            console.error(`Provider "${provider.name || index}" is missing fields: ${missing.join(', ')}`);
        }

        // Validate URL format
        if (provider.endpoint && !provider.endpoint.startsWith('http')) {
            console.error(`Provider "${provider.name}" has invalid endpoint URL: ${provider.endpoint}`);
        }

        // Validate color format
        if (provider.color && !/^#[0-9A-Fa-f]{6}$/.test(provider.color)) {
            console.warn(`Provider "${provider.name}" has invalid color format: ${provider.color}`);
        }
    });
})();
