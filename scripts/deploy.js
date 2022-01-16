// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  console.log("Deploying process");

  const United = await hre.ethers.getContractFactory("United");
  console.log("got the United factory");
  const united = await United.deploy();
  console.log("united deployed");

  await united.deployed();
  console.log("United deployed to:", united.address);

  const UnionNFT = await hre.ethers.getContractFactory("UnionNFT");
  console.log("got the UnionNFT factory");

  const unionNFT = await UnionNFT.deploy(united.address);
  console.log("unionNFT deployed");

  await unionNFT.deployed();
  console.log("UnionNFT deployed to:", unionNFT.address);

  const receipt = await united.deployTransaction.wait();
  const receiptNFT = await unionNFT.deployTransaction.wait();
  console.log("gasUsed united", receipt.gasUsed._hex);
  console.log("gasUsed unionNFT", receiptNFT.gasUsed._hex);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
