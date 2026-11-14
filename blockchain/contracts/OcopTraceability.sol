// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OcopTraceability
 * @dev Hợp đồng thông minh lưu trữ và xác thực chuỗi cung ứng đặc sản OCOP Việt Nam
 */
contract OcopTraceability {

    // 1. Cấu trúc dữ liệu Lô sản xuất
    struct Batch {
        string batchCode;           // Mã lô (ví dụ: BATCH-P001-20260408)
        string dataHash;            // Mã băm SHA-256 thông tin lô (ngày SX, HSD, sản lượng, chứng nhận)
        string producerCode;        // Mã cơ sở / HTX sản xuất
        uint256 timestamp;          // Thời điểm ghi nhận lên Blockchain (Block timestamp)
        address recordedBy;         // Địa chỉ ví người thực hiện giao dịch
        bool isExisted;             // Đánh dấu lô hàng đã tồn tại
    }

    // 2. Cấu trúc dữ liệu Sự kiện chuỗi cung ứng (Thu hái, chế biến, kiểm định, đóng gói)
    struct SupplyChainEvent {
        string eventType;           // Loại sự kiện: HARVEST, PROCESSING, QUALITY_INSPECTION, PACKAGING
        string eventName;           // Tên hiển thị sự kiện
        string eventHash;           // Mã băm SHA-256 dữ liệu sự kiện
        string actorName;           // Người / Bộ phận thực hiện
        uint256 timestamp;          // Thời điểm ghi nhận
    }

    // Lưu trữ Lô sản xuất theo mã lô: batchCode => Batch
    mapping(string => Batch) private batches;

    // Lưu trữ danh sách sự kiện theo mã lô: batchCode => Danh sách sự kiện
    mapping(string => SupplyChainEvent[]) private batchEvents;

    // Danh sách tất cả mã lô đã đăng ký để tiện duyệt qua
    string[] private allBatchCodes;

    // Sự kiện phát ra (Event log) khi có giao dịch mới (hỗ trợ Web3 lắng nghe)
    event BatchRegistered(string indexed batchCode, string dataHash, string producerCode, uint256 timestamp);
    event EventAdded(string indexed batchCode, string eventType, string eventHash, uint256 timestamp);

    /**
     * @dev Đăng ký lô sản xuất mới lên Blockchain
     */
    function registerBatch(
        string memory _batchCode,
        string memory _dataHash,
        string memory _producerCode
    ) public {
        require(bytes(_batchCode).length > 0, "Ma lo khong duoc de trong");
        require(bytes(_dataHash).length > 0, "Ma bam hash khong duoc de trong");
        require(!batches[_batchCode].isExisted, "Ma lo san xuat nay da ton tai tren Blockchain");

        batches[_batchCode] = Batch({
            batchCode: _batchCode,
            dataHash: _dataHash,
            producerCode: _producerCode,
            timestamp: block.timestamp,
            recordedBy: msg.sender,
            isExisted: true
        });

        allBatchCodes.push(_batchCode);

        emit BatchRegistered(_batchCode, _dataHash, _producerCode, block.timestamp);
    }

    /**
     * @dev Thêm một công đoạn / sự kiện chuỗi cung ứng vào lô sản xuất
     */
    function addSupplyChainEvent(
        string memory _batchCode,
        string memory _eventType,
        string memory _eventName,
        string memory _eventHash,
        string memory _actorName
    ) public {
        require(batches[_batchCode].isExisted, "Lo san xuat khong ton tai tren Blockchain");
        require(bytes(_eventHash).length > 0, "Ma bam su kien khong duoc de trong");

        SupplyChainEvent memory newEvent = SupplyChainEvent({
            eventType: _eventType,
            eventName: _eventName,
            eventHash: _eventHash,
            actorName: _actorName,
            timestamp: block.timestamp
        });

        batchEvents[_batchCode].push(newEvent);

        emit EventAdded(_batchCode, _eventType, _eventHash, block.timestamp);
    }

    /**
     * @dev Đọc thông tin Lô sản xuất từ Blockchain (Miễn phí Gas)
     */
    function getBatch(string memory _batchCode) public view returns (
        string memory batchCode,
        string memory dataHash,
        string memory producerCode,
        uint256 timestamp,
        address recordedBy
    ) {
        require(batches[_batchCode].isExisted, "Lo san xuat khong ton tai");
        Batch memory b = batches[_batchCode];
        return (b.batchCode, b.dataHash, b.producerCode, b.timestamp, b.recordedBy);
    }

    /**
     * @dev Lấy toàn bộ danh sách sự kiện chuỗi cung ứng của lô
     */
    function getEvents(string memory _batchCode) public view returns (SupplyChainEvent[] memory) {
        require(batches[_batchCode].isExisted, "Lo san xuat khong ton tai");
        return batchEvents[_batchCode];
    }

    /**
     * @dev Hàm kiểm tra tính toàn vẹn: So sánh hash tính được với hash lưu trên Blockchain
     */
    function verifyBatchIntegrity(string memory _batchCode, string memory _calculatedHash) public view returns (bool) {
        if (!batches[_batchCode].isExisted) {
            return false;
        }
        // So sánh chuỗi hash
        return keccak256(abi.encodePacked(batches[_batchCode].dataHash)) == keccak256(abi.encodePacked(_calculatedHash));
    }
}