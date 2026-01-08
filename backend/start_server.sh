#!/bin/bash
# Quick test script to verify backend starts with Redis

cd "$(dirname "$0")"
source venv/bin/activate

echo "Starting backend server with Redis integration..."
echo "Press Ctrl+C to stop"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000
