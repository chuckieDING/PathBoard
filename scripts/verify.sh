#!/bin/bash
# Pathology Board — Post-Change Verification Script
# Run after any code change to verify everything works

set -e

WORKSPACE="/root/.openclaw/workspace/pathology-board"
LOG="/tmp/pathboard_verify.log"

echo "=== PathBoard Verification $(date) ===" | tee $LOG

cd $WORKSPACE

# 1. TypeScript compile check
echo "[1/4] TypeScript check..." | tee -a $LOG
if npm run build 2>&1 | tee -a $LOG | grep -q "error\|failed"; then
  echo "❌ Build failed — see log below:" | tee -a $LOG
  tail -20 $LOG
  exit 1
fi
echo "✅ Build passed" | tee -a $LOG

# 2. PM2 restart
echo "[2/4] PM2 restart..." | tee -a $LOG
pm2 restart pathology-board 2>&1 | tee -a $LOG | grep -q "online" || { echo "❌ PM2 restart failed"; exit 1; }
echo "✅ PM2 online" | tee -a $LOG

# 3. Wait for startup
sleep 4

# 4. HTTP check
echo "[3/4] HTTP check..." | tee -a $LOG
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000)
if [ "$STATUS" != "200" ]; then
  echo "❌ HTTP $STATUS — expected 200" | tee -a $LOG
  exit 1
fi
echo "✅ HTTP 200 OK" | tee -a $LOG

# 5. API check
echo "[4/4] API check..." | tee -a $LOG
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:3000/api/notes/breast/Fibroadenoma")
if [ "$API_STATUS" != "200" ]; then
  echo "❌ API returned $API_STATUS" | tee -a $LOG
  exit 1
fi
echo "✅ API 200 OK" | tee -a $LOG

echo "" | tee -a $LOG
echo "🎉 All checks passed! ($(date))" | tee -a $LOG
echo "Log: $LOG"
