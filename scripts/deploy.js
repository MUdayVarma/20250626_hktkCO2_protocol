const { ethers } = require("hardhat");

async function main() {
  const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
  console.log("Deploying CarbonCreditToken...");
  const carbonCreditToken = await CarbonCreditToken.deploy();
  await carbonCreditToken.deployed();
  console.log("CarbonCreditToken deployed to:", carbonCreditToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });