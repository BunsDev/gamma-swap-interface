// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./interfaces/IEIP20.sol";
import "./interfaces/IEIP20NonStandard.sol";


contract SafeToken {
    /**
     * @dev Checks whether or not there is sufficient allowance for this contract to move amount from `from` and
     *      whether or not `from` has a balance of at least `amount`. Does NOT do a transfer.
     */
    function checkTransferIn(
        address asset,
        address from,
        uint256 amount
    ) internal view {
        IEIP20 token = IEIP20(asset);
        require(token.allowance(from, address(this)) > amount, "TOKEN_INSUFFICIENT_ALLOWANCE");
        require(token.balanceOf(from) > amount, "TOKEN_INSUFFICIENT_BALANCE");
    }

    /**
     * @dev Similar to EIP20 transfer, except it handles a False result from `transferFrom` and returns an explanatory
     *      error code rather than reverting.  If caller has not called `checkTransferIn`, this may revert due to
     *      insufficient balance or insufficient allowance.
     *
     *      Note: This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
     *            See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
     */
    function doTransferIn(
        address asset,
        address from,
        uint256 amount
    ) internal {
        IEIP20NonStandard token = IEIP20NonStandard(asset);

        bool result;

        token.transferFrom(from, address(this), amount);

        assembly {
            switch returndatasize()
                case 0 {
                    // This is a non-standard ERC-20
                    result := not(0) // set result to true
                }
                case 32 {
                    // This is a compliant ERC-20
                    returndatacopy(0, 0, 32)
                    result := mload(0) // Set `result = returndata` of external call
                }
                default {
                    // This is an excessively non-compliant ERC-20, revert.
                    revert(0, 0)
                }
        }

        require(result, "TOKEN_TRANSFER_FAILED");
    }


    /**
     * @dev Checks balance of this contract in asset
     */
    function getCash(address asset) internal view returns(uint256) {
        IEIP20 token = IEIP20(asset);
        return token.balanceOf(address(this));
    }


    /**
     * @dev Checks balance of `from` in `asset`
     */
    function getBalanceOf(address asset, address from) internal view returns(uint256) {
        IEIP20 token = IEIP20(asset);

        return token.balanceOf(from);
    }


    /**
     * @dev Similar to EIP20 transfer, except it handles a False result from `transfer` and returns an explanatory
     *      error code rather than reverting. If caller has not called checked protocol's balance, this may revert due to
     *      insufficient cash held in this contract. If caller has checked protocol's balance prior to this call, and verified
     *      it is >= amount, this should not revert in normal conditions.
     *
     *      Note: This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
     *            See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
     */
    function doTransferOut(
        address asset,
        address to,
        uint256 amount
    ) internal {
        IEIP20NonStandard token = IEIP20NonStandard(asset);
        bool result;

        token.transfer(to, amount);

        assembly {
            switch returndatasize()
                case 0 {
                    // This is a non-standard ERC-20
                    result := not(0) // set result to true
                }
                case 32 {
                    // This is a complaint ERC-20
                    returndatacopy(0, 0, 32)
                    result := mload(0) // Set `result = returndata` of external call
                }
                default {
                    // This is an excessively non-compliant ERC-20, revert.
                    revert(0, 0)
                }
        }

        require(result, "TOKEN_TRANSFER_OUT_FAILED");
    }


    function doApprove(
        address asset,
        address to,
        uint256 amount
    ) internal {
        IEIP20NonStandard token = IEIP20NonStandard(asset);
        bool result;
        token.approve(to, amount);
        
        assembly {
            switch returndatasize()
                case 0 {
                    // This is a non-standard ERC-20
                    result := not(0) // set result to true
                }
                case 32 {
                    // This is a complaint ERC-20
                    returndatacopy(0, 0, 32)
                    result := mload(0) // Set `result = returndata` of external call
                }
                default {
                    // This is an excessively non-compliant ERC-20, revert.
                    revert(0, 0)
                }
        }
        require(result, "TOKEN_TRANSFER_OUT_FAILED");
    }
}
