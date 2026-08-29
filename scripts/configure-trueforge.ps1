[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://localhost:8790',
    [string]$SkillGitUrl = '',
    [string]$SkillGitRef = 'main'
)

$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'import-sponsor-env.ps1')

foreach ($required in @('OPENAI_API_KEY', 'DAYTONA_API_KEY', 'BRIGHTDATA_API_KEY')) {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($required, 'Process'))) {
        throw "Required sponsor credential $required is not available."
    }
}

$apiBase = $BaseUrl.TrimEnd('/') + '/api/v1'
$baseUri = [uri]$BaseUrl
if ($baseUri.Host -notin @('localhost', '127.0.0.1', '::1')) {
    throw 'This setup script only sends sponsor credentials to a local TrueForge instance.'
}

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
        $statusCode = if ($_.Exception.Response) {
            [int]$_.Exception.Response.StatusCode
        } else {
            0
        }
        throw "TrueForge $Method $Path failed with HTTP status $statusCode."
    }
}

foreach ($service in @(
    @{ Name = 'cpsc-recalls'; Url = 'http://127.0.0.1:8940/health' },
    @{ Name = 'revoke-commerce'; Url = 'http://127.0.0.1:8941/health' }
)) {
    try {
        $null = Invoke-RestMethod -Uri $service.Url -TimeoutSec 5
    } catch {
        throw "$($service.Name) is not running at $($service.Url)."
    }
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
$existingSandbox = $null
try {
    $existingSandbox = Invoke-RestMethod -Method Get -Uri "$apiBase/settings/sandbox-providers" -TimeoutSec 10
} catch {
    if (-not $_.Exception.Response -or [int]$_.Exception.Response.StatusCode -ne 404) {
        throw
    }
}
$configuredSandbox = $existingSandbox.data.manifest
$sandboxMatches =
    $null -ne $configuredSandbox -and
    $configuredSandbox.type -eq 'daytona' -and
    $configuredSandbox.exec_timeout_ms -eq 120000 -and
    $configuredSandbox.auto_stop_interval_in_minutes -eq 5 -and
    $configuredSandbox.auto_archive_interval_in_minutes -eq 60 -and
    $configuredSandbox.auto_delete_interval_in_minutes -eq 1440
$sandbox = if ($sandboxMatches) {
    $existingSandbox
} else {
    Invoke-TrueForgeJson -Method Put -Path '/settings/sandbox-providers' -Body $sandboxProvider
}
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
                description = 'Bright Data live search and non-government manufacturer or retailer page collection.'
                auth = @{
                    type = 'header'
                    headers = @{ Authorization = "Bearer $env:BRIGHTDATA_API_KEY" }
                }
            }
        }
    },
    @{
        Name = 'cpsc-recalls'
        ExpectedTools = @('get_source_policy', 'get_recall_snapshot', 'compare_recall_expansion')
        Body = @{
            manifest = @{
                type = 'remote'
                name = 'cpsc-recalls'
                url = 'http://127.0.0.1:8940/mcp'
                description = 'Read-only live verification of the two allowlisted official CPSC recall notices.'
            }
        }
    },
    @{
        Name = 'revoke-commerce'
        ExpectedTools = @(
            'get_demo_catalog',
            'get_orders_by_skus',
            'preview_containment',
            'apply_containment',
            'rollback_containment',
            'create_notice_drafts',
            'get_audit_log'
        )
        Body = @{
            manifest = @{
                type = 'remote'
                name = 'revoke-commerce'
                url = 'http://127.0.0.1:8941/mcp'
                description = 'Simulated merchant catalog, orders, guarded containment, receipts, rollback, and audit.'
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

$includeSkill = -not [string]::IsNullOrWhiteSpace($SkillGitUrl)
if ($includeSkill) {
    $skillBody = @{
        manifest = @{
            type = 'git'
            name = 'recall-containment'
            url = $SkillGitUrl
            path = 'skills/recall-containment'
            ref = $SkillGitRef
            description = 'Evidence-backed product recall matching, sandbox exposure, approval, receipts, and rollback.'
        }
    }
    $null = Invoke-TrueForgeJson -Method Put -Path '/settings/skills' -Body $skillBody
    Write-Output 'trueforge_skill=configured'
}

$agentPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'agents/revoke.agent.json'
$agentManifest = Get-Content -LiteralPath $agentPath -Raw | ConvertFrom-Json
if (-not $includeSkill) {
    $agentManifest.PSObject.Properties.Remove('skills')
}
$agents = Invoke-TrueForgeJson -Method Get -Path '/agents'
$existing = $agents.data | Where-Object { $_.name -eq 'revoke' } | Select-Object -First 1
if ($null -eq $existing) {
    $savedAgent = Invoke-TrueForgeJson -Method Post -Path '/agents' -Body @{
        name = 'revoke'
        manifest = $agentManifest
    }
} else {
    $savedAgent = Invoke-TrueForgeJson -Method Put -Path "/agents/$($existing.id)" -Body @{
        manifest = $agentManifest
    }
}

Write-Output "trueforge_agent=ok:$($savedAgent.data.id)"
Write-Output "trueforge_agent_skill_mode=$(if ($includeSkill) { 'git' } else { 'inline-bootstrap' })"
