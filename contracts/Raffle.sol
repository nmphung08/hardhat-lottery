// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

error Raffle__NotEnf();
error Raffle_FailedTransfer();
error Raffle__Calculating();
error Raffle__UpKeepNotNeeded(uint256 currentBalance, uint256 nPlayer, uint256 raffleState);

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    /* Type */
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUMWORDS = 1;
    uint private immutable i_interval;

    /* Lottery Variables */
    address private s_rencentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;

    /* Events */
    event RaffleEnter(address indexed player);
    event RequestRaffleWinner(uint256 indexed requestId);
    event PickedWinner(address indexed winner);


    /* Functions */
    constructor(
        address VRFCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(VRFCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(VRFCoordinatorV2);
        i_entranceFee = entranceFee;
        i_gasLane = gasLane;
        i_subId = subId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        // Same as: s_raffleState = RaffleState(0);
        i_interval = interval;
        s_lastTimeStamp = block.timestamp;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnf();
        }

        if (s_raffleState == RaffleState.CALCULATING) {
            revert Raffle__Calculating();
        }

        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    /** @dev This is the function that check if its needed to trigger the Automation
     * Some conditions needed to be met:
     * 1. The Lottery is OPEN
     * 2. Interval time passed
     * 3. Have at least 1 player
     * 4. Have some ETH in balance
     * 5. The configured Subscription ID must be funded
     * with LINK in order to do the Automation and Randomness
     */

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = (s_raffleState == RaffleState(0));
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool enfPlayer = s_players.length > 0;
        bool haveEth = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && enfPlayer && haveEth);
        return (upkeepNeeded, "0x");
    }



    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__UpKeepNotNeeded(address(this).balance, s_players.length, uint256(s_raffleState));
        }
        
        s_raffleState = RaffleState.CALCULATING;
        // same as: s_raffleState = RaffleState(1);

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUMWORDS
        );

        emit RequestRaffleWinner(requestId);
    }



    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 rand = randomWords[0] % s_players.length;
        address payable winner = s_players[rand];
        (bool sent, ) = winner.call{value: address(this).balance}("");
        s_raffleState = RaffleState.OPEN;
        s_players = new address payable[](0);
        s_rencentWinner = winner;
        s_lastTimeStamp = block.timestamp;

        if (!sent) {
            revert Raffle_FailedTransfer();
        }

        emit PickedWinner(winner);
    }


    /* View / Pure functions */
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }


    function getPlayer(uint256 i) public view returns (address) {
        return s_players[i];
    }


    function getRecentWinner() public view returns (address) {
        return s_rencentWinner;
    }


    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    
    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }


    function getReqConfs() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }


    function getNumWords() public pure returns (uint32) {
        return NUMWORDS;
    }


    function getInterval() public view returns (uint) {
        return i_interval;
    }

    function getPlayersNumber() public view returns (uint256) {
        return s_players.length;
    }

}