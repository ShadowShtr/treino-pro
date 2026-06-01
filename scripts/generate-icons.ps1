Add-Type -AssemblyName System.Drawing

function New-TravizaniIcon {
    param(
        [int]$Size,
        [string]$Path
    )

    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $scale = $Size / 512.0

    $background = [System.Drawing.ColorTranslator]::FromHtml("#FC4C02")
    $graphics.Clear($background)

    $circlePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(44, 255, 255, 255)), (14 * $scale)
    $graphics.DrawEllipse($circlePen, 78 * $scale, 78 * $scale, 356 * $scale, 356 * $scale)

    $pulsePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), (30 * $scale)
    $pulsePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pulsePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pulsePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $points = @(
        (New-Object System.Drawing.PointF (127 * $scale), (288 * $scale)),
        (New-Object System.Drawing.PointF (183 * $scale), (288 * $scale)),
        (New-Object System.Drawing.PointF (214 * $scale), (206 * $scale)),
        (New-Object System.Drawing.PointF (269 * $scale), (345 * $scale)),
        (New-Object System.Drawing.PointF (307 * $scale), (254 * $scale)),
        (New-Object System.Drawing.PointF (385 * $scale), (254 * $scale))
    )
    $graphics.DrawLines($pulsePen, $points)

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $pulsePen.Dispose()
    $circlePen.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}

$iconDirectory = Join-Path $PSScriptRoot "..\public\icons"
New-TravizaniIcon -Size 192 -Path (Join-Path $iconDirectory "icon-192.png")
New-TravizaniIcon -Size 512 -Path (Join-Path $iconDirectory "icon-512.png")
New-TravizaniIcon -Size 180 -Path (Join-Path $iconDirectory "apple-touch-icon.png")
