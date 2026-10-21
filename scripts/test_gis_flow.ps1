$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  KIỂM THỬ TỰ ĐỘNG: BẢN ĐỒ SỐ GIS ĐỊNH VỊ OCOP & BỘ LỌC ĐA CHIỀU" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# -------------------------------------------------------------
# BƯỚC 1: KIỂM TRA TRUY VẤN CÔNG KHAI TẤT CẢ ĐIỂM ĐỊNH VỊ GIS
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 1] Lấy danh sách điểm định vị GIS các cơ sở OCOP toàn quốc (Public API)..." -ForegroundColor Yellow
$markersRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/gis/markers" -Method Get
Write-Host "   -> Thành công! Tổng số cơ sở OCOP có định vị GPS:" $markersRes.data.Count -ForegroundColor Green

if ($markersRes.data.Count -eq 0) {
    Write-Host "   [LỖI] Không tìm thấy cơ sở OCOP nào có tọa độ!" -ForegroundColor Red
    exit 1
}

$firstMarker = $markersRes.data[0]
Write-Host "   -> Điểm OCOP tiêu biểu:" $firstMarker.producerName "- Tỉnh:" $firstMarker.province "- Tọa độ: (" $firstMarker.latitude "," $firstMarker.longitude ") - Sao:" $firstMarker.maxStarRating "★" -ForegroundColor Cyan

# -------------------------------------------------------------
# BƯỚC 2: KIỂM TRA TRUY VẤN DANH SÁCH TỈNH THÀNH OCOP
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 2] Lấy danh sách Tỉnh/Thành phố có cơ sở OCOP..." -ForegroundColor Yellow
$provRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/gis/provinces" -Method Get
Write-Host "   -> Danh sách các Tỉnh/Thành OCOP (" ($provRes.data.Count) "tỉnh):" ($provRes.data -join ", ") -ForegroundColor Green

# -------------------------------------------------------------
# BƯỚC 3: KIỂM TRA BỘ LỌC THEO TỈNH THÀNH (Bến Tre)
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 3] Lọc cơ sở OCOP theo Tỉnh Bến Tre..." -ForegroundColor Yellow
$filterProvRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/gis/markers?province=B%E1%BA%BFn+Tre" -Method Get
Write-Host "   -> Số cơ sở tại Bến Tre:" $filterProvRes.data.Count -ForegroundColor Green
foreach ($m in $filterProvRes.data) {
    Write-Host "      + " $m.producerName " - " $m.addressDetail " (Sản phẩm: " $m.totalProducts ")" -ForegroundColor Gray
}

# -------------------------------------------------------------
# BƯỚC 4: KIỂM TRA BỘ LỌC THEO HẠNG SAO OCOP (5 Sao)
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 4] Lọc cơ sở OCOP đạt chuẩn 5 Sao (Cấp Quốc gia)..." -ForegroundColor Yellow
$filterStarRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/gis/markers?starRating=5" -Method Get
Write-Host "   -> Số cơ sở có sản phẩm 5 Sao:" $filterStarRes.data.Count -ForegroundColor Green
foreach ($m in $filterStarRes.data) {
    Write-Host "      ★ " $m.producerName " (" $m.province ") - Sản phẩm 5★: " ($m.products | Where-Object { $_.ocopStarRating -eq 5 }).name -ForegroundColor Yellow
}

# -------------------------------------------------------------
# BƯỚC 5: KIỂM TRA TÌM KIẾM THEO TỪ KHÓA
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 5] Tìm kiếm cơ sở / đặc sản theo từ khóa 'Chè' hoặc 'Trà'..." -ForegroundColor Yellow
$searchRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/gis/markers?search=Tr%C3%A0" -Method Get
Write-Host "   -> Kết quả tìm kiếm:" $searchRes.data.Count "cơ sở" -ForegroundColor Green
foreach ($m in $searchRes.data) {
    Write-Host "      🍵 " $m.producerName " - " $m.province -ForegroundColor Gray
}

# -------------------------------------------------------------
# BƯỚC 6: ADMIN / PRODUCER CẬP NHẬT TỌA ĐỘ GPS CƠ SỞ
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 6] Đăng nhập Admin và cập nhật tọa độ GPS vùng sản xuất cho cơ sở ID=1..." -ForegroundColor Yellow
$loginBody = @{ usernameOrEmail = "admin"; password = "password123" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $loginBody
$adminHeaders = @{ Authorization = "Bearer $($loginRes.data.accessToken)" }

$updateLocBody = @{
    province = "Bến Tre"
    district = "Thành phố Bến Tre"
    ward = "Xã Phú Hưng"
    addressDetail = "Số 128 Đường Đồng Khởi, Xã Phú Hưng, TP Bến Tre"
    latitude = 10.2456000
    longitude = 106.3789000
} | ConvertTo-Json

$updateRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/gis/producers/1/location" -Method Put -ContentType "application/json; charset=utf-8" -Headers $adminHeaders -Body $updateLocBody
Write-Host "   -> Cập nhật tọa độ thành công!" $updateRes.message -ForegroundColor Green
Write-Host "   -> Tọa độ mới:" $updateRes.data.location.latitude "," $updateRes.data.location.longitude -ForegroundColor Cyan

Write-Host "`n==========================================================================" -ForegroundColor Green
Write-Host "  TẤT CẢ CÁC BƯỚC KIỂM THỬ BẢN ĐỒ SỐ GIS ĐÃ HOÀN TẤT THÀNH CÔNG 100%! " -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Green
