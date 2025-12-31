#!/bin/sh
set -e

echo "Starting AI Research Agent..."
echo "Node version: $(node --version)"
echo "Environment: ${NODE_ENV:-development}"

if [ -n "$MONGODB_URI" ]; then
  echo "MongoDB URI configured"
else
  echo "No MongoDB URI found"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "Warning: NEXTAUTH_SECRET not set"
fi

echo "Starting Next.js server..."
exec "$@"
