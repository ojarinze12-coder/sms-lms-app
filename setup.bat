@echo off
echo ========================================
echo Edunext Setup Script
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Checking DATABASE_URL...
findstr /C:"UPDATE_ME" .env.local >nul
if %ERRORLEVEL% EQU 0 (
    echo ERROR: Please update your DATABASE_URL in .env.local
    echo.
    echo 1. Go to Supabase Dashboard
    echo 2. Go to Settings ^> Database
    echo 3. Find "Connection string" 
    echo 4. Copy the password you set for the database
    echo 5. Update DATABASE_URL in .env.local with your password
    echo.
    echo Example format:
    echo DATABASE_URL=postgres.xy123abc456:password@db.abc123xyz.supabase.co:5432/postgres
    echo.
    pause
    exit /b 1
)

echo.
echo Step 3: Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo Step 4: Pushing schema to database...
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo Failed to push schema to database
    echo Make sure your DATABASE_URL is correct
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run 'npm run dev' to start the development server
echo 2. Open http://localhost:3000/register
echo 3. Register your first school
echo.
echo Note: After registering, go to Supabase SQL Editor
echo and run the RLS policies script from prisma/rls-policies.sql
echo.
pause
