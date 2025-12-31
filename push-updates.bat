@echo off
REM Quick script to push updates to GitHub (Windows)
REM Usage: push-updates.bat "Your commit message"

if "%~1"=="" (
    echo Usage: push-updates.bat "Your commit message"
    exit /b 1
)

REM Add all changes
git add .

REM Commit with provided message
git commit -m "%~1"

REM Push to GitHub
git push

echo ✅ Updates pushed to GitHub successfully!

