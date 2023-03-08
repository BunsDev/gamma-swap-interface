// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


// Simple Bridge. No checks.
// A Better implementation is being written and will be published soon.
contract Bridge {
    address admin;

    event Deposit(address who, address token, uint256 amount, bytes32 data);
    event Withdraw(address who, address token, uint256 amount, bytes32 data);

    constructor() {
        admin = msg.sender;
    }

    function deposit(
        address token,
        uint256 amount,
        address who,
        bytes32 data
    ) external {
        IERC20(token).transferFrom(who, address(this), amount);
        emit Deposit(who, token, amount, data);
    }

    function withdraw(
        address token,
        uint256 amount,
        address who,
        bytes32 data
    ) external {
        IERC20(token).transfer(who, amount);
        emit Withdraw(who, token, amount, data);
    }
}