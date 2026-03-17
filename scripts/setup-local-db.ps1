[CmdletBinding()]
param(
  [switch]$SkipCompose
)

$ErrorActionPreference = "Stop"

function Test-Command {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Wait-ForDb {
  $containerId = docker compose ps -q db

  if ([string]::IsNullOrWhiteSpace($containerId)) {
    throw "Could not find the db container from docker compose."
  }

  Write-Host "Waiting for PostgreSQL to become healthy..."

  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    $healthStatus = docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $containerId

    if ($healthStatus -eq "healthy" -or $healthStatus -eq "running") {
      Write-Host "PostgreSQL is ready."
      return
    }

    Start-Sleep -Seconds 2
  }

  throw "PostgreSQL did not become ready in time."
}

$repoRoot = Split-Path -Path $PSScriptRoot -Parent

Test-Command -Name npm
Set-Location $repoRoot

if (-not $SkipCompose) {
  Test-Command -Name docker
  Write-Host "Starting PostgreSQL with Docker Compose..."
  docker compose up -d
  Wait-ForDb
} else {
  Write-Host "Skipping Docker Compose startup."
}

Write-Host "Applying database migrations..."
& npm run db:migrate

Write-Host "Seeding Pokedex catalog data..."
& npm run db:seed:pokedex

Write-Host "Local database setup completed."
