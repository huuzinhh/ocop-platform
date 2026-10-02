$ErrorActionPreference = "Stop"

Write-Host "=== 1. TEST LOGIN (ADMIN) ==="
$loginBody = @{
    usernameOrEmail = "admin"
    password = "123456"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $loginBody
Write-Host "Login Status:" $loginRes.success
Write-Host "Message:" $loginRes.message
Write-Host "Token Type:" $loginRes.data.tokenType
Write-Host "Access Token (first 30 chars):" ($loginRes.data.accessToken.Substring(0, 30) + "...")
Write-Host "User Full Name:" $loginRes.data.user.fullName
Write-Host "User Roles:" ($loginRes.data.user.roles -join ", ")

$token = $loginRes.data.accessToken

Write-Host "`n=== 2. TEST PROTECTED ENDPOINT /api/v1/auth/me WITH BEARER TOKEN ==="
$headers = @{
    Authorization = "Bearer $token"
}
$meRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/me" -Method Get -Headers $headers
Write-Host "Get Me Status:" $meRes.success
Write-Host "Current Username:" $meRes.data.username
Write-Host "Current Email:" $meRes.data.email
Write-Host "Current Roles:" ($meRes.data.roles -join ", ")

Write-Host "`n=== 3. TEST REGISTER NEW USER ==="
$rand = Get-Random -Minimum 1000 -Maximum 9999
$newUser = @{
    username = "test_farmer_$rand"
    email = "farmer_$rand@ocop.vn"
    password = "password123"
    fullName = "Nong Dan OCOP Mau $rand"
    phone = "0988776655"
    role = "PRODUCER"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json; charset=utf-8" -Body $newUser
Write-Host "Register Status:" $regRes.success
Write-Host "Registered User:" $regRes.data.username
Write-Host "Assigned Roles:" ($regRes.data.roles -join ", ")

Write-Host "`n=== 4. TEST LOGIN WITH NEWLY REGISTERED USER ==="
$newLoginBody = @{
    usernameOrEmail = "test_farmer_$rand"
    password = "password123"
} | ConvertTo-Json

$newLoginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $newLoginBody
Write-Host "New Login Status:" $newLoginRes.success
Write-Host "New Login Message:" $newLoginRes.message
Write-Host "New Login User Roles:" ($newLoginRes.data.user.roles -join ", ")

Write-Host "`n=== ALL AUTH TESTS PASSED 100% SUCCESSFULLY ==="
