$ErrorActionPreference = "Stop"

$rand = Get-Random -Minimum 1000 -Maximum 9999
$newUser = @{
    username = "farmer_$rand"
    email = "farmer_$rand@ocop.vn"
    password = "password123"
    fullName = "Bác Nông Dân $rand"
    phone = "0987654321"
    role = "PRODUCER"
} | ConvertTo-Json

Write-Host "Calling /api/v1/auth/register..."
$reg = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json" -Body $newUser
Write-Host "Registered successfully:" $reg.data.username "Roles:" ($reg.data.roles -join ",")

Write-Host "`nCalling /api/v1/auth/login..."
$loginBody = @{
    usernameOrEmail = "farmer_$rand"
    password = "password123"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
Write-Host "Login successfully! User:" $login.data.user.fullName
Write-Host "JWT Token (first 25 chars):" ($login.data.accessToken.Substring(0, 25) + "...")
Write-Host "Token Type:" $login.data.tokenType
Write-Host "Roles:" ($login.data.user.roles -join ",")

Write-Host "`nCalling protected /api/v1/auth/me..."
$headers = @{
    Authorization = "Bearer " + $login.data.accessToken
}
$me = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/me" -Method Get -Headers $headers
Write-Host "Get Me success! Username:" $me.data.username "Email:" $me.data.email
Write-Host "`nALL REGISTRATION AND AUTHENTICATION TESTS PASSED 100%!"
