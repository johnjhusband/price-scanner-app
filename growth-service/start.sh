#!/bin/bash
set -euo pipefail

# Growth service startup script
echo "✨ Starting Flippi Growth Service..."

# Run from growth-service directory
cd "$(dirname "$0")"

# Load environment variables if .env exists
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Set default values for growth service
export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-dummy}"
export ENABLE_REDDIT_AUTOMATION="${ENABLE_REDDIT_AUTOMATION:-false}"
export GROWTH_PORT="${GROWTH_PORT:-3003}"

# Set database path
mkdir -p ../data
export FEEDBACK_DB_PATH="${FEEDBACK_DB_PATH:-../data/feedback.db}"

# Start the service
NODE_PATH=../backend/node_modules:./node_modules node ../growth.js