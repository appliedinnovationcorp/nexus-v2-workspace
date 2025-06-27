#!/bin/bash

# Generate API documentation using Swagger UI

set -e

echo "Generating API documentation..."

# Create output directory
mkdir -p ./dist

# Copy OpenAPI specs
cp ./backend/openapi.yaml ./dist/backend-api.yaml
cp ./ai-services/openapi.yaml ./dist/ai-services-api.yaml
cp ./cms/openapi.yaml ./dist/cms-api.yaml

# Create index.html
cat > ./dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AIC Website API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.5.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.5.0/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.5.0/favicon-16x16.png" sizes="16x16" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    
    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }
    
    body {
      margin: 0;
      background: #fafafa;
    }

    .topbar {
      background-color: #222;
      padding: 10px 0;
    }

    .wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .topbar-wrapper {
      display: flex;
      align-items: center;
    }

    .topbar-logo {
      font-size: 1.5em;
      font-weight: bold;
      color: white;
      text-decoration: none;
    }

    .api-selector {
      margin-left: 20px;
    }

    .api-selector select {
      padding: 5px 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="wrapper">
      <div class="topbar-wrapper">
        <a href="#" class="topbar-logo">AIC Website API Documentation</a>
        <div class="api-selector">
          <select id="api-selector">
            <option value="backend-api.yaml">Backend API</option>
            <option value="ai-services-api.yaml">AI Services API</option>
            <option value="cms-api.yaml">CMS API</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" charset="UTF-8"> </script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js" charset="UTF-8"> </script>
  <script>
    window.onload = function() {
      // Initialize Swagger UI
      const ui = SwaggerUIBundle({
        url: "backend-api.yaml",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });

      // Handle API selector change
      document.getElementById('api-selector').addEventListener('change', function() {
        ui.specActions.updateUrl(this.value);
        ui.specActions.download();
      });

      window.ui = ui;
    }
  </script>
</body>
</html>
EOF

echo "API documentation generated successfully!"
echo "Open ./dist/index.html in a browser to view the documentation."
