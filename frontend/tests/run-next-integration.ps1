$ErrorActionPreference = 'Stop'

$port = 3012
$baseUrl = "http://127.0.0.1:$port"
$workdir = Resolve-Path (Join-Path $PSScriptRoot '..')
$logPath = Join-Path $workdir 'next-integration.log'

$job = Start-Job -ScriptBlock {
  param($dir, $log, $serverPort)
  Set-Location $dir
  npm.cmd run start -- -p $serverPort *> $log
} -ArgumentList $workdir, $logPath, $port

try {
  $ready = $false
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 500
    try {
      $null = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing -TimeoutSec 2
      $ready = $true
      break
    } catch {}
  }

  if (-not $ready) {
    if (Test-Path $logPath) { Get-Content $logPath -Tail 80 }
    throw "Next integration server did not start on $baseUrl"
  }

  $env:NEXT_INTEGRATION_BASE_URL = $baseUrl
  node (Join-Path $PSScriptRoot 'next-http.integration.mjs')
} finally {
  Stop-Job $job -ErrorAction SilentlyContinue
  Remove-Job $job -Force -ErrorAction SilentlyContinue
  Remove-Item Env:\NEXT_INTEGRATION_BASE_URL -ErrorAction SilentlyContinue
  if (Test-Path $logPath) { Remove-Item $logPath -ErrorAction SilentlyContinue }
}
