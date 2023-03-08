// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// Abstract contract for the full ERC 20 Token standard
// https://github.com/ethereum/EIPs/issues/20

interface IEIP20 {
    /* 
        This is a slight change to the ERC20 base standard.
        function totalSupply() constant returns(uint256 supply);
        is replaced with:
        uint256 public totalSupply;
        This automatically creates a getter function for the totalSupply.
        This is moved to the base contract since public getter functions are not
        currently recognised as an implementation of the matching abstract
        function by the compiler.
    */

    function decimals() external view returns(uint8);

    function balanceOf(address _owner) external view returns(uint256);

    function transfer(address _to, uint256 _value) external returns(bool);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns(bool);

    function approve(address _spender, uint256 _value) external returns(bool);

    function allowance(address _owner, address _spender) external view returns(uint256);

    event Transfer(
        address indexed _from, 
        address indexed _to, 
        uint256 _value
    );
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );
}
