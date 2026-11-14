@echo off
title InternTrack AI

echo ===================================================
echo   InternTrack AI - Starting Application
echo ===================================================
echo.

if not exist .env (
    echo [.env file not found. Creating from .env.example...]
    copy .env.example .env
)

echo [1/3] Generating Prisma Database Client...
call npx prisma generate

echo.
echo [2/3] Syncing Database Schema...
call npx prisma db push || (
    echo.
    echo [WARNING] Could not connect to PostgreSQL database.
    echo Please verify DATABASE_URL in your .env file with your local PostgreSQL password.
    echo.
)

echo.
echo [3/3] Starting Server (Frontend + Backend)...
echo.
echo App running at: http://localhost:3000
echo ===================================================
echo.

call npx tsx server.ts
