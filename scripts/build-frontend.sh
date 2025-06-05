#!/bin/bash

# Build script for frontend with configurable API URL
# Usage: ./scripts/build-frontend.sh [API_URL]

set -e

# Default API URL
API_URL=${1:-"http://localhost:8000"}

echo "Building frontend with API URL: $API_URL"

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend"

# Set environment variable for build
export VITE_API_URL="$API_URL"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Run build
echo "Building application..."
npm run build

echo "Frontend built successfully!"
echo "Build output is in: frontend/dist/"
echo ""
echo "To serve the built frontend:"
echo "  cd frontend/dist && python -m http.server 8080"
echo "  # or"
echo "  cd frontend/dist && npx serve ."