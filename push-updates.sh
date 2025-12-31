#!/bin/bash
# Quick script to push updates to GitHub
# Usage: ./push-updates.sh "Your commit message"

# Check if commit message provided
if [ -z "$1" ]; then
    echo "Usage: ./push-updates.sh 'Your commit message'"
    exit 1
fi

# Add all changes
git add .

# Commit with provided message
git commit -m "$1"

# Push to GitHub
git push

echo "✅ Updates pushed to GitHub successfully!"

