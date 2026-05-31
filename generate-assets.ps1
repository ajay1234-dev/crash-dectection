# generate-assets.ps1
# Creates placeholder PNG assets for CrashGuard using .NET System.Drawing
# Run this once from the project root: .\generate-assets.ps1

Add-Type -AssemblyName System.Drawing

function Create-PlaceholderPng {
    param(
        [string]$FilePath,
        [int]$Width,
        [int]$Height,
        [string]$Label
    )

    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)

    # Background fill (#0f0f0f)
    $bg = [System.Drawing.Color]::FromArgb(255, 15, 15, 15)
    $g.Clear($bg)

    # Draw a red rounded rect as shield placeholder
    $pen  = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 226, 75, 74), [float]([Math]::Max(2, $Width / 60)))
    $padX = [int]($Width  * 0.2)
    $padY = [int]($Height * 0.2)
    $g.DrawEllipse($pen, $padX, $padY, $Width - $padX*2, $Height - $padY*2)

    # Label text
    $fontSize  = [Math]::Max(10, [int]($Width / 12))
    $font      = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush     = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 75, 74))
    $sf        = New-Object System.Drawing.StringFormat
    $sf.Alignment          = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment      = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $Width, $Height)
    $g.DrawString("CG", $font, $brush, $rect, $sf)

    $g.Dispose()

    $dir = Split-Path $FilePath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

    $bmp.Save($FilePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $FilePath ($Width x $Height)" -ForegroundColor Green
}

$base = $PSScriptRoot

Create-PlaceholderPng "$base\assets\icon.png"          1024 1024 "Icon"
Create-PlaceholderPng "$base\assets\splash.png"        1284 2778 "Splash"
Create-PlaceholderPng "$base\assets\adaptive-icon.png" 1024 1024 "Adaptive"
Create-PlaceholderPng "$base\assets\favicon.png"         48   48 "Favicon"

Write-Host "`nAll placeholder assets generated!" -ForegroundColor Cyan
Write-Host "Replace them with real artwork before publishing." -ForegroundColor Yellow
