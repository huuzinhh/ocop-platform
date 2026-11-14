import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("----------------------------------------------------");
  console.log("🚀 Đang kết nối mạng Hardhat Node tại http://127.0.0.1:8545 ...");

  // 1. Đọc file ABI và Bytecode mà Hardhat đã compile ở Bước 1
  const artifactPath = path.join(__dirname, "../artifacts/contracts/OcopTraceability.sol/OcopTraceability.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Chưa tìm thấy file compiled artifact. Hãy chạy 'npx hardhat compile' trước!");
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // 2. Sử dụng tài khoản Account #0 mặc định của Hardhat Node (có 10,000 ETH)
  // Private key mặc định nổi tiếng của Account #0 trong Hardhat/Anvil:
  const account = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

  const walletClient = createWalletClient({
    account,
    chain: hardhat,
    transport: http("http://127.0.0.1:8545")
  });

  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545")
  });

  console.log("👤 Deployer Account:", account.address);

  // 3. Gửi transaction deploy contract lên mạng
  console.log("⏳ Đang gửi transaction deploy hợp đồng lên Blockchain...");
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  console.log("📝 Transaction Hash:", hash);
  console.log("⏳ Đang chờ xác nhận Block (Mining)...");

  // 4. Chờ nhận Transaction Receipt để lấy Contract Address
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.log("====================================================");
  console.log("🎉 DEPLOY SMART CONTRACT OCOP THÀNH CÔNG RỰC RỠ!");
  console.log("📍 Contract Address :", contractAddress);
  console.log("🧱 Block Number      :", receipt.blockNumber.toString());
  console.log("⛽ Gas Used          :", receipt.gasUsed.toString());
  console.log("====================================================");

  // 5. Lưu thông tin ra file JSON cho Spring Boot sử dụng
  const outputDir = path.join(__dirname, "../build_info");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const deployInfo = {
    network: "hardhat_localhost",
    contractAddress: contractAddress,
    deployerAddress: account.address,
    blockNumber: receipt.blockNumber.toString(),
    transactionHash: hash,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(outputDir, "contract_address.json"),
    JSON.stringify(deployInfo, null, 2)
  );

  console.log("💾 Đã lưu cấu hình vào: blockchain/build_info/contract_address.json");
}

run().catch((err) => {
  console.error("❌ Lỗi:", err.message || err);
});