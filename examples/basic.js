const { VSSClient } = require('@vaultscope/vss-sdk');

// Initialize client
const client = new VSSClient({
  baseURL: 'http://localhost:4000',
  apiKey: process.env.VSS_API_KEY || 'your-api-key-here',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
});

async function main() {
  try {
    // Check health
    console.log('Checking server health...');
    const health = await client.health();
    console.log('Health status:', health);

    // Get system stats
    console.log('\nFetching system statistics...');
    const stats = await client.stats();

    console.log('\n=== CPU Information ===');
    console.log(`Model: ${stats.cpu.brand}`);
    console.log(`Cores: ${stats.cpu.cores} (${stats.cpu.physicalCores} physical)`);
    console.log(`Speed: ${stats.cpu.speed} GHz`);

    console.log('\n=== Memory Usage ===');
    const memoryGB = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);
    console.log(`Total: ${memoryGB(stats.memory.total)} GB`);
    console.log(`Used: ${memoryGB(stats.memory.used)} GB`);
    console.log(`Free: ${memoryGB(stats.memory.free)} GB`);
    console.log(`Usage: ${stats.memory.usage}%`);

    console.log('\n=== Disk Usage ===');
    stats.disk.forEach(disk => {
      const sizeGB = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);
      console.log(`${disk.mount}:`);
      console.log(`  File System: ${disk.fs}`);
      console.log(`  Total: ${sizeGB(disk.size)} GB`);
      console.log(`  Used: ${sizeGB(disk.used)} GB (${disk.use}%)`);
      console.log(`  Available: ${sizeGB(disk.available)} GB`);
    });

    console.log('\n=== Network Interfaces ===');
    stats.network.forEach(iface => {
      console.log(`${iface.iface}:`);
      console.log(`  IPv4: ${iface.ip4 || 'N/A'}`);
      console.log(`  IPv6: ${iface.ip6 || 'N/A'}`);
      console.log(`  MAC: ${iface.mac || 'N/A'}`);
      console.log(`  Speed: ${iface.speed || 'N/A'} Mbps`);
    });

    console.log('\n=== System Information ===');
    console.log(`Platform: ${stats.os.platform}`);
    console.log(`Distribution: ${stats.os.distro}`);
    console.log(`Kernel: ${stats.os.kernel}`);
    console.log(`Architecture: ${stats.os.arch}`);
    console.log(`Hostname: ${stats.os.hostname}`);
    console.log(`Uptime: ${Math.floor(stats.uptime / 3600)} hours`);

    // Get top processes
    console.log('\n=== Top 5 Processes by CPU ===');
    const processes = await client.processes({
      sortBy: 'cpu',
      limit: 5
    });

    processes.forEach((proc, index) => {
      console.log(`${index + 1}. ${proc.name} (PID: ${proc.pid})`);
      console.log(`   CPU: ${proc.cpu.toFixed(2)}%`);
      console.log(`   Memory: ${(proc.memory / 1024 / 1024).toFixed(2)} MB`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.status === 401) {
      console.error('Authentication failed. Please check your API key.');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('Could not connect to server. Is it running?');
    }
    process.exit(1);
  }
}

// Run the example
main();