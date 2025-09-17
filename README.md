# VaultScope Statistics Server SDK

TypeScript/JavaScript SDK for interacting with VaultScope Statistics Server (VSS).

## Installation

```bash
npm install @vaultscope/vss-sdk
# or
yarn add @vaultscope/vss-sdk
# or
pnpm add @vaultscope/vss-sdk
```

## Quick Start

```typescript
import { VSSClient } from '@vaultscope/vss-sdk';

const client = new VSSClient({
  baseURL: 'http://localhost:4000',
  apiKey: 'your-api-key-here',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
});

// Get system stats
const stats = await client.stats();
console.log(stats);

// Get CPU information
const cpu = await client.cpu();
console.log(cpu);

// Run speed test
const speedTest = await client.speedTest();
console.log(speedTest);
```

## API Reference

### Client Configuration

```typescript
interface VSSConfig {
  baseURL: string;       // Base URL of the VSS server
  apiKey: string;        // API key for authentication
  timeout?: number;      // Request timeout in ms (default: 30000)
  retryAttempts?: number; // Number of retry attempts (default: 3)
  retryDelay?: number;   // Delay between retries in ms (default: 1000)
}
```

### Available Methods

#### Health & Status

```typescript
// Simple health check
await client.health(); // Returns: "OK"

// Detailed health status
await client.healthDetailed();
```

#### System Statistics

```typescript
// Complete system stats
await client.stats();

// CPU information
await client.cpu();

// Memory information
await client.memory();

// Disk information
await client.disk();

// Network interfaces
await client.network();

// Network statistics
await client.networkStats();

// Process list
await client.processes({
  sortBy: 'cpu',  // 'cpu' | 'memory' | 'name' | 'pid'
  limit: 10,
  filter: 'node'
});

// GPU information
await client.gpu();
```

#### Hardware Information

```typescript
// All hardware info
await client.hardware();

// Mainboard info
await client.mainboard();

// BIOS info
await client.bios();

// Chassis info
await client.chassis();
```

#### Network Speed Test

```typescript
// Run speed test (may take up to 2 minutes)
const result = await client.speedTest();

// Check speed test status
const status = await client.speedTestStatus();
```

#### API Key Management

```typescript
// List all API keys
const keys = await client.listApiKeys();

// Create new API key
const newKey = await client.createApiKey({
  name: 'My API Key',
  permissions: {
    viewStats: true,
    createApiKey: false,
    deleteApiKey: false,
    viewApiKeys: false,
    usePowerCommands: false
  }
});

// Update API key
await client.updateApiKey('key-id', {
  name: 'Updated Name',
  permissions: { viewStats: true }
});

// Delete API key
await client.deleteApiKey('key-id');
```

#### Alert Management

```typescript
// List alerts
const alerts = await client.listAlerts();

// Create alert
const alert = await client.createAlert({
  name: 'High CPU Alert',
  type: 'cpu',
  condition: 'greater_than',
  threshold: 80,
  action: 'notify',
  enabled: true,
  severity: 'high'
});

// Update alert
await client.updateAlert('alert-id', {
  threshold: 90,
  enabled: false
});

// Toggle alert
await client.toggleAlert('alert-id', true);

// Delete alert
await client.deleteAlert('alert-id');
```

#### Logs

```typescript
// Get application logs
const logs = await client.logs({
  level: 'error',
  source: 'api',
  limit: 100,
  offset: 0,
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

// Get system logs
const systemLogs = await client.systemLogs({
  lines: 100,
  filter: 'error'
});
```

#### Power Commands

```typescript
// Shutdown system
await client.power({
  action: 'shutdown',
  delay: 60,  // seconds
  force: false,
  message: 'System maintenance'
});

// Reboot system
await client.power({
  action: 'reboot',
  delay: 30
});

// Cancel scheduled power command
await client.cancelPowerCommand();
```

#### Network History

```typescript
// Get network history
const history = await client.networkHistory({
  interface: 'eth0',
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-31T23:59:59Z',
  limit: 1000
});
```

### Error Handling

The SDK includes comprehensive error handling:

```typescript
try {
  const stats = await client.stats();
} catch (error) {
  if (error.status === 401) {
    console.error('Authentication failed');
  } else if (error.status === 429) {
    console.error('Rate limit exceeded');
  } else if (error.code === 'NETWORK_ERROR') {
    console.error('Network connection failed');
  } else {
    console.error('Error:', error.message);
  }
}
```

### TypeScript Support

This SDK is written in TypeScript and includes complete type definitions for all API responses.

```typescript
import { SystemStats, CPUInfo, ProcessInfo } from '@vaultscope/vss-sdk';

const stats: SystemStats = await client.stats();
const cpu: CPUInfo = stats.cpu;
const processes: ProcessInfo[] = await client.processes();
```

### Advanced Usage

#### Custom Requests

For endpoints not yet covered by the SDK:

```typescript
const customData = await client.request({
  method: 'GET',
  url: '/api/custom/endpoint',
  params: { custom: 'param' }
});
```

#### Update Configuration

```typescript
// Update API key or base URL at runtime
client.updateConfig({
  apiKey: 'new-api-key',
  baseURL: 'https://new-server.com'
});

// Get current configuration
const config = client.getConfig();
```

## Examples

See the `examples/` directory for more detailed usage examples:

- `examples/basic.js` - Basic usage with JavaScript
- `examples/typescript.ts` - TypeScript example
- `examples/monitoring.js` - Continuous monitoring example
- `examples/alerts.js` - Alert management example

## Requirements

- Node.js >= 18.0.0
- VaultScope Statistics Server with valid API key

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub issues page](https://github.com/vaultscope/vss-sdk/issues).