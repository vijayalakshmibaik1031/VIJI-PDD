#!/usr/bin/env bash
set -e
# Ensure dependencies are installed
npm install
# Build frontend
npm run build
# Start backend in background
nohup node backend/server.js > backend.log 2>&1 &
# Start frontend preview in background
nohup npm --prefix web-admin run preview -- --host 127.0.0.1 --port 5173 --strictPort > frontend.log 2>&1 &
# Wait for services to become reachable
echo "Waiting for backend and frontend..."
for i in {1..30}; do
  curl -s http://127.0.0.1:5000/ && break || sleep 2
done
for i in {1..30}; do
  curl -s http://127.0.0.1:5173/ && break || sleep 2
done
echo "Services ready, running Selenium tests"
npm run test:headless
