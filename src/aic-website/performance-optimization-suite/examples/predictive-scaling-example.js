/**
 * Predictive Scaling Example
 * Demonstrates how to use the enhanced predictive scaling capabilities
 */

const { AutoScalingManager } = require('../core/auto-scaling-manager');

async function runPredictiveScalingDemo() {
  console.log('Starting Predictive Scaling Demo...');
  
  // Create auto scaling manager with predictive scaling enabled
  const autoScaler = new AutoScalingManager({
    enablePredictiveScaling: true,
    predictionHorizon: 24, // 24 hours ahead
    predictionInterval: 15, // 15-minute intervals
    predictionConfidenceThreshold: 70,
    enableAnomalyDetection: true,
    enableTrendDetection: true,
    minReplicas: 2,
    maxReplicas: 10,
    enableCostOptimization: true,
    maxCostPerHour: 50
  });
  
  // Set up event listeners
  autoScaler.on('initialized', (data) => {
    console.log(`Auto Scaling Manager initialized with ${data.currentReplicas} replicas`);
  });
  
  autoScaler.on('metricsCollected', (metrics) => {
    console.log(`Metrics collected: CPU ${metrics.cpuUtilization.toFixed(1)}%, Memory ${metrics.memoryUtilization.toFixed(1)}%`);
  });
  
  autoScaler.on('predictionsGenerated', (data) => {
    console.log(`Generated ${data.count} predictions for the next ${data.horizon}`);
  });
  
  autoScaler.on('anomalyDetected', (data) => {
    console.log(`Anomaly detected: ${JSON.stringify(data.anomalies)}`);
  });
  
  autoScaler.on('scalingExecuted', (action) => {
    console.log(`Scaling action executed: ${action.action} from ${action.previousReplicas} to ${action.newReplicas} replicas`);
    console.log(`Reason: ${action.reason} (Confidence: ${action.confidence}%)`);
  });
  
  autoScaler.on('scalingBlocked', (data) => {
    console.log(`Scaling blocked: ${data.reason}`);
  });
  
  autoScaler.on('error', (error) => {
    console.error(`Error: ${error.type} - ${error.error}`);
  });
  
  // Initialize the auto scaler
  await autoScaler.initialize();
  
  // Simulate running for a period of time
  console.log('\nSimulating system activity...');
  
  // Collect metrics and evaluate scaling every 5 seconds (accelerated for demo)
  const simulationInterval = setInterval(async () => {
    await autoScaler.collectMetrics();
    await autoScaler.evaluateScaling();
    
    // Periodically show status
    if (Math.random() > 0.7) {
      const status = autoScaler.getScalingStatus();
      console.log('\nCurrent Status:');
      console.log(`- Replicas: ${status.currentReplicas}/${status.maxReplicas}`);
      console.log(`- CPU: ${status.metrics.cpuUtilization.toFixed(1)}%, Memory: ${status.metrics.memoryUtilization.toFixed(1)}%`);
      
      if (status.predictiveEngine) {
        const predictions = status.predictiveEngine.predictions;
        if (predictions && predictions.length > 0) {
          console.log('\nUpcoming Predictions:');
          predictions.slice(0, 3).forEach(p => {
            const time = new Date(p.timestamp).toLocaleTimeString();
            console.log(`- ${time}: Load ${p.predictedLoad.toFixed(1)}% (Confidence: ${p.confidence.toFixed(1)}%)`);
          });
        }
        
        const trends = status.predictiveEngine.trends;
        console.log('\nCurrent Trends:');
        console.log(`- CPU: ${trends.cpu.direction} (${trends.cpu.magnitude.toFixed(2)})`);
        console.log(`- Memory: ${trends.memory.direction} (${trends.memory.magnitude.toFixed(2)})`);
        console.log(`- Requests: ${trends.requestRate.direction} (${trends.requestRate.magnitude.toFixed(2)})`);
      }
      
      // Get scaling recommendations
      const recommendations = autoScaler.getScalingRecommendations();
      if (recommendations.length > 0) {
        console.log('\nRecommendations:');
        recommendations.forEach(r => {
          console.log(`- ${r.type}: ${r.description} (Priority: ${r.priority})`);
        });
      }
      
      console.log('\n-----------------------------------');
    }
  }, 5000);
  
  // Run for 5 minutes then stop
  setTimeout(() => {
    clearInterval(simulationInterval);
    console.log('\nDemo completed. Shutting down...');
    
    // Final status
    const finalStatus = autoScaler.getScalingStatus();
    console.log(`\nFinal replica count: ${finalStatus.currentReplicas}`);
    console.log(`Scaling actions performed: ${finalStatus.scalingHistory.length}`);
    
    if (finalStatus.predictiveEngine) {
      console.log(`Predictions generated: ${finalStatus.predictiveEngine.status.predictions}`);
      console.log(`Anomalies detected: ${finalStatus.predictiveEngine.status.anomalies}`);
    }
    
    console.log('\nPredictive Scaling Demo completed.');
  }, 5 * 60 * 1000); // 5 minutes
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runPredictiveScalingDemo().catch(error => {
    console.error('Demo failed:', error);
  });
}

module.exports = { runPredictiveScalingDemo };
