# Phase 1 Testing Script - MR Data Isolation
# Run these commands in PowerShell to verify territory filtering

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Phase 1: MR Data Isolation Testing" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"

# Test 1: Admin user (should see ALL data)
Write-Host "Test 1: Admin User - Should see ALL doctors" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/doctors (as admin)" -ForegroundColor Gray
$adminDoctors = Invoke-RestMethod -Uri "$baseUrl/doctors" -Headers @{ Authorization = "Bearer admin@metapharsic.com" }
Write-Host "Result: $($adminDoctors.Count) doctors found" -ForegroundColor Green
Write-Host "Territories represented:" -ForegroundColor Gray
$adminDoctors | Group-Object territory | ForEach-Object { Write-Host "  - $($_.Name): $($_.Count) doctors" }
Write-Host ""

# Test 2: MR User - Rajesh Kumar (should see ONLY Hyderabad West doctors)
Write-Host "Test 2: MR User (Rajesh Kumar) - Should see ONLY Hyderabad West doctors" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/doctors (as rajesh.kumar)" -ForegroundColor Gray
$mrDoctors = Invoke-RestMethod -Uri "$baseUrl/doctors" -Headers @{ Authorization = "Bearer rajesh.kumar@metapharsic.com" }
Write-Host "Result: $($mrDoctors.Count) doctors found" -ForegroundColor Green
if ($mrDoctors.Count -gt 0) {
    Write-Host "All doctors in territory:" -ForegroundColor Gray
    $mrDoctors | Group-Object territory | ForEach-Object { Write-Host "  - $($_.Name): $($_.Count) doctors" }
}
Write-Host ""

# Test 3: Verify MR data isolation for sales
Write-Host "Test 3: MR Data Isolation - Sales Records" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/sales (as rajesh.kumar)" -ForegroundColor Gray
$mrSales = Invoke-RestMethod -Uri "$baseUrl/sales" -Headers @{ Authorization = "Bearer rajesh.kumar@metapharsic.com" }
Write-Host "Result: $($mrSales.Count) sales records found" -ForegroundColor Green
if ($mrSales.Count -gt 0) {
    # Get the actual MR ID from the user context
    $mrInfo = Invoke-RestMethod -Uri "$baseUrl/mrs" -Headers @{ Authorization = "Bearer rajesh.kumar@metapharsic.com" }
    $actualMrId = $mrInfo[0].id
    $wrongSales = $mrSales | Where-Object { $_.mr_id -ne $actualMrId } | Measure-Object | Select-Object -ExpandProperty Count
    $validationResult = if ($wrongSales -eq 0) { 'YES' } else { 'NO' }
    $validationColor = if ($wrongSales -eq 0) { 'Green' } else { 'Red' }
    Write-Host "All sales belong to MR ID $actualMrId : $validationResult" -ForegroundColor $validationColor
}
Write-Host ""

# Test 4: Verify MR data isolation for expenses
Write-Host "Test 4: MR Data Isolation - Expense Records" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/expenses (as rajesh.kumar)" -ForegroundColor Gray
$mrExpenses = Invoke-RestMethod -Uri "$baseUrl/expenses" -Headers @{ Authorization = "Bearer rajesh.kumar@metapharsic.com" }
Write-Host "Result: $($mrExpenses.Count) expense records found" -ForegroundColor Green
Write-Host ""

# Test 5: Verify MR data isolation for visit schedules
Write-Host "Test 5: MR Data Isolation - Visit Schedules" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/visit-schedules (as rajesh.kumar)" -ForegroundColor Gray
$mrSchedules = Invoke-RestMethod -Uri "$baseUrl/visit-schedules" -Headers @{ Authorization = "Bearer rajesh.kumar@metapharsic.com" }
Write-Host "Result: $($mrSchedules.Count) schedules found" -ForegroundColor Green
if ($mrSchedules.Count -gt 0) {
    # Get the actual MR ID from the user context
    $mrInfo = Invoke-RestMethod -Uri "$baseUrl/mrs" -Headers @{ Authorization = "Bearer rajesh.kumar@metapharsic.com" }
    $actualMrId = $mrInfo[0].id
    $wrongSchedules = $mrSchedules | Where-Object { $_.mr_id -ne $actualMrId } | Measure-Object | Select-Object -ExpandProperty Count
    $validationResult = if ($wrongSchedules -eq 0) { 'YES' } else { 'NO' }
    $validationColor = if ($wrongSchedules -eq 0) { 'Green' } else { 'Red' }
    Write-Host "All schedules belong to MR ID $actualMrId : $validationResult" -ForegroundColor $validationColor
}
Write-Host ""

# Test 6: Admin sees all MRs
Write-Host "Test 6: Admin User - Should see ALL MRs" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/mrs (as admin)" -ForegroundColor Gray
$allMrs = Invoke-RestMethod -Uri "$baseUrl/mrs" -Headers @{ Authorization = "Bearer admin@metapharsic.com" }
Write-Host "Result: $($allMrs.Count) MRs found" -ForegroundColor Green
$allMrs | ForEach-Object { Write-Host "  - $($_.name) (ID: $($_.id))" -ForegroundColor Gray }
Write-Host ""

# Test 7: MR sees only their own record
Write-Host "Test 7: MR User - Should see ONLY their own record" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/mrs (as rajesh.kumar)" -ForegroundColor Gray
$ownMr = Invoke-RestMethod -Uri "$baseUrl/mrs" -Headers @{ Authorization = "Bearer rajesh.kumar@metapharsic.com" }
Write-Host "Result: $($ownMr.Count) MR record(s) found" -ForegroundColor Green
if ($ownMr.Count -eq 1) {
    Write-Host "MR Name: $($ownMr[0].name)" -ForegroundColor Green
    Write-Host "MR Territory: $($ownMr[0].territory)" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected Results:" -ForegroundColor Yellow
Write-Host "  ✓ Admin sees all doctors from all territories" -ForegroundColor Green
Write-Host "  ✓ MR (Rajesh) sees only doctors from Hyderabad West" -ForegroundColor Green
Write-Host "  ✓ MR sees only their own sales, expenses, schedules" -ForegroundColor Green
Write-Host "  ✓ MR sees only their own MR record" -ForegroundColor Green
Write-Host ""
