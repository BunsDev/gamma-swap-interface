// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// Abstract contract for the full ERC 20 Token standard
// https://github.com/ethereum/EIPs/issues/20

/**
 * @title IEIP20NonStandard
 * @dev Version of ERC20 with no return values for `transfer` and `transferFrom`
 * See https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
 */
interface IEIP20NonStandard {
    function balanceOf(address _owner) external view returns(uint256 balance);

    /**
     * !!!!!!!!!!!!!!
     * !!! NOTICE !!! `transfer` does not return a value, in violation of the ERC-20 specification
     * !!!!!!!!!!!!!!
     */
    function transfer(address _to, uint256 _value) external;

    /**
     *
     * !!!!!!!!!!!!!!
     * !!! NOTICE !!! `transferFrom` does not return a value, in violation of the ERC-20 specification
     * !!!!!!!!!!!!!!
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external;


    function approve(address _spender, uint256 _value)
        external
        returns(bool success);

    function allowance(address _owner, address _spender)
        external
        view
        returns(uint256 remaining);

    // solhint-disable-next-line no-simple-event-func-name
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );
}
