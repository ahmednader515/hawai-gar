#Requires -Version 5.1
<#
.SYNOPSIS
  Creates all tables from prisma/schema.prisma on your PostgreSQL database (e.g. Neon).

.DESCRIPTION
  1. Generates Prisma Client
  2. Pushes the schema to the DB (CREATE TABLE, enums, indexes)
  3. Runs the seed (locations, default admin user, etc.)

  Prerequisites:
  - `.env` with DATABASE_URL (and optional DATABASE_DIRECT_URL for Neon direct connection)
  - Node.js and npm dependencies installed (`npm install`)

.EXAMPLE
  cd "d:\web dev\gulf-container"
  .\scripts\setup-database.ps1
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot

Write-Host "==> Project: $ProjectRoot" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
  Write-Host "ERROR: .env not found. Copy .env.example to .env and set DATABASE_URL." -ForegroundColor Red
  exit 1
}

Write-Host "`n==> prisma generate" -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n==> prisma db push (creates/updates all tables from schema.prisma)" -ForegroundColor Cyan
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n==> prisma db seed" -ForegroundColor Cyan
npx prisma db seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nDone. Tables should exist; try registering again." -ForegroundColor Green
