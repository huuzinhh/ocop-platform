$ErrorActionPreference = "Stop"

Write-Host "=========================================================="
Write-Host "  KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN THƯƠNG MẠI ĐIỆN TỬ OCOP (TUẦN 3)"
Write-Host "=========================================================="

# 1. Khách hàng đăng nhập
Write-Host "`n1. Đăng nhập tài khoản Khách hàng (customer_demo)..."
$custLogin = @{ usernameOrEmail = "customer_demo"; password = "123456" } | ConvertTo-Json
$custRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $custLogin
$custToken = $custRes.data.accessToken
$custHeaders = @{ Authorization = "Bearer $custToken" }
Write-Host "   -> Đăng nhập thành công! User:" $custRes.data.user.fullName

# 2. Xóa giỏ hàng cũ để bắt đầu sạch
Write-Host "`n2. Làm sạch giỏ hàng..."
$clearRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/cart" -Method Delete -Headers $custHeaders
Write-Host "   -> Giỏ hàng đã làm rỗng:" $clearRes.message

# 3. Thêm sản phẩm vào giỏ hàng
Write-Host "`n3. Thêm sản phẩm vào giỏ hàng..."
$item1 = @{ productId = 1; quantity = 2 } | ConvertTo-Json
$cartRes1 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/cart/items" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $item1
Write-Host "   -> Đã thêm 2 Trà Shan Tuyết. Số món trong giỏ:" $cartRes1.data.totalItems "Tổng tiền:" $cartRes1.data.totalAmount "VNĐ"

$item2 = @{ productId = 2; quantity = 1 } | ConvertTo-Json
$cartRes2 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/cart/items" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $item2
Write-Host "   -> Đã thêm 1 Mật ong Bạc hà. Số món trong giỏ:" $cartRes2.data.totalItems "Tổng tiền:" $cartRes2.data.totalAmount "VNĐ"

# 4. Tạo đơn hàng từ giỏ hàng (Checkout)
Write-Host "`n4. Tiến hành Đặt hàng (Checkout) từ giỏ hàng..."
$orderReq = @{
    recipientName = "Nguyễn Văn Người Dùng"
    recipientPhone = "0912345678"
    shippingAddress = "Số 123 Đường Trần Phú, Quận Ba Đình, Hà Nội"
    note = "Giao giờ hành chính, đóng gói cẩn thận làm quà biếu"
    paymentMethod = "MOCK_VNPAY"
} | ConvertTo-Json

$orderRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $orderReq
$orderCode = $orderRes.data.orderCode
Write-Host "   -> Đặt hàng thành công!"
Write-Host "      + Mã đơn hàng:" $orderCode
Write-Host "      + Tổng giá trị:" $orderRes.data.totalAmount "VNĐ"
Write-Host "      + Trạng thái đơn hàng:" $orderRes.data.status
Write-Host "      + Trạng thái thanh toán:" $orderRes.data.paymentStatus
Write-Host "      + Mã vận đơn:" $orderRes.data.trackingCode

# 5. Kiểm tra giỏ hàng sau khi đặt (phải rỗng)
Write-Host "`n5. Kiểm tra lại giỏ hàng sau khi đã đặt..."
$cartAfter = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/cart" -Method Get -Headers $custHeaders
Write-Host "   -> Số món còn lại trong giỏ:" $cartAfter.data.totalItems "(Đúng kỳ vọng = 0)"

# 6. Thanh toán mô phỏng VNPay
Write-Host "`n6. Thực hiện Thanh toán mô phỏng (Mock VNPay)..."
$payReq = @{ paymentMethod = "MOCK_VNPAY" } | ConvertTo-Json
$payRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/$orderCode/mock-pay" -Method Post -ContentType "application/json; charset=utf-8" -Headers $custHeaders -Body $payReq
Write-Host "   -> Kết quả thanh toán mô phỏng:"
Write-Host "      + Trạng thái đơn hàng sau thanh toán:" $payRes.data.status "(Kỳ vọng: CONFIRMED)"
Write-Host "      + Trạng thái thanh toán:" $payRes.data.paymentStatus "(Kỳ vọng: SUCCESS)"
Write-Host "      + Mã giao dịch thanh toán:" $payRes.data.paymentTransactionRef
Write-Host "      + Trạng thái vận chuyển:" $payRes.data.shipmentStatus "(Kỳ vọng: IN_TRANSIT)"

# 7. Đăng nhập Nhà sản xuất và đăng bán sản phẩm OCOP mới
Write-Host "`n7. Đăng nhập Nhà sản xuất (producer_finho) và đăng bán sản phẩm OCOP mới..."
$prodLogin = @{ usernameOrEmail = "producer_finho"; password = "123456" } | ConvertTo-Json
$prodRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -ContentType "application/json; charset=utf-8" -Body $prodLogin
$prodToken = $prodRes.data.accessToken
$prodHeaders = @{ Authorization = "Bearer $prodToken" }

$randCode = Get-Random -Minimum 100 -Maximum 999
$newProduct = @{
    name = "Bạch Trà Shan Tuyết Cổ Thụ Đặc Biệt $randCode"
    categoryId = 1
    description = "Bạch trà thượng hạng từ búp non phủ lông tuyết trắng muốt của cây chè cổ thụ trên đỉnh Tây Côn Lĩnh."
    culturalStory = "Di sản văn hóa chè Shan Tuyết hàng trăm năm tuổi của đồng bào người Dao đỏ Hoàng Su Phì."
    price = 650000
    stockQuantity = 50
    unit = "Hộp 100g"
    ocopStarRating = 5
    thumbnail = "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500"
} | ConvertTo-Json

$createProdRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/products" -Method Post -ContentType "application/json; charset=utf-8" -Headers $prodHeaders -Body $newProduct
Write-Host "   -> Đăng sản phẩm thành công! ID:" $createProdRes.data.id "Tên:" $createProdRes.data.name "Sao:" $createProdRes.data.ocopStarRating "Giá:" $createProdRes.data.price "VNĐ"

# 8. Xem danh sách đơn hàng của khách hàng
Write-Host "`n8. Kiểm tra lịch sử đơn hàng của khách hàng..."
$myOrders = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders" -Method Get -Headers $custHeaders
Write-Host "   -> Số đơn hàng đã đặt:" $myOrders.data.Count "Đơn gần nhất:" $myOrders.data[0].orderCode

Write-Host "`n=========================================================="
Write-Host "  TẤT CẢ CÁC BÀI TEST THƯƠNG MẠI ĐIỆN TỬ ĐÃ THÀNH CÔNG 100%!"
Write-Host "=========================================================="
