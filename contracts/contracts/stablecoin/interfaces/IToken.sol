// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IToken {
  function decimals() external view returns(uint8);

  function balanceOf(address) external view returns(uint256);

  function transfer(address, uint256) external returns(bool);

  function transferFrom(
    address,
    address,
    uint256
  ) external returns(bool);

  function approve(address, uint256) external returns(bool);
}
