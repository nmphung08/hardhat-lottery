require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()


const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || ""
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.8",

  defaultNetwork: "hardhat",

  networks: {
    "localhost": {
      chainId: 31337,
    },
    "goerli": {
      chainId: 5,
      blockConfirmations: 6,
      accounts: [PRIVATE_KEY],
      url: GOERLI_RPC_URL
    }
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },

  gasReporter: {
    enabled: false,
    coinmarketcap: COINMARKETCAP_API_KEY,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },

  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },

  mocha: {
    timeout: 500000,
  }
};
