import { AxiosRequestConfig } from 'axios';

interface VSSConfig {
    baseURL: string;
    apiKey: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}
interface APIKeyPermissions {
    viewStats?: boolean;
    createApiKey?: boolean;
    deleteApiKey?: boolean;
    viewApiKeys?: boolean;
    usePowerCommands?: boolean;
}
interface APIKey {
    id: string;
    name: string;
    key: string;
    permissions: APIKeyPermissions;
    isAdmin: boolean;
    createdAt: string;
    lastUsed?: string;
    usageCount: number;
}
interface CPUInfo {
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
interface CPUSpeed {
    min: number;
    max: number;
    avg: number;
    cores: number[];
}
interface CPUTemperature {
    main: number;
    cores: number[];
    max: number;
}
interface CPULoad {
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
interface MemoryInfo {
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
interface DiskInfo {
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    use: number;
    mount: string;
}
interface NetworkInterface {
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
interface NetworkStats {
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
interface OSInfo {
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
interface SystemStats {
    cpu: CPUInfo;
    memory: MemoryInfo;
    disk: DiskInfo[];
    network: NetworkInterface[];
    os: OSInfo;
    uptime: number;
}
interface ProcessInfo {
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
interface GPUInfo {
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
interface SpeedTestResult {
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
interface Alert {
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
interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    source?: string;
    metadata?: Record<string, any>;
}
interface PowerCommand {
    action: 'shutdown' | 'reboot' | 'sleep' | 'hibernate';
    delay?: number;
    force?: boolean;
    message?: string;
}
interface HealthStatus {
    status: 'OK' | 'ERROR' | 'DEGRADED';
    uptime?: number;
    version?: string;
    database?: {
        connected: boolean;
        initialized: boolean;
    };
    timestamp?: string;
}
interface VSSError extends Error {
    code?: string;
    status?: number;
    details?: any;
}

declare class VSSClient {
    private client;
    private config;
    constructor(config: VSSConfig);
    private setupInterceptors;
    private handleError;
    private delay;
    health(): Promise<string>;
    healthDetailed(): Promise<HealthStatus>;
    stats(): Promise<SystemStats>;
    cpu(): Promise<{
        info: CPUInfo;
        speed: CPUSpeed;
        temperature: CPUTemperature;
        load: CPULoad;
    }>;
    memory(): Promise<MemoryInfo>;
    disk(): Promise<DiskInfo[]>;
    network(): Promise<NetworkInterface[]>;
    networkStats(): Promise<NetworkStats[]>;
    processes(options?: {
        sortBy?: 'cpu' | 'memory' | 'name' | 'pid';
        limit?: number;
        filter?: string;
    }): Promise<ProcessInfo[]>;
    gpu(): Promise<GPUInfo[]>;
    hardware(): Promise<any>;
    mainboard(): Promise<any>;
    bios(): Promise<any>;
    chassis(): Promise<any>;
    speedTest(): Promise<SpeedTestResult>;
    speedTestStatus(): Promise<{
        running: boolean;
        progress?: number;
        result?: SpeedTestResult;
    }>;
    listApiKeys(): Promise<APIKey[]>;
    createApiKey(data: {
        name: string;
        permissions?: APIKeyPermissions;
    }): Promise<APIKey>;
    deleteApiKey(id: string): Promise<{
        message: string;
    }>;
    updateApiKey(id: string, data: {
        name?: string;
        permissions?: APIKeyPermissions;
    }): Promise<APIKey>;
    listAlerts(): Promise<Alert[]>;
    createAlert(alert: Alert): Promise<Alert>;
    updateAlert(id: string, alert: Partial<Alert>): Promise<Alert>;
    deleteAlert(id: string): Promise<{
        message: string;
    }>;
    toggleAlert(id: string, enabled: boolean): Promise<Alert>;
    logs(options?: {
        level?: string;
        source?: string;
        limit?: number;
        offset?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<LogEntry[]>;
    systemLogs(options?: {
        lines?: number;
        filter?: string;
    }): Promise<string[]>;
    power(command: PowerCommand): Promise<{
        message: string;
        scheduled?: boolean;
    }>;
    cancelPowerCommand(): Promise<{
        message: string;
    }>;
    networkHistory(options?: {
        interface?: string;
        startTime?: string;
        endTime?: string;
        limit?: number;
    }): Promise<any[]>;
    request<T = any>(config: AxiosRequestConfig): Promise<T>;
    updateConfig(config: Partial<VSSConfig>): void;
    getConfig(): VSSConfig;
}

declare function createClient(config: {
    baseURL: string;
    apiKey: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}): VSSClient;
declare const _default: {
    VSSClient: any;
    createClient: typeof createClient;
};

export { type APIKey, type APIKeyPermissions, type Alert, type CPUInfo, type CPULoad, type CPUSpeed, type CPUTemperature, type DiskInfo, type GPUInfo, type HealthStatus, type LogEntry, type MemoryInfo, type NetworkInterface, type NetworkStats, type OSInfo, type PowerCommand, type ProcessInfo, type SpeedTestResult, type SystemStats, VSSClient, type VSSConfig, type VSSError, createClient, _default as default };
