import hre from "hardhat";
import fs from 'fs';

async function main() {
  console.log("Starting deployment to", hre.network.name);

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy SimpleCounter (FHE simulation for Sepolia)
  console.log("Deploying SimpleCounter...");
  const SimpleCounter = await hre.ethers.getContractFactory("SimpleCounter");
  const simpleCounter = await SimpleCounter.deploy();
  await simpleCounter.waitForDeployment();
  
  const simpleCounterAddress = await simpleCounter.getAddress();
  console.log("SimpleCounter deployed to:", simpleCounterAddress);

  // Get contract info
  const contractInfo = await simpleCounter.getContractInfo();
  console.log("Contract Info:", contractInfo);

  // Test initial count
  const initialCount = await simpleCounter.getCount();
  console.log("Initial count:", initialCount.toString());

  // Save deployment addresses
  const deploymentData = {
    SimpleCounter: simpleCounterAddress,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 'unknown',
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    gasUsed: "Estimated 500k gas"
  };

  // Ensure directory exists
  const deploymentDir = './frontend/src/contracts/';
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  fs.writeFileSync(
    deploymentDir + 'deployments.json',
    JSON.stringify(deploymentData, null, 2)
  );
  
  console.log("Deployment addresses saved to frontend/src/contracts/deployments.json");
  console.log("✅ Deployment completed successfully!");
  console.log(`📍 Contract Address: ${simpleCounterAddress}`);
  console.log(`🔍 View on Etherscan: https://sepolia.etherscan.io/address/${simpleCounterAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });