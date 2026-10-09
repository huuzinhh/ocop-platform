$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  KIỂM THỬ TỰ ĐỘNG: ĐĂNG KÝ NHÀ SẢN XUẤT MỚI & QUẢN LÝ ĐƠN HÀNG RIÊNG BIỆT" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

$suffix = Get-Random -Minimum 1000 -Maximum 9999
$prodUsername = "producer_test_$suffix"
$prodEmail = "producer_$suffix@ocop.vn"
$prodFullName = "Hợp tác xã Mật Ong Rừng $suffix"
$prodPassword = "password123"

# -------------------------------------------------------------
# BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN NHÀ SẢN XUẤT MỚI
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 1] Đăng ký tài khoản Nhà sản xuất mới ($prodUsername)..." -ForegroundColor Yellow
$regBody = @{
    username = $prodUsername
    email = $prodEmail
    password = $prodPassword
    fullName = $prodFullName
    phone = "0988776655"
    role = "PRODUCER"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json; charset=utf-8" -Body $regBody
Write-Host "   -> Đăng ký thành công! ID:" $regRes.data.id "Username:" $regRes.data.username "Roles:" ($regRes.data.roles -join ", ") -ForegroundColor Green

# -------------------------------------------------------------
# BƯỚC 2: ĐĂNG NHẬP NHÀ SẢN XUẤT MỚI
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 2] Đăng nhập bằng tài khoản Nhà sản xuất mới..." -ForegroundColor Yellow
$loginBody = @{
    usernameOrEmail = $prodUsername
    password = $prodPassword
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $loginBody
$prodToken = $loginRes.data.accessToken
$prodHeaders = @{ Authorization = "Bearer $prodToken" }
Write-Host "   -> Đăng nhập thành công! Token đã cấp." -ForegroundColor Green

# -------------------------------------------------------------
# BƯỚC 3: NHÀ SẢN XUẤT MỚI ĐĂNG BÁN SẢN PHẨM OCOP
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 3] Nhà sản xuất mới đăng bán sản phẩm OCOP..." -ForegroundColor Yellow
$newProduct = @{
    name = "Mật Ong Hoa Bạc Hà Mèo Vạc $suffix"
    categoryId = 1
    description = "Mật ong bạc hà nguyên chất khai thác từ hoa bạc hà dại trên cao nguyên đá Đồng Văn."
    culturalStory = "Đặc sản chỉ có vào mùa đông tại vùng cao nguyên đá Hà Giang."
    price = 320000
    stockQuantity = 80
    unit = "Chai 500ml"
    ocopStarRating = 4
    thumbnail = "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500"
} | ConvertTo-Json

$prodCreatedRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products" -Method Post -ContentType "application/json; charset=utf-8" -Headers $prodHeaders -Body $newProduct
$createdProductId = $prodCreatedRes.data.id
$producerId = $prodCreatedRes.data.producer.id
$producerName = $prodCreatedRes.data.producer.name
Write-Host "   -> Đăng sản phẩm thành công!" -ForegroundColor Green
Write-Host "      + Product ID:" $createdProductId
Write-Host "      + Tên sản phẩm:" $prodCreatedRes.data.name
Write-Host "      + Thuộc về Nhà SX ID:" $producerId "($producerName)" -ForegroundColor Magenta

# -------------------------------------------------------------
# BƯỚC 4: KIỂM TRA API SẢN PHẨM CỦA TÔI
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 4] Gọi API GET /api/v1/products/my-products..." -ForegroundColor Yellow
$myProductsRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products/my-products" -Method Get -Headers $prodHeaders
Write-Host "   -> Số sản phẩm của cơ sở:" $myProductsRes.data.Count -ForegroundColor Green
if ($myProductsRes.data.Count -gt 0) {
    Write-Host "      + Tên món đầu tiên:" $myProductsRes.data[0].name "(Producer: $($myProductsRes.data[0].producer.name))" -ForegroundColor Gray
}

# -------------------------------------------------------------
# BƯỚC 5: ĐĂNG KÝ & ĐĂNG NHẬP KHÁCH HÀNG ĐỂ MUA SẢN PHẨM
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 5] Khách hàng đặt mua sản phẩm của Nhà sản xuất mới..." -ForegroundColor Yellow
$custUsername = "cust_test_$suffix"
$custPassword = "password123"
$custRegBody = @{
    username = $custUsername
    email = "cust_$suffix@ocop.vn"
    password = $custPassword
    fullName = "Trần Thị Khách Hàng $suffix"
    phone = "0912345678"
    role = "CUSTOMER"
} | ConvertTo-Json

$custRegRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json; charset=utf-8" -Body $custRegBody

$custLogin = @{ usernameOrEmail = $custUsername; password = $custPassword } | ConvertTo-Json
$custRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $custLogin
$custHeaders = @{ Authorization = "Bearer $($custRes.data.accessToken)" }

# Thêm 2 chai mật ong vào giỏ
$addCartBody = @{ productId = $createdProductId; quantity = 2 } | ConvertTo-Json
$cartRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/cart/items" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $addCartBody

# Đặt hàng (Checkout)
$orderReq = @{
    recipientName = "Trần Thị Khách Hàng"
    recipientPhone = "0933445566"
    shippingAddress = "Số 456 Đường Lê Lợi, TP. Đà Nẵng"
    note = "Giao hàng bọc bóng khí chống vỡ"
    paymentMethod = "MOCK_VNPAY"
} | ConvertTo-Json

$orderRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $orderReq
$orderCode = $orderRes.data.orderCode
Write-Host "   -> Khách hàng đặt đơn thành công! Mã đơn:" $orderCode "Tổng tiền:" $orderRes.data.totalAmount "VNĐ" -ForegroundColor Green

# Thanh toán mô phỏng
$payReq = @{ paymentMethod = "MOCK_VNPAY" } | ConvertTo-Json
$payRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/$orderCode/mock-pay" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $payReq
Write-Host "   -> Thanh toán mô phỏng thành công! Trạng thái đơn:" $payRes.data.status -ForegroundColor Green

# -------------------------------------------------------------
# BƯỚC 6: NHÀ SẢN XUẤT MỚI KIỂM TRA ĐƠN HÀNG CỦA MÌNH
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 6] Nhà sản xuất mới kiểm tra danh sách đơn hàng quản lý..." -ForegroundColor Yellow
$prodOrdersRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/all" -Method Get -Headers $prodHeaders
Write-Host "   -> Số đơn hàng cơ sở nhìn thấy:" $prodOrdersRes.data.Count -ForegroundColor Green

$foundOrder = $prodOrdersRes.data | Where-Object { $_.orderCode -eq $orderCode }
if ($null -ne $foundOrder) {
    Write-Host "   [CHÍNH XÁC] Tìm thấy đúng đơn hàng $orderCode!" -ForegroundColor Green
    Write-Host "      + Người nhận:" $foundOrder.recipientName "($($foundOrder.recipientPhone))"
    Write-Host "      + Tổng giá trị đơn cơ sở:" $foundOrder.totalAmount "VNĐ"
    Write-Host "      + Số lượng sản phẩm của cơ sở trong đơn:" $foundOrder.items.Count
    Write-Host "      + Tên sản phẩm:" $foundOrder.items[0].productName "x" $foundOrder.items[0].quantity
} else {
    Write-Error "KHÔNG tìm thấy đơn hàng $orderCode trong danh sách của Nhà sản xuất mới!"
}

# -------------------------------------------------------------
# BƯỚC 7: KIỂM TRA CÔ LẬP DỮ LIỆU VỚI MỘT NHÀ SẢN XUẤT KHÁC
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 7] Kiểm tra tính cô lập: Nhà sản xuất khác có nhìn thấy đơn này không?..." -ForegroundColor Yellow
$otherProdUsername = "producer_other_$suffix"
$otherProdReg = @{
    username = $otherProdUsername
    email = "other_$suffix@ocop.vn"
    password = "password123"
    fullName = "HTX Chè Khác $suffix"
    phone = "0977665544"
    role = "PRODUCER"
} | ConvertTo-Json
$otherRegRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json; charset=utf-8" -Body $otherProdReg

$otherLogin = @{ usernameOrEmail = $otherProdUsername; password = "password123" } | ConvertTo-Json
$otherRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $otherLogin
$otherHeaders = @{ Authorization = "Bearer $($otherRes.data.accessToken)" }

$otherOrders = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/all" -Method Get -Headers $otherHeaders
$leakOrder = $otherOrders.data | Where-Object { $_.orderCode -eq $orderCode }

if ($null -eq $leakOrder) {
    Write-Host "   [CHÍNH XÁC] Nhà sản xuất khác KHÔNG nhìn thấy đơn hàng của bạn. Dữ liệu được bảo mật và cô lập 100%!" -ForegroundColor Green
} else {
    Write-Error "LỖI: Nhà sản xuất khác vẫn nhìn thấy đơn hàng của cơ sở này!"
}

# -------------------------------------------------------------
# BƯỚC 8: KIỂM TRA ADMIN CÓ THỂ XEM TẤT CẢ ĐƠN
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 8] Kiểm tra Admin (admin) có nhìn thấy đơn hàng này không?..." -ForegroundColor Yellow
$adminLogin = @{ usernameOrEmail = "admin"; password = "password123" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $adminLogin
$adminHeaders = @{ Authorization = "Bearer $($adminRes.data.accessToken)" }

$adminOrders = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/all" -Method Get -Headers $adminHeaders
$adminFoundOrder = $adminOrders.data | Where-Object { $_.orderCode -eq $orderCode }

if ($null -ne $adminFoundOrder) {
    Write-Host "   [CHÍNH XÁC] Admin nhìn thấy toàn bộ đơn hàng trong hệ thống (Tổng: $($adminOrders.data.Count) đơn)!" -ForegroundColor Green
} else {
    Write-Error "LỖI: Admin không nhìn thấy đơn hàng!"
}

# -------------------------------------------------------------
# BƯỚC 9: CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
# -------------------------------------------------------------
Write-Host "`n[BƯỚC 9] Nhà sản xuất mới cập nhật trạng thái đơn hàng sang DELIVERED..." -ForegroundColor Yellow
$statusBody = @{ status = "DELIVERED" } | ConvertTo-Json
$updateRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/$orderCode/status" -Method Put -ContentType "application/json; charset=utf-8" -Headers $prodHeaders -Body $statusBody
Write-Host "   -> Cập nhật trạng thái thành công! Trạng thái mới:" $updateRes.data.status -ForegroundColor Green

Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host "  TẤT CẢ 9 BƯỚC KIỂM THỬ ĐÃ THÀNH CÔNG 100%! HỆ THỐNG HOẠT ĐỘNG CHUẨN XÁC!" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan
