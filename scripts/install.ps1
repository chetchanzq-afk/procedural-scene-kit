# 安装 procedural-scene-kit 到目标 harness
# 用法:
#   powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -Target trae-cn
#   -Target: trae-cn | trae | claude | codex-user | codex-project
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('trae-cn', 'trae', 'claude', 'codex-user', 'codex-project')]
    [string]$Target
)

$Name = 'procedural-scene-kit'
$Src = Split-Path -Parent $PSScriptRoot

$Dest = switch ($Target) {
    'trae-cn'       { Join-Path $HOME ".trae-cn\skills\$Name" }
    'trae'          { Join-Path $HOME ".trae\skills\$Name" }
    'claude'        { Join-Path $HOME ".claude\skills\$Name" }
    'codex-user'    { Join-Path $HOME ".agents\skills\$Name" }
    'codex-project' { Join-Path (Get-Location) ".agents\skills\$Name" }
}

$Parent = Split-Path -Parent $Dest
if (-not (Test-Path $Parent)) { New-Item -ItemType Directory -Path $Parent -Force | Out-Null }
if (Test-Path $Dest) { Remove-Item $Dest -Recurse -Force }
Copy-Item $Src $Dest -Recurse -Force

Write-Host "已安装到: $Dest"
Write-Host "运行示例: cd `"$Dest\assets\kit`"; python -m http.server 8877"
