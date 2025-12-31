# Auto-Commit Setup Guide

## Current Status

### ❌ No Automatic CI/CD
Currently, changes must be manually committed and pushed. There is **no automatic CI/CD pipeline** running.

## Options for Auto-Commit

### Option 1: Git Hooks (Recommended for Local Development)

#### Pre-commit Hook (Prevents Secret Commits)
```bash
# Windows
copy scripts\pre-commit-check.bat .git\hooks\pre-commit

# Mac/Linux
cp scripts/pre-commit-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

#### Post-commit Hook (Auto-push)
Create `.git/hooks/post-commit`:
```bash
#!/bin/bash
git push
```

**Windows:** Create `.git/hooks/post-commit.bat`:
```batch
@echo off
git push
```

### Option 2: VS Code Task (Recommended)

Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Git: Commit and Push",
      "type": "shell",
      "command": "git add . && git commit -m 'Auto-commit: ${input:commitMessage}' && git push",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always"
      },
      "inputs": [
        {
          "id": "commitMessage",
          "type": "promptString",
          "description": "Commit message"
        }
      ]
    }
  ]
}
```

### Option 3: GitHub Actions (For Automated Workflows)

A basic workflow file has been created at `.github/workflows/auto-commit.yml`, but this requires manual triggering.

**Note:** GitHub Actions cannot automatically commit changes from the same repository (would cause infinite loops). For true CI/CD, you'd need:
- Separate deployment repository
- Or use GitHub Actions for testing/deployment only

## Recommended Approach

**For now, use manual commits with the provided scripts:**

```bash
# Windows
push-updates.bat "Your commit message"

# Mac/Linux
./push-updates.sh "Your commit message"
```

This ensures:
- ✅ You review changes before committing
- ✅ You write meaningful commit messages
- ✅ You control what gets pushed
- ✅ No accidental secret commits

## Security Checks

The pre-commit hook will:
- ✅ Block commits containing `.env` files
- ✅ Block commits containing secret patterns
- ✅ Warn about potential API keys

## Next Steps

1. **Set up pre-commit hook** (prevents secret commits)
2. **Use push scripts** for manual commits
3. **Consider GitHub Actions** for testing/deployment (optional)

