// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IERC20 {
    function mint(address who, uint256 amount) external;
}

contract Faucet {
    constructor() { }

    function supply(
        address[] memory tokens,
        uint256[] memory amounts,
        address who
    ) external {
        require(tokens.length == amounts.length, "Invalid lengths");
        for(uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).mint(who, amounts[i]);
        }
    }
}