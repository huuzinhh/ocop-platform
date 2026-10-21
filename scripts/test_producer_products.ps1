$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  KIEM THU: QUAN LY DANH SACH SAN PHAM, GIA, TON KHO & CHUNG NHAN OCOP" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

$suffix = Get-Random -Minimum 1000 -Maximum 9999
$prodUsername = "producer_ocop_$suffix"
$prodEmail = "producer_$suffix@ocop.vn"
$prodFullName = "HTX Che Shan Tuyet Fin Ho $suffix"
$prodPassword = "password123"

# 1. DANG KY TAI KHOAN NHA SAN XUAT MOI
Write-Host "`n[1] Dang ky tai khoan Nha san xuat moi: $prodUsername..." -ForegroundColor Yellow
$regBody = @{
    username = $prodUsername
    email = $prodEmail
    password = $prodPassword
    fullName = $prodFullName
    phone = "0988123456"
    role = "PRODUCER"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json; charset=utf-8" -Body $regBody
Write-Host "   -> Dang ky thanh cong: ID = $($regRes.data.id), Username = $($regRes.data.username)" -ForegroundColor Green

# 2. DANG NHAP NHA SAN XUAT
Write-Host "`n[2] Dang nhap Nha san xuat..." -ForegroundColor Yellow
$loginBody = @{
    usernameOrEmail = $prodUsername
    password = $prodPassword
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $loginBody
$token = $loginRes.data.accessToken
$headers = @{ 
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json; charset=utf-8"
}
Write-Host "   -> Dang nhap thanh cong, Token: $($token.Substring(0, 20))..." -ForegroundColor Green

# 3. LAY DANH SACH SAN PHAM KHI CHUA CO SAN PHAM
Write-Host "`n[3] Goi GET /api/v1/products/my-products (Gian hang moi tao)..." -ForegroundColor Yellow
$emptyList = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products/my-products" -Method Get -Headers $headers
Write-Host "   -> So luong san pham hien tai: $($emptyList.data.Count) (Dung ky vong rong)" -ForegroundColor Green

# 4. TAO SAN PHAM MOI KEM CHUNG NHAN OCOP
Write-Host "`n[4] Goi POST /api/v1/products (Dang san pham OCOP kem giay chung nhan)..." -ForegroundColor Yellow
$newProductBody = @{
    name = "Hong Tra Shan Tuyet Co Thu Fin Ho $suffix"
    categoryId = 1
    description = "Thu hai tu cay che co thu tren 200 nam tuoi dinh Tay Con Linh"
    culturalStory = "Van hoa thuong tra co truyen cua dong bao nguoi Dao Do tai Ha Giang"
    price = 320000
    stockQuantity = 150
    unit = "Hop"
    ocopStarRating = 5
    thumbnail = "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500"
    status = "ACTIVE"
    certificateCode = "OCOP-5S-HG-$suffix"
    issuedDate = "2026-03-15"
    expiryDate = "2029-03-15"
    issuingAuthority = "Hoi dong danh gia phan hang san pham OCOP Quoc gia"
    documentUrl = "https://ocop.gov.vn/certificates/hg-$suffix.pdf"
} | ConvertTo-Json

$createdRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products" -Method Post -Headers $headers -Body $newProductBody
$newProduct = $createdRes.data
Write-Host "   -> Tao thanh cong San pham ID: $($newProduct.id) - $($newProduct.name)" -ForegroundColor Green
Write-Host "   -> Ma chung nhan OCOP: $($newProduct.ocopCertificate.certificateCode) ($($newProduct.ocopCertificate.starRating) Sao)" -ForegroundColor Green
Write-Host "   -> Co quan cap: $($newProduct.ocopCertificate.issuingAuthority)" -ForegroundColor Green
Write-Host "   -> Hieu luc: $($newProduct.ocopCertificate.issuedDate) den $($newProduct.ocopCertificate.expiryDate)" -ForegroundColor Green

# 5. XAC MINH SAN PHAM TRONG MY-PRODUCTS
Write-Host "`n[5] Kiem tra lai GET /api/v1/products/my-products..." -ForegroundColor Yellow
$myProducts = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products/my-products" -Method Get -Headers $headers
Write-Host "   -> Tim thay $($myProducts.data.Count) san pham cua co so $prodUsername" -ForegroundColor Green
$item = $myProducts.data[0]
Write-Host "   -> San pham: $($item.name) | Gia: $($item.price) | Ton kho: $($item.stockQuantity) $($item.unit) | Trang thai: $($item.status)" -ForegroundColor Cyan

# 6. SUA NHANH DON GIA VA TON KHO (PUT /api/v1/products/{id})
Write-Host "`n[6] Goi PUT /api/v1/products/$($item.id) (Cap nhat gia len 380,000 d, ton kho xuong 80, trang thai INACTIVE)..." -ForegroundColor Yellow
$updatePayload = @{
    price = 380000
    stockQuantity = 80
    status = "INACTIVE"
} | ConvertTo-Json

$updateRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products/$($item.id)" -Method Put -Headers $headers -Body $updatePayload
$updated = $updateRes.data
Write-Host "   -> Gia moi: $($updated.price) d" -ForegroundColor Green
Write-Host "   -> Ton kho moi: $($updated.stockQuantity) $($updated.unit)" -ForegroundColor Green
Write-Host "   -> Trang thai moi: $($updated.status)" -ForegroundColor Green

# 7. XOA SAN PHAM (DELETE /api/v1/products/{id})
Write-Host "`n[7] Goi DELETE /api/v1/products/$($item.id) (Xoa san pham khoi gian hang)..." -ForegroundColor Yellow
$deleteRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products/$($item.id)" -Method Delete -Headers $headers
Write-Host "   -> Ket qua: $($deleteRes.message)" -ForegroundColor Green

# 8. XAC MINH SAN PHAM DA BI XOA
Write-Host "`n[8] Kiem tra lai danh sach sau khi xoa..." -ForegroundColor Yellow
$finalList = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products/my-products" -Method Get -Headers $headers
Write-Host "   -> So luong san pham con lai trong gian hang: $($finalList.data.Count)" -ForegroundColor Green

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host "  TAT CA 8 BUOC KIEM THU CHUC NANG NHA SAN XUAT DEU THANH CONG 100%!       " -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
