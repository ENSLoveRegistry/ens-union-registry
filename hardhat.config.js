require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.7",
  settings: {
    // evmVersion: "byzantium",
    optimizer: {
      enabled: true,
      runs: 1,
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/OZYrTiuf99NjUsn4PJ_oTvAXPSlg7LjY",
      },
    },
    goerli: {
      url: process.env.ALCHEMY_GOERLI_API,
      accounts: [`${process.env.GOERLY_PRIVATE_KEY}`],
    },
  },
  etherscan: { apiKey: process.env.ETHERSCAN_KEY },
};
