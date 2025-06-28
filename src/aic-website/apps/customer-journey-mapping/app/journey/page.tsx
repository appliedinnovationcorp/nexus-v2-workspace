'use client';

import React from 'react';
import { JourneyDashboardLayout } from '@/components/layout/journey-dashboard-layout';
import { JourneyOverview } from '@/components/journey/journey-overview';
import { JourneyMetrics } from '@/components/journey/journey-metrics';
import { JourneyFlow } from '@/components/journey/journey-flow';
import { PersonaSelector } from '@/components/persona/persona-selector';
import { OptimizationPanel } from '@/components/optimization/optimization-panel';
import { useJourney } from '@/contexts/journey-context';
import { usePersona } from '@/contexts/persona-context';
import { useAnalytics } from '@/contexts/analytics-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function JourneyPage() {
  const { currentJourney, isLoading: journeyLoading } = useJourney();
  const { currentPersona } = usePersona();
  const { isLoading: analyticsLoading } = useAnalytics();

  const isLoading = journeyLoading || analyticsLoading;

  if (isLoading) {
    return (
      <JourneyDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading journey data...</p>
          </div>
        </div>
      </JourneyDashboardLayout>
    );
  }

  return (
    <JourneyDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Customer Journey Mapping
            </h1>
            <p className="text-gray-600 mt-1">
              Visualize and optimize customer experiences across all touchpoints
            </p>
          </div>
          <PersonaSelector />
        </div>

        {/* Journey Overview */}
        <JourneyOverview />

        {/* Main Content */}
        <Tabs defaultValue="flow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flow">Journey Flow</TabsTrigger>
            <TabsTrigger value="metrics">Analytics</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="space-y-6">
            <JourneyFlow />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <JourneyMetrics />
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            <OptimizationPanel />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  AI-Powered Insights
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900">
                          Mobile Experience Opportunity
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Mobile users show 40% higher drop-off rates in the awareness stage. 
                          Optimizing mobile experience could increase conversions by 15%.
                        </p>
                        <div className="mt-2 text-xs text-blue-600">
                          Confidence: 87% • Impact: High
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-900">
                          Demo Performance Excellence
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          Product demos consistently achieve 45% conversion rates, 
                          significantly above industry benchmarks.
                        </p>
                        <div className="mt-2 text-xs text-green-600">
                          Confidence: 92% • Impact: Medium
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-900">
                          Weekend Traffic Pattern
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Weekend visitors spend 60% more time on site but convert 
                          at lower rates. Consider weekend-specific content strategy.
                        </p>
                        <div className="mt-2 text-xs text-yellow-600">
                          Confidence: 73% • Impact: Medium
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Journey Recommendations
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-red-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Optimize Awareness Content
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Create targeted content to reduce 75% drop-off rate
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Impact: 8.5/10</span>
                        <span>Effort: 6/10</span>
                        <span>ROI: 3.2x</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-yellow-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Streamline Demo Process
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Reduce friction in demo scheduling and setup
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Impact: 6.5/10</span>
                        <span>Effort: 4/10</span>
                        <span>ROI: 2.1x</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Personalize Enterprise Journey
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Create tailored experiences for enterprise buyers
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Impact: 7.8/10</span>
                        <span>Effort: 8/10</span>
                        <span>ROI: 4.5x</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </JourneyDashboardLayout>
  );
}
