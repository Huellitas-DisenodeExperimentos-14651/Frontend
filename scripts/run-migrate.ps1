param(
  [Parameter(Mandatory=$true)][string]$DB_HOST,
  [string]$DB_PORT = "3306",
  [Parameter(Mandatory=$true)][string]$DB_USER,
  [Parameter(Mandatory=$true)][string]$DB_PASS,
  [Parameter(Mandatory=$true)][string]$DB_NAME
)

# Cambiar al directorio server y ejecutar la migración usando variables de entorno
Push-Location -Path (Join-Path $PSScriptRoot '..')
Set-Location -Path '.\server'
$env:DB_HOST = $DB_HOST
$env:DB_PORT = $DB_PORT
$env:DB_USER = $DB_USER
$env:DB_PASS = $DB_PASS
$env:DB_NAME = $DB_NAME

# Use formatted string to avoid invalid variable reference when using ':'
Write-Host ("Running migration against {0}:{1} database {2} as {3}" -f $DB_HOST, $DB_PORT, $DB_NAME, $DB_USER)

npm run migrate-to-mysql

Pop-Location
