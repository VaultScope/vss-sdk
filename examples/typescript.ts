import { VSSClient, SystemStats, ProcessInfo, CPUInfo } from '@vaultscope/vss-sdk';

// Initialize client with environment variable or default
const client = new VSSClient({
  baseURL: process.env.VSS_BASE_URL || 'http://localhost:4000',
  apiKey: process.env.VSS_API_KEY || 'your-api-key-here',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
});

interface SystemSummary {
  cpu: {
    model: string;
    usage: number;
    temperature?: number;
  };
  memory: {
    totalGB: number;
    usedGB: number;
    percentage: number;
  };
  disk: Array<{
    mount: string;
    usedGB: number;
    totalGB: number;
    percentage: number;
  }>;
  network: {
    interfaces: number;
    activeInterfaces: string[];
  };
  uptime: {
    hours: number;
    days: number;
  };
}

async function getSystemSummary(): Promise<SystemSummary> {
  const [stats, cpu, processes] = await Promise.all([
    client.stats(),
    client.cpu(),
    client.processes({ sortBy: 'cpu', limit: 100 })
  ]);

  const bytesToGB = (bytes: number): number =>
    Number((bytes / 1024 / 1024 / 1024).toFixed(2));

  const totalCpuUsage = processes.reduce((sum, proc) => sum + proc.cpu, 0);

  return {
    cpu: {
      model: stats.cpu.brand,
      usage: Math.min(totalCpuUsage, 100),
      temperature: cpu.temperature?.main
    },
    memory: {
      totalGB: bytesToGB(stats.memory.total),
      usedGB: bytesToGB(stats.memory.used),
      percentage: Number(stats.memory.usage)
    },
    disk: stats.disk.map(d => ({
      mount: d.mount,
      usedGB: bytesToGB(d.used),
      totalGB: bytesToGB(d.size),
      percentage: d.use
    })),
    network: {
      interfaces: stats.network.length,
      activeInterfaces: stats.network
        .filter(n => n.ip4 || n.ip6)
        .map(n => n.iface)
    },
    uptime: {
      hours: Math.floor(stats.uptime / 3600),
      days: Math.floor(stats.uptime / 86400)
    }
  };
}

async function monitorSystem(): Promise<void> {
  console.log('Starting system monitoring...\n');

  try {
    // Initial health check
    const health = await client.healthDetailed();
    console.log(`Server Status: ${health.status}`);
    console.log(`Server Version: ${health.version || 'Unknown'}`);
    console.log(`Database: ${health.database?.connected ? 'Connected' : 'Disconnected'}\n`);

    // Get system summary
    const summary = await getSystemSummary();

    // Display CPU information
    console.log('=== CPU Information ===');
    console.log(`Model: ${summary.cpu.model}`);
    console.log(`Usage: ${summary.cpu.usage.toFixed(2)}%`);
    if (summary.cpu.temperature) {
      console.log(`Temperature: ${summary.cpu.temperature}°C`);
    }

    // Display Memory information
    console.log('\n=== Memory Information ===');
    console.log(`Total: ${summary.memory.totalGB} GB`);
    console.log(`Used: ${summary.memory.usedGB} GB (${summary.memory.percentage}%)`);
    console.log(`Free: ${(summary.memory.totalGB - summary.memory.usedGB).toFixed(2)} GB`);

    // Display Disk information
    console.log('\n=== Disk Information ===');
    summary.disk.forEach(disk => {
      console.log(`${disk.mount}: ${disk.usedGB}/${disk.totalGB} GB (${disk.percentage}%)`);
    });

    // Display Network information
    console.log('\n=== Network Information ===');
    console.log(`Total Interfaces: ${summary.network.interfaces}`);
    console.log(`Active Interfaces: ${summary.network.activeInterfaces.join(', ')}`);

    // Display Uptime
    console.log('\n=== System Uptime ===');
    console.log(`${summary.uptime.days} days, ${summary.uptime.hours % 24} hours`);

    // Get top processes
    console.log('\n=== Top 5 CPU-intensive Processes ===');
    const topProcesses = await client.processes({
      sortBy: 'cpu',
      limit: 5
    });

    topProcesses.forEach((proc: ProcessInfo, index: number) => {
      console.log(`${index + 1}. ${proc.name}`);
      console.log(`   PID: ${proc.pid}`);
      console.log(`   CPU: ${proc.cpu.toFixed(2)}%`);
      console.log(`   Memory: ${(proc.memory / 1024 / 1024).toFixed(2)} MB`);
      if (proc.user) {
        console.log(`   User: ${proc.user}`);
      }
    });

    // Get network statistics
    console.log('\n=== Network Statistics ===');
    const netStats = await client.networkStats();

    netStats.forEach(stat => {
      if (stat.operstate === 'up') {
        const rxMB = (stat.rx_bytes / 1024 / 1024).toFixed(2);
        const txMB = (stat.tx_bytes / 1024 / 1024).toFixed(2);
        const rxSpeed = (stat.rx_sec / 1024).toFixed(2);
        const txSpeed = (stat.tx_sec / 1024).toFixed(2);

        console.log(`${stat.iface}:`);
        console.log(`  Total RX: ${rxMB} MB`);
        console.log(`  Total TX: ${txMB} MB`);
        console.log(`  Current RX: ${rxSpeed} KB/s`);
        console.log(`  Current TX: ${txSpeed} KB/s`);
      }
    });

    // Check for GPU if available
    try {
      const gpus = await client.gpu();
      if (gpus.length > 0) {
        console.log('\n=== GPU Information ===');
        gpus.forEach((gpu, index) => {
          console.log(`GPU ${index + 1}: ${gpu.vendor} ${gpu.model}`);
          if (gpu.memoryTotal) {
            const memUsed = gpu.memoryUsed || 0;
            const memTotal = gpu.memoryTotal;
            console.log(`  Memory: ${memUsed}/${memTotal} MB`);
          }
          if (gpu.temperatureGpu !== undefined) {
            console.log(`  Temperature: ${gpu.temperatureGpu}°C`);
          }
          if (gpu.utilizationGpu !== undefined) {
            console.log(`  Utilization: ${gpu.utilizationGpu}%`);
          }
        });
      }
    } catch (error) {
      // GPU info might not be available
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);

    if (error.status === 401) {
      console.error('Authentication failed. Please check your API key.');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('Could not connect to server. Please check if the server is running.');
    } else if (error.details) {
      console.error('Details:', error.details);
    }

    process.exit(1);
  }
}

// Continuous monitoring mode
async function continuousMonitoring(intervalSeconds: number = 5): Promise<void> {
  console.log(`Starting continuous monitoring (updating every ${intervalSeconds} seconds)...`);
  console.log('Press Ctrl+C to stop\n');

  const monitor = async () => {
    console.clear();
    await monitorSystem();
  };

  // Initial run
  await monitor();

  // Set up interval
  setInterval(monitor, intervalSeconds * 1000);
}

// Check if running in continuous mode
const args = process.argv.slice(2);
const continuous = args.includes('--continuous') || args.includes('-c');
const interval = args.includes('--interval')
  ? parseInt(args[args.indexOf('--interval') + 1])
  : 5;

if (continuous) {
  continuousMonitoring(interval);
} else {
  monitorSystem();
}