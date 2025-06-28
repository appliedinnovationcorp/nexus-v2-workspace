'use client';

import React from 'react';
import { useJourney } from '@/contexts/journey-context';
import { useAnalytics } from '@/contexts/analytics-context';
import { formatNumber, formatPercentage, getStageColor, getTouchpointColor } from '@/lib/utils';
import { ArrowRight, Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

export function JourneyFlow() {
  const { currentJourney, setSelectedStage } = useJourney();
  const { data } = useAnalytics();

  if (!currentJourney || !data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const stageAnalytics = data.stageAnalytics;

  return (
    <div className="space-y-6">
      {/* Journey Flow Visualization */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Customer Journey Flow</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>High Performance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Needs Attention</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Critical Issue</span>
            </div>
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="relative">
          <div className="flex items-center justify-between space-x-4 overflow-x-auto pb-4">
            {currentJourney.stages.map((stage, index) => {
              const analytics = stageAnalytics.find(s => s.stageId === stage.id);
              const isLast = index === currentJourney.stages.length - 1;
              const performanceLevel = analytics?.conversionRate > 40 ? 'high' : 
                                    analytics?.conversionRate > 20 ? 'medium' : 'low';

              return (
                <React.Fragment key={stage.id}>
                  {/* Stage Card */}
                  <div 
                    className={`flex-shrink-0 w-64 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      performanceLevel === 'high' ? 'border-green-200 bg-green-50' :
                      performanceLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-red-200 bg-red-50'
                    }`}
                    onClick={() => setSelectedStage(stage)}
                  >
                    {/* Stage Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getStageColor(stage.id) }}
                        />
                        <h4 className="font-medium text-gray-900">{stage.name}</h4>
                      </div>
                      {performanceLevel === 'low' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>

                    {/* Stage Metrics */}
                    {analytics && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Customers</span>
                          <span className="font-medium">{formatNumber(analytics.customerCount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Conversion</span>
                          <span className={`font-medium ${
                            analytics.conversionRate > 40 ? 'text-green-600' :
                            analytics.conversionRate > 20 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {formatPercentage(analytics.conversionRate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Avg Time</span>
                          <span className="font-medium">{analytics.averageTime.toFixed(1)}d</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Satisfaction</span>
                          <span className="font-medium">{analytics.satisfaction.toFixed(1)}/5</span>
                        </div>
                      </div>
                    )}

                    {/* Touchpoints Preview */}
                    {stage.touchpoints.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-1">
                          {stage.touchpoints.slice(0, 3).map((touchpoint) => (
                            <div
                              key={touchpoint.id}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                              style={{ backgroundColor: getTouchpointColor(touchpoint.type) }}
                              title={touchpoint.name}
                            >
                              {touchpoint.name.charAt(0)}
                            </div>
                          ))}
                          {stage.touchpoints.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                              +{stage.touchpoints.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  {!isLast && (
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Stages */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Stages</h3>
          <div className="space-y-3">
            {stageAnalytics
              .sort((a, b) => b.conversionRate - a.conversionRate)
              .slice(0, 3)
              .map((stage, index) => (
                <div key={stage.stageId} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{stage.stageName}</h4>
                      <span className="text-sm font-medium text-green-600">
                        {formatPercentage(stage.conversionRate)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatNumber(stage.customerCount)} customers • {stage.averageTime.toFixed(1)}d avg
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Bottleneck Stages */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bottleneck Stages</h3>
          <div className="space-y-3">
            {stageAnalytics
              .sort((a, b) => a.conversionRate - b.conversionRate)
              .slice(0, 3)
              .map((stage, index) => (
                <div key={stage.stageId} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{stage.stageName}</h4>
                      <span className="text-sm font-medium text-red-600">
                        {formatPercentage(stage.dropOffRate)} drop-off
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {stage.bottlenecks.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Journey Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Journey Flow Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Customer Volume</h4>
            </div>
            <p className="text-sm text-blue-700">
              {formatNumber(data.metrics.activeCustomers)} customers are currently in the journey, 
              with highest concentration in the {stageAnalytics[0]?.stageName.toLowerCase()} stage.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-900">Conversion Trend</h4>
            </div>
            <p className="text-sm text-green-700">
              Overall conversion rate is {formatPercentage(data.metrics.conversionRate)}, 
              with the strongest performance in later stages of the journey.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-900">Journey Duration</h4>
            </div>
            <p className="text-sm text-yellow-700">
              Average journey time is {data.metrics.averageJourneyTime.toFixed(1)} days, 
              with opportunities to reduce time in awareness and consideration stages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
