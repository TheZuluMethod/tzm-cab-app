/**
 * Automatic Database Migration Service
 * 
 * This service attempts to automatically add missing database columns.
 * However, due to Supabase security restrictions, ALTER TABLE commands
 * require admin privileges and cannot be run from the client.
 * 
 * This service will detect missing columns and provide clear instructions.
 */

import { supabase } from './supabaseClient';

/**
 * Check if columns exist by attempting to query them
 */
const checkColumnsExist = async (): Promise<{ exists: boolean; missingColumns: string[] }> => {
  if (!supabase) {
    return { exists: false, missingColumns: ['all'] };
  }

  const requiredColumns = ['avatar_url', 'phone', 'company', 'bio', 'website'];
  const missingColumns: string[] = [];

  // Try to query each column
  for (const column of requiredColumns) {
    try {
      const { error } = await supabase
        .from('users')
        .select(column)
        .limit(0); // Just check if column exists, don't fetch data

      if (error) {
        // Check if error is about missing column
        if (error.message?.includes(column) || 
            error.code === '42703' || // PostgreSQL undefined column error
            error.message?.includes('column') && error.message?.includes('does not exist')) {
          missingColumns.push(column);
        }
      }
    } catch (err: any) {
      // If query fails, column likely doesn't exist
      if (err.message?.includes(column) || err.code === '42703') {
        missingColumns.push(column);
      }
    }
  }

  return {
    exists: missingColumns.length === 0,
    missingColumns
  };
};

/**
 * Attempt to add missing columns using a database function
 * This will automatically add columns if the function exists
 */
export const migrateUsersTable = async (): Promise<{ success: boolean; message: string }> => {
  if (!supabase) {
    return { success: false, message: 'Supabase not configured' };
  }

  try {
    // First, check which columns are missing
    const { exists, missingColumns } = await checkColumnsExist();

    if (exists) {
      console.log('✅ All profile columns exist');
      return { success: true, message: 'All columns exist' };
    }

    console.log(`🔄 Missing columns detected: ${missingColumns.join(', ')}`);
    console.log('🔄 Attempting automatic migration...');

    // Try to call the migration function
    try {
      const { data, error } = await supabase.rpc('add_profile_columns');

      if (error) {
        console.error('❌ Migration function error:', error);
        
        // Check if function doesn't exist
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          const migrationSQL = `
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
          `.trim();

          console.warn('⚠️ Migration function not found. Please run this SQL in Supabase:');
          console.warn(migrationSQL);
          console.warn('Or create the function using: supabase/create-migration-function.sql');

          return {
            success: false,
            message: 'Migration function not found. See console for SQL.'
          };
        }

        // Other error
        return {
          success: false,
          message: `Migration failed: ${error.message}`
        };
      }

      // Success! Verify columns were added
      console.log('✅ Migration function executed successfully');
      
      // Wait a moment for changes to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify columns exist now
      const { exists: nowExists, missingColumns: stillMissing } = await checkColumnsExist();

      if (nowExists) {
        console.log('✅ All columns successfully added!');
        return { success: true, message: 'Columns added successfully' };
      } else {
        console.warn('⚠️ Some columns still missing:', stillMissing.join(', '));
        return {
          success: false,
          message: `Some columns still missing: ${stillMissing.join(', ')}`
        };
      }
    } catch (rpcError: any) {
      console.error('❌ Error calling migration function:', rpcError);
      
      const migrationSQL = `
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      `.trim();

      console.warn('📋 Please run this SQL manually in Supabase Dashboard → SQL Editor:');
      console.warn(migrationSQL);

      return {
        success: false,
        message: `Migration function error: ${rpcError.message || 'Unknown error'}. See console for manual SQL.`
      };
    }
  } catch (error: any) {
    console.error('Migration check error:', error);
    return { success: false, message: error.message || 'Unknown error' };
  }
};

/**
 * Run all migrations on app startup
 */
export const runMigrations = async (): Promise<void> => {
  if (!supabase) {
    return;
  }

  try {
    console.log('🔄 Checking database schema...');
    const result = await migrateUsersTable();
    
    if (result.success) {
      console.log('✅ Database schema is up to date');
    } else {
      console.warn('⚠️', result.message);
      // Show prominent message in console
      console.log('%c⚠️ Database Migration Required', 'color: orange; font-weight: bold; font-size: 14px;');
      console.log('%cCheck the console above for SQL to run', 'color: orange;');
    }
  } catch (error) {
    console.error('❌ Migration check failed:', error);
  }
};
