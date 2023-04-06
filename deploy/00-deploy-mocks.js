const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log('---------------------------------------------------')
        log("Local network detected! Deploying mocks...")

        const BASE_FEE = ethers.utils.parseEther("0.01")
        const GAS_PRICE_LINK = 1e9

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        })

    }
}

module.exports.tags = ["all", "mocks"]