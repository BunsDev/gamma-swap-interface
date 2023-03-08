// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

import "@alpaca-finance/alpaca-contract/contracts/6/protocol/apis/pancakeV2/PancakeLibraryV2.sol";
import "../interfaces/IOracle.sol";

contract DexPriceOracle is Initializable, IOracle {
  using SafeMathUpgradeable for uint256;
  address public dexFactory;

  function initialize(address _dexFactory) external initializer {
    dexFactory = _dexFactory;
  }

  /// @dev Return the wad price of token0/token1, multiplied by 1e18
  /// NOTE: (if you have 1 token0 how much you can sell it for token1)
  function getPrice(address token0, address token1) external view override returns(uint256, uint256) {
    if(token0 == token1) return (1e18, uint64(now));

    (uint256 r0, uint256 r1) = PancakeLibraryV2.getReserves(dexFactory, token0, token1);
    uint256 price = r0.mul(1e18).div(r1);
    return (price, uint64(now));
  }
}
