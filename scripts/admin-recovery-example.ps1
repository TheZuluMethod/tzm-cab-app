# ============================================================================
# Admin Recovery Script Example (PowerShell)
# ============================================================================
# This script demonstrates how to use the admin recovery Edge Function
# 
# Prerequisites:
# 1. ADMIN_RECOVERY_KEY set in Supabase Edge Function environment variables
# 2. Edge Function deployed: supabase/functions/admin-recovery
# 3. Migration run: supabase/migrations/add_super_admin_column.sql
#
# Usage:
#   .\admin-recovery-example.ps1 -UserEmail "user@example.com"
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$UserEmail,
    
    [string]$SupabaseUrl = "https://your-project.supabase.co",
    [string]$AdminRecoveryKey = "your-recovery-key-here"  # Get from Supabase Edge Function env vars
)

$EdgeFunctionUrl = "$SupabaseUrl/functions/v1/admin-recovery"

# Prepare request body
$body = @{
    user_email = $UserEmail
} | ConvertTo-Json

# Prepare headers
$headers = @{
    "Authorization" = "Bearer $AdminRecoveryKey"
    "Content-Type" = "application/json"
}

Write-Host "🔐 Attempting admin recovery for: $UserEmail" -ForegroundColor Yellow
Write-Host ""

try {
    # Make recovery request
    $response = Invoke-RestMethod -Uri $EdgeFunctionUrl -Method Post -Headers $headers -Body $body
    
    if ($response.success) {
        Write-Host "✅ Admin recovery successful!" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Write-Host ""
        Write-Host "User $UserEmail now has super admin access." -ForegroundColor Green
    } else {
        Write-Host "❌ Admin recovery failed:" -ForegroundColor Red
        Write-Host ($response | ConvertTo-Json -Depth 10)
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

