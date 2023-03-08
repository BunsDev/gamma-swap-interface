// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../interfaces/IAggregatorV3.sol";

contract MockAggregatorV3 is IAggregatorV3 {
    uint8 immutable _decimals;

    constructor(uint8 decimals_) {
        _decimals = decimals_;
    }

    function decimals() external view returns(uint8) {
        return _decimals;
    }

    function description() external pure returns(string memory) {
        return "mock";
    }

    function version() external pure returns(uint256) {
        return 3;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 _roundId) external view returns(
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        roundId = _roundId;
        startedAt = block.timestamp;
        updatedAt = block.timestamp;
        answeredInRound = _roundId;
        answer = int256(10**(_decimals));
    }

    function latestRoundData() external view returns(
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        roundId = 1;
        startedAt = block.timestamp;
        updatedAt = block.timestamp;
        answeredInRound = 1;
        answer = int256(10**(_decimals));
    }
}
