'use client';

import React from 'react';
import { useAnalytics } from '@/contexts/analytics-context';
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function JourneyMetrics() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Conversion Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trends.conversions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Conversion Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Conversion Rates</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stageAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stageName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="conversionRate" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.stageAnalytics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ stageName, customerCount }) => `${stageName}: ${formatNumber(customerCount)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="customerCount"
                >
                  {data.stageAnalytics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Touchpoint Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Touchpoint Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Touchpoint</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Interactions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Conversion Rate</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Satisfaction</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.touchpointAnalytics.map((touchpoint) => (
                <tr key={touchpoint.touchpointId} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        touchpoint.type === 'digital' ? 'bg-blue-500' :
                        touchpoint.type === 'physical' ? 'bg-green-500' :
                        touchpoint.type === 'social' ? 'bg-purple-500' :
                        touchpoint.type === 'support' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="font-medium text-gray-900">{touchpoint.touchpointName}</span>
                      <span className="text-xs text-gray-500 capitalize">({touchpoint.type})</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    {formatNumber(touchpoint.interactions)}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`font-medium ${
                      touchpoint.conversionRate > 30 ? 'text-green-600' :
                      touchpoint.conversionRate > 15 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatPercentage(touchpoint.conversionRate)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    {touchpoint.satisfaction.toFixed(1)}/5
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`font-medium ${
                      touchpoint.roi > 5 ? 'text-green-600' :
                      touchpoint.roi > 2 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {touchpoint.roi.toFixed(1)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Persona Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.personaPerformance.map((persona) => (
            <div key={persona.personaId} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{persona.personaName}</h4>
                <span className="text-sm text-gray-500">{formatNumber(persona.journeyCount)} journeys</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-medium">{formatPercentage(persona.conversionRate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Average Value</span>
                  <span className="font-medium">{formatCurrency(persona.averageValue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Satisfaction</span>
                  <span className="font-medium">{persona.satisfaction.toFixed(1)}/5</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Top Stages:</div>
                <div className="flex flex-wrap gap-1">
                  {persona.topStages.map((stage) => (
                    <span key={stage} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {stage}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Challenges:</div>
                <div className="flex flex-wrap gap-1">
                  {persona.challenges.map((challenge) => (
                    <span key={challenge} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      {challenge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Satisfaction Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Satisfaction Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trends.satisfaction}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Satisfaction Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
