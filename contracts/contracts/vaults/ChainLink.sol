// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./interfaces/IAggregatorV3.sol";
import "./interfaces/IEIP20.sol";


contract ChainLink {
    mapping(address => IAggregatorV3) internal priceContractMapping;
    address public admin;
    bool public paused = false;
    uint256 constant expScale = 10**18;
    uint8 constant eighteen = 18;


    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "Only the Admin can perform this operation"
        );
        _;
    }

    event AssetAdded(address indexed assetAddress, address indexed priceFeedContract);
    event AssetRemoved(address indexed assetAddress);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event ContractPausedOrUnpaused(bool currentStatus);


    /**
     * Allows admin to add a new asset for price tracking
     */
    function addAsset(address assetAddress, address priceFeedContract) public onlyAdmin {
        require(
            assetAddress != address(0) && priceFeedContract != address(0),
            "Asset or Price Feed address cannot be 0x00"
        );

        priceContractMapping[assetAddress] = IAggregatorV3(priceFeedContract);
        emit AssetAdded(assetAddress, priceFeedContract);
    }


    /**
     * Allows admin to remove an existing asset from price tracking
     */
    function removeAsset(address assetAddress) public onlyAdmin {
        require(
            assetAddress != address(0),
            "Asset or Price Feed address cannot be 0x00"
        );

        priceContractMapping[assetAddress] = IAggregatorV3(address(0));
        emit AssetRemoved(assetAddress);
    }


    /**
     * Allows admin to change the admin of the contract
     */
    function changeAdmin(address newAdmin) public onlyAdmin {
        require(
            newAdmin != address(0),
            "Asset or Price Feed address cannot be 0x00"
        );
        emit AdminChanged(admin, newAdmin);
        admin = newAdmin;
    }


    /**
     * Allows admin to pause and unpause the contract
     */
    function togglePause() public onlyAdmin {
        paused = !paused;
        emit ContractPausedOrUnpaused(paused);
    }

    /**
     * Returns the latest price scaled to 1e18 scale
     */
    function getAssetPrice(address asset) public view returns(uint256, uint8) {
        // Capture the decimals in the ERC20 token
        uint8 assetDecimals = IEIP20(asset).decimals();
        if(!paused && address(priceContractMapping[asset]) != address(0)) {
            (
                uint80 roundID,
                int256 price,
                uint256 startedAt,
                uint256 timeStamp,
                uint80 answeredInRound
            ) = priceContractMapping[asset].latestRoundData();

            startedAt; // To avoid compiler warnings for unused local variable

            // If the price data was not refreshed for the past 1 day, prices are considered stale
            // This threshold is the maximum Chainlink uses to update the price feeds
            require(timeStamp > (block.timestamp - 86500 seconds), "Stale data");
            // If answeredInRound is less than roundID, prices are considered stale
            require(answeredInRound >= roundID, "Stale Data");
            
            if(price > 0) {
                // Magnify the result based on decimals
                return (uint256(price), assetDecimals);
            } else {
                return (0, assetDecimals);
            }
        } else {
            return (0, assetDecimals);
        }
    }
}
