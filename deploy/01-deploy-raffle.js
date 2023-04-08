const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
require("dotenv").config()
const {verify} = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    let chainId = network.config.chainId
    let VRFCoordinatorV2, subId, vrfMock

    let entranceFee = networkConfig[chainId]["entranceFee"]
    let gasLane = networkConfig[chainId]["gasLane"]
    let callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    let interval = networkConfig[chainId]["interval"]

    const VRF_SUB_ETH_AMT = ethers.utils.parseEther("2")

    if (developmentChains.includes(network.name)) {
        vrfMock = await ethers.getContract("VRFCoordinatorV2Mock")
        VRFCoordinatorV2 = vrfMock.address
        let txRes = await vrfMock.createSubscription()
        let txReceipt = await txRes.wait(1)
        subId = txReceipt.events[0].args.subId

        await vrfMock.fundSubscription(subId, VRF_SUB_ETH_AMT)
    }
    else {
        VRFCoordinatorV2 = networkConfig[chainId]["VRFCoordinatorV2"]
        subId = networkConfig[chainId]["subId"]
    }

    let args = [VRFCoordinatorV2, entranceFee, gasLane, subId, callbackGasLimit, interval]

    log('---------------------------------------------------')
    log(`Deploying Raffle Contract...`)
    let raffleContract = await deploy("Raffle", {
        from: deployer,
        log: true,
        args: args,
        confirmations: network.config.blockConfirmations || 1,
    })

    // const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

    

    // if (!developmentChains.includes(network.name) && ETHERSCAN_API_KEY) {
    //     await verify(raffleContract.address, args)
    // } 

    if (vrfMock) {
        vrfMock.addConsumer(subId, raffleContract.address)
    }

}

module.exports.tags = ["all", "raffle"]