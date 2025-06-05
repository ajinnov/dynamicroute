#!/bin/bash

# Deployment script for DynamicRoute53
# Usage: ./scripts/deploy.sh [production|development] [API_URL]

set -e

MODE=${1:-development}
API_URL=${2}

echo "Deploying DynamicRoute53 in $MODE mode"

case $MODE in
  "production")
    if [ -z "$API_URL" ]; then
      echo "Error: API_URL is required for production deployment"
      echo "Usage: ./scripts/deploy.sh production https://api.yourdomain.com"
      exit 1
    fi
    
    echo "Building frontend for production with API URL: $API_URL"
    ./scripts/build-frontend.sh "$API_URL"
    
    echo "Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d
    ;;
    
  "development")
    API_URL=${API_URL:-"http://localhost:8000"}
    echo "Starting development services with API URL: $API_URL"
    
    # Set environment variable for development
    export VITE_API_URL="$API_URL"
    
    docker-compose up -d
    ;;
    
  *)
    echo "Error: Invalid mode. Use 'production' or 'development'"
    exit 1
    ;;
esac

echo "Deployment completed!"
echo ""
echo "Services should be available at:"
echo "  Frontend: http://localhost:3000 (development) or http://localhost (production)"
echo "  Backend: http://localhost:8000"
echo "  Database: localhost:5432"
echo ""
echo "To check status: docker-compose ps"
echo "To view logs: docker-compose logs -f"