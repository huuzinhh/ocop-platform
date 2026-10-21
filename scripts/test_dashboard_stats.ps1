$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  KIEM THU TU DONG: DASHBOARD THONG KE & HIEU QUA BAN HANG NHA SAN XUAT" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

$suffix = Get-Random -Minimum 1000 -Maximum 9999
$prodUsername = "prod_stat_$suffix"
$prodEmail = "prod_stat_$suffix@ocop.vn"
$prodFullName = "HTX Thong Ke OCOP $suffix"
$prodPassword = "password123"

# -------------------------------------------------------------
# 1. DANG KY TAI KHOAN NHA SAN XUAT
# -------------------------------------------------------------
Write-Host "`n[1] Dang ky tai khoan Nha san xuat moi ($prodUsername)..." -ForegroundColor Yellow
$regBody = @{
    username = $prodUsername
    email = $prodEmail
    password = $prodPassword
    fullName = $prodFullName
    phone = "0988665544"
    role = "PRODUCER"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json; charset=utf-8" -Body $regBody
Write-Host "   -> Dang ky thanh cong: ID = $($regRes.data.id)" -ForegroundColor Green

# -------------------------------------------------------------
# 2. DANG NHAP NHA SAN XUAT
# -------------------------------------------------------------
Write-Host "`n[2] Dang nhap Nha san xuat..." -ForegroundColor Yellow
$loginBody = @{
    usernameOrEmail = $prodUsername
    password = $prodPassword
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $loginBody
$prodToken = $loginRes.data.accessToken
$prodHeaders = @{ 
    "Authorization" = "Bearer $prodToken"
    "Content-Type" = "application/json; charset=utf-8"
}
Write-Host "   -> Dang nhap thanh cong, Token OK" -ForegroundColor Green

# -------------------------------------------------------------
# 3. TAO SAN PHAM OCOP MOI
# -------------------------------------------------------------
Write-Host "`n[3] Nha san xuat tao san pham OCOP moi..." -ForegroundColor Yellow
$newProduct = @{
    name = "Che O Long Moc Chau Dac Biet $suffix"
    categoryId = 1
    description = "Che O Long thu hai tren cao nguyen Moc Chau"
    price = 250000
    stockQuantity = 100
    unit = "Hop 200g"
    ocopStarRating = 5
    thumbnail = "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500"
} | ConvertTo-Json

$prodCreatedRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products" -Method Post -ContentType "application/json; charset=utf-8" -Headers $prodHeaders -Body $newProduct
$productId = $prodCreatedRes.data.id
$producerId = $prodCreatedRes.data.producer.id
Write-Host "   -> Tao san pham thanh cong: ID = $productId, ProducerId = $producerId" -ForegroundColor Green

# -------------------------------------------------------------
# 4. TAO LO SAN XUAT MOI
# -------------------------------------------------------------
Write-Host "`n[4] Nha san xuat tao lo san xuat..." -ForegroundColor Yellow
$newBatch = @{
    productId = $productId
    batchCode = "BATCH-STAT-$suffix"
    manufactureDate = (Get-Date).ToString("yyyy-MM-dd")
    expiryDate = (Get-Date).AddYears(1).ToString("yyyy-MM-dd")
    quantity = 500
} | ConvertTo-Json

$batchRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/batches" -Method Post -ContentType "application/json; charset=utf-8" -Headers $prodHeaders -Body $newBatch
Write-Host "   -> Tao lo thanh cong: Mã lô = $($batchRes.data.batchCode)" -ForegroundColor Green

# -------------------------------------------------------------
# 5. KIEM TRA STATS BAN DAU (CHUA CO DON HANG)
# -------------------------------------------------------------
Write-Host "`n[5] Kiem tra Dashboard ban dau cua Nha san xuat..." -ForegroundColor Yellow
$statsInit = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/stats/dashboard" -Method Get -Headers $prodHeaders
Write-Host "   -> Ten NSX:" $statsInit.data.producerName -ForegroundColor Cyan
Write-Host "   -> Tong san pham:" $statsInit.data.totalProducts "(Ky vong: 1)" -ForegroundColor Cyan
Write-Host "   -> Tong lo san xuat:" $statsInit.data.totalBatches "(Ky vong: 1)" -ForegroundColor Cyan
Write-Host "   -> Tong doanh thu:" $statsInit.data.totalRevenue "(Ky vong: 0)" -ForegroundColor Cyan
Write-Host "   -> Tong so don:" $statsInit.data.totalOrders "(Ky vong: 0)" -ForegroundColor Cyan

if ($statsInit.data.totalProducts -ne 1 -or $statsInit.data.totalBatches -ne 1) {
    Write-Error "Sai lech du lieu san pham/lo khoi tao!"
}

# -------------------------------------------------------------
# 6. KHACH HANG DAT MUA 3 SAN PHAM & THANH TOAN
# -------------------------------------------------------------
Write-Host "`n[6] Khach hang dat mua 3 san pham va hoan tat don..." -ForegroundColor Yellow
$custUsername = "cust_stat_$suffix"
$custPassword = "password123"
$custRegBody = @{
    username = $custUsername
    email = "cust_stat_$suffix@ocop.vn"
    password = $custPassword
    fullName = "Khach Hang Thong Ke $suffix"
    phone = "0911223344"
    role = "CUSTOMER"
} | ConvertTo-Json
$null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json; charset=utf-8" -Body $custRegBody

$custLogin = @{ usernameOrEmail = $custUsername; password = $custPassword } | ConvertTo-Json
$custRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $custLogin
$custHeaders = @{ 
    "Authorization" = "Bearer $($custRes.data.accessToken)"
    "Content-Type" = "application/json; charset=utf-8"
}

# Them vao gio: 3 x 250,000 = 750,000 VND
$addCartBody = @{ productId = $productId; quantity = 3 } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/cart/items" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $addCartBody

# Dat hang
$orderReq = @{
    recipientName = "Khach Hang Thong Ke"
    recipientPhone = "0911223344"
    shippingAddress = "Ha Noi"
    paymentMethod = "MOCK_VNPAY"
} | ConvertTo-Json
$orderRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $orderReq
$orderCode = $orderRes.data.orderCode
Write-Host "   -> Dat hang thanh cong: Ma don = $orderCode, Tong tien = $($orderRes.data.totalAmount) VND" -ForegroundColor Green

# Thanh toan mo phong
$payReq = @{ paymentMethod = "MOCK_VNPAY" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/$orderCode/mock-pay" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $payReq

# NSX cap nhat don hang sang DELIVERED (Hoan tat)
$statusBody = @{ status = "DELIVERED" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/$orderCode/status" -Method Put -ContentType "application/json; charset=utf-8" -Headers $prodHeaders -Body $statusBody
Write-Host "   -> Don hang da chuyen sang DELIVERED!" -ForegroundColor Green

# -------------------------------------------------------------
# 7. KIEM TRA DASHBOARD NHA SAN XUAT SAU KHI CO DOANH THU
# -------------------------------------------------------------
Write-Host "`n[7] Kiem tra lai Dashboard cua Nha san xuat sau khi phat sinh don..." -ForegroundColor Yellow
$statsUpdated = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/stats/dashboard" -Method Get -Headers $prodHeaders
Write-Host "   -> Tong doanh thu thuc te: $($statsUpdated.data.totalRevenue) VND (Ky vong: 750000)" -ForegroundColor Green
Write-Host "   -> Tong don hang: $($statsUpdated.data.totalOrders) (Ky vong: 1)" -ForegroundColor Green
Write-Host "   -> Don da hoan thanh: $($statsUpdated.data.completedOrders) (Ky vong: 1)" -ForegroundColor Green
Write-Host "   -> Tong san pham da ban: $($statsUpdated.data.totalUnitsSold) (Ky vong: 3)" -ForegroundColor Green
Write-Host "   -> Top san pham ban chay:" -ForegroundColor Yellow
$topProd = $statsUpdated.data.topSellingProducts[0]
Write-Host "      + Ten: $($topProd.productName)" -ForegroundColor Cyan
Write-Host "      + Da ban: $($topProd.quantitySold) hop (Ky vong: 3)" -ForegroundColor Cyan
Write-Host "      + Doanh thu sp: $($topProd.totalRevenue) VND (Ky vong: 750000)" -ForegroundColor Cyan

# Kiem tra timeline 7 ngay
$todayStr = (Get-Date).ToString("dd/MM")
$todayEntry = $statsUpdated.data.revenueTimeline | Where-Object { $_.date -eq $todayStr }
Write-Host "   -> Timeline ngay hom nay ($todayStr): Doanh thu = $($todayEntry.revenue) VND, Don = $($todayEntry.orderCount), So luong = $($todayEntry.unitsSold)" -ForegroundColor Green

if ($statsUpdated.data.totalRevenue -ne 750000) {
    Write-Error "Loi: Doanh thu khong khop! Nhan duoc $($statsUpdated.data.totalRevenue)"
}
if ($statsUpdated.data.totalUnitsSold -ne 3) {
    Write-Error "Loi: So luong san pham da ban khong khop!"
}
if ($statsUpdated.data.completedOrders -ne 1) {
    Write-Error "Loi: So don hoan thanh khong khop!"
}

# -------------------------------------------------------------
# 8. KIEM TRA ADMIN DASHBOARD & CO LAP DU LIEU
# -------------------------------------------------------------
Write-Host "`n[8] Kiem tra Admin Dashboard va loc theo producerId..." -ForegroundColor Yellow
$adminLogin = @{ usernameOrEmail = "admin"; password = "password123" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $adminLogin
$adminHeaders = @{ Authorization = "Bearer $($adminRes.data.accessToken)" }

# Admin xem rieng nha san xuat nay
$adminScopedStats = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/stats/dashboard?producerId=$producerId" -Method Get -Headers $adminHeaders
Write-Host "   -> Admin loc theo Producer ID $($producerId):" -ForegroundColor Green
Write-Host "      + Ten NSX:" $adminScopedStats.data.producerName
Write-Host "      + Doanh thu:" $adminScopedStats.data.totalRevenue "VND"
Write-Host "      + So don:" $adminScopedStats.data.totalOrders
if ($adminScopedStats.data.totalRevenue -ne 750000) {
    Write-Error "Loi: Admin loc theo producerId khong dung so lieu!"
}

Write-Host "`n==========================================================================" -ForegroundColor Green
Write-Host "  TAT CA CAC TEST DASHBOARD THONG KE UU TIEN 3 DEU PASSED 100%! EXCELLENT" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Green
