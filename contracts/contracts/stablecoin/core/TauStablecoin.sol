// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "../interfaces/IStablecoin.sol";


contract TauStablecoin is IStablecoin, AccessControlUpgradeable {
    bytes32 public constant OWNER_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // --- ERC20 Data ---
    string public name; // Tau USD Stablecoin
    string public symbol; // tauUSD
    string public constant version = "1";
    uint8 public constant override decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public nonces;

    event Approval(address indexed src, address indexed guy, uint256 wad);
    event Transfer(address indexed src, address indexed dst, uint256 wad);


    // --- Math ---
    function add(uint256 _x, uint256 _y) internal pure returns(uint256 _z) {
        require((_z = _x + _y) >= _x);
    }


    function sub(uint256 _x, uint256 _y) internal pure returns(uint256 _z) {
        require((_z = _x - _y) <= _x);
    }


    // --- Init ---
    function initialize(string memory _name, string memory _symbol) external initializer {
        AccessControlUpgradeable.__AccessControl_init();

        name = _name;
        symbol = _symbol;

        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(OWNER_ROLE, msg.sender);
    }


    // --- Token ---
    function transfer(address _dst, uint256 _wad) external override returns(bool) {
        return transferFrom(msg.sender, _dst, _wad);
    }


    function transferFrom(
        address _src,
        address _dst,
        uint256 _wad
    ) public override returns(bool) {
        require(balanceOf[_src] >= _wad, "[TauStablecoin] insufficient-balance");

        if(_src != msg.sender && allowance[_src][msg.sender] != uint256(-1)) {
            require(allowance[_src][msg.sender] >= _wad, "[TauStablecoin] insufficient-allowance");
            allowance[_src][msg.sender] = sub(allowance[_src][msg.sender], _wad);
        }

        balanceOf[_src] = sub(balanceOf[_src], _wad);
        balanceOf[_dst] = add(balanceOf[_dst], _wad);
        emit Transfer(_src, _dst, _wad);
        return true;
    }


    /// @dev access: MINTER_ROLE
    function mint(address _usr, uint256 _wad) external override {
        require(
            hasRole(MINTER_ROLE, msg.sender), 
            "!minterRole"
        );

        balanceOf[_usr] = add(balanceOf[_usr], _wad);
        totalSupply = add(totalSupply, _wad);
        emit Transfer(address(0), _usr, _wad);
    }


    function burn(address _usr, uint256 _wad) external override {
        require(
            balanceOf[_usr] >= _wad, 
            "[TauStablecoin] insufficient-balance"
        );

        if(_usr != msg.sender && allowance[_usr][msg.sender] != uint256(-1)) {
            require(allowance[_usr][msg.sender] >= _wad, "[TauStablecoin] insufficient-allowance");
            allowance[_usr][msg.sender] = sub(allowance[_usr][msg.sender], _wad);
        }

        balanceOf[_usr] = sub(balanceOf[_usr], _wad);
        totalSupply = sub(totalSupply, _wad);
        emit Transfer(
            _usr, 
            address(0), 
            _wad
        );
    }


    function approve(address _usr, uint256 _wad) external override returns(bool) {
        allowance[msg.sender][_usr] = _wad;
        emit Approval(msg.sender, _usr, _wad);
        return true;
    }


    // --- Alias ---
    function push(address _usr, uint256 _wad) external {
        transferFrom(msg.sender, _usr, _wad);
    }


    function pull(address _usr, uint256 _wad) external {
        transferFrom(_usr, msg.sender, _wad);
    }


    function move(
        address _src,
        address _dst,
        uint256 _wad
    ) external {
        transferFrom(_src, _dst, _wad);
    }
}
