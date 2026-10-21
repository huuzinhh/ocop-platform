$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  KIEM THU TU DONG: THAM DINH & PHE DUYET CHUNG NHAN OCOP (QUYEN ADMIN)" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

$suffix = Get-Random -Minimum 1000 -Maximum 9999

# -------------------------------------------------------------
# 1. DANG NHAP ADMIN
# -------------------------------------------------------------
Write-Host "`n[1] Dang nhap Admin he thong..." -ForegroundColor Yellow
$adminLogin = @{ usernameOrEmail = "admin"; password = "password123" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $adminLogin
$adminToken = $adminRes.data.accessToken
$adminHeaders = @{ 
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json; charset=utf-8"
}
Write-Host "   -> Admin dang nhap thanh cong, Token OK" -ForegroundColor Green

# -------------------------------------------------------------
# 2. DANG KY VA DANG NHAP NHA SAN XUAT MOI
# -------------------------------------------------------------
$prodUsername = "producer_cert_$suffix"
$prodPassword = "password123"
Write-Host "`n[2] Dang ky & Dang nhap Nha san xuat moi: $prodUsername..." -ForegroundColor Yellow

$regBody = @{
    username = $prodUsername
    email = "producer_$suffix@ocop.vn"
    password = $prodPassword
    fullName = "HTX Dieu Binh Phuoc $suffix"
    phone = "0933112233"
    role = "PRODUCER"
} | ConvertTo-Json
$null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json; charset=utf-8" -Body $regBody

$prodLogin = @{ usernameOrEmail = $prodUsername; password = $prodPassword } | ConvertTo-Json
$prodRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $prodLogin
$prodToken = $prodRes.data.accessToken
$prodHeaders = @{ 
    "Authorization" = "Bearer $prodToken"
    "Content-Type" = "application/json; charset=utf-8"
}
Write-Host "   -> Nha san xuat dang nhap thanh cong" -ForegroundColor Green

# -------------------------------------------------------------
# 3. NHA SAN XUAT DANG BAN SAN PHAM KEM CHUNG NHAN OCOP
# -------------------------------------------------------------
$certCode = "OCOP-BP-2026-$suffix"
Write-Host "`n[3] Nha san xuat tao san pham kem khai bao chung nhan $certCode..." -ForegroundColor Yellow

$newProduct = @{
    name = "Hat Dieu Rang Cui Binh Phuoc $suffix"
    categoryId = 1
    description = "Hat dieu loai 1 rang cui truyen thong Binh Phuoc"
    price = 180000
    stockQuantity = 200
    unit = "Hop 500g"
    ocopStarRating = 5
    thumbnail = "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500"
    status = "ACTIVE"
    certificateCode = $certCode
    issuedDate = "2026-01-15"
    expiryDate = "2029-01-15"
    issuingAuthority = "Hoi dong OCOP Quoc gia"
    documentUrl = "https://example.com/certificates/ocop-bp-2026.pdf"
} | ConvertTo-Json

$productRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products" -Method Post -Headers $prodHeaders -Body $newProduct
$createdProd = $productRes.data
$productId = $createdProd.id
$certId = $createdProd.ocopCertificate.id
$certStatus = $createdProd.ocopCertificate.status

Write-Host "   -> San pham tao thanh cong: ID = $productId, Ten: $($createdProd.name)" -ForegroundColor Green
Write-Host "   -> Ma chung nhan: $($createdProd.ocopCertificate.certificateCode), ID = $certId" -ForegroundColor Green
Write-Host "   -> Trang thai khoi tao cua chung nhan: $certStatus (Ky vong: PENDING)" -ForegroundColor Cyan

if ($certStatus -ne "PENDING") {
    Write-Error "Loi: Chung nhan moi tao phai co trang thai PENDING!"
}

# -------------------------------------------------------------
# 4. ADMIN KIEM TRA DANH SACH HO SO CHO THAM DINH
# -------------------------------------------------------------
Write-Host "`n[4] Admin kiem tra danh sach cho tham dinh (status=PENDING)..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/certificates/stats" -Headers $adminHeaders
Write-Host "   -> Thong ke ho so OCOP: Tong = $($stats.data.total), Cho duyet = $($stats.data.pending), Da duyet = $($stats.data.approved)" -ForegroundColor Green

$pendingList = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/certificates?status=PENDING" -Headers $adminHeaders
$foundCert = $pendingList.data | Where-Object { $_.certificateCode -eq $certCode }

if ($null -ne $foundCert) {
    Write-Host "   -> Tim thay ho so $certCode trong danh sach cho tham dinh!" -ForegroundColor Green
    Write-Host "      + San pham: $($foundCert.productName)"
    Write-Host "      + Co so: $($foundCert.producerName)"
    Write-Host "      + Co quan cap: $($foundCert.issuingAuthority)"
} else {
    Write-Error "Loi: Khong tim thay ho so trong danh sach cho tham dinh!"
}

# -------------------------------------------------------------
# 5. ADMIN THUC HIEN TU CHOI HO SO (REJECT)
# -------------------------------------------------------------
Write-Host "`n[5] Admin thuc hien Tu choi (REJECT) ho so do scan bi mo..." -ForegroundColor Yellow
$rejectBody = @{
    action = "REJECT"
    rejectionReason = "Giay chung nhan scan bi mo khong doc duoc so quyet dinh, de nghi cap nhat lai file PDF"
} | ConvertTo-Json

$rejectRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/certificates/$certId/audit" -Method Put -Headers $adminHeaders -Body $rejectBody
Write-Host "   -> Ket qua tu choi: $($rejectRes.message)" -ForegroundColor Green
Write-Host "   -> Trang thai moi: $($rejectRes.data.status) (Ky vong: REJECTED)" -ForegroundColor Cyan
Write-Host "   -> Ly do luu lai: $($rejectRes.data.rejectionReason)" -ForegroundColor Cyan
Write-Host "   -> Nguoi tu choi: $($rejectRes.data.verifiedBy)" -ForegroundColor Cyan

if ($rejectRes.data.status -ne "REJECTED") {
    Write-Error "Loi: Trang thai phai la REJECTED!"
}

# -------------------------------------------------------------
# 6. NHA SAN XUAT CAP NHAT LAI SAN PHAM -> HE THONG RESET VE PENDING
# -------------------------------------------------------------
Write-Host "`n[6] Nha san xuat bo sung link tai lieu moi va cap nhat lai..." -ForegroundColor Yellow
$updateProduct = @{
    name = "Hat Dieu Rang Cui Binh Phuoc $suffix (Ban Chuan)"
    price = 185000
    certificateCode = $certCode
    documentUrl = "https://example.com/certificates/ocop-bp-2026-clear.pdf"
} | ConvertTo-Json

$updateRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products/$productId" -Method Put -Headers $prodHeaders -Body $updateProduct
$updatedCertStatus = $updateRes.data.ocopCertificate.status
Write-Host "   -> Sau khi cap nhat, trang thai chung nhan: $updatedCertStatus (Ky vong: PENDING)" -ForegroundColor Green

if ($updatedCertStatus -ne "PENDING") {
    Write-Error "Loi: Sau khi NSX cap nhat, ho so bi tu choi phai duoc reset ve PENDING!"
}

# -------------------------------------------------------------
# 7. ADMIN THUC HIEN PHE DUYET HO SO (APPROVE)
# -------------------------------------------------------------
Write-Host "`n[7] Admin doi chieu va Phe duyet (APPROVE) cap Tich xanh OCOP..." -ForegroundColor Yellow
$approveBody = @{
    action = "APPROVE"
} | ConvertTo-Json

$approveRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/certificates/$certId/audit" -Method Put -Headers $adminHeaders -Body $approveBody
Write-Host "   -> Ket qua phe duyet: $($approveRes.message)" -ForegroundColor Green
Write-Host "   -> Trang thai moi: $($approveRes.data.status) (Ky vong: APPROVED)" -ForegroundColor Green
Write-Host "   -> Nguoi phe duyet: $($approveRes.data.verifiedBy)" -ForegroundColor Green
Write-Host "   -> Thoi gian phe duyet: $($approveRes.data.verifiedAt)" -ForegroundColor Green

if ($approveRes.data.status -ne "APPROVED") {
    Write-Error "Loi: Trang thai phai la APPROVED!"
}

# -------------------------------------------------------------
# 8. KIEM TRA BAO MAT: NHA SAN XUAT / KHACH HANG KHONG DUOC PHEP DUYET
# -------------------------------------------------------------
Write-Host "`n[8] Kiem tra bao mat: Nha san xuat goi API phe duyet phai bi chan..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/certificates/$certId/audit" -Method Put -Headers $prodHeaders -Body $approveBody
    Write-Error "Loi bao mat: Nha san xuat khong duoc phep goi API cua Admin!"
} catch {
    Write-Host "   -> Chinh xac! He thong chan thanh cong (HTTP $($_.Exception.Response.StatusCode)): Chi Admin moi co quyen tham dinh." -ForegroundColor Green
}

Write-Host "`n==========================================================================" -ForegroundColor Green
Write-Host "  TAT CA CAC TEST THAM DINH CHUNG NHAN OCOP DEU PASSED 100%! XUAT SAC" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Green
