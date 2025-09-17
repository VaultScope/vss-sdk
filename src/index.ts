export { VSSClient } from './client';
export * from './types';

// Convenience function for creating client
export function createClient(config: {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}): import('./client').VSSClient {
  const { VSSClient } = require('./client');
  return new VSSClient(config);
}

// Default export
export default { VSSClient: require('./client').VSSClient, createClient };