import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');
const successRate = new Rate('success_rate');
const apiLatency = new Trend('api_latency');

// Configuration
export const options = {
  scenarios: {
    // Common user behavior
    browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
    },
    // API-heavy usage
    api_users: {
      executor: 'constant-arrival-rate',
      rate: 50,                // 50 iterations per second
      timeUnit: '1s',          // 1 second
      duration: '10m',
      preAllocatedVUs: 50,     // Initial pool of VUs
      maxVUs: 200,             // Maximum pool of VUs
    },
    // Spike test
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '1m', target: 10 },   // Normal load
        { duration: '30s', target: 200 }, // Spike
        { duration: '3m', target: 200 },  // Sustained spike
        { duration: '30s', target: 10 },  // Back to normal
        { duration: '2m', target: 10 },   // Continue normal
      ],
      preAllocatedVUs: 50,
      maxVUs: 500,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    'http_req_duration{endpoint:login}': ['p(95)<300'], // Login should be faster
    'http_req_duration{endpoint:content}': ['p(95)<200'], // Content API should be very fast
    'successful_logins': ['count>100'],
    'success_rate': ['rate>0.95'], // 95% success rate
  },
};

// Shared data
const BASE_URL = __ENV.BASE_URL || 'https://api.example.com/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
let authToken = AUTH_TOKEN;

// Helper functions
function getAuthToken() {
  if (authToken) return authToken;
  
  const credentials = {
    email: 'loadtest@example.com',
    password: 'Password123!'
  };
  
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(credentials), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login' }
  });
  
  if (loginRes.status === 200) {
    successfulLogins.add(1);
    authToken = JSON.parse(loginRes.body).accessToken;
    return authToken;
  } else {
    failedLogins.add(1);
    console.log(`Login failed: ${loginRes.status} ${loginRes.body}`);
    return '';
  }
}

function makeAuthenticatedRequest(method, url, body = null) {
  const token = getAuthToken();
  if (!token) return null;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const options = {
    headers: headers
  };
  
  let response;
  if (method === 'GET') {
    response = http.get(url, options);
  } else if (method === 'POST') {
    response = http.post(url, JSON.stringify(body), options);
  } else if (method === 'PUT') {
    response = http.put(url, JSON.stringify(body), options);
  } else if (method === 'DELETE') {
    response = http.del(url, null, options);
  }
  
  successRate.add(response.status < 400);
  apiLatency.add(response.timings.duration);
  
  return response;
}

// Main test function
export default function() {
  group('Authentication', () => {
    const credentials = {
      email: `user_${randomString(8)}@example.com`,
      password: 'Password123!'
    };
    
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(credentials), {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'login' }
    });
    
    check(loginRes, {
      'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
    
    if (loginRes.status === 200) {
      successfulLogins.add(1);
      const token = JSON.parse(loginRes.body).accessToken;
      
      // Test token refresh
      const refreshRes = http.post(`${BASE_URL}/auth/refresh`, JSON.stringify({
        refreshToken: JSON.parse(loginRes.body).refreshToken
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        tags: { endpoint: 'refresh' }
      });
      
      check(refreshRes, {
        'refresh token works': (r) => r.status === 200,
      });
    }
  });
  
  sleep(randomIntBetween(1, 3));
  
  group('Content API', () => {
    const contentRes = http.get(`${BASE_URL}/content?limit=10`, {
      tags: { endpoint: 'content' }
    });
    
    check(contentRes, {
      'content status is 200': (r) => r.status === 200,
      'content has data': (r) => JSON.parse(r.body).data.length > 0,
    });
    
    if (contentRes.status === 200) {
      const content = JSON.parse(contentRes.body).data;
      if (content.length > 0) {
        const contentId = content[0].id;
        
        const contentDetailRes = http.get(`${BASE_URL}/content/${contentId}`, {
          tags: { endpoint: 'content_detail' }
        });
        
        check(contentDetailRes, {
          'content detail status is 200': (r) => r.status === 200,
          'content detail has correct id': (r) => JSON.parse(r.body).data.id === contentId,
        });
      }
    }
  });
  
  sleep(randomIntBetween(1, 3));
  
  group('User API', () => {
    const token = getAuthToken();
    if (!token) return;
    
    const usersRes = makeAuthenticatedRequest('GET', `${BASE_URL}/users?limit=10`);
    
    check(usersRes, {
      'users status is 200': (r) => r.status === 200,
      'users has data': (r) => JSON.parse(r.body).data.length > 0,
    });
  });
  
  sleep(randomIntBetween(1, 3));
  
  group('AI Services API', () => {
    const token = getAuthToken();
    if (!token) return;
    
    const aiRequest = {
      prompt: "Write a short product description for a coffee maker.",
      maxTokens: 100,
      temperature: 0.7
    };
    
    const aiRes = makeAuthenticatedRequest('POST', `${BASE_URL}/ai/content/generate`, aiRequest);
    
    check(aiRes, {
      'AI service status is 200': (r) => r.status === 200,
      'AI service returns content': (r) => JSON.parse(r.body).content.length > 0,
    });
  });
  
  sleep(randomIntBetween(3, 8));
}

// Setup function (runs once per VU)
export function setup() {
  console.log('Running setup...');
  
  // Get initial auth token
  const credentials = {
    email: 'loadtest@example.com',
    password: 'Password123!'
  };
  
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(credentials), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (loginRes.status === 200) {
    console.log('Setup: Successfully logged in');
    return JSON.parse(loginRes.body).accessToken;
  } else {
    console.log(`Setup: Login failed: ${loginRes.status} ${loginRes.body}`);
    return '';
  }
}

// Teardown function (runs at the end of the test)
export function teardown(data) {
  console.log('Running teardown...');
  
  if (data) {
    // Logout or cleanup if needed
    const logoutRes = http.post(`${BASE_URL}/auth/logout`, null, {
      headers: {
        'Authorization': `Bearer ${data}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Teardown: Logout status: ${logoutRes.status}`);
  }
}
