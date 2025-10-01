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
