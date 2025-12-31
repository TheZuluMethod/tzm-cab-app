# Git Workflow Guide - Keeping Your Code Synced

## Quick Push Commands

### Option 1: Manual Commands (Recommended)
After making changes, run these commands:

```bash
git add .
git commit -m "Description of your changes"
git push
```

### Option 2: Use the Scripts

**Windows:**
```bash
push-updates.bat "Description of your changes"
```

**Mac/Linux:**
```bash
chmod +x push-updates.sh
./push-updates.sh "Description of your changes"
```

## Best Practices

### 1. Commit Frequently
- Commit after completing a feature or fix
- Commit after fixing bugs
- Commit at the end of each work session

### 2. Write Clear Commit Messages
Good examples:
- `"Fix: Analytics snapshot 406 errors"`
- `"Add: Dark mode toggle to admin panel"`
- `"Update: Industry data loading logic"`
- `"Fix: Draft session query errors"`

Bad examples:
- `"updates"`
- `"fix"`
- `"stuff"`

### 3. Check Status Before Committing
```bash
git status
```
This shows what files have changed.

### 4. Review Changes Before Committing
```bash
git diff
```
This shows exactly what changed in each file.

## Automated Workflow (Optional)

### Set up a Git Hook (Auto-commit on save)
Create `.git/hooks/post-commit` to automatically push after commits:

```bash
#!/bin/bash
git push
```

### Use VS Code Git Integration
1. Open Source Control panel (Ctrl+Shift+G)
2. Stage changes (+ icon)
3. Write commit message
4. Click Commit
5. Click Sync Changes (or Push)

## Common Commands Reference

```bash
# Check what's changed
git status

# See detailed changes
git diff

# Add all changes
git add .

# Add specific file
git add path/to/file.ts

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push

# Pull latest from GitHub
git pull

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- .
```

## Troubleshooting

### "Your branch is behind"
```bash
git pull
git push
```

### "Merge conflicts"
```bash
# Resolve conflicts in files, then:
git add .
git commit -m "Resolve merge conflicts"
git push
```

### "Nothing to commit"
Your working directory is clean - all changes are already committed and pushed.

## Daily Workflow Example

```bash
# Morning: Pull latest changes
git pull

# Make your changes...

# After changes: Commit and push
git add .
git commit -m "Add: New feature X"
git push

# End of day: Final push
git add .
git commit -m "End of day: Completed feature Y"
git push
```

## Weekly Backup Reminder

Set a calendar reminder to:
1. Check `git status` - ensure everything is committed
2. Run `git push` - ensure everything is backed up
3. Verify on GitHub that your latest commits are there

