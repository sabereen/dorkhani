$commonGit = git rev-parse --git-common-dir
$mainRoot = Split-Path (Resolve-Path $commonGit) -Parent
$target = Join-Path $mainRoot "node_modules"

if (Test-Path ".\node_modules") {
    Remove-Item ".\node_modules" -Recurse -Force
}

New-Item -ItemType Junction `
    -Path ".\node_modules" `
    -Target $target

Write-Host "node_modules linked to $target"
