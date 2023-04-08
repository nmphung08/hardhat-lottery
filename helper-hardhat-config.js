const { ethers } = require("hardhat")

const developmentChains = ["localhost", "hardhat"]
const networkConfig = {
    31337: {
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "500000",
        interval: "30"
    },
    5: {
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "500000",
        subId: "0",
        interval: "30",
        VRFCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d"
    },
    80001: {
        entranceFee: ethers.utils.parseEther("0.001"),
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        callbackGasLimit: "500000",
        subId: "4169",
        interval: "30",
        VRFCoordinatorV2: "0x7a1bac17ccc5b313516c5e16fb24f7659aa5ebed"
    }
}

module.exports = { developmentChains, networkConfig }