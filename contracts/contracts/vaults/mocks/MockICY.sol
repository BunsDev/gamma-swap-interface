// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MockICY {
    // asset => address => balance
    mapping(address => mapping(address => uint256)) balances;

    constructor() { }

    function mint(address asset, uint256 mintAmount) external returns (uint256) {
        IERC20(asset).transferFrom(msg.sender, address(this), mintAmount);
        balances[asset][msg.sender] += mintAmount;

        return 0;
    }


    function redeem(address asset, uint256 redeemTokens) external returns (uint256) {
        // In this mock, we aren't doing any checking, so theoretically anyone can call this and steal somebody else's assets
        // We're on the testnet and the token assets are not `admin`-ized, so it doesn't matter too
        // This is a "Mock" after all
        require(IERC20(asset).balanceOf(address(this)) >= redeemTokens, "Insufficient amount");
        
        IERC20(asset).transfer(msg.sender, redeemTokens);
        balances[asset][msg.sender] -= redeemTokens;

        return 0;
    }

    function balanceOf(address asset, address who) external view returns(uint256) {
        return balances[asset][who];
    }
}