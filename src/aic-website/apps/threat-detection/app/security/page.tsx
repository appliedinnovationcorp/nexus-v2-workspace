'use client';

import React from 'react';
import { SecurityDashboardLayout } from '@/components/layout/security-dashboard-layout';
import { ThreatOverview } from '@/components/security/threat-overview';
import { SecurityMetrics } from '@/components/security/security-metrics';
import { ThreatMap } from '@/components/security/threat-map';
import { RecentAlerts } from '@/components/security/recent-alerts';
import { ThreatIntelligenceFeed } from '@/components/security/threat-intelligence-feed';
import { IncidentTimeline } from '@/components/security/incident-timeline';
import { useThreatDetection } from '@/contexts/threat-detection-context';
import { useSecurityMonitoring } from '@/contexts/security-monitoring-context';
import { useIncidentResponse } from '@/contexts/incident-response-context';
import { useThreatIntelligence } from '@/contexts/threat-intelligence-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertTriangle, Shield, Activity, Eye, Zap, Target } from 'lucide-react';

export default function SecurityDashboard() {
  const { metrics: threatMetrics, isLoading: threatLoading } = useThreatDetection();
  const { dashboard: securityDashboard, isLoading: securityLoading } = useSecurityMonitoring();
  const { metrics: incidentMetrics, isLoading: incidentLoading } = useIncidentResponse();
  const { metrics: intelMetrics, isLoading: intelLoading } = useThreatIntelligence();

  const isLoading = threatLoading || securityLoading || incidentLoading || intelLoading;

  if (isLoading) {
    return (
      <SecurityDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" color="red" />
            <p className="mt-4 text-gray-300">Loading Security Operations Center...</p>
          </div>
        </div>
      </SecurityDashboardLayout>
    );
  }

  return (
    <SecurityDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Security Operations Center</h1>
            <p className="text-gray-400 mt-1">
              Real-time threat detection and security monitoring
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Systems Online</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">
                Threat Level: {securityDashboard?.threatLevel?.toUpperCase() || 'MEDIUM'}
              </span>
            </div>
          </div>
        </div>

        {/* Threat Overview */}
        <ThreatOverview />

        {/* Security Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="security-metric-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Active Threats</h3>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-white">
                {threatMetrics?.activeThreats || 0}
              </p>
              <span className="ml-2 text-sm text-red-400">
                +{threatMetrics?.criticalThreats || 0} critical
              </span>
            </div>
          </div>

          <div className="security-metric-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Security Score</h3>
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-white">
                {securityDashboard?.overview.securityScore || 0}
              </p>
              <span className="ml-2 text-sm text-green-400">/100</span>
            </div>
          </div>

          <div className="security-metric-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Open Incidents</h3>
              <Activity className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-white">
                {incidentMetrics?.openIncidents || 0}
              </p>
              <span className="ml-2 text-sm text-yellow-400">
                {incidentMetrics?.criticalIncidents || 0} critical
              </span>
            </div>
          </div>

          <div className="security-metric-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">IOC Matches</h3>
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-white">
                {intelMetrics?.recentMatches || 0}
              </p>
              <span className="ml-2 text-sm text-blue-400">24h</span>
            </div>
          </div>

          <div className="security-metric-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Response Time</h3>
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-white">
                {incidentMetrics?.meanTimeToResponse?.toFixed(1) || '0.0'}
              </p>
              <span className="ml-2 text-sm text-purple-400">min</span>
            </div>
          </div>

          <div className="security-metric-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Assets Online</h3>
              <Target className="h-5 w-5 text-cyan-500" />
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-white">
                {securityDashboard?.overview.onlineAssets || 0}
              </p>
              <span className="ml-2 text-sm text-cyan-400">
                /{securityDashboard?.overview.totalAssets || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Security Metrics Charts */}
            <SecurityMetrics />
            
            {/* Threat Map */}
            <ThreatMap />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <RecentAlerts />
            
            {/* Threat Intelligence Feed */}
            <ThreatIntelligenceFeed />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Timeline */}
          <IncidentTimeline />
          
          {/* System Status */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Threat Detection Engine</span>
                </div>
                <span className="text-green-400 text-sm">Online</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">SIEM Platform</span>
                </div>
                <span className="text-green-400 text-sm">Online</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">Threat Intelligence</span>
                </div>
                <span className="text-yellow-400 text-sm">Updating</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Incident Response</span>
                </div>
                <span className="text-green-400 text-sm">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SecurityDashboardLayout>
  );
}
