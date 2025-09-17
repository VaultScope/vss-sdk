const { VSSClient } = require('@vaultscope/vss-sdk');

// Initialize client
const client = new VSSClient({
  baseURL: process.env.VSS_BASE_URL || 'http://localhost:4000',
  apiKey: process.env.VSS_API_KEY || 'your-api-key-here',
  timeout: 30000
});

// Alert templates
const alertTemplates = {
  highCpu: {
    name: 'High CPU Usage Alert',
    type: 'cpu',
    condition: 'greater_than',
    threshold: 80,
    action: 'notify',
    enabled: true,
    severity: 'high',
    description: 'Alert when CPU usage exceeds 80%',
    cooldown: 300, // 5 minutes
    notificationChannels: ['email', 'slack']
  },
  highMemory: {
    name: 'High Memory Usage Alert',
    type: 'memory',
    condition: 'greater_than',
    threshold: 90,
    action: 'notify',
    enabled: true,
    severity: 'high',
    description: 'Alert when memory usage exceeds 90%',
    cooldown: 300
  },
  diskSpace: {
    name: 'Low Disk Space Alert',
    type: 'disk',
    condition: 'greater_than',
    threshold: 85,
    action: 'notify',
    enabled: true,
    severity: 'medium',
    description: 'Alert when disk usage exceeds 85%',
    cooldown: 600 // 10 minutes
  },
  processDown: {
    name: 'Critical Process Down',
    type: 'process',
    condition: 'not_running',
    threshold: 0,
    action: 'notify',
    enabled: true,
    severity: 'critical',
    description: 'Alert when critical process is not running',
    metadata: {
      processName: 'node',
      checkInterval: 60
    }
  },
  networkBandwidth: {
    name: 'High Network Bandwidth',
    type: 'network',
    condition: 'greater_than',
    threshold: 100, // MB/s
    action: 'notify',
    enabled: true,
    severity: 'medium',
    description: 'Alert when network bandwidth exceeds 100 MB/s',
    cooldown: 180
  }
};

async function listAlerts() {
  console.log('=== Current Alerts ===\n');

  try {
    const alerts = await client.listAlerts();

    if (alerts.length === 0) {
      console.log('No alerts configured.');
      return;
    }

    alerts.forEach((alert, index) => {
      console.log(`${index + 1}. ${alert.name} (${alert.id})`);
      console.log(`   Type: ${alert.type}`);
      console.log(`   Condition: ${alert.condition} ${alert.threshold}`);
      console.log(`   Severity: ${alert.severity || 'medium'}`);
      console.log(`   Enabled: ${alert.enabled ? 'Yes' : 'No'}`);
      console.log(`   Description: ${alert.description || 'N/A'}`);

      if (alert.lastTriggered) {
        console.log(`   Last Triggered: ${new Date(alert.lastTriggered).toLocaleString()}`);
        console.log(`   Trigger Count: ${alert.triggerCount || 0}`);
      }

      console.log('');
    });
  } catch (error) {
    console.error('Error listing alerts:', error.message);
  }
}

async function createSampleAlerts() {
  console.log('=== Creating Sample Alerts ===\n');

  for (const [key, template] of Object.entries(alertTemplates)) {
    try {
      console.log(`Creating alert: ${template.name}`);
      const alert = await client.createAlert(template);
      console.log(`✓ Created alert with ID: ${alert.id}\n`);
    } catch (error) {
      console.error(`✗ Failed to create alert: ${error.message}\n`);
    }
  }
}

async function testAlertOperations() {
  console.log('=== Testing Alert Operations ===\n');

  try {
    // Create a test alert
    console.log('1. Creating test alert...');
    const testAlert = await client.createAlert({
      name: 'Test Alert',
      type: 'cpu',
      condition: 'greater_than',
      threshold: 50,
      action: 'notify',
      enabled: false,
      severity: 'low',
      description: 'Test alert for demonstration'
    });
    console.log(`   ✓ Created alert: ${testAlert.id}\n`);

    // Update the alert
    console.log('2. Updating alert threshold...');
    const updatedAlert = await client.updateAlert(testAlert.id, {
      threshold: 70,
      severity: 'medium'
    });
    console.log(`   ✓ Updated threshold to ${updatedAlert.threshold}\n`);

    // Toggle alert state
    console.log('3. Enabling alert...');
    const enabledAlert = await client.toggleAlert(testAlert.id, true);
    console.log(`   ✓ Alert enabled: ${enabledAlert.enabled}\n`);

    // Disable alert
    console.log('4. Disabling alert...');
    const disabledAlert = await client.toggleAlert(testAlert.id, false);
    console.log(`   ✓ Alert disabled: ${!disabledAlert.enabled}\n`);

    // Delete the test alert
    console.log('5. Deleting test alert...');
    await client.deleteAlert(testAlert.id);
    console.log('   ✓ Alert deleted successfully\n');

  } catch (error) {
    console.error('Error during alert operations:', error.message);
  }
}

