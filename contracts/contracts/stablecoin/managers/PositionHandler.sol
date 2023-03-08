// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "../interfaces/IBookKeeper.sol";

contract PositionHandler {
  constructor(address _bookKeeper) public {
    IBookKeeper(_bookKeeper).whitelist(msg.sender);
  }
}
