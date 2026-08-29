[CmdletBinding()]
param()

& (Join-Path $PSScriptRoot 'import-sponsor-env.ps1')

if ([string]::IsNullOrWhiteSpace($env:DAYTONA_API_KEY)) {
    Write-Error 'Daytona credential is not available in the current process.'
    exit 2
}

$baseUrl = if ([string]::IsNullOrWhiteSpace($env:DAYTONA_API_URL)) {
    'https://app.daytona.io/api'
} else {
    $env:DAYTONA_API_URL.TrimEnd('/')
}
$baseUri = [uri]$baseUrl

if (
    $baseUri.Scheme -ne 'https' -or
    -not ($baseUri.Host -eq 'app.daytona.io' -or $baseUri.Host.EndsWith('.daytona.io'))
) {
    Write-Error 'Refusing to send the Daytona credential to an untrusted endpoint.'
    exit 3
}

$headers = @{
    Authorization = "Bearer $env:DAYTONA_API_KEY"
    'X-Daytona-Source' = 'revoke-sponsor-check'
}

try {
    $response = Invoke-RestMethod -Method Get -Uri "$baseUrl/api-keys/current" -Headers $headers
    $metadata = $response | ConvertTo-Json -Depth 12 -Compress
    $requiredScopes = @(
        'write:sandboxes',
        'delete:sandboxes',
        'write:snapshots',
        'delete:snapshots'
    )
    $missingScopes = @($requiredScopes | Where-Object { $metadata -notmatch [regex]::Escape($_) })

    [ordered]@{
        status = if ($missingScopes.Count -eq 0) { 'ok' } else { 'insufficient_scope' }
        provider = 'daytona'
        host = $baseUri.Host
        requiredScopes = $requiredScopes
        missingScopes = $missingScopes
    } | ConvertTo-Json -Compress

    if ($missingScopes.Count -gt 0) {
        exit 4
    }
} catch {
    $statusCode = if ($_.Exception.Response) {
        [int]$_.Exception.Response.StatusCode
    } else {
        0
    }
    Write-Error "Daytona authentication check failed with HTTP status $statusCode."
    exit 1
}
