#!/bin/bash

# Set up GitLab CI integration with Jenkins

set -e

echo "Setting up GitLab CI integration with Jenkins..."

# Check if required environment variables are set
if [ -z "$GITLAB_TOKEN" ]; then
  echo "Error: GITLAB_TOKEN environment variable is not set"
  echo "Please set it with: export GITLAB_TOKEN=your_gitlab_token"
  exit 1
fi

if [ -z "$JENKINS_URL" ]; then
  echo "Error: JENKINS_URL environment variable is not set"
  echo "Please set it with: export JENKINS_URL=https://jenkins.example.com"
  exit 1
fi

if [ -z "$JENKINS_USER" ]; then
  echo "Error: JENKINS_USER environment variable is not set"
  echo "Please set it with: export JENKINS_USER=your_jenkins_user"
  exit 1
fi

if [ -z "$JENKINS_TOKEN" ]; then
  echo "Error: JENKINS_TOKEN environment variable is not set"
  echo "Please set it with: export JENKINS_TOKEN=your_jenkins_token"
  exit 1
fi

# Create GitLab CI variables for Jenkins integration
echo "Creating GitLab CI variables..."
curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --form "key=JENKINS_URL" \
  --form "value=$JENKINS_URL" \
  --form "protected=true" \
  --form "masked=false" \
  "https://gitlab.example.com/api/v4/projects/12345/variables"

curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --form "key=JENKINS_USER" \
  --form "value=$JENKINS_USER" \
  --form "protected=true" \
  --form "masked=false" \
  "https://gitlab.example.com/api/v4/projects/12345/variables"

curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --form "key=JENKINS_TOKEN" \
  --form "value=$JENKINS_TOKEN" \
  --form "protected=true" \
  --form "masked=true" \
  "https://gitlab.example.com/api/v4/projects/12345/variables"

# Create webhook in GitLab to trigger Jenkins
echo "Creating GitLab webhook for Jenkins..."
curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --form "url=$JENKINS_URL/gitlab-webhook/post" \
  --form "push_events=true" \
  --form "tag_push_events=true" \
  --form "merge_requests_events=true" \
  --form "enable_ssl_verification=true" \
  --form "token=$(kubectl get secret jenkins-secrets -n jenkins -o jsonpath='{.data.GITLAB_WEBHOOK_SECRET}' | base64 --decode)" \
  "https://gitlab.example.com/api/v4/projects/12345/hooks"

echo "GitLab CI integration with Jenkins set up successfully!"
