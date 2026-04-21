#!/bin/bash
# CAO Topographique - Automation Deployment Script
# Usage: ./deploy-automations.sh

set -e

# Configuration
OPENHANDS_HOST="https://app.all-hands.dev"

echo "==============================================="
echo "CAO Topographique - AI Automation Deployer"
echo "==============================================="

# Get API Key
if [ -z "$OPENHANDS_API_KEY" ]; then
  echo "Enter your OpenHands API Key:"
  read -s OPENHANDS_API_KEY
fi

if [ -z "$OPENHANDS_API_KEY" ]; then
  echo "ERROR: API Key required. Set OPENHANDS_API_KEY env variable."
  exit 1
fi

# Deploy Automations
echo ""
echo "Deploying automations..."

# 1. Strategic Advisor
curl -s -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Strategic Advisor - CAO",
    "prompt": "Analyse le marché CAO topographique et propose roadmap.",
    "trigger": {"type": "cron", "schedule": "0 9 1 * *"}
  }' && echo " ✓ Strategic Advisor"

# 2. Code Reviewer
curl -s -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Reviewer - CAO",
    "prompt": "Fais revue automatique du code CAO Topographique.",
    "trigger": {"type": "cron", "schedule": "0 2 * * *"}
  }' && echo " ✓ Code Reviewer"

# 3. QA Engineer
curl -s -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "QA Engineer - CAO",
    "prompt": "Exécute tests et génère rapport coverage.",
    "trigger": {"type": "cron", "schedule": "0 1 * * *"}
  }' && echo " ✓ QA Engineer"

# 4. DevOps CI/CD
curl -s -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DevOps CI/CD - CAO",
    "prompt": "Lance build et déploie automatiquement.",
    "trigger": {"type": "cron", "schedule": "*/30 * * * *"}
  }' && echo " ✓ DevOps"

# 5. Technical Writer
curl -s -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technical Writer - CAO",
    "prompt": "Met à jour documentation automatique.",
    "trigger": {"type": "cron", "schedule": "0 6 * * *"}
  }' && echo " ✓ Technical Writer"

# 6. Security Monitor
curl -s -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Security Monitor - CAO",
    "prompt": "Scanne vulnérabilités sécurité.",
    "trigger": {"type": "cron", "schedule": "0 22 * * *"}
  }' && echo " ✓ Security Monitor"

echo ""
echo "==============================================="
echo "Déploiement terminé!"
echo "==============================================="