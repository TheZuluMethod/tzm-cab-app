# Backup Instructions - The Zulu Method CAB App

## ✅ Git Repository Initialized

Your code is now tracked with Git locally. To back it up to a remote repository, follow these steps:

## Option 1: GitHub (Recommended)

### Step 1: Create a GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Name it: `tzm-cab-app` (or your preferred name)
4. Choose **Private** (recommended for business apps)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Step 2: Connect and Push
Run these commands in your terminal (replace `YOUR_USERNAME` with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/tzm-cab-app.git
git branch -M main
git push -u origin main
```

If prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (not your password)
  - Create one at: https://github.com/settings/tokens
  - Select scopes: `repo` (full control of private repositories)

## Option 2: GitLab

### Step 1: Create a GitLab Repository
1. Go to [GitLab.com](https://gitlab.com) and sign in
2. Click "New project" → "Create blank project"
3. Name it: `tzm-cab-app`
4. Choose **Private**
5. Click "Create project"

### Step 2: Connect and Push
```bash
git remote add origin https://gitlab.com/YOUR_USERNAME/tzm-cab-app.git
git branch -M main
git push -u origin main
```

## Option 3: Bitbucket

### Step 1: Create a Bitbucket Repository
1. Go to [Bitbucket.org](https://bitbucket.org) and sign in
2. Click "Create" → "Repository"
3. Name it: `tzm-cab-app`
4. Choose **Private**
5. Click "Create repository"

### Step 2: Connect and Push
```bash
git remote add origin https://bitbucket.org/YOUR_USERNAME/tzm-cab-app.git
git branch -M main
git push -u origin main
```

## 🔒 Important Security Notes

### What's Protected (NOT in Git):
- ✅ `.env` files (if you create them) - API keys are safe
- ✅ `node_modules/` - Dependencies (can be reinstalled)
- ✅ `dist/` - Build outputs
- ✅ `errors.txt` - Temporary error logs

### What's Backed Up:
- ✅ All source code
- ✅ Configuration files
- ✅ Database migrations
- ✅ Documentation

### ⚠️ Never Commit:
- API keys or secrets
- `.env` files
- Personal credentials
- Database passwords

## 📝 Future Updates

After making changes, commit and push:

```bash
git add .
git commit -m "Description of your changes"
git push
```

## 🔄 Restore from Backup

If you need to restore on a new machine:

```bash
git clone https://github.com/YOUR_USERNAME/tzm-cab-app.git
cd tzm-cab-app
npm install
```

Then create a `.env` file with your API keys (see `API_KEY_SETUP.md`).

## 📦 Additional Backup Options

### 1. Automated Backups
Consider setting up:
- **GitHub Actions** for automated deployments
- **Scheduled backups** of your Supabase database
- **Cloud storage** (Dropbox, Google Drive) for database exports

### 2. Database Backup
Your Supabase database should be backed up separately:
- Supabase provides automatic backups on paid plans
- Export SQL dumps regularly: `pg_dump` or Supabase dashboard exports

## ✅ Current Status

- ✅ Git initialized
- ✅ Initial commit created
- ✅ `.gitignore` configured to protect sensitive files
- ⏳ **Next step**: Create remote repository and push

