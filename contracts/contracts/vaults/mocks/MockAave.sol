// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockAave {
    // asset => onBehalfOf => balance
    mapping(address => mapping(address => uint256)) balances;

    constructor() { }

    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external {
        referralCode;

        IERC20(asset).transferFrom(onBehalfOf, address(this), amount);
        balances[asset][onBehalfOf] += amount;
    }


    function withdraw(address asset, uint256 amount, address to) external{
        // In this mock, we aren't doing any checking, so theoretically anyone can call this and steal somebody else's assets
        // We're on the testnet and the token assets are not `admin`-ized, so it doesn't matter too
        // This is a "Mock" after all
        require(IERC20(asset).balanceOf(address(this)) >= amount, "Insufficient amount");

        IERC20(asset).transfer(to, amount);
        balances[asset][msg.sender] -= amount;
        balances[asset][to] += amount;
    }

    function balanceOf(address asset, address who) external view returns(uint256) {
        return balances[asset][who];
    }
}