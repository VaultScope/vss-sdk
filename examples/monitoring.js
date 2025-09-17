const { VSSClient } = require('@vaultscope/vss-sdk');

// Initialize client
const client = new VSSClient({
  baseURL: process.env.VSS_BASE_URL || 'http://localhost:4000',
  apiKey: process.env.VSS_API_KEY || 'your-api-key-here',
  timeout: 30000
});

// Thresholds for alerts
const THRESHOLDS = {
  cpu: 80,        // Alert if CPU > 80%
  memory: 90,     // Alert if Memory > 90%
  disk: 85,       // Alert if Disk > 85%
  temperature: 75 // Alert if Temperature > 75°C
};

// Store for tracking changes
let previousStats = null;
const alerts = [];

function formatBytes(bytes) {
  const gb = bytes / 1024 / 1024 / 1024;
  return gb > 1 ? `${gb.toFixed(2)} GB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

async function checkThresholds(stats, cpu) {
  const newAlerts = [];

  // Check CPU usage
  if (cpu.load && cpu.load.currentLoad > THRESHOLDS.cpu) {
    newAlerts.push({
      type: 'CPU',
      message: `High CPU usage: ${cpu.load.currentLoad.toFixed(2)}%`,
      severity: 'warning',
      timestamp: new Date()
    });
  }

  // Check memory usage
  const memoryUsage = (stats.memory.used / stats.memory.total) * 100;
  if (memoryUsage > THRESHOLDS.memory) {
    newAlerts.push({
      type: 'Memory',
      message: `High memory usage: ${memoryUsage.toFixed(2)}%`,
      severity: 'warning',
      timestamp: new Date()
    });
  }

  // Check disk usage
  stats.disk.forEach(disk => {
    if (disk.use > THRESHOLDS.disk) {
      newAlerts.push({
        type: 'Disk',
        message: `High disk usage on ${disk.mount}: ${disk.use}%`,
        severity: 'warning',
        timestamp: new Date()
      });
    }
  });

  // Check temperature
  if (cpu.temperature && cpu.temperature.main > THRESHOLDS.temperature) {
    newAlerts.push({
      type: 'Temperature',
      message: `High CPU temperature: ${cpu.temperature.main}°C`,
      severity: 'critical',
      timestamp: new Date()
    });
  }

  return newAlerts;
}

async function displayDashboard() {
  try {
    const [stats, cpu, processes, netStats] = await Promise.all([
      client.stats(),
      client.cpu(),
      client.processes({ sortBy: 'cpu', limit: 5 }),
      client.networkStats()
    ]);

    // Clear console for dashboard effect
    console.clear();

    // Header
    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                     VaultScope System Monitor Dashboard                   ║');
    console.log('╠═══════════════════════════════════════════════════════════════════════════╣');

    // System Info
    console.log('║ System Information                                                        ║');
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');
    console.log(`║ Hostname: ${stats.os.hostname.padEnd(64)} ║`);
    console.log(`║ Platform: ${(stats.os.platform + ' ' + stats.os.distro).padEnd(64)} ║`);
    console.log(`║ Uptime: ${formatUptime(stats.uptime).padEnd(66)} ║`);

    // CPU Info
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');
    console.log('║ CPU Status                                                                ║');
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');
    console.log(`║ Model: ${stats.cpu.brand.padEnd(67)} ║`);
    console.log(`║ Cores: ${(`${stats.cpu.cores} (${stats.cpu.physicalCores} physical)`).padEnd(67)} ║`);

    if (cpu.load) {
      const loadBar = createProgressBar(cpu.load.currentLoad, 40);
      console.log(`║ Usage: ${loadBar} ${cpu.load.currentLoad.toFixed(1).padStart(5)}% ║`);
    }

    if (cpu.temperature) {
      const tempBar = createProgressBar(cpu.temperature.main / 100 * 100, 40);
      console.log(`║ Temp:  ${tempBar} ${cpu.temperature.main.toFixed(1).padStart(5)}°C║`);
    }

    // Memory Info
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');
    console.log('║ Memory Status                                                             ║');
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');

    const memoryUsage = (stats.memory.used / stats.memory.total) * 100;
    const memBar = createProgressBar(memoryUsage, 40);
    console.log(`║ RAM:   ${memBar} ${memoryUsage.toFixed(1).padStart(5)}% ║`);
    console.log(`║ Used: ${formatBytes(stats.memory.used).padEnd(10)} / Total: ${formatBytes(stats.memory.total).padEnd(10)}                    ║`);

    // Disk Info
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');
    console.log('║ Disk Usage                                                                ║');
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');

    stats.disk.slice(0, 3).forEach(disk => {
      const diskBar = createProgressBar(disk.use, 30);
      const diskInfo = `${disk.mount}: ${diskBar} ${disk.use.toFixed(1)}%`;
      console.log(`║ ${diskInfo.padEnd(74)} ║`);
    });

    // Network Info
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');
    console.log('║ Network Activity                                                          ║');
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');

    netStats.filter(n => n.operstate === 'up').slice(0, 2).forEach(net => {
      const rxSpeed = (net.rx_sec / 1024).toFixed(2);
      const txSpeed = (net.tx_sec / 1024).toFixed(2);
      const netInfo = `${net.iface}: ↓ ${rxSpeed} KB/s | ↑ ${txSpeed} KB/s`;
      console.log(`║ ${netInfo.padEnd(74)} ║`);
    });

    // Top Processes
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');
    console.log('║ Top Processes (by CPU)                                                    ║');
    console.log('╟───────────────────────────────────────────────────────────────────────────╢');

    processes.forEach((proc, index) => {
      const procInfo = `${index + 1}. ${proc.name} (PID: ${proc.pid})`;
      const procStats = `CPU: ${proc.cpu.toFixed(1)}% | RAM: ${(proc.memory / 1024 / 1024).toFixed(0)} MB`;
      console.log(`║ ${procInfo.padEnd(40)} ${procStats.padEnd(34)} ║`);
    });

    // Check for alerts
    const newAlerts = await checkThresholds(stats, cpu);

    if (newAlerts.length > 0 || alerts.length > 0) {
      console.log('╟───────────────────────────────────────────────────────────────────────────╢');
      console.log('║ Alerts                                                                    ║');
      console.log('╟───────────────────────────────────────────────────────────────────────────╢');

      // Add new alerts
      newAlerts.forEach(alert => {
        if (!alerts.find(a => a.type === alert.type && a.message === alert.message)) {
          alerts.push(alert);
        }
      });

      // Keep only last 5 alerts
      if (alerts.length > 5) {
        alerts.splice(0, alerts.length - 5);
      }

      alerts.forEach(alert => {
        const symbol = alert.severity === 'critical' ? '⚠️ ' : '⚡';
        const alertText = `${symbol} ${alert.message}`;
        console.log(`║ ${alertText.padEnd(74)} ║`);
      });
    }

    // Footer
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
    console.log(`Last updated: ${new Date().toLocaleString()} | Press Ctrl+C to exit`);

    // Store current stats for comparison
    previousStats = stats;

  } catch (error) {
    console.error('Error fetching stats:', error.message);

    if (error.status === 401) {
      console.error('Authentication failed. Please check your API key.');
      process.exit(1);
    }
  }
}

function createProgressBar(percentage, width) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  let bar = '[';
  bar += '█'.repeat(filled);
  bar += '░'.repeat(empty);
  bar += ']';

  // Color based on percentage
  if (percentage > 80) {
    return `\x1b[31m${bar}\x1b[0m`; // Red
  } else if (percentage > 60) {
    return `\x1b[33m${bar}\x1b[0m`; // Yellow
  } else {
    return `\x1b[32m${bar}\x1b[0m`; // Green
  }
}

async function startMonitoring(interval = 2000) {
  console.log('Starting monitoring dashboard...');

  // Initial check
  await displayDashboard();

  // Set up interval
  setInterval(displayDashboard, interval);
}

// Handle graceful exit
process.on('SIGINT', () => {
  console.log('\n\nMonitoring stopped.');
  process.exit(0);
});

// Parse command line arguments
const args = process.argv.slice(2);
const interval = args.includes('--interval')
  ? parseInt(args[args.indexOf('--interval') + 1]) * 1000
  : 2000;

// Start monitoring
startMonitoring(interval);