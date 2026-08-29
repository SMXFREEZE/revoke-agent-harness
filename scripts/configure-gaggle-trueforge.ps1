[CmdletBinding()]
param([string]$BaseUrl = 'http://localhost:8790')

$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'import-sponsor-env.ps1')

foreach ($required in @('OPENAI_API_KEY', 'DAYTONA_API_KEY', 'BRIGHTDATA_API_KEY')) {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($required, 'Process'))) {
        throw "Required sponsor credential $required is not available."
    }
}

$baseUri = [uri]$BaseUrl
if ($baseUri.Host -notin @('localhost', '127.0.0.1', '::1')) {
    throw 'This setup script only sends sponsor credentials to a local TrueForge instance.'
}
$apiBase = $BaseUrl.TrimEnd('/') + '/api/v1'

function Invoke-TrueForgeJson {
    param(
        [Parameter(Mandatory)] [ValidateSet('Get', 'Post', 'Put')] [string]$Method,
        [Parameter(Mandatory)] [string]$Path,
        [object]$Body
    )
    $arguments = @{
        Method = $Method
        Uri = $script:apiBase + $Path
        ContentType = 'application/json'
        TimeoutSec = 180
    }
    if ($null -ne $Body) {
        $arguments.Body = $Body | ConvertTo-Json -Depth 30 -Compress
    }
    try {
        return Invoke-RestMethod @arguments
    } catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        throw "TrueForge $Method $Path failed with HTTP status $statusCode."
    }
}

try {
    $null = Invoke-RestMethod -Uri 'http://127.0.0.1:8942/health' -TimeoutSec 5
} catch {
    throw 'gaggle-lab is not running at http://127.0.0.1:8942/health.'
}

$modelProvider = @{
    manifest = @{
        type = 'openai'
        base_url = 'https://api.openai.com/v1'
        auth = @{ api_key = $env:OPENAI_API_KEY }
        models = @(
            @{
                model_id = 'gpt-5.6-sol'
                name = 'gpt-5-6-sol'
                properties = @{
                    context_length = 1050000
                    max_output_tokens = 128000
                    reasoning_efforts = @('none', 'low', 'medium', 'high', 'xhigh', 'max')
                }
            }
        )
    }
}
$null = Invoke-TrueForgeJson -Method Put -Path '/settings/model-providers' -Body $modelProvider
Write-Output 'trueforge_openai=configured'

$sandboxProvider = @{
    manifest = @{
        type = 'daytona'
        auth = @{ api_key = $env:DAYTONA_API_KEY }
        exec_timeout_ms = 120000
        auto_stop_interval_in_minutes = 5
        auto_archive_interval_in_minutes = 60
        auto_delete_interval_in_minutes = 1440
    }
}
$sandbox = Invoke-TrueForgeJson -Method Put -Path '/settings/sandbox-providers' -Body $sandboxProvider
Write-Output "trueforge_daytona=$($sandbox.data.status)"

$connectors = @(
    @{
        Name = 'bright-data'
        ExpectedTools = @('search_engine', 'scrape_as_markdown')
        Body = @{
            manifest = @{
                type = 'remote'
                name = 'bright-data'
                url = 'https://mcp.brightdata.com/mcp?tools=search_engine,scrape_as_markdown'
                description = 'Live public microbiome evidence search and collection with provenance.'
                auth = @{
                    type = 'header'
                    headers = @{ Authorization = "Bearer $env:BRIGHTDATA_API_KEY" }
                }
            }
        }
    },
    @{
        Name = 'gaggle-lab'
        ExpectedTools = @(
            'get_synthetic_case',
            'preview_experimental_proposal',
            'promote_experimental_proposal',
            'get_investigation_audit'
        )
        Body = @{
            manifest = @{
                type = 'remote'
                name = 'gaggle-lab'
                url = 'http://127.0.0.1:8942/mcp'
                description = 'Synthetic microbiome case, immutable proposal preview, guarded scientist approval, and audit.'
            }
        }
    }
)

foreach ($connector in $connectors) {
    $null = Invoke-TrueForgeJson -Method Put -Path '/settings/mcp-servers' -Body $connector.Body
    $tools = Invoke-TrueForgeJson -Method Get -Path "/mcp-servers/$($connector.Name)/tools"
    $publishedNames = @($tools.data | ForEach-Object { $_.name })
    $missing = @($connector.ExpectedTools | Where-Object { $_ -notin $publishedNames })
    if ($missing.Count -gt 0) {
        throw "$($connector.Name) did not publish required tools: $($missing -join ', ')."
    }
    Write-Output "trueforge_mcp_$($connector.Name)=ok:$($publishedNames.Count)"
}

$agentPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'agents/gaggle.agent.json'
$agentManifest = Get-Content -LiteralPath $agentPath -Raw | ConvertFrom-Json
$agents = Invoke-TrueForgeJson -Method Get -Path '/agents'
$existing = $agents.data | Where-Object { $_.name -eq 'gaggle' } | Select-Object -First 1
if ($null -eq $existing) {
    $savedAgent = Invoke-TrueForgeJson -Method Post -Path '/agents' -Body @{
        name = 'gaggle'
        manifest = $agentManifest
    }
} else {
    $savedAgent = Invoke-TrueForgeJson -Method Put -Path "/agents/$($existing.id)" -Body @{
        manifest = $agentManifest
    }
}

Write-Output "trueforge_agent=ok:$($savedAgent.data.id)"
Write-Output 'trueforge_agent_mode=adversarial-biotech'
