
const fs = require("fs")
const { network, ethers } = require("hardhat")
const ABI_PATH = "D:\\pp\\projects\\blockchain\\nextjs-lottery\\constants\\abi.json"
const ADDRESS_PATH = "D:\\pp\\projects\\blockchain\\nextjs-lottery\\constants\\contractAddress.json"
module.exports = async function () {

    if (process.env.UPDATE_FRONTEND) {
        console.log("Update front-end!")
        updateAbi()
        updateContractAddresses()
    }

}

async function updateAbi() {
    let raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(ABI_PATH, raffle.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
    let raffle = await ethers.getContract("Raffle")
    let currentAddresses = JSON.parse(fs.readFileSync(ADDRESS_PATH, "utf8"))
    let chainId = network.config.chainId.toString()
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.address)) {
            currentAddresses[chainId].push(raffle.address)
        }
    }
    else {
        currentAddresses[chainId] = [raffle.address]
    }

    fs.writeFileSync(ADDRESS_PATH, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all","frontend"]
