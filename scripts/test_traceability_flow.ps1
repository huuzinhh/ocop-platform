$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  KIEM THU: QUAN LY LO SAN XUAT, NHAT KY CHUOI CUNG UNG & QR TRUY XUAT" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# 1. TRA CUU CONG KHAI LO MAU CO SAN TRONG CSDL (Unauthenticated)
Write-Host "`n[1] Tra cuu cong khai lo san xuat mau: BATCH-KD-202601..." -ForegroundColor Yellow
$traceSeed = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/trace/BATCH-KD-202601" -Method Get
$d = $traceSeed.data
Write-Host "   -> San pham: $($d.productName) ($($d.ocopStarRating) Sao)" -ForegroundColor Green
Write-Host "   -> Co so SX: $($d.producerName) - $($d.producerProvince)" -ForegroundColor Green
Write-Host "   -> Chung nhan: $($d.certificateCode) do $($d.certIssuingAuthority) cap" -ForegroundColor Green
Write-Host "   -> Blockchain Tx: $($d.blockchainTxHash)" -ForegroundColor Green
Write-Host "   -> So su kien chuoi cung ung: $($d.events.Count) su kien" -ForegroundColor Green
foreach ($ev in $d.events) {
    Write-Host "      + [$($ev.eventType)] $($ev.eventName) (Thuc hien: $($ev.actorName))"
}

# 2. DANG KY & DANG NHAP NHA SAN XUAT MOI
$suffix = Get-Random -Minimum 1000 -Maximum 9999
$prodUsername = "producer_trace_$suffix"
$prodEmail = "producer_trace_$suffix@ocop.vn"
$prodPassword = "password123"

Write-Host "`n[2] Dang ky va dang nhap Nha san xuat moi: $prodUsername..." -ForegroundColor Yellow
$regBody = @{
    username = $prodUsername
    email = $prodEmail
    password = $prodPassword
    fullName = "HTX Che Shan Tuyet Nam Dam $suffix"
    phone = "0977889900"
    role = "PRODUCER"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json; charset=utf-8" -Body $regBody
$loginBody = @{ usernameOrEmail = $prodUsername; password = $prodPassword } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $loginBody
$token = $loginRes.data.accessToken
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json; charset=utf-8"
}
Write-Host "   -> Dang nhap thanh cong, Token: $($token.Substring(0, 20))..." -ForegroundColor Green

# 3. TAO SAN PHAM DE GAN LO
Write-Host "`n[3] Dang ban san pham OCOP moi..." -ForegroundColor Yellow
$prodBody = @{
    name = "Bach Tra Shan Tuyet Tay Con Linh $suffix"
    categoryId = 1
    description = "Che bup non 1 tom phu tuyet trang"
    culturalStory = "Bi quyet sao che co truyen"
    price = 450000
    stockQuantity = 200
    unit = "Hop"
    ocopStarRating = 5
    thumbnail = "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500"
    status = "ACTIVE"
    certificateCode = "OCOP-5S-HG-$suffix"
    issuedDate = "2026-01-10"
    expiryDate = "2029-01-10"
    issuingAuthority = "Hoi dong OCOP Quoc gia"
} | ConvertTo-Json

$prodRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products" -Method Post -Headers $headers -Body $prodBody
$productId = $prodRes.data.id
Write-Host "   -> Tao san pham ID: $productId ($($prodRes.data.name))" -ForegroundColor Green

# 4. TAO LO SAN XUAT MOI CHO SAN PHAM
Write-Host "`n[4] Tao Lo san xuat moi (POST /api/v1/batches)..." -ForegroundColor Yellow
$batchCode = "BATCH-NAMDAM-$suffix"
$batchBody = @{
    productId = $productId
    batchCode = $batchCode
    manufactureDate = "2026-10-01"
    expiryDate = "2028-10-01"
    quantity = 300
} | ConvertTo-Json

$batchRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/batches" -Method Post -Headers $headers -Body $batchBody
$newBatch = $batchRes.data
Write-Host "   -> Khoi tao Lo thanh cong: ID = $($newBatch.id), Code = $($newBatch.batchCode)" -ForegroundColor Green
Write-Host "   -> Raw Data Hash (SHA-256): $($newBatch.rawDataHash)" -ForegroundColor Green
Write-Host "   -> Blockchain Tx Hash: $($newBatch.blockchainTxHash)" -ForegroundColor Green
Write-Host "   -> QR Code URL: $($newBatch.qrCodeUrl)" -ForegroundColor Green

# 5. GHI CAC SU KIEN CHUOI CUNG UNG (POST /api/v1/batches/{id}/events)
Write-Host "`n[5] Ghi cac mat xich su kien chuoi cung ung..." -ForegroundColor Yellow

$ev1 = @{
    eventType = "HARVEST"
    eventName = "Thu hai che bup 1 tom 1 la luc 5h sang"
    description = "Thu hai thu cong tren nui cao do am 85%"
    actorName = "To thu hai Ban Nam Dam"
    eventTimestamp = "2026-10-01 05:30:00"
} | ConvertTo-Json
$resEv1 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/batches/$($newBatch.id)/events" -Method Post -Headers $headers -Body $ev1
Write-Host "   -> [HARVEST] Ghi su kien: $($resEv1.data.eventName) (Tx: $($resEv1.data.blockchainTxHash.Substring(0, 16))...)" -ForegroundColor Green

$ev2 = @{
    eventType = "PROCESSING"
    eventName = "Sao chao gang & diet men truyen thong"
    description = "Nhiet do chao on dinh 95 do C trong 30 phut"
    actorName = "Nghe nhan Ly Van Thang"
    eventTimestamp = "2026-10-01 11:00:00"
} | ConvertTo-Json
$resEv2 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/batches/$($newBatch.id)/events" -Method Post -Headers $headers -Body $ev2
Write-Host "   -> [PROCESSING] Ghi su kien: $($resEv2.data.eventName) (Tx: $($resEv2.data.blockchainTxHash.Substring(0, 16))...)" -ForegroundColor Green

$ev3 = @{
    eventType = "QUALITY_INSPECTION"
    eventName = "Kiem tra do am va vi sinh theo tieu chuan OCOP 5 Sao"
    description = "Do am dat 4.8%, du luong kim loai nang bang 0"
    actorName = "Phong KCS Tinh Ha Giang"
    eventTimestamp = "2026-10-01 16:30:00"
} | ConvertTo-Json
$resEv3 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/batches/$($newBatch.id)/events" -Method Post -Headers $headers -Body $ev3
Write-Host "   -> [QUALITY_INSPECTION] Ghi su kien: $($resEv3.data.eventName) (Tx: $($resEv3.data.blockchainTxHash.Substring(0, 16))...)" -ForegroundColor Green

# 6. TRUY XUAT CONG KHAI LO HANG MOI TAO (Public QR Verification)
Write-Host "`n[6] Quet ma QR / Tra cuu cong khai lo hang vua tao: $batchCode..." -ForegroundColor Yellow
$publicTrace = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/trace/$batchCode" -Method Get
$pt = $publicTrace.data
Write-Host "   -> San pham: $($pt.productName)" -ForegroundColor Green
Write-Host "   -> Co so: $($pt.producerName)" -ForegroundColor Green
Write-Host "   -> Giay chung nhan OCOP: $($pt.certificateCode) ($($pt.certificateStarRating) Sao)" -ForegroundColor Green
Write-Host "   -> Trang thai Blockchain: $($pt.blockchainStatus)" -ForegroundColor Green
Write-Host "   -> Tong so mat xich nhat ky: $($pt.events.Count) su kien" -ForegroundColor Green
foreach ($item in $pt.events) {
    Write-Host "      + [$($item.eventType)] $($item.eventName) | Nguoi lam: $($item.actorName) | Thoi gian: $($item.eventTimestamp)"
}

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host "  TAT CA CAC BUOC KIEM THU TRUY XUAT NGUON GOC BLOCKCHAIN DEU PASS 100%!   " -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
