export interface VSSConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface APIKeyPermissions {
  viewStats?: boolean;
  createApiKey?: boolean;
  deleteApiKey?: boolean;
  viewApiKeys?: boolean;
  usePowerCommands?: boolean;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: APIKeyPermissions;
  isAdmin: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

export interface CPUInfo {
  manufacturer: string;
  brand: string;
  vendor?: string;
  family?: string;
  model?: string;
  stepping?: string;
  revision?: string;
  cores: number;
  physicalCores: number;
  processors?: number;
  socket?: string;
  physicalCpus?: number;
  coresPerCpu?: number;
  threadsPerCore?: number;
}

export interface CPUSpeed {
  min: number;
  max: number;
  avg: number;
  cores: number[];
}

export interface CPUTemperature {
  main: number;
  cores: number[];
  max: number;
}

export interface CPULoad {
  avgLoad: number;
  currentLoad: number;
  currentLoadUser: number;
  currentLoadSystem: number;
  currentLoadNice: number;
  currentLoadIdle: number;
  currentLoadIrq: number;
  cores: Array<{
    load: number;
    loadUser: number;
    loadSystem: number;
    loadNice: number;
    loadIdle: number;
    loadIrq: number;
  }>;
}

export interface MemoryInfo {
  total: number;
  free: number;
  used: number;
  active: number;
  available: number;
  usage: string;
  swapTotal?: number;
  swapFree?: number;
  swapUsed?: number;
}

export interface DiskInfo {
  fs: string;
  type: string;
  size: number;
  used: number;
  available: number;
  use: number;
  mount: string;
}

export interface NetworkInterface {
  iface: string;
  ip4?: string;
  ip6?: string;
  mac?: string;
  type?: string;
  speed?: number;
  internal?: boolean;
  virtual?: boolean;
  operstate?: string;
  duplex?: string;
}

export interface NetworkStats {
  iface: string;
  operstate: string;
  rx_bytes: number;
  rx_dropped: number;
  rx_errors: number;
  tx_bytes: number;
  tx_dropped: number;
  tx_errors: number;
  rx_sec: number;
  tx_sec: number;
  ms: number;
}

export interface OSInfo {
  platform: string;
  distro: string;
  release: string;
  kernel: string;
  arch: string;
  hostname: string;
  codepage?: string;
  logofile?: string;
  serial?: string;
  build?: string;
  servicepack?: string;
  uefi?: boolean;
}

export interface SystemStats {
  cpu: CPUInfo;
  memory: MemoryInfo;
  disk: DiskInfo[];
  network: NetworkInterface[];
  os: OSInfo;
  uptime: number;
}

export interface ProcessInfo {
  pid: number;
  parentPid?: number;
  name: string;
  cpu: number;
  memory: number;
  state?: string;
  started?: string;
  user?: string;
  command?: string;
  path?: string;
  params?: string;
  priority?: number;
  memVsz?: number;
  memRss?: number;
}

export interface GPUInfo {
  vendor: string;
  model: string;
  bus?: string;
  busAddress?: string;
  vram?: number;
  vramDynamic?: boolean;
  vramUsed?: number;
  temperatureGpu?: number;
  temperatureMemory?: number;
  fanSpeed?: number;
  clockCore?: number;
  clockMemory?: number;
  memoryTotal?: number;
  memoryUsed?: number;
  memoryFree?: number;
  utilizationGpu?: number;
  utilizationMemory?: number;
  powerDraw?: number;
  powerLimit?: number;
}

export interface SpeedTestResult {
  timestamp: Date;
  ping: {
    latency: number;
    jitter?: number;
  };
  download: {
    bandwidth: number;
    bytes: number;
    speed: number;
  };
  upload: {
    bandwidth: number;
    bytes: number;
    speed: number;
  };
  server: {
    id: number;
    name: string;
    location: string;
    country: string;
    host: string;
    port: number;
    ip?: string;
  };
  result: {
    id: string;
    url: string;
  };
  isp?: string;
  interface?: {
    internalIp?: string;
    name?: string;
    macAddr?: string;
    isVpn?: boolean;
    externalIp?: string;
  };
}

export interface Alert {
  id?: string;
  name: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'process' | 'custom';
  condition: string;
  threshold: number;
  action: string;
  enabled: boolean;
  notificationChannels?: string[];
  cooldown?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  lastTriggered?: string;
  triggerCount?: number;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface PowerCommand {
  action: 'shutdown' | 'reboot' | 'sleep' | 'hibernate';
  delay?: number;
  force?: boolean;
  message?: string;
}

export interface HealthStatus {
  status: 'OK' | 'ERROR' | 'DEGRADED';
  uptime?: number;
  version?: string;
  database?: {
    connected: boolean;
    initialized: boolean;
  };
  timestamp?: string;
}

export interface VSSError extends Error {
  code?: string;
  status?: number;
  details?: any;
}