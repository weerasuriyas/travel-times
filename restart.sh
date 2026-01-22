#!/bin/bash
echo "🔄 Stopping dev server..."
pkill -f "vite.*travel-times-srilanka"
sleep 2
echo "✨ Starting fresh dev server..."
npm run dev
