# play.ps1 — Windows fallback launcher (no Python needed; PowerShell is built into Windows).
# play.bat runs this automatically when it can't find Python. Serves this folder on
# http://localhost and opens the game. Close this window (or press Ctrl+C) to stop.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path (Join-Path $root 'index.html'))) {
  Write-Host "Hmm - I can't find index.html next to this launcher."
  Read-Host "Press Enter to close"
  exit 1
}

# Pick a free port starting at 8000.
$port = 8000
while ($port -lt 8050) {
  try {
    $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    $probe.Start(); $probe.Stop(); break
  } catch { $port++ }
}

$mime = @{
  '.html'='text/html'; '.htm'='text/html'; '.js'='text/javascript'; '.mjs'='text/javascript';
  '.css'='text/css'; '.json'='application/json'; '.wasm'='application/wasm'; '.svg'='image/svg+xml';
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif'; '.webp'='image/webp';
  '.ico'='image/x-icon'; '.mp3'='audio/mpeg'; '.ogg'='audio/ogg'; '.wav'='audio/wav';
  '.glb'='model/gltf-binary'; '.gltf'='model/gltf+json'; '.ttf'='font/ttf'; '.woff'='font/woff'; '.woff2'='font/woff2'
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

$url = "http://localhost:$port/index.html"
Write-Host ""
Write-Host "  Your game is playing at:  $url"
Write-Host "  Leave this window open while you play. Close it to stop."
Write-Host ""
Start-Process $url

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '') { $rel = 'index.html' }
      $file = Join-Path $root $rel
      $res = $ctx.Response
      $res.Headers['Cache-Control'] = 'no-store'
      if (Test-Path $file -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] }
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
      }
    } catch {
      # A browser that reloads or cancels mid-response throws here — ignore and keep serving.
    } finally {
      try { $ctx.Response.OutputStream.Close() } catch {}
    }
  }
} finally {
  $listener.Stop()
}
