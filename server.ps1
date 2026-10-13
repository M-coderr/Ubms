param(
    [int]$Port = 8080,
    [string]$Root = $PSScriptRoot
)

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
$listener.Start()

$ipList = @()
try {
    $ipList = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
        $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' 
    } | ForEach-Object { $_.IPAddress }
} catch {}

if ($ipList.Count -eq 0) {
    $ipList = @("127.0.0.1")
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  uBMS - Unified Business Management Server Running" -ForegroundColor Cyan
Write-Host "  Local URL: http://localhost:$Port/" -ForegroundColor Yellow
foreach ($ip in $ipList) {
    Write-Host "  LAN URL:   http://${ip}:$Port/" -ForegroundColor Yellow
}
Write-Host "  Serving:   $Root" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".txt"   = "text/plain; charset=utf-8"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"   = "font/ttf"
}

function SendJsonResponse($stream, $statusCode, $statusText, $jsonString) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonString)
    $header = "HTTP/1.1 $statusCode $statusText`r`nContent-Type: application/json; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`r`nAccess-Control-Allow-Headers: Content-Type`r`nConnection: close`r`n`r`n"
    $hBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($hBytes, 0, $hBytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
}

function HandleClient($tcpClient, $rootDir, $types) {
    try {
        $stream = $tcpClient.GetStream()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        
        $reqLine = $reader.ReadLine()
        if (-not $reqLine) {
            $tcpClient.Close()
            return
        }

        $parts = $reqLine.Split(" ")
        if ($parts.Length -lt 2) {
            $tcpClient.Close()
            return
        }

        $method = $parts[0].ToUpper()
        $rawUrl = $parts[1]
        $urlPath = $rawUrl.Split("?")[0]
        $urlPath = [System.Uri]::UnescapeDataString($urlPath)

        # Read headers
        $contentLength = 0
        while ($true) {
            $line = $reader.ReadLine()
            if ([string]::IsNullOrEmpty($line)) { break }
            if ($line -match '^Content-Length:\s*(\d+)') {
                $contentLength = [int]$matches[1]
            }
        }

        # Read Body if POST/PUT
        $body = ""
        if ($contentLength -gt 0) {
            $charBuffer = New-Object char[] $contentLength
            $readTotal = 0
            while ($readTotal -lt $contentLength) {
                $readCount = $reader.Read($charBuffer, $readTotal, $contentLength - $readTotal)
                if ($readCount -le 0) { break }
                $readTotal += $readCount
            }
            $body = New-Object string ($charBuffer, 0, $readTotal)
        }

        # Handle CORS OPTIONS
        if ($method -eq "OPTIONS") {
            $h = "HTTP/1.1 204 No Content`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`r`nAccess-Control-Allow-Headers: Content-Type`r`nConnection: close`r`n`r`n"
            $hb = [System.Text.Encoding]::ASCII.GetBytes($h)
            $stream.Write($hb, 0, $hb.Length)
            $stream.Flush()
            $tcpClient.Close()
            return
        }

        # Generic Dynamic REST API Router for /api/{collection}
        if ($urlPath.StartsWith("/api/")) {
            $endpoint = $urlPath.Substring(5).Trim("/").ToLower()
            $validCollections = @("orders", "users", "products", "estimates", "invoices", "payments", "production", "payroll", "messages", "label_types")
            
            if ($validCollections -contains $endpoint) {
                $targetFile = [System.IO.Path]::Combine($rootDir, "data", "$endpoint.json")
                if ($method -eq "GET") {
                    $json = if (Test-Path $targetFile) { [System.IO.File]::ReadAllText($targetFile, [System.Text.Encoding]::UTF8) } else { "[]" }
                    SendJsonResponse $stream 200 "OK" $json
                    return
                }
                elseif ($method -eq "POST" -or $method -eq "PUT") {
                    if ($body) {
                        $parentDir = [System.IO.Path]::GetDirectoryName($targetFile)
                        if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }
                        [System.IO.File]::WriteAllText($targetFile, $body, [System.Text.Encoding]::UTF8)
                        SendJsonResponse $stream 200 "OK" "{`"status`":`"success`",`"message`":`"$endpoint saved successfully`"}"
                        return
                    }
                }
            }
        }

        # Static file serving
        if ($urlPath -eq "/" -or $urlPath -eq "") {
            $urlPath = "/index.html"
        }

        $relPath = $urlPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
        $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rootDir, $relPath))

        if (-not $filePath.StartsWith($rootDir, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $filePath -PathType Leaf)) {
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($notFound.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($notFound, 0, $notFound.Length)
            $stream.Flush()
            $tcpClient.Close()
            return
        }

        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }

        $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
        $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($fileBytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)

        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($fileBytes, 0, $fileBytes.Length)
        $stream.Flush()
    }
    catch {
        # Silent cleanup on client disconnect
    }
    finally {
        try { $tcpClient.Close() } catch {}
    }
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        HandleClient $client $Root $mimeTypes
    }
}
finally {
    $listener.Stop()
}
