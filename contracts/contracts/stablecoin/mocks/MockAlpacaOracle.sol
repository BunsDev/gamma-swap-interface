pragma solidity 0.6.12;

import "../interfaces/IOracle.sol";

contract MockTauOracle is IOracle {
  function getPrice(address, address) external view override returns(uint256 price, uint256 lastUpdate) {
    return (0, 0);
  }
}
