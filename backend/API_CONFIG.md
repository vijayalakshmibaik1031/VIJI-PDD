/**
 * Configuration file for API connections
 * Update the API_URL based on your environment
 */

// For Web Admin (localhost - same machine)
export const WEB_API_CONFIG = {
  baseUrl: 'http://localhost:5000/api',
  description: 'Web Admin - Local Backend',
};

// For Mobile App (use your PC IP)
// Find IP with: ipconfig
// Look for: IPv4 Address under your network adapter
export const MOBILE_API_CONFIG = {
  baseUrl: 'http://192.168.31.72:5000/api',
  description: 'Mobile App - PC Backend',
  // Update PC_IP if your IP changes
  PC_IP: '192.168.31.72',
  PORT: 5000,
};

/**
 * How to find your PC IP:
 * 
 * Windows:
 * 1. Open Command Prompt
 * 2. Run: ipconfig
 * 3. Look for "IPv4 Address" under your active network adapter
 * 4. It will look like: 192.168.xxx.xxx
 * 
 * Update MOBILE_API_CONFIG.PC_IP with your IP
 * 
 * Common Network Adapters:
 * - Wi-Fi: For wireless connections
 * - Ethernet: For wired connections
 * - Do NOT use 127.0.0.1 or localhost in mobile app
 */

// Environment detection
export const API_CONFIG = {
  isDevelopment: true,
  web: WEB_API_CONFIG,
  mobile: MOBILE_API_CONFIG,
};
