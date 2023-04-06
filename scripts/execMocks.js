const { ethers, network } = require("hardhat");




async function mockKeepers() {
    let raffle = await ethers.getContract("Raffle")
    let tx = await raffle.performUpkeep([])
    txReceipt = await tx.wait(1)
    console.log("-------------------------")
    console.log("Done with Keepers!")
    if (network.config.chainId == 31337) {
        await mockVrf(txReceipt.events[1].args.requestId, raffle)
    }


}

async function mockVrf(reqId, raffle) {
    let vrf = await ethers.getContract("VRFCoordinatorV2Mock")
    await vrf.fulfillRandomWords(reqId, raffle.address)
    console.log("-------------------------")
    console.log("Done with VRF!")

    let recentWinner = await raffle.getRecentWinner()
    console.log("-------------------------")
    console.log(`The recent winner is: ${recentWinner}`)
}



mockKeepers()
    .then(() => {
        process.exit(0)
    })
    .catch((e) => { console.log(e) })