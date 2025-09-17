"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  VSSClient: () => VSSClient
});
var import_axios, VSSClient;
var init_client = __esm({
  "src/client.ts"() {
    "use strict";
    import_axios = __toESM(require("axios"));
    VSSClient = class {
      client;
      config;
      constructor(config) {
        this.config = {
          timeout: 3e4,
          retryAttempts: 3,
          retryDelay: 1e3,
          ...config
        };
        this.client = import_axios.default.create({
          baseURL: this.config.baseURL,
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey
          }
        });
        this.setupInterceptors();
      }
      setupInterceptors() {
        this.client.interceptors.response.use(
          (response) => response,
          async (error) => {
            const originalRequest = error.config;
            if (!originalRequest._retry && this.config.retryAttempts && originalRequest._retryCount < this.config.retryAttempts) {
              originalRequest._retry = true;
              originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
              await this.delay(this.config.retryDelay || 1e3);
              return this.client(originalRequest);
            }
            throw this.handleError(error);
          }
        );
      }
      handleError(error) {
        const vssError = new Error();
        if (error.response) {
          vssError.message = error.response.data?.message || error.message;
          vssError.status = error.response.status;
          vssError.code = error.response.data?.code || error.code;
          vssError.details = error.response.data?.details;
        } else if (error.request) {
          vssError.message = "No response from server";
          vssError.code = "NETWORK_ERROR";
        } else {
          vssError.message = error.message;
          vssError.code = "REQUEST_ERROR";
        }
        return vssError;
      }
      delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      // Health endpoints
      async health() {
        const response = await this.client.get("/health");
        return response.data;
      }
      async healthDetailed() {
        const response = await this.client.get("/health/detailed");
        return response.data;
      }
      // Stats endpoints
      async stats() {
        const response = await this.client.get("/api/stats");
        return response.data;
      }
      async cpu() {
        const response = await this.client.get("/api/stats/cpu");
        return response.data;
      }
      async memory() {
        const response = await this.client.get("/api/stats/memory");
        return response.data;
      }
      async disk() {
        const response = await this.client.get("/api/stats/disk");
        return response.data;
      }
      async network() {
        const response = await this.client.get("/api/stats/network");
        return response.data;
      }
      async networkStats() {
        const response = await this.client.get("/api/network/stats");
        return response.data;
      }
      async processes(options) {
        const response = await this.client.get("/api/stats/processes", {
          params: options
        });
        return response.data;
      }
      async gpu() {
        const response = await this.client.get("/api/stats/gpu");
        return response.data;
      }
      // Hardware endpoints
      async hardware() {
        const response = await this.client.get("/api/hardware");
        return response.data;
      }
      async mainboard() {
        const response = await this.client.get("/api/hardware/mainboard");
        return response.data;
      }
      async bios() {
        const response = await this.client.get("/api/hardware/bios");
        return response.data;
      }
      async chassis() {
        const response = await this.client.get("/api/hardware/chassis");
        return response.data;
      }
      // Speed test
      async speedTest() {
        const response = await this.client.post("/api/speedtest", {}, {
          timeout: 12e4
          // 2 minutes for speed tests
        });
        return response.data;
      }
      async speedTestStatus() {
        const response = await this.client.get("/api/speedtest/status");
        return response.data;
      }
      // API Keys management
      async listApiKeys() {
        const response = await this.client.get("/api/apikeys");
        return response.data;
      }
      async createApiKey(data) {
        const response = await this.client.post("/api/apikeys", data);
        return response.data;
      }
      async deleteApiKey(id) {
        const response = await this.client.delete(`/api/apikeys/${id}`);
        return response.data;
      }
      async updateApiKey(id, data) {
        const response = await this.client.put(`/api/apikeys/${id}`, data);
        return response.data;
      }
      // Alerts management
      async listAlerts() {
        const response = await this.client.get("/api/alerts");
        return response.data;
      }
      async createAlert(alert) {
        const response = await this.client.post("/api/alerts", alert);
        return response.data;
      }
      async updateAlert(id, alert) {
        const response = await this.client.put(`/api/alerts/${id}`, alert);
        return response.data;
      }
      async deleteAlert(id) {
        const response = await this.client.delete(`/api/alerts/${id}`);
        return response.data;
      }
      async toggleAlert(id, enabled) {
        const response = await this.client.patch(`/api/alerts/${id}/toggle`, { enabled });
        return response.data;
      }
      // Logs
      async logs(options) {
        const response = await this.client.get("/api/logs", {
          params: options
        });
        return response.data;
      }
      async systemLogs(options) {
        const response = await this.client.get("/api/logs/system", {
          params: options
        });
        return response.data;
      }
      // Power commands
      async power(command) {
        const response = await this.client.post("/api/power", command);
        return response.data;
      }
      async cancelPowerCommand() {
        const response = await this.client.delete("/api/power/cancel");
        return response.data;
      }
      // Network history
      async networkHistory(options) {
        const response = await this.client.get("/api/network-history", {
          params: options
        });
        return response.data;
      }
      // Custom request method for extending functionality
      async request(config) {
        const response = await this.client.request(config);
        return response.data;
      }
      // Update configuration
      updateConfig(config) {
        this.config = { ...this.config, ...config };
        if (config.baseURL) {
          this.client.defaults.baseURL = config.baseURL;
        }
        if (config.apiKey) {
          this.client.defaults.headers["x-api-key"] = config.apiKey;
        }
        if (config.timeout) {
          this.client.defaults.timeout = config.timeout;
        }
      }
      // Get current configuration
      getConfig() {
        return { ...this.config };
      }
    };
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  VSSClient: () => VSSClient,
  createClient: () => createClient,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
init_client();
function createClient(config) {
  const { VSSClient: VSSClient2 } = (init_client(), __toCommonJS(client_exports));
  return new VSSClient2(config);
}
var index_default = { VSSClient: (init_client(), __toCommonJS(client_exports)).VSSClient, createClient };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VSSClient,
  createClient
});
