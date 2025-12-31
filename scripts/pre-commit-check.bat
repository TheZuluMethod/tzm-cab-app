@echo off
REM Pre-commit hook to check for sensitive data (Windows)

echo 🔍 Checking for sensitive data before commit...

REM Check for .env files
git diff --cached --name-only | findstr /R "\.env$ \.env\." >nul
if %errorlevel% equ 0 (
    echo ❌ ERROR: .env files detected in commit!
    echo    .env files should NEVER be committed to Git.
    exit /b 1
)

REM Check for common secret patterns
git diff --cached | findstr /I "sk_live sk_test STRIPE_SECRET SUPABASE_SERVICE_ROLE service_role" >nul
if %errorlevel% equ 0 (
    echo ❌ ERROR: Potential secrets detected in commit!
    echo    Please remove secrets from your code before committing.
    exit /b 1
)

echo ✅ No sensitive data detected. Proceeding with commit...
exit /b 0