async function monitorAlerts() {
  console.log('=== Starting Alert Monitor ===\n');
  console.log('Monitoring active alerts... Press Ctrl+C to stop\n');

  const checkAlerts = async () => {
    try {
      // Get current system stats
      const [stats, cpu, processes] = await Promise.all([
        client.stats(),
        client.cpu(),
        client.processes({ sortBy: 'cpu', limit: 5 })
      ]);

      // Get configured alerts
      const alerts = await client.listAlerts();
      const activeAlerts = alerts.filter(a => a.enabled);

      const triggered = [];

      // Check each active alert
      for (const alert of activeAlerts) {
        let shouldTrigger = false;

        switch (alert.type) {
          case 'cpu':
            if (cpu.load) {
              const cpuUsage = cpu.load.currentLoad;
              if (alert.condition === 'greater_than' && cpuUsage > alert.threshold) {
                shouldTrigger = true;
                triggered.push({
                  alert: alert.name,
                  value: cpuUsage.toFixed(2),
                  threshold: alert.threshold,
                  severity: alert.severity
                });
              }
            }
            break;

          case 'memory':
            const memUsage = (stats.memory.used / stats.memory.total) * 100;
            if (alert.condition === 'greater_than' && memUsage > alert.threshold) {
              shouldTrigger = true;
              triggered.push({
                alert: alert.name,
                value: memUsage.toFixed(2),
                threshold: alert.threshold,
                severity: alert.severity
              });
            }
            break;

          case 'disk':
            for (const disk of stats.disk) {
              if (alert.condition === 'greater_than' && disk.use > alert.threshold) {
                shouldTrigger = true;
                triggered.push({
                  alert: `${alert.name} (${disk.mount})`,
                  value: disk.use.toFixed(2),
                  threshold: alert.threshold,
                  severity: alert.severity
                });
              }
            }
            break;

          case 'process':
            if (alert.metadata && alert.metadata.processName) {
              const processRunning = processes.some(p =>
                p.name.toLowerCase().includes(alert.metadata.processName.toLowerCase())
              );
              if (alert.condition === 'not_running' && !processRunning) {
                shouldTrigger = true;
                triggered.push({
                  alert: alert.name,
                  value: 'Process not found',
                  threshold: alert.metadata.processName,
                  severity: alert.severity
                });
              }
            }
            break;
        }
      }

      // Display results
      const timestamp = new Date().toLocaleTimeString();
      console.clear();
      console.log(`=== Alert Monitor - ${timestamp} ===\n`);

      console.log('System Status:');
      console.log(`  CPU: ${cpu.load ? cpu.load.currentLoad.toFixed(2) : 'N/A'}%`);
      console.log(`  Memory: ${((stats.memory.used / stats.memory.total) * 100).toFixed(2)}%`);
      console.log(`  Active Alerts: ${activeAlerts.length}`);
      console.log('');

      if (triggered.length > 0) {
        console.log('⚠️  TRIGGERED ALERTS:');
        triggered.forEach(t => {
          const icon = t.severity === 'critical' ? '🔴' :
                       t.severity === 'high' ? '🟠' :
                       t.severity === 'medium' ? '🟡' : '🟢';
          console.log(`${icon} ${t.alert}`);
          console.log(`   Current: ${t.value} | Threshold: ${t.threshold}`);
        });
      } else {
        console.log('✅ All systems operating normally');
      }

      console.log('\nPress Ctrl+C to stop monitoring');

    } catch (error) {
      console.error('Error checking alerts:', error.message);
    }
  };

  // Initial check
  await checkAlerts();

  // Set up interval (check every 5 seconds)
  setInterval(checkAlerts, 5000);
}

// Main menu
async function main() {
  console.log('VaultScope Alert Management Example\n');

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      await listAlerts();
      break;

    case 'create':
      await createSampleAlerts();
      break;

    case 'test':
      await testAlertOperations();
      break;

    case 'monitor':
      await monitorAlerts();
      break;

    default:
      console.log('Usage: node alerts.js <command>\n');
      console.log('Commands:');
      console.log('  list     - List all configured alerts');
      console.log('  create   - Create sample alerts');
      console.log('  test     - Test alert operations (create, update, delete)');
      console.log('  monitor  - Start real-time alert monitoring');
      console.log('\nExample: node alerts.js monitor');
  }
}

// Handle graceful exit
process.on('SIGINT', () => {
  console.log('\n\nStopping alert manager...');
  process.exit(0);
});

// Run main function
main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});