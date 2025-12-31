#!/bin/bash
# ============================================================================
# Admin Recovery Script Example
# ============================================================================
# This script demonstrates how to use the admin recovery Edge Function
# 
# Prerequisites:
# 1. ADMIN_RECOVERY_KEY set in Supabase Edge Function environment variables
# 2. Edge Function deployed: supabase/functions/admin-recovery
# 3. Migration run: supabase/migrations/add_super_admin_column.sql
#
# Usage:
#   ./admin-recovery-example.sh user@example.com
# ============================================================================

# Configuration
SUPABASE_URL="https://your-project.supabase.co"
EDGE_FUNCTION_URL="${SUPABASE_URL}/functions/v1/admin-recovery"
ADMIN_RECOVERY_KEY="your-recovery-key-here"  # Get from Supabase Edge Function env vars
USER_EMAIL="${1}"

# Check if email provided
if [ -z "$USER_EMAIL" ]; then
  echo "❌ Error: User email required"
  echo "Usage: $0 user@example.com"
  exit 1
fi

# Make recovery request
echo "🔐 Attempting admin recovery for: $USER_EMAIL"
echo ""

RESPONSE=$(curl -s -X POST "$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $ADMIN_RECOVERY_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"user_email\": \"$USER_EMAIL\"}")

# Parse response
SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Admin recovery successful!"
  echo "$RESPONSE" | jq .
  echo ""
  echo "User $USER_EMAIL now has super admin access."
else
  echo "❌ Admin recovery failed:"
  echo "$RESPONSE" | jq .
  exit 1
fi

