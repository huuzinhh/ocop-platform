import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("----------------------------------------------------");
  console.log("🚀 Bắt đầu quá trình Deploy Smart Contract OCOP (Viem)...");

  // 1. Kết nối với viem public client & wallet client
  const { viem } = await import("hardhat");
  const [deployer] = await viem.getWalletClients();

  console.log("👤 Tài khoản Deployer:", deployer.account.address);

  // 2. Tiến hành deploy hợp đồng OcopTraceability
  const ocopContract = await viem.deployContract("OcopTraceability");

  console.log("✅ Deploy Smart Contract THÀNH CÔNG!");
  console.log("📍 Địa chỉ Contract Address:", ocopContract.address);
  console.log("----------------------------------------------------");

  // 3. Tự động lưu địa chỉ hợp đồng ra file JSON
  const deployInfo = {
    network: network.name,
    contractAddress: ocopContract.address,
    deployerAddress: deployer.account.address,
    deployedAt: new Date().toISOString()
  };

  const outputDir = path.join(__dirname, "../build_info");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "contract_address.json"),
    JSON.stringify(deployInfo, null, 2)
  );

  console.log("💾 Đã lưu cấu hình vào: blockchain/build_info/contract_address.json");
}

main().catch((error) => {
  console.error("❌ Lỗi khi deploy:", error);
  process.exitCode = 1;
});