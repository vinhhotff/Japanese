# PowerShell script to fix all icons strokeWidth from 2 to 1.5

$files = Get-ChildItem -Path "src/components" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace 'strokeWidth="2"', 'strokeWidth="1.5"'
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`nDone! All icons updated to strokeWidth='1.5'" -ForegroundColor Cyan
