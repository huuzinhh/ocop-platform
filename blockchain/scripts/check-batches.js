import { createPublicClient, http, decodeFunctionData } from "viem";
import { hardhat } from "viem/chains";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const artifactPath = path.join(__dirname, "../artifacts/contracts/OcopTraceability.sol/OcopTraceability.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const client = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });

  const latestBlock = await client.getBlockNumber();
  console.log(`Scanning blocks 1 to ${latestBlock}...`);

  for (let i = 1n; i <= latestBlock; i++) {
    const block = await client.getBlock({ blockNumber: i, includeTransactions: true });
    for (const tx of block.transactions) {
      try {
        const decoded = decodeFunctionData({
          abi: artifact.abi,
          data: tx.input,
        });
        console.log(`Block #${i}: Function ${decoded.functionName}, Args:`, decoded.args);
      } catch (e) {
        // Not a contract call with our abi (e.g. deployment)
        console.log(`Block #${i}: Deployment / Other Tx: ${tx.hash}`);
      }
    }
  }
}

main().catch(console.error);
