// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  console.log("Deploying process");

  const ENSTogether = await hre.ethers.getContractFactory("ENSTogether");
  console.log("got the ENSTogether factory");
  //Pass the Ens ReverseRegistar contract address to constructor
  const enstogether = await ENSTogether.deploy(
    "0x084b1c3c81545d370f3634392de611caabff8148"
  );
  console.log("enstogether deployed");

  await enstogether.deployed();
  console.log("ENSTogether deployed to:", enstogether.address);

  const ENSTogetherNFT = await hre.ethers.getContractFactory("ENSTogetherNFT");
  console.log("got the ENSTogetherNFT factory");

  const enstogetherNft = await ENSTogetherNFT.deploy(enstogether.address);
  console.log("enstogetherNft deployed");

  await enstogetherNft.deployed();
  console.log("ENSTogetherNFT deployed to:", enstogetherNft.address);

  const receipt = await enstogether.deployTransaction.wait();
  const receiptNFT = await enstogetherNft.deployTransaction.wait();
  console.log("gasUsed enstogether", receipt.gasUsed._hex);
  console.log("gasUsed enstogetherNft", receiptNFT.gasUsed._hex);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
