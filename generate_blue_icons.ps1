Add-Type -AssemblyName System.Drawing

$sourcePath = "public\images\logoFotolou.png"
if (-not (Test-Path $sourcePath)) {
    $sourcePath = "..\public\images\logoFotolou.png"
}
$fullSourcePath = (Get-Item $sourcePath).FullName
Write-Host "Source image: $fullSourcePath"

$srcImg = [System.Drawing.Image]::FromFile($fullSourcePath)
Write-Host "Original dimensions: $($srcImg.Width) x $($srcImg.Height)"

function Generate-Blue-Icon {
    param(
        [System.Drawing.Image]$source,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$destinationPath,
        [double]$scaleMultiplier = 0.72,
        [string]$bgColor = "#1E5AF0"
    )

    $destBitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Fill with brand blue background
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($bgColor))
    $graphics.FillRectangle($brush, 0, 0, $targetWidth, $targetHeight)
    $brush.Dispose()

    # Calculate proportional scale
    $scale = [Math]::Min($targetWidth / $source.Width, $targetHeight / $source.Height) * $scaleMultiplier

    $destW = [int]($source.Width * $scale)
    $destH = [int]($source.Height * $scale)
    $destX = [int](($targetWidth - $destW) / 2)
    $destY = [int](($targetHeight - $destH) / 2)

    $graphics.DrawImage($source, $destX, $destY, $destW, $destH)
    $graphics.Dispose()

    $destBitmap.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Host "Generated: $destinationPath ($targetWidth x $targetHeight) with blue background ($bgColor)"
}

$iconsDir = "public\icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

# 1. Standard PWA 192x192 icon with Blue Background
Generate-Blue-Icon -source $srcImg -targetWidth 192 -targetHeight 192 -destinationPath "$iconsDir\icon-192x192.png" -scaleMultiplier 0.75 -bgColor "#1E5AF0"

# 2. Standard PWA 512x512 icon with Blue Background
Generate-Blue-Icon -source $srcImg -targetWidth 512 -targetHeight 512 -destinationPath "$iconsDir\icon-512x512.png" -scaleMultiplier 0.75 -bgColor "#1E5AF0"

# 3. Android Maskable 512x512 icon (with 65% safe zone and Blue Background)
Generate-Blue-Icon -source $srcImg -targetWidth 512 -targetHeight 512 -destinationPath "$iconsDir\icon-maskable-512x512.png" -scaleMultiplier 0.65 -bgColor "#1E5AF0"

# 4. Apple Touch Icon 180x180 & 192x192 with Blue Background (for iOS home screen)
Generate-Blue-Icon -source $srcImg -targetWidth 180 -targetHeight 180 -destinationPath "$iconsDir\apple-touch-icon-180x180.png" -scaleMultiplier 0.75 -bgColor "#1E5AF0"
Generate-Blue-Icon -source $srcImg -targetWidth 192 -targetHeight 192 -destinationPath "$iconsDir\apple-touch-icon.png" -scaleMultiplier 0.75 -bgColor "#1E5AF0"

$srcImg.Dispose()
Write-Host "All PWA and iOS icons have been regenerated with the Fotolou Blue (#1E5AF0) background!"
