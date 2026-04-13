$file = 'd:\Workspace - Ticketliv\ticketliv\ticketliv-admin\src\pages\CreateEvent.tsx'
$content = [System.IO.File]::ReadAllText($file)

# Fix section description fonts from 13px to 12px (all remaining descriptions)
$content = $content -replace "fontSize: '13px' \}\}>", "fontSize: '12px' }}>"

# Fix section border padding
$content = $content -replace "paddingBottom: '20px'", "paddingBottom: '14px'"

# Fix icon sizes from 24 to 20 in section headers
$content = $content -replace '<CheckSquare size=\{24\}', '<CheckSquare size={20}'
$content = $content -replace '<Sparkles size=\{24\}', '<Sparkles size={20}'
$content = $content -replace '<Info size=\{24\}', '<Info size={20}'
$content = $content -replace '<Camera size=\{24\}', '<Camera size={20}'
$content = $content -replace '<Globe size=\{24\}', '<Globe size={20}'
$content = $content -replace '<AlertCircle size=\{24\}', '<AlertCircle size={20}'
$content = $content -replace '<Video size=\{24\}', '<Video size={20}'
$content = $content -replace '<Tag size=\{24\}', '<Tag size={20}'
$content = $content -replace '<PieChart size=\{24\}', '<PieChart size={20}'
$content = $content -replace '<FileText size=\{24\}', '<FileText size={20}'

# Fix textarea border-radius
$content = $content -replace "borderRadius: '24px', lineHeight", "borderRadius: '16px', lineHeight"

# Fix grid gaps
$content = $content -replace "gap: '32px' \}\}>", "gap: '24px' }}>"
$content = $content -replace "gap: '40px' \}\}>", "gap: '28px' }}>"

[System.IO.File]::WriteAllText($file, $content)
Write-Host "Done updating CreateEvent.tsx"
