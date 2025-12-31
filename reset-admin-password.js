/**
 * Admin Password Reset Script
 * 
 * This script helps reset the admin password if you have the Supabase Service Role Key.
 * 
 * Usage:
 * 1. Update the variables below with your values
 * 2. Run: node reset-admin-password.js
 * 
 * IMPORTANT: Keep your SERVICE_ROLE_KEY secret! Never commit it to git.
 */

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

const SUPABASE_URL = 'https://rhbxbrzvefllzqfuzdwb.supabase.co';
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Get from Supabase Dashboard → Settings → API → service_role key
const USER_EMAIL = 'hbrett@thezulumethod.com';
const NEW_PASSWORD = 'YourNewSecurePassword123!'; // Change this to your desired password

// ============================================
// SCRIPT - DO NOT MODIFY BELOW
// ============================================

async function resetAdminPassword() {
  try {
    console.log('🔐 Starting password reset process...');
    console.log(`📧 Looking for user: ${USER_EMAIL}`);
    
    // Step 1: Get user ID
    const usersResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      throw new Error(`Failed to fetch users: ${usersResponse.status} ${errorText}`);
    }

    const users = await usersResponse.json();
    const user = Array.isArray(users.users) 
      ? users.users.find(u => u.email === USER_EMAIL)
      : users.find(u => u.email === USER_EMAIL);

    if (!user) {
      throw new Error(`User with email ${USER_EMAIL} not found`);
    }

    console.log(`✅ Found user: ${user.id}`);
    console.log(`🔄 Resetting password...`);

    // Step 2: Update password
    const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: NEW_PASSWORD,
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update password: ${updateResponse.status} ${errorText}`);
    }

    const result = await updateResponse.json();
    
    console.log('✅ Password reset successful!');
    console.log(`📧 Email: ${USER_EMAIL}`);
    console.log(`🔑 New password: ${NEW_PASSWORD}`);
    console.log('\n⚠️  IMPORTANT: Change this password after logging in!');
    console.log('⚠️  Delete this file after use for security!');
    
    return result;
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    throw error;
  }
}

// Run the script
if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERROR: Please update SERVICE_ROLE_KEY in this file!');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

if (NEW_PASSWORD === 'YourNewSecurePassword123!') {
  console.error('❌ ERROR: Please update NEW_PASSWORD in this file!');
  console.error('   Choose a strong password (8+ chars, uppercase, lowercase, number)');
  process.exit(1);
}

resetAdminPassword()
  .then(() => {
    console.log('\n✅ Done! You can now log in with your new password.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to reset password:', error.message);
    process.exit(1);
  });

