# Starts the bundled MongoDB 8.0 server as a detached background process.
$repoRoot = Split-Path $PSScriptRoot -Parent
$dbpath = Join-Path $repoRoot '.mongo-data'
New-Item -ItemType Directory -Force -Path $dbpath | Out-Null


$mongod = Join-Path $PSScriptRoot 'downloads\bin\mongod.exe'
if (-not (Test-Path $mongod)) {
    Write-Error "mongod.exe not found at $mongod"
    exit 1
}

$existing = Get-NetTCPConnection -LocalPort 27017 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Output 'MONGO_ALREADY_RUNNING'
    exit 0
}

Start-Process -FilePath $mongod -ArgumentList @('--dbpath', $dbpath, '--port', '27017') -WindowStyle Hidden
Start-Sleep -Seconds 4
$check = Get-NetTCPConnection -LocalPort 27017 -State Listen -ErrorAction SilentlyContinue
if ($check) { Write-Output 'MONGO_STARTED' } else { Write-Output 'MONGO_FAILED_TO_START' }

