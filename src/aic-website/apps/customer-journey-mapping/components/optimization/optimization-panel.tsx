'use client';

import React from 'react';
import { useOptimization } from '@/contexts/optimization-context';
import { formatPercentage } from '@/lib/utils';
import { Target, TrendingUp, Clock, DollarSign, AlertTriangle, CheckCircle, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function OptimizationPanel() {
  const { 
    recommendations, 
    abTests, 
    goals, 
    isLoading,
    updateRecommendation,
    startABTest,
    stopABTest 
  } = useOptimization();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Optimization Goals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{goal.name}</h4>
                <Badge className={getPriorityColor(goal.status)}>
                  {goal.status}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current: {goal.current}{goal.unit}</span>
                  <span className="text-gray-600">Target: {goal.target}{goal.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline">
                      {rec.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {rec.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => updateRecommendation({ ...rec, status: 'in-progress' })}
                      >
                        Start
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateRecommendation({ ...rec, status: 'dismissed' })}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                  {rec.status === 'in-progress' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateRecommendation({ ...rec, status: 'completed' })}
                    >
                      Complete
                    </Button>
                  )}
                  {rec.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{rec.impact}/10</div>
                  <div className="text-gray-500">Impact</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{rec.effort}/10</div>
                  <div className="text-gray-500">Effort</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{rec.estimatedROI}x</div>
                  <div className="text-gray-500">ROI</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{rec.timeToImplement}d</div>
                  <div className="text-gray-500">Timeline</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* A/B Tests */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">A/B Tests</h3>
        <div className="space-y-4">
          {abTests.map((test) => (
            <div key={test.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                  <p className="text-sm text-gray-500">
                    <strong>Hypothesis:</strong> {test.hypothesis}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {test.status === 'draft' && (
                    <Button size="sm" onClick={() => startABTest(test.id)}>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {test.status === 'running' && (
                    <Button size="sm" variant="outline" onClick={() => stopABTest(test.id)}>
                      <Pause className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {test.variants.map((variant) => (
                  <div key={variant.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{variant.name}</h5>
                      <span className="text-sm text-gray-500">{variant.trafficAllocation}%</span>
                    </div>
                    <p className="text-sm text-gray-600">{variant.description}</p>
                  </div>
                ))}
              </div>
              
              {test.results && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Test Results</span>
                  </div>
                  <div className="text-sm text-green-700">
                    Winner: {test.results.winner} • 
                    Improvement: {formatPercentage(test.results.improvement)} • 
                    Confidence: {test.results.confidence}%
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="flex items-center justify-center space-x-2 h-12">
            <Target className="h-5 w-5" />
            <span>Create Goal</span>
          </Button>
          
          <Button variant="outline" className="flex items-center justify-center space-x-2 h-12">
            <TrendingUp className="h-5 w-5" />
            <span>New A/B Test</span>
          </Button>
          
          <Button variant="outline" className="flex items-center justify-center space-x-2 h-12">
            <AlertTriangle className="h-5 w-5" />
            <span>Generate Insights</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
