import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(d);
}

// Number utilities
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(seconds / 86400);
  const remainingHours = Math.floor((seconds % 86400) / 3600);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

// Security utilities
export function getSeverityColor(severity: 'critical' | 'high' | 'medium' | 'low' | 'info'): string {
  const colors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#65a30d',
    info: '#2563eb',
  };
  return colors[severity];
}

export function getThreatLevelColor(level: 'critical' | 'high' | 'medium' | 'low' | 'minimal'): string {
  const colors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#65a30d',
    minimal: '#16a34a',
  };
  return colors[level];
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    online: '#16a34a',
    offline: '#dc2626',
    active: '#16a34a',
    inactive: '#6b7280',
    connected: '#16a34a',
    disconnected: '#dc2626',
    resolved: '#16a34a',
    open: '#dc2626',
    investigating: '#d97706',
    contained: '#2563eb',
    pending: '#d97706',
    maintenance: '#8b5cf6',
    error: '#dc2626',
    warning: '#d97706',
    success: '#16a34a',
    info: '#2563eb',
  };
  return colors[status.toLowerCase()] || '#6b7280';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return '#16a34a';
  if (confidence >= 70) return '#65a30d';
  if (confidence >= 50) return '#d97706';
  if (confidence >= 30) return '#ea580c';
  return '#dc2626';
}

// Risk calculation utilities
export function calculateRiskScore(
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info',
  confidence: number,
  impact: number = 1
): number {
  const severityWeights = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
    info: 10,
  };
  
  const baseScore = severityWeights[severity];
  const confidenceMultiplier = confidence / 100;
  const impactMultiplier = Math.max(0.1, Math.min(2.0, impact));
  
  return Math.round(baseScore * confidenceMultiplier * impactMultiplier);
}

export function getRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' | 'minimal' {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'low';
  return 'minimal';
}

// IP address utilities
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

export function isValidIPv6(ip: string): boolean {
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
}

export function isPrivateIP(ip: string): boolean {
  if (!isValidIPv4(ip)) return false;
  
  const parts = ip.split('.').map(Number);
  
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  
  // 127.0.0.0/8 (loopback)
  if (parts[0] === 127) return true;
  
  return false;
}

// Hash utilities
export function generateHash(input: string): string {
  let hash = 0;
  if (input.length === 0) return hash.toString();
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// String utilities
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Performance utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Random utilities
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getRandomColor(): string {
  const colors = [
    '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
    '#059669', '#0891b2', '#0284c7', '#2563eb', '#4f46e5',
    '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Local storage utilities
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Handle storage errors silently
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Handle storage errors silently
  }
}

// Export utilities
export function downloadAsJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadAsCSV(data: any[], filename: string): void {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Security validation utilities
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Threat intelligence utilities
export function parseIOC(value: string): { type: string; value: string } | null {
  const cleanValue = value.trim().toLowerCase();
  
  // IP address
  if (isValidIPv4(cleanValue) || isValidIPv6(cleanValue)) {
    return { type: 'ip', value: cleanValue };
  }
  
  // Domain
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;
  if (domainRegex.test(cleanValue) && cleanValue.includes('.')) {
    return { type: 'domain', value: cleanValue };
  }
  
  // URL
  if (isValidUrl(value)) {
    return { type: 'url', value: cleanValue };
  }
  
  // Hash (MD5, SHA1, SHA256)
  const hashRegex = /^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/;
  if (hashRegex.test(cleanValue)) {
    return { type: 'hash', value: cleanValue };
  }
  
  // Email
  if (isValidEmail(cleanValue)) {
    return { type: 'email', value: cleanValue };
  }
  
  return null;
}
