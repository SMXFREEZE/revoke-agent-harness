function Import-RevokeSponsorEnvironment {
    [CmdletBinding()]
    param(
        [string]$Path = 'C:\Users\sami\.config\ai\env.local'
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Sponsor credential file was not found at the configured path."
    }

    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -notmatch '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            continue
        }

        $name = $Matches[1]
        $value = $Matches[2].Trim()

        if (
            ($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }

    if (
        [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable('DAYTONA_API_KEY', 'Process')) -and
        -not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable('DAYTONA_API', 'Process'))
    ) {
        [Environment]::SetEnvironmentVariable(
            'DAYTONA_API_KEY',
            [Environment]::GetEnvironmentVariable('DAYTONA_API', 'Process'),
            'Process'
        )
    }

    if (
        [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable('BRIGHTDATA_API_KEY', 'Process')) -and
        -not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable('BRIGHT_DATA_API', 'Process'))
    ) {
        [Environment]::SetEnvironmentVariable(
            'BRIGHTDATA_API_KEY',
            [Environment]::GetEnvironmentVariable('BRIGHT_DATA_API', 'Process'),
            'Process'
        )
    }
}

Import-RevokeSponsorEnvironment
