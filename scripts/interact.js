const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xB6a35A6562A5623F94936e17f5591DB7562be86e";
  const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
  const contract = CarbonCreditToken.attach(contractAddress);

  // Mint credits
  const tx = await contract.mintCredits(
    "0xYourAccountAddress",
    1000,
    "Project123",
    "2023",
    "VerifierCorp"
  );
  await tx.wait();
  console.log("Minted 1000 credits");

  // Check metadata
  const metadata = await contract.creditMetadata(0);
  console.log("Metadata:", metadata);

  // Retire credits
  const retireTx = await contract.retireCredits(500);
  await retireTx.wait();
  console.log("Retired 500 credits");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });