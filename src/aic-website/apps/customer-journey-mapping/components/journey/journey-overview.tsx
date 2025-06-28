'use client';

import React from 'react';
import { useJourney } from '@/contexts/journey-context';
import { useAnalytics } from '@/contexts/analytics-context';
import { formatNumber, formatPercentage, formatDuration } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Clock, Target, Zap } from 'lucide-react';

export function JourneyOverview() {
  const { currentJourney } = useJourney();
  const { data } = useAnalytics();

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = data.metrics;

  const overviewCards = [
    {
      title: 'Active Customers',
      value: formatNumber(metrics.activeCustomers),
      change: 12.5,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Conversion Rate',
      value: formatPercentage(metrics.conversionRate),
      change: -2.3,
      icon: Target,
      color: 'green',
    },
    {
      title: 'Avg Journey Time',
      value: formatDuration(metrics.averageJourneyTime),
      change: -8.1,
      icon: Clock,
      color: 'purple',
    },
    {
      title: 'Satisfaction Score',
      value: metrics.customerSatisfaction.toFixed(1),
      change: 5.2,
      icon: Zap,
      color: 'yellow',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Journey Header */}
      {currentJourney && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentJourney.name}
              </h2>
              <p className="text-gray-600 mt-1">
                {currentJourney.description}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentJourney.stages.length}
                </div>
                <div className="text-xs text-gray-500">Stages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentJourney.stages.reduce((acc, stage) => acc + stage.touchpoints.length, 0)}
                </div>
                <div className="text-xs text-gray-500">Touchpoints</div>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentJourney.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : currentJourney.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentJourney.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card) => {
          const isPositive = card.change > 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          
          return (
            <div key={card.title} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                <div className={`p-2 rounded-lg ${
                  card.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  card.color === 'green' ? 'bg-green-50 text-green-600' :
                  card.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                  'bg-yellow-50 text-yellow-600'
                }`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  
                  <div className="flex items-center mt-2">
                    <TrendIcon className={`h-4 w-4 mr-1 ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? '+' : ''}{card.change.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 ml-2">vs last period</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Journey Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Journey Stage Performance</h3>
        <div className="space-y-4">
          {data.stageAnalytics.map((stage, index) => (
            <div key={stage.stageId} className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">{index + 1}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900">{stage.stageName}</h4>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatNumber(stage.customerCount)} customers</span>
                    <span>{formatPercentage(stage.conversionRate)} conversion</span>
                    <span>{formatDuration(stage.averageTime)} avg time</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stage.conversionRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
