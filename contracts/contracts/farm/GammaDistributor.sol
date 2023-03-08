// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IGammaERC20.sol";

 
contract GammaDistributor is Ownable, ReentrancyGuard {
    address _trustedForwarder; // TRUSTED FORWARDER

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        uint256 rewardLockedUp; // Reward locked up.
        uint256 nextHarvestUntil; // When can the user harvest again.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. Tau to distribute per block.
        uint256 lastRewardBlock; // Last block number that Tau distribution occurs.
        uint256 accTauPerShare; // Accumulated Tau per share, times 1e12. See below.
        uint16 depositFeeBP; // Deposit fee in basis points
        uint256 harvestInterval; // Harvest interval in seconds
        uint256 totalLp; // Total token in Pool
    }

    IGammaERC20 public tau;

    // The operator can only update EmissionRate and AllocPoint to protect tokenomics
    //i.e some wrong setting and a pools get too much allocation accidentally
    address private _operator;

    // Dev address.
    address public devAddress;

    // Deposit Fee address
    address public feeAddress;

    // Tau tokens created per block
    uint256 public tauPerBlock;

    // Max harvest interval: 14 days
    uint256 public constant MAXIMUM_HARVEST_INTERVAL = 14 days;

    // Maximum deposit fee rate: 10%
    uint16 public constant MAXIMUM_DEPOSIT_FEE_RATE = 1000;

    // Info of each pool
    PoolInfo[] public poolInfo;

    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;

    // The block number when Tau mining starts.
    uint256 public startBlock;

    // Total locked up rewards
    uint256 public totalLockedUpRewards;

    // Total Tau in Tau Pools (can be multiple pools)
    uint256 public totalTauInPools = 0;

    // Control support for EIP-2771 Meta Transactions
    bool public metaTxnsEnabled = false;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );
    event EmissionRateUpdated(
        address indexed caller,
        uint256 previousAmount,
        uint256 newAmount
    );
    event RewardLockedUp(
        address indexed user,
        uint256 indexed pid,
        uint256 amountLockedUp
    );
    event OperatorTransferred(
        address indexed previousOperator,
        address indexed newOperator
    );
    event DevAddressChanged(
        address indexed caller,
        address oldAddress,
        address newAddress
    );
    event FeeAddressChanged(
        address indexed caller,
        address oldAddress,
        address newAddress
    );
    event AllocPointsUpdated(
        address indexed caller,
        uint256 previousAmount,
        uint256 newAmount
    );
    event MetaTxnsEnabled(address indexed caller);
    event MetaTxnsDisabled(address indexed caller);

    modifier onlyOperator() {
        require(
            _operator == msg.sender,
            "Operator: caller is not the operator"
        );
        _;
    }

    constructor(
        IGammaERC20 _tau, 
        uint256 _tauPerBlock
    ) {
        //StartBlock always many years later from contract construct, will be set later in StartFarming function
        startBlock = block.number + (10 * 365 * 24 * 60 * 60);

        tau = _tau;
        tauPerBlock = _tauPerBlock;

        devAddress = msg.sender;
        feeAddress = msg.sender;
        _operator = msg.sender;
        emit OperatorTransferred(address(0), _operator);
    }

    function isTrustedForwarder(address forwarder)
        public
        view
        virtual
        returns(bool)
    {
        return metaTxnsEnabled && forwarder == _trustedForwarder;
    }

    function _msgSender()
        internal
        view
        virtual
        override
        returns(address sender)
    {
        if(isTrustedForwarder(msg.sender)) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            return super._msgSender();
        }
    }

    function _msgData()
        internal
        view
        virtual
        override
        returns(bytes calldata)
    {
        if(isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return super._msgData();
        }
    }

    function operator() public view returns(address) {
        return _operator;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to)
        public
        pure
        returns(uint256)
    {
        return _to.sub(_from);
    }

    function transferOperator(address newOperator) public onlyOperator {
        require(
            newOperator != address(0),
            "TransferOperator: new operator is the zero address"
        );
        emit OperatorTransferred(_operator, newOperator);
        _operator = newOperator;
    }

    // Set farming start, can call only once
    function startFarming() public onlyOwner {
        require(block.number < startBlock, "Error::Farm started already");

        uint256 length = poolInfo.length;
        for(uint256 pid = 0; pid < length; ++pid) {
            PoolInfo storage pool = poolInfo[pid];
            pool.lastRewardBlock = block.number;
        }

        startBlock = block.number;
    }

    function poolLength() external view returns(uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // Can add multiple pool with same lp token without messing up rewards, because each pool's balance is tracked using its own totalLp
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        uint16 _depositFeeBP,
        uint256 _harvestInterval,
        bool _withUpdate
    ) public onlyOwner {
        require(
            _depositFeeBP <= MAXIMUM_DEPOSIT_FEE_RATE,
            "add: deposit fee too high"
        );

        require(
            _harvestInterval <= MAXIMUM_HARVEST_INTERVAL,
            "add: invalid harvest interval"
        );

        if(_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number;
        // uint256 lastRewardBlock = block.number > startBlock
            // ? block.number
            // : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accTauPerShare: 0,
                depositFeeBP: _depositFeeBP,
                harvestInterval: _harvestInterval,
                totalLp: 0
            })
        );
    }

    // Update the given pool's Tau allocation point and deposit fee. Can only be called by the owner.
    function set(
        uint256 _poolId,
        uint256 _allocPoint,
        uint16 _depositFeeBP,
        uint256 _harvestInterval,
        bool _withUpdate
    ) public onlyOwner {
        require(
            _depositFeeBP <= MAXIMUM_DEPOSIT_FEE_RATE,
            "set: deposit fee too high"
        );
        require(
            _harvestInterval <= MAXIMUM_HARVEST_INTERVAL,
            "set: invalid harvest interval"
        );
        if(_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_poolId].allocPoint).add(
            _allocPoint
        );
        poolInfo[_poolId].allocPoint = _allocPoint;
        poolInfo[_poolId].depositFeeBP = _depositFeeBP;
        poolInfo[_poolId].harvestInterval = _harvestInterval;
    }

    // View function to see pending Tau on frontend.
    function pendingTau(uint256 _poolId, address _user)
        external
        view
        returns(uint256)
    {
        PoolInfo storage pool = poolInfo[_poolId];
        UserInfo storage user = userInfo[_poolId][_user];
        uint256 accTauPerShare = pool.accTauPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));

        if(block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(
                pool.lastRewardBlock,
                block.number
            );
            uint256 tauReward = multiplier
                .mul(tauPerBlock)
                .mul(pool.allocPoint)
                .div(totalAllocPoint);
            accTauPerShare = accTauPerShare.add(
                tauReward.mul(1e12).div(lpSupply)
            );
        }

        uint256 pending = user.amount.mul(accTauPerShare).div(1e12).sub(
            user.rewardDebt
        );
        return pending.add(user.rewardLockedUp);
    }
    

    // View function to see if user can harvest Tau.
    function canHarvest(uint256 _poolId, address _user)
        public
        view
        returns(bool)
    {
        UserInfo storage user = userInfo[_poolId][_user];
        return
            // block.number >= startBlock &&
            block.timestamp >= user.nextHarvestUntil;
    }


    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for(uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }


    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _poolId) public {
        PoolInfo storage pool = poolInfo[_poolId];
        if(block.number <= pool.lastRewardBlock) {
            return;
        }

        uint256 lpSupply = pool.totalLp;
        if(lpSupply == 0 || pool.allocPoint == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 tauReward = multiplier
            .mul(tauPerBlock)
            .mul(pool.allocPoint)
            .div(totalAllocPoint);

        tau.mint(devAddress, tauReward.div(10));
        tau.mint(address(this), tauReward);

        pool.accTauPerShare = pool.accTauPerShare.add(
            tauReward.mul(1e12).div(pool.totalLp)
        );
        pool.lastRewardBlock = block.number;
    }


    // Deposit LP tokens to MasterChef for Tau allocation.
    function deposit(uint256 _poolId, uint256 _amount) public nonReentrant {
        // require(
        //     block.number >= startBlock,
        //     "GammaDistributor: Can not deposit before start"
        // );

        PoolInfo storage pool = poolInfo[_poolId];
        UserInfo storage user = userInfo[_poolId][_msgSender()];

        updatePool(_poolId);

        payOrLockupPendingTau(_poolId);

        if(_amount > 0) {
            uint256 beforeDeposit = pool.lpToken.balanceOf(address(this));
            pool.lpToken.transferFrom(_msgSender(), address(this), _amount);
            uint256 afterDeposit = pool.lpToken.balanceOf(address(this));

            _amount = afterDeposit.sub(beforeDeposit);

            if(pool.depositFeeBP > 0) {
                uint256 depositFee = _amount.mul(pool.depositFeeBP).div(10000);
                pool.lpToken.transfer(feeAddress, depositFee);

                _amount = _amount.sub(depositFee);
            }

            user.amount = user.amount.add(_amount);
            pool.totalLp = pool.totalLp.add(_amount);

            if(address(pool.lpToken) == address(tau)) {
                totalTauInPools = totalTauInPools.add(_amount);
            }
        }

        user.rewardDebt = user.amount.mul(pool.accTauPerShare).div(1e12);
        
        emit Deposit(
            _msgSender(), 
            _poolId, 
            _amount
        );
    }


    // Withdraw tokens
    function withdraw(uint256 _poolId, uint256 _amount) public nonReentrant {
        PoolInfo storage pool = poolInfo[_poolId];
        UserInfo storage user = userInfo[_poolId][_msgSender()];

        //this will make sure that user can only withdraw from his pool
        require(user.amount >= _amount, "Withdraw: User amount not enough");

        //Cannot withdraw more than pool's balance
        require(pool.totalLp >= _amount, "Withdraw: Pool total not enough");

        updatePool(_poolId);

        payOrLockupPendingTau(_poolId);

        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.totalLp = pool.totalLp.sub(_amount);
            if(address(pool.lpToken) == address(tau)) {
                totalTauInPools = totalTauInPools.sub(_amount);
            }
            pool.lpToken.transfer(_msgSender(), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accTauPerShare).div(1e12);
        emit Withdraw(_msgSender(), _poolId, _amount);
    }


    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _poolId) public nonReentrant {
        PoolInfo storage pool = poolInfo[_poolId];
        UserInfo storage user = userInfo[_poolId][_msgSender()];
        uint256 amount = user.amount;

        //Cannot withdraw more than pool's balance
        require(
            pool.totalLp >= amount,
            "EmergencyWithdraw: Pool total not enough"
        );

        user.amount = 0;
        user.rewardDebt = 0;
        user.rewardLockedUp = 0;
        user.nextHarvestUntil = 0;
        pool.totalLp = pool.totalLp.sub(amount);

        if(address(pool.lpToken) == address(tau)) {
            totalTauInPools = totalTauInPools.sub(amount);
        }
        pool.lpToken.transfer(_msgSender(), amount);

        emit EmergencyWithdraw(_msgSender(), _poolId, amount);
    }


    // Pay or lockup pending Tau.
    function payOrLockupPendingTau(uint256 _poolId) internal {
        PoolInfo storage pool = poolInfo[_poolId];
        UserInfo storage user = userInfo[_poolId][_msgSender()];

        if(user.nextHarvestUntil == 0) {
        // if(user.nextHarvestUntil == 0 && block.number >= startBlock) {
            user.nextHarvestUntil = block.timestamp.add(pool.harvestInterval);
        }

        uint256 pending = user.amount.mul(pool.accTauPerShare).div(1e12).sub(
            user.rewardDebt
        );
        if(canHarvest(_poolId, _msgSender())) {
            if(pending > 0 || user.rewardLockedUp > 0) {
                uint256 totalRewards = pending.add(user.rewardLockedUp);

                // reset lockup
                totalLockedUpRewards = totalLockedUpRewards.sub(
                    user.rewardLockedUp
                );
                user.rewardLockedUp = 0;
                user.nextHarvestUntil = block.timestamp.add(
                    pool.harvestInterval
                );

                // send rewards
                safeTauTransfer(_msgSender(), totalRewards);
            }
        } else if(pending > 0) {
            user.rewardLockedUp = user.rewardLockedUp.add(pending);
            totalLockedUpRewards = totalLockedUpRewards.add(pending);
            emit RewardLockedUp(_msgSender(), _poolId, pending);
        }
    }

    // Safe Tau transfer function, just in case if rounding error causes pool do not have enough Tau.
    function safeTauTransfer(address _to, uint256 _amount) internal {
        if(tau.balanceOf(address(this)) > totalTauInPools) {
            //TauBal = total Tau in GammaDistributor - total Tau in Tau pools, this will make sure that GammaDistributor never transfer rewards from deposited Tau pools
            uint256 TauBal = tau.balanceOf(address(this)).sub(
                totalTauInPools
            );
            if(_amount >= TauBal) {
                tau.transfer(_to, TauBal);
            } else if(_amount > 0) {
                tau.transfer(_to, _amount);
            }
        }
    }

    // Update dev address by the previous dev.
    function setDevAddress(address _devAddress) public {
        require(_msgSender() == devAddress, "setDevAddress: FORBIDDEN");
        require(_devAddress != address(0), "setDevAddress: ZERO");

        emit DevAddressChanged(_msgSender(), devAddress, _devAddress);

        devAddress = _devAddress;
    }

    function setFeeAddress(address _feeAddress) public {
        require(_msgSender() == feeAddress, "setFeeAddress: FORBIDDEN");
        require(_feeAddress != address(0), "setFeeAddress: ZERO");

        emit FeeAddressChanged(_msgSender(), feeAddress, _feeAddress);

        feeAddress = _feeAddress;
    }

    // Pancake has to add hidden dummy pools in order to alter the emission, here we make it simple and transparent to all.
    function updateEmissionRate(uint256 _tauPerBlock) public onlyOperator {
        massUpdatePools();

        emit EmissionRateUpdated(msg.sender, tauPerBlock, _tauPerBlock);
        tauPerBlock = _tauPerBlock;
    }

    function updateAllocPoint(
        uint256 _poolId,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOperator {
        if(_withUpdate) {
            massUpdatePools();
        }

        emit AllocPointsUpdated(
            _msgSender(),
            poolInfo[_poolId].allocPoint,
            _allocPoint
        );

        totalAllocPoint = totalAllocPoint.sub(poolInfo[_poolId].allocPoint).add(
            _allocPoint
        );
        poolInfo[_poolId].allocPoint = _allocPoint;
    }

    // Enable support for meta transactions
    function enableMetaTxns() public onlyOperator {
        require(!metaTxnsEnabled, "Meta transactions are already enabled");

        metaTxnsEnabled = true;
        emit MetaTxnsEnabled(_msgSender());
    }

    // Disable support for meta transactions
    function disableMetaTxns() public onlyOperator {
        require(metaTxnsEnabled, "Meta transactions are already disabled");

        metaTxnsEnabled = false;
        emit MetaTxnsDisabled(_msgSender());
    }
}
