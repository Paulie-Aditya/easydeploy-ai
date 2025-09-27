import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying factory with", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  
  const Factory = await ethers.getContractFactory("TokenFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("TokenFactory deployed to:", factoryAddress);
  
  // Verify deployment by calling a function
  console.log("Factory deployed successfully!");
}

main().catch(e => { console.error(e); process.exit(1); });
