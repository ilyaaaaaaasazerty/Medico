$expectedScreens = @(
    "family-members.tsx",
    "add-family-member.tsx",
    "allergies.tsx",
    "medications.tsx",
    "vital-signs.tsx",
    "edit-profile.tsx",
    "edit-doctor-profile.tsx",
    "manage-specialties.tsx",
    "manage-education.tsx",
    "clinic-staff.tsx",
    "add-clinic-staff.tsx",
    "clinic-rooms.tsx",
    "lab-tests.tsx",
    "lab-technicians.tsx",
    "reschedule-appointment.tsx",
    "clinic-appointments.tsx"
)

$searchPath = "apps\mobile\app\(app)"
$missingCount = 0
$foundCount = 0

Write-Host "Checking for expected screens in $searchPath..." -ForegroundColor Cyan

foreach ($screen in $expectedScreens) {
    if (Test-Path "$searchPath\$screen") {
        Write-Host "[OK] Found $screen" -ForegroundColor Green
        $foundCount++
    } else {
        Write-Host "[MISSING] Could not find $screen" -ForegroundColor Red
        $missingCount++
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Found: $foundCount" -ForegroundColor Green
Write-Host "Missing: $missingCount" -ForegroundColor Red

if ($missingCount -eq 0) {
    Write-Host "`nAll screens are present! Phase 6.5 complete." -ForegroundColor Green
} else {
    Write-Host "`nSome screens are missing." -ForegroundColor Yellow
}
