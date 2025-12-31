#!/bin/bash
# Pre-commit hook to check for sensitive data

echo "🔍 Checking for sensitive data before commit..."

# Check for common secret patterns
SECRET_PATTERNS=(
  "sk_live"
  "sk_test"
  "STRIPE_SECRET"
  "SUPABASE_SERVICE_ROLE"
  "service_role"
  "api_key.*=.*[a-zA-Z0-9]{20,}"
  "secret.*=.*[a-zA-Z0-9]{20,}"
)

FOUND_SECRETS=false

for pattern in "${SECRET_PATTERNS[@]}"; do
  if git diff --cached --name-only | xargs grep -i "$pattern" 2>/dev/null; then
    echo "❌ ERROR: Potential secret found matching pattern: $pattern"
    FOUND_SECRETS=true
  fi
done

# Check for .env files
if git diff --cached --name-only | grep -E "\.env$|\.env\."; then
  echo "❌ ERROR: .env files detected in commit!"
  echo "   .env files should NEVER be committed to Git."
  FOUND_SECRETS=true
fi

if [ "$FOUND_SECRETS" = true ]; then
  echo ""
  echo "🚨 COMMIT BLOCKED: Sensitive data detected!"
  echo "   Please remove secrets from your code before committing."
  echo "   Use environment variables instead."
  exit 1
fi

echo "✅ No sensitive data detected. Proceeding with commit..."
exit 0

