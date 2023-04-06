const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { expect, assert } = require("chai")


!developmentChains.includes(network.name) ? describe.skip :
    describe("Raffle", () => {
        let vrfMock, raffle, deployer, chainId, raffleEntranceFee, raffleInterval, player, raffleContract, deployerObj
        let accounts

        beforeEach(async () => {
            accounts = await ethers.getSigners()
            deployer = (await getNamedAccounts()).deployer
            deployerObj = accounts[0]
            player = accounts[1]
            await deployments.fixture("all")
            chainId = network.config.chainId
            vrfMock = await ethers.getContract("VRFCoordinatorV2Mock")
            raffleContract = await ethers.getContract("Raffle")
            raffle = raffleContract.connect(deployerObj)
            raffleEntranceFee = await raffle.getEntranceFee()
            raffleInterval = await raffle.getInterval()
        })

        describe("constructor", () => {
            it("initializes with proper state: raffle state, interval", async () => {
                let expectedInterval = networkConfig[chainId]["interval"]
                let raffleState = await raffle.getRaffleState()

                assert.equal(raffleInterval.toString(), expectedInterval)
                assert.equal(raffleState.toString(), "0")
            })
        })

        describe("enterRaffle", () => {
            it("reverts when not enough fee used", async () => {
                await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnf")
            })

            it("adds player to list", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                let expectedPlayer = await raffle.getPlayer(0)
                assert.equal(expectedPlayer.toString(), deployer.toString())
            })

            it("emits proposed event", async () => {
                await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(raffle, "RaffleEnter")
            })

            it("can not be enter when calculating", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])

                await raffle.performUpkeep([])

                await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith("Raffle__Calculating")
            })
        })

        describe("checkUpkeep", () => {
            it("returns false if doesnt have ETH", async () => {
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                assert(!upkeepNeeded)
            })

            it("returns false if calculating", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                await raffle.performUpkeep([])
                // same as: await raffle.performUpkeep("0x")
                let state = await raffle.getRaffleState()

                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])

                assert.equal(state.toString(), "1")
                assert(!upkeepNeeded)
            })
        })

        describe("performUpkeep", () => {
            it("can not be execute when upkeep not needed", async () => {
                await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpKeepNotNeeded")
            })

            it("can be execute when upkeep needed", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                await raffle.performUpkeep([])
                let state = await raffle.getRaffleState()

                assert.equal(state.toString(), "1")
            })

            it("excutes vrfCoordinator, emits events", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                let txRes = await raffle.performUpkeep([])
                let txReceipt = await txRes.wait(1)

                let reqId = txReceipt.events[1].args.requestId
                assert(reqId.toNumber() > 0)
            })
        })

        describe("fulfillRandomWords", () => {
            beforeEach(async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
            })

            it("can only be run after performUpkeep", async () => {
                expect(vrfMock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request")
            })

            it("picks a winner, gives the money, resets the state", async () => {
                const entrants = 3
                const idx = 1
                for (let i = idx; i < entrants + idx; i++) {
                    let rafflePlayer = raffleContract.connect(accounts[i])
                    await rafflePlayer.enterRaffle({ value: raffleEntranceFee })
                }
                let startingTimeStamp = await raffle.getLastTimeStamp()

                await new Promise(async (resolve, reject) => {
                    raffle.once("PickedWinner", async () => {
                        try {
                            let raffleState = await raffle.getRaffleState()
                            let latestTimeStamp = await raffle.getLastTimeStamp()
                            let nPlayer = await raffle.getPlayersNumber()
                            let balance = await ethers.provider.getBalance(raffle.address)

                            assert.equal(raffleState.toString(), "0")
                            assert(latestTimeStamp > startingTimeStamp)
                            assert.equal(nPlayer.toString(), "0")
                            assert.equal(balance.toString(), "0")

                            resolve()
                        } catch (error) {
                            reject(e)
                        }
                    })
                    let txRes = await raffle.performUpkeep([])
                    let txReceipt = await txRes.wait(1)
                    let reqId = txReceipt.events[1].args.requestId
                    await vrfMock.fulfillRandomWords(reqId.toNumber(), raffle.address)
                })






            })


        })
    })