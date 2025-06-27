#!/bin/bash

# Run performance tests for AIC Website

set -e

# Configuration
BASE_URL=${BASE_URL:-"https://api.example.com/v1"}
OUTPUT_DIR="./results/$(date +%Y-%m-%d_%H-%M-%S)"
K6_BINARY=${K6_BINARY:-"k6"}

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Log configuration
echo "Performance Test Configuration:" | tee "$OUTPUT_DIR/config.log"
echo "- Base URL: $BASE_URL" | tee -a "$OUTPUT_DIR/config.log"
echo "- Output Directory: $OUTPUT_DIR" | tee -a "$OUTPUT_DIR/config.log"
echo "- K6 Binary: $K6_BINARY" | tee -a "$OUTPUT_DIR/config.log"
echo "- Date: $(date)" | tee -a "$OUTPUT_DIR/config.log"
echo "" | tee -a "$OUTPUT_DIR/config.log"

# Function to run a test
run_test() {
    local test_name=$1
    local scenario=$2
    local duration=$3
    local vus=$4
    
    echo "Running test: $test_name" | tee -a "$OUTPUT_DIR/tests.log"
    echo "- Scenario: $scenario" | tee -a "$OUTPUT_DIR/tests.log"
    echo "- Duration: $duration" | tee -a "$OUTPUT_DIR/tests.log"
    echo "- VUs: $vus" | tee -a "$OUTPUT_DIR/tests.log"
    echo "- Start time: $(date)" | tee -a "$OUTPUT_DIR/tests.log"
    
    # Run the test
    BASE_URL=$BASE_URL $K6_BINARY run \
        --out json="$OUTPUT_DIR/${test_name}.json" \
        --out csv="$OUTPUT_DIR/${test_name}.csv" \
        --summary-export="$OUTPUT_DIR/${test_name}-summary.json" \
        --tag testname="$test_name" \
        --tag scenario="$scenario" \
        ${scenario:+--scenario $scenario} \
        ${duration:+-d $duration} \
        ${vus:+--vus $vus} \
        load-test.js
    
    echo "- End time: $(date)" | tee -a "$OUTPUT_DIR/tests.log"
    echo "" | tee -a "$OUTPUT_DIR/tests.log"
}

# Check if k6 is installed
if ! command -v $K6_BINARY &> /dev/null; then
    echo "Error: k6 is not installed or not found at $K6_BINARY" | tee -a "$OUTPUT_DIR/error.log"
    exit 1
fi

# Run baseline test
echo "Starting baseline test..." | tee -a "$OUTPUT_DIR/tests.log"
run_test "baseline" "browsing" "1m" 10

# Run load test
echo "Starting load test..." | tee -a "$OUTPUT_DIR/tests.log"
run_test "load" "browsing" "5m" 100

# Run API-focused test
echo "Starting API test..." | tee -a "$OUTPUT_DIR/tests.log"
run_test "api" "api_users" "3m" ""

# Run spike test
echo "Starting spike test..." | tee -a "$OUTPUT_DIR/tests.log"
run_test "spike" "spike" "" ""

# Generate HTML report if k6-reporter is available
if command -v node &> /dev/null; then
    echo "Generating HTML report..." | tee -a "$OUTPUT_DIR/tests.log"
    
    # Create a simple Node.js script to generate HTML report
    cat > "$OUTPUT_DIR/generate-report.js" << 'EOF'
const fs = require('fs');
const path = require('path');

// Get all JSON result files
const resultFiles = fs.readdirSync('.').filter(file => file.endsWith('.json') && !file.includes('summary'));

// Create HTML header
let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        h1, h2, h3 { color: #333; }
        .test-case { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric-good { color: green; }
        .metric-warning { color: orange; }
        .metric-bad { color: red; }
        .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Performance Test Results</h1>
    <div class="summary">
        <h2>Test Summary</h2>
        <p>Date: ${new Date().toLocaleString()}</p>
        <p>Number of tests: ${resultFiles.length}</p>
    </div>
`;

// Process each result file
resultFiles.forEach(file => {
    const testName = file.replace('.json', '');
    const summaryFile = `${testName}-summary.json`;
    
    try {
        const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
        
        html += `
        <div class="test-case">
            <h2>Test: ${testName}</h2>
            <h3>Metrics</h3>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Total Requests</td>
                    <td>${summaryData.metrics.http_reqs.count}</td>
                </tr>
                <tr>
                    <td>Request Rate</td>
                    <td>${summaryData.metrics.http_reqs.rate.toFixed(2)} req/s</td>
                </tr>
                <tr>
                    <td>Response Time (avg)</td>
                    <td>${(summaryData.metrics.http_req_duration.avg / 1000).toFixed(2)} s</td>
                </tr>
                <tr>
                    <td>Response Time (p95)</td>
                    <td>${(summaryData.metrics.http_req_duration.p(95) / 1000).toFixed(2)} s</td>
                </tr>
                <tr>
                    <td>Response Time (max)</td>
                    <td>${(summaryData.metrics.http_req_duration.max / 1000).toFixed(2)} s</td>
                </tr>
                <tr>
                    <td>Failed Requests</td>
                    <td>${summaryData.metrics.http_req_failed.count} (${(summaryData.metrics.http_req_failed.rate * 100).toFixed(2)}%)</td>
                </tr>
            </table>
            
            <h3>Thresholds</h3>
            <table>
                <tr>
                    <th>Threshold</th>
                    <th>Status</th>
                </tr>
                ${Object.entries(summaryData.root_group.thresholds || {}).map(([name, threshold]) => `
                <tr>
                    <td>${name}</td>
                    <td class="metric-${threshold.ok ? 'good' : 'bad'}">${threshold.ok ? 'PASSED' : 'FAILED'}</td>
                </tr>
                `).join('')}
            </table>
        </div>
        `;
    } catch (error) {
        html += `
        <div class="test-case">
            <h2>Test: ${testName}</h2>
            <p>Error processing results: ${error.message}</p>
        </div>
        `;
    }
});

// Close HTML
html += `
</body>
</html>
`;

// Write HTML file
fs.writeFileSync('report.html', html);
console.log('HTML report generated: report.html');
EOF
    
    # Run the report generator
    (cd "$OUTPUT_DIR" && node generate-report.js)
    
    echo "HTML report generated: $OUTPUT_DIR/report.html" | tee -a "$OUTPUT_DIR/tests.log"
else
    echo "Node.js not found, skipping HTML report generation" | tee -a "$OUTPUT_DIR/tests.log"
fi

echo "All performance tests completed successfully!" | tee -a "$OUTPUT_DIR/tests.log"
echo "Results saved to: $OUTPUT_DIR"
