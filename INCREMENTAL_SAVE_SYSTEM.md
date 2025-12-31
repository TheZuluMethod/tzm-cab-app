# Incremental Save System

## ✅ Implementation Complete

All user information is now saved incrementally at each step to prevent data loss.

## 🔄 Save Points

### Step 1: After ICP Setup Form Submission
- **Trigger**: User clicks "Next: Tell us what you want to test..."
- **Saved**: All ICP setup form data (`input` JSONB)
- **Status**: `draft`
- **App State**: `SETUP`

### Step 2: After Setup Form Submission
- **Trigger**: User clicks "Recruit my board!"
- **Saved**: Complete user input (merged from Step 1 + Step 2)
- **Status**: `draft`
- **App State**: `ASSEMBLING`

### Step 3: After Board Assembly
- **Trigger**: Board members generated successfully
- **Saved**: User input + generated board members
- **Status**: `draft`
- **App State**: `BOARD_READY`

### Step 4: Before Analysis Starts
- **Trigger**: User clicks "Start Board Session"
- **Saved**: User input + board members
- **Status**: `draft`
- **App State**: `ANALYZING`

### Step 5: During Analysis (Periodic Saves)
- **Trigger**: Every 5000 characters of report generated
- **Saved**: User input + board members + partial report + competitor analysis (if applicable)
- **Status**: `draft`
- **App State**: `ANALYZING`

### Step 6: After Analysis Completes
- **Trigger**: Analysis streaming completes
- **Saved**: User input + board members + complete report + competitor analysis
- **Status**: `draft`
- **App State**: `ANALYZING`

### Step 7: Final Save (Complete)
- **Trigger**: Report generation completes with QC
- **Saved**: All data including ICP profile, persona breakdowns, dashboard data, QC status
- **Status**: `complete`
- **App State**: `COMPLETE`

## 🛡️ Data Protection & Stopgaps

### 1. Data Validation
- ✅ **Input Validation**: All data is validated before saving
- ✅ **Type Checking**: Ensures data types match expected formats
- ✅ **Required Fields**: Validates required fields are present
- ✅ **Array Validation**: Validates arrays contain valid objects
- ✅ **Member Validation**: Ensures board members have required fields (id, name, role)

### 2. Error Handling
- ✅ **Non-Blocking Saves**: Save failures don't block user flow
- ✅ **Error Logging**: All errors are logged for debugging
- ✅ **Graceful Degradation**: Falls back to localStorage if Supabase unavailable
- ✅ **Retry Logic**: Failed saves are logged but don't interrupt user

### 3. Data Corruption Prevention
- ✅ **Partial Updates**: Only updates fields that are provided (prevents overwriting with null)
- ✅ **Data Sanitization**: Invalid data is rejected before saving
- ✅ **Type Safety**: TypeScript types ensure data structure integrity
- ✅ **Validation Layers**: Multiple validation checks at different levels

### 4. Session Recovery
- ✅ **Draft Detection**: On app load, checks for incomplete draft sessions
- ✅ **Recovery Prompt**: Offers to recover draft session if found
- ✅ **State Restoration**: Restores all saved state (input, members, report, etc.)
- ✅ **App State Recovery**: Restores user to the exact step they were on

### 5. Database Safeguards
- ✅ **UUID Validation**: Ensures session IDs are valid UUIDs
- ✅ **User Authentication**: Only authenticated users can save
- ✅ **Row Level Security**: Users can only access their own sessions
- ✅ **Conflict Resolution**: Uses `upsert` to handle concurrent updates
- ✅ **Status Tracking**: Tracks draft vs complete status

## 📊 Database Schema Updates

### New Columns Added:
- `status` TEXT DEFAULT 'draft' - Tracks draft vs complete sessions
- `app_state` TEXT - Stores current app state for recovery

### Migration Required:
Run `supabase/migrations/add_draft_session_fields.sql` in your Supabase SQL Editor.

## 🔍 How It Works

1. **Session ID Tracking**: Each session gets a UUID that persists across steps
2. **Incremental Updates**: Each save updates only the fields that have changed
3. **Draft Status**: Sessions remain in 'draft' status until completion
4. **Recovery System**: On app load, checks for draft sessions and offers recovery
5. **Final Save**: When complete, marks session as 'complete' and saves all data

## ✅ Benefits

- **No Data Loss**: User progress is saved at every step
- **Recovery**: Users can resume interrupted sessions
- **Data Integrity**: Validation prevents corrupted data
- **Non-Blocking**: Saves happen in background, don't slow user flow
- **Resilient**: Multiple fallbacks ensure saves always work

