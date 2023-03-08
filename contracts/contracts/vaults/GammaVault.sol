// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./Exponential.sol";
import "./interfaces/IRateModel.sol";
import "./SafeToken.sol";
import "./ChainLink.sol";
import "./interfaces/IRewardControl.sol";
import "./interfaces/IVaultERC20.sol";

// import "hardhat/console.sol";


contract GammaVaultStorage is Exponential {
    uint256 internal MAX_UINT256 = type(uint256).max; // 115792089237316195423570985008687907853269984665640564039457584007913129639935
    uint256 internal initialInterestIndex;
    uint256 internal defaultOriginationFee;
    uint256 internal defaultCollateralRatio;
    uint256 internal defaultLiquidationDiscount;

    uint256 public minCollateralRatioMantissa;
    uint256 public maxLiquidationDiscountMantissa;

    address public admin;

    // Account allowed to set oracle prices for this contract.
    address private oracle;

    // Account allowed to fetch chainlink oracle prices for this contract. Can be changed by the admin.
    ChainLink public priceOracle;


    /**
     * @dev Container for customer balance information written to storage.
     */
    struct Balance {
        // customer total balance with accrued interest after applying the customer's most recent balance-changing action
        uint256 principal;
        // Checkpoint for interest calculation after the customer's most recent balance-changing action
        uint256 interestIndex;
    }

    /**
     * @dev 2-level map: customerAddress -> assetAddress -> balance for supplies
     */
    mapping(address => mapping(address => Balance)) public supplyBalances;

    /**
     * @dev 2-level map: customerAddress -> assetAddress -> balance for borrows
     */
    mapping(address => mapping(address => Balance)) public borrowBalances;

    /**
     * @dev Container for per-asset balance sheet and interest rate information written to storage, 
     * intended to be stored in a map where the asset address is the key
     */
    struct Market {
        // Whether this market is supported or not (not to be confused with the list of collateral assets)
        bool isSupported;
        // when the other values in this struct were calculated
        uint256 blockNumber;
        // Interest Rate model, which calculates supply interest rate and borrow interest rate based on Utilization, used for the asset
        address interestRateModel;
        // total amount of this asset supplied (in asset wei)
        uint256 totalSupply;
        // the per-block interest rate for supplies of asset as of blockNumber, scaled by 10e18
        uint256 supplyRateMantissa;
        // the interest index for supplies of asset as of blockNumber; initialized in _supportMarket
        uint256 supplyIndex;
        // total amount of this asset borrowed (in asset wei)
        uint256 totalBorrows;
        // the per-block interest rate for borrows of asset as of blockNumber, scaled by 10e18
        uint256 borrowRateMantissa;
        // the interest index for borrows of asset as of blockNumber; initialized in _supportMarket
        uint256 borrowIndex;
        // the interest-bearing token
        address ibToken;
    }


    /**
     * @dev map: assetAddress -> Market
     */
    mapping(address => Market) public markets;

    uint256 public marketsLength;

    /**
     * @dev list: collateralMarkets
     */
    address[] public collateralMarkets;

    /**
     * @dev The collateral ratio that borrows must maintain (e.g. 2 implies 2:1)
     */
    Exp public collateralRatio;

    /**
     * @dev originationFee for new borrows.
     */
    Exp public originationFee;

    /**
     * @dev liquidationDiscount for collateral when liquidating borrows
     */
    Exp public liquidationDiscount;

    /**
     * @dev flag for whether or not contract is paused
     */
    bool public paused;


    // The `SupplyLocalVars` struct is used internally in the `supply` function.
    struct SupplyLocalVars {
        uint256 startingBalance;
        uint256 newSupplyIndex;
        uint256 userSupplyCurrent;
        uint256 userSupplyUpdated;
        uint256 newTotalSupply;
        uint256 currentCash;
        uint256 updatedCash;
        uint256 newSupplyRateMantissa;
        uint256 newBorrowIndex;
        uint256 newBorrowRateMantissa;
    }

    // The `WithdrawLocalVars` struct is used internally in the `withdraw` function.
    struct WithdrawLocalVars {
        uint256 withdrawAmount;
        uint256 startingBalance;
        uint256 newSupplyIndex;
        uint256 userSupplyCurrent;
        uint256 userSupplyUpdated;
        uint256 newTotalSupply;
        uint256 currentCash;
        uint256 updatedCash;
        uint256 newSupplyRateMantissa;
        uint256 newBorrowIndex;
        uint256 newBorrowRateMantissa;
        uint256 withdrawCapacity;
        Exp accountLiquidity;
        Exp accountShortfall;
        Exp ethValueOfWithdrawal;
    }

    // The `AccountValueLocalVars` struct is used internally in the `CalculateAccountValuesInternal` function.
    struct AccountValueLocalVars {
        address assetAddress;
        uint256 collateralMarketsLength;
        uint256 newSupplyIndex;
        uint256 userSupplyCurrent;
        uint256 newBorrowIndex;
        uint256 userBorrowCurrent;
        Exp supplyTotalValue;
        Exp sumSupplies;
        Exp borrowTotalValue;
        Exp sumBorrows;
    }

    // The `PayBorrowLocalVars` struct is used internally in the `repayBorrow` function.
    struct PayBorrowLocalVars {
        uint256 newBorrowIndex;
        uint256 userBorrowCurrent;
        uint256 repayAmount;
        uint256 userBorrowUpdated;
        uint256 newTotalBorrows;
        uint256 currentCash;
        uint256 updatedCash;
        uint256 newSupplyIndex;
        uint256 newSupplyRateMantissa;
        uint256 newBorrowRateMantissa;
        uint256 startingBalance;
    }

    // The `BorrowLocalVars` struct is used internally in the `borrow` function.
    struct BorrowLocalVars {
        uint256 newBorrowIndex;
        uint256 userBorrowCurrent;
        uint256 borrowAmountWithFee;
        uint256 userBorrowUpdated;
        uint256 newTotalBorrows;
        uint256 currentCash;
        uint256 updatedCash;
        uint256 newSupplyIndex;
        uint256 newSupplyRateMantissa;
        uint256 newBorrowRateMantissa;
        uint256 startingBalance;
        Exp accountLiquidity;
        Exp accountShortfall;
        Exp ethValueOfBorrowAmountWithFee;
    }

    // The `LiquidateLocalVars` struct is used internally in the `liquidateBorrow` function.
    struct LiquidateLocalVars {
        // we need these addresses in the struct for use with `emitLiquidationEvent` to avoid `CompilerError: Stack too deep, try removing local variables.`
        address targetAccount;
        address assetBorrow;
        address liquidator;
        address assetCollateral;
        // borrow index and supply index are global to the asset, not specific to the user
        uint256 newBorrowIndex_UnderwaterAsset;
        uint256 newSupplyIndex_UnderwaterAsset;
        uint256 newBorrowIndex_CollateralAsset;
        uint256 newSupplyIndex_CollateralAsset;
        // the target borrow's full balance with accumulated interest
        uint256 currentBorrowBalance_TargetUnderwaterAsset;
        // currentBorrowBalance_TargetUnderwaterAsset minus whatever gets repaid as part of the liquidation
        uint256 updatedBorrowBalance_TargetUnderwaterAsset;
        uint256 newTotalBorrows_ProtocolUnderwaterAsset;
        uint256 startingBorrowBalance_TargetUnderwaterAsset;
        uint256 startingSupplyBalance_TargetCollateralAsset;
        uint256 startingSupplyBalance_LiquidatorCollateralAsset;
        uint256 currentSupplyBalance_TargetCollateralAsset;
        uint256 updatedSupplyBalance_TargetCollateralAsset;
        // If liquidator already has a balance of collateralAsset, we will accumulate
        // interest on it before transferring seized collateral from the borrower.
        uint256 currentSupplyBalance_LiquidatorCollateralAsset;
        // This will be the liquidator's accumulated balance of collateral asset before the liquidation (if any)
        // plus the amount seized from the borrower.
        uint256 updatedSupplyBalance_LiquidatorCollateralAsset;
        uint256 newTotalSupply_ProtocolCollateralAsset;
        uint256 currentCash_ProtocolUnderwaterAsset;
        uint256 updatedCash_ProtocolUnderwaterAsset;
        // cash does not change for collateral asset

        uint256 newSupplyRateMantissa_ProtocolUnderwaterAsset;
        uint256 newBorrowRateMantissa_ProtocolUnderwaterAsset;
        // Why no variables for the interest rates for the collateral asset?
        // We don't need to calculate new rates for the collateral asset since neither cash nor borrows change

        uint256 discountedRepayToEvenAmount;
        //[supplyCurrent / (1 + liquidationDiscount)] * (Oracle price for the collateral / Oracle price for the borrow) (discountedBorrowDenominatedCollateral)
        uint256 discountedBorrowDenominatedCollateral;
        uint256 maxCloseableBorrowAmount_TargetUnderwaterAsset;
        uint256 closeBorrowAmount_TargetUnderwaterAsset;
        uint256 seizeSupplyAmount_TargetCollateralAsset;
        Exp collateralPrice;
        Exp underwaterAssetPrice;
    }

    /**
     * @dev 2-level map: customerAddress -> assetAddress -> originationFeeBalance for borrows
     */
    mapping(address => mapping(address => uint256)) public originationFeeBalance;

    /**
     * @dev Reward Control Contract address
     */
    IRewardControl public rewardControl;

    /**
     * @notice Multiplier used to calculate the maximum repayAmount when liquidating a borrow
     */
    uint256 public closeFactorMantissa;

    /// @dev _guardCounter and nonReentrant modifier extracted from Open Zeppelin's reEntrancyGuard
    /// @dev counter to allow mutex lock with only one SSTORE operation
    uint256 public _guardCounter;


    /**
     * @dev emitted when a supply is received
     *      Note: newBalance - amount - startingBalance = interest accumulated since last change
     */
    event SupplyReceived(
        address account,
        address asset,
        uint256 amount,
        uint256 startingBalance,
        uint256 newBalance
    );

    /**
     * @dev emitted when a origination fee supply is received as admin
     *      Note: newBalance - amount - startingBalance = interest accumulated since last change
     */
    event SupplyOrgFeeAsAdmin(
        address account,
        address asset,
        uint256 amount,
        uint256 startingBalance,
        uint256 newBalance
    );
    /**
     * @dev emitted when a supply is withdrawn
     *      Note: startingBalance - amount - startingBalance = interest accumulated since last change
     */
    event SupplyWithdrawn(
        address account,
        address asset,
        uint256 amount,
        uint256 startingBalance,
        uint256 newBalance
    );

    /**
     * @dev emitted when a new borrow is taken
     *      Note: newBalance - borrowAmountWithFee - startingBalance = interest accumulated since last change
     */
    event BorrowTaken(
        address account,
        address asset,
        uint256 amount,
        uint256 startingBalance,
        uint256 borrowAmountWithFee,
        uint256 newBalance
    );

    /**
     * @dev emitted when a borrow is repaid
     *      Note: newBalance - amount - startingBalance = interest accumulated since last change
     */
    event BorrowRepaid(
        address account,
        address asset,
        uint256 amount,
        uint256 startingBalance,
        uint256 newBalance
    );

    /**
     * @dev emitted when a borrow is liquidated
     *      targetAccount = user whose borrow was liquidated
     *      assetBorrow = asset borrowed
     *      borrowBalanceBefore = borrowBalance as most recently stored before the liquidation
     *      borrowBalanceAccumulated = borroBalanceBefore + accumulated interest as of immediately prior to the liquidation
     *      amountRepaid = amount of borrow repaid
     *      liquidator = account requesting the liquidation
     *      assetCollateral = asset taken from targetUser and given to liquidator in exchange for liquidated loan
     *      borrowBalanceAfter = new stored borrow balance (should equal borrowBalanceAccumulated - amountRepaid)
     *      collateralBalanceBefore = collateral balance as most recently stored before the liquidation
     *      collateralBalanceAccumulated = collateralBalanceBefore + accumulated interest as of immediately prior to the liquidation
     *      amountSeized = amount of collateral seized by liquidator
     *      collateralBalanceAfter = new stored collateral balance (should equal collateralBalanceAccumulated - amountSeized)
     *      assetBorrow and assetCollateral are not indexed as indexed addresses in an event is limited to 3
     */
    event BorrowLiquidated(
        address targetAccount,
        address assetBorrow,
        uint256 borrowBalanceAccumulated,
        uint256 amountRepaid,
        address liquidator,
        address assetCollateral,
        uint256 amountSeized
    );


    /**
     * @dev emitted when admin withdraws equity
     * Note that `equityAvailableBefore` indicates equity before `amount` was removed.
     */
    event EquityWithdrawn(
        address asset,
        uint256 equityAvailableBefore,
        uint256 amount,
        address owner
    );
}



contract GammaVault is GammaVaultStorage, SafeToken {
    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * If you mark a function `nonReentrant`, you should also
     * mark it `external`. Calling one `nonReentrant` function from
     * another is not supported. Instead, you can implement a
     * `private` function doing the actual work, and an `external`
     * wrapper marked as `nonReentrant`.
     */
    modifier nonReentrant() {
        _guardCounter += 1;
        uint256 localCounter = _guardCounter;
        _;
        require(localCounter == _guardCounter);
    }


    modifier nonPaused() {
        require(!paused, "Contract paused");
        _;
    }


    constructor(
        address oracle_,
        uint256 newCloseFactorMantissa_
    ) {
        require(oracle_ != address(0), "Oracle can't be ZERO address");
        require(
            newCloseFactorMantissa_ < 10**18,
            "Invalid Origination Fee or Close Factor Mantissa"
        );

        admin = msg.sender;
        initialInterestIndex = 10**18;
        defaultOriginationFee = (10**15); // default is 0.1%
        defaultCollateralRatio = 125 * (10**16); // default is 125% or 1.25
        defaultLiquidationDiscount = (10**17); // default is 10% or 0.1
        minCollateralRatioMantissa = 11 * (10**17); // 1.1
        maxLiquidationDiscountMantissa = (10**17); // 0.1
        
        collateralRatio = Exp({ mantissa: defaultCollateralRatio });
        originationFee = Exp({ mantissa: defaultOriginationFee });
        liquidationDiscount = Exp({ mantissa: defaultLiquidationDiscount });
        _guardCounter = 1;

        priceOracle = ChainLink(oracle_);
        closeFactorMantissa = newCloseFactorMantissa_;
    }


    /**
     * @notice Set the address of the Reward Control contract to be triggered to accrue ALK rewards for participants
     * @param rewardControl_ The address of the underlying reward control contract
     */
    function setRewardControl(address rewardControl_) public returns(bool) {
        require(msg.sender == admin, "Expected admin");
        require(rewardControl_ != address(0), "RewardControl address cannot be empty");

        rewardControl = IRewardControl(rewardControl_);
        return true;
    }


    /**
     * @notice return the number of elements in `collateralMarkets`
     * @dev you can then externally call `collateralMarkets(uint)` to pull each market address
     * @return the length of `collateralMarkets`
     */
    function getCollateralMarketsLength() external view returns(uint256) {
        return collateralMarkets.length;
    }


    /**
     * @notice Reads scaled price of specified asset from the price oracle
     * @dev Reads scaled price of specified asset from the price oracle.
     *      The plural name is to match a previous storage mapping that this function replaced.
     * @param asset Asset whose price should be retrieved
     * @return 0 on an error or missing price, the price scaled by 1e18 otherwise
     */
    function assetPrices(address asset) public view returns(uint256) {
        Exp memory result = fetchAssetPrice(asset);

        return result.mantissa;
    }


    /**
     * @notice returns the liquidity for given account.
     *         a positive result indicates ability to borrow, whereas
     *         a negative result indicates a shortfall which may be liquidated
     * @dev returns account liquidity in terms of eth-wei value, scaled by 1e18 and truncated when the value is 0 or when the last few decimals are 0
     *      note: this includes interest trued up on all balances
     * @param account the account to examine
     * @return signed integer in terms of eth-wei (negative indicates a shortfall)
     */
    function getAccountLiquidity(address account) public view returns(int256) {
        (
            Exp memory accountLiquidity,
            Exp memory accountShortfall
        ) = calculateAccountLiquidity(account);

        if(isZeroExp(accountLiquidity)) {
            return -1 * int256(truncate(accountShortfall));
        } else {
            return int256(truncate(accountLiquidity));
        }
    }

    /**
     * @notice returns supply principal
     * @param account the account to examine
     * @param asset the market asset whose supply balance belonging to `account` should be checked
     */
    function getSupplyBalance(address account, address asset) external view returns(uint256) {
        return supplyBalances[account][asset].principal;
    }


    /**
     * @notice return supply balance with any accumulated interest for `asset` belonging to `account`
     * @dev returns supply balance with any accumulated interest for `asset` belonging to `account`
     * @param account the account to examine
     * @param asset the market asset whose supply balance belonging to `account` should be checked
     * @return uint supply balance with and without interest
     */
    function getSupplyBalanceWithInterest(address account, address asset) public view returns(uint256) {
        uint256 newSupplyIndex;
        uint256 userSupplyCurrent;

        Market storage market = markets[asset];
        Balance storage supplyBalance = supplyBalances[account][asset];

        // Calculate the newSupplyIndex, needed to calculate user's supplyCurrent
        newSupplyIndex = calculateInterestIndex(
            market.supplyIndex,
            market.supplyRateMantissa,
            market.blockNumber,
            block.number
        );

        // Use newSupplyIndex and stored principal to calculate the accumulated balance
        userSupplyCurrent = calculateBalance(
            supplyBalance.principal,
            supplyBalance.interestIndex,
            newSupplyIndex
        );

        return userSupplyCurrent;
    }


    /**
     * @notice returns borrow principal
     * @param account the account to examine
     * @param asset the market asset whose borrow balance belonging to `account` should be checked
     */
    function getBorrowBalance(address account, address asset) public view returns(uint256) {
        return borrowBalances[account][asset].principal;
    }


    /**
     * @notice return borrow balance with any accumulated interest for `asset` belonging to `account`
     * @dev returns borrow balance with any accumulated interest for `asset` belonging to `account`
     * @param account the account to examine
     * @param asset the market asset whose borrow balance belonging to `account` should be checked
     * @return uint borrow balance on success, throws on failed assertion otherwise
     */
    function getBorrowBalanceWithInterest(address account, address asset) public view returns(uint256) {
        uint256 newBorrowIndex;
        uint256 userBorrowCurrent;

        Market storage market = markets[asset];
        Balance storage borrowBalance = borrowBalances[account][asset];

        // Calculate the newBorrowIndex, needed to calculate user's borrowCurrent
        newBorrowIndex = calculateInterestIndex(
            market.borrowIndex,
            market.borrowRateMantissa,
            market.blockNumber,
            block.number
        );

        // Use newBorrowIndex and stored principal to calculate the accumulated balance
        userBorrowCurrent = calculateBalance(
            borrowBalance.principal,
            borrowBalance.interestIndex,
            newBorrowIndex
        );

        return userBorrowCurrent;
    }


    /**
     * @notice Supports a given market (asset) for use
     * @dev Admin function to add support for a market
     * @param asset Asset to support; MUST already have a non-zero price set
     * @param interestRateModel IRateModel to use for the asset
     */
    function _supportMarket(address asset, address interestRateModel, address interestBearingToken) external returns(bool) {
        require(msg.sender == admin, "Only admin");
        require(interestRateModel != address(0), "Rate Model cannot be 0x0");

        // Hard cap on the maximum number of markets allowed
        require(
            collateralMarkets.length < 16, // MAX_ALLOWED_MARKETS = 16
            "Exceeding the max number of markets allowed"
        );

        Exp memory assetPrice = fetchAssetPrice(asset); // TODO
        require(!isZeroExp(assetPrice), "Not a supported asset"); // TODO

        // Set the interest rate model to `modelAddress`
        markets[asset].interestRateModel = interestRateModel;
        markets[asset].ibToken = interestBearingToken;
        marketsLength += 1;

        // Append asset to collateralAssets if not set
        _addCollateralMarket(asset);
        IRewardControl(rewardControl).addMarket(asset, interestBearingToken);

        // Set market isSupported to true
        markets[asset].isSupported = true;

        // Default supply and borrow index to 1e18
        if(markets[asset].supplyIndex == 0) {
            markets[asset].supplyIndex = initialInterestIndex;
        }

        if(markets[asset].borrowIndex == 0) {
            markets[asset].borrowIndex = initialInterestIndex;
        }

        // emit SupportedMarket(asset, interestRateModel);
        return true;
    }


    /**
     * @notice Suspends a given *supported* market (asset) from use.
     *         Assets in this state do count for collateral, but users may only withdraw, payBorrow,
     *         and liquidate the asset. The liquidate function no longer checks collateralization.
     * @dev Admin function to suspend a market
     * @param asset Asset to suspend
     */
    function _suspendMarket(address asset) external returns(bool) {
        require(msg.sender == admin, "SUSPEND_MARKET_OWNER_CHECK");

        // If the market is not configured at all, we don't want to add any configuration for it.
        // If we find !markets[asset].isSupported then either the market is not configured at all, or it
        // has already been marked as unsupported. We can just return without doing anything.
        // Caller is responsible for knowing the difference between not-configured and already unsupported.
        if(!markets[asset].isSupported) {
            return true;
        }

        // If we get here, we know market is configured and is supported, so set isSupported to false
        markets[asset].isSupported = false;

        return true;
    }


    /**
     * @notice Sets the risk parameters: collateral ratio and liquidation discount
     * @dev Owner function to set the risk parameters
     * @param collateralRatioMantissa rational collateral ratio, scaled by 1e18. The de-scaled value must be >= 1.1
     * @param liquidationDiscountMantissa rational liquidation discount, scaled by 1e18. The de-scaled value must be <= 0.1 and must be less than (descaled collateral ratio minus 1)
     */
    function _setRiskParameters(
        uint256 collateralRatioMantissa,
        uint256 liquidationDiscountMantissa
    ) public returns(bool) {
        require(msg.sender == admin, "SET_RISK_PARAMETERS_OWNER_CHECK");
        // Input validations
        require(
            collateralRatioMantissa >= minCollateralRatioMantissa &&
            liquidationDiscountMantissa <= maxLiquidationDiscountMantissa,
            "Liquidation discount is more than max discount or collateral ratio is less than min ratio"
        );

        Exp memory newCollateralRatio = Exp({ mantissa: collateralRatioMantissa });
        Exp memory newLiquidationDiscount = Exp({ mantissa: liquidationDiscountMantissa });
        Exp memory minimumCollateralRatio = Exp({ mantissa: minCollateralRatioMantissa });
        Exp memory maximumLiquidationDiscount = Exp({ mantissa: maxLiquidationDiscountMantissa });

        // Make sure new collateral ratio value is not below minimum value
        require(!lessThanExp(newCollateralRatio, minimumCollateralRatio), "INVALID_COLLATERAL_RATIO");

        // Make sure new liquidation discount does not exceed the maximum value, but reverse operands so we can use the
        // existing `lessThanExp` function rather than adding a `greaterThan` function to Exponential.
        require(!lessThanExp(maximumLiquidationDiscount, newLiquidationDiscount), "INVALID_LIQUIDATION_DISCOUNT");

        Exp memory newLiquidationDiscountPlusOne;
        // C = L+1 is not allowed because it would cause division by zero error in `calculateDiscountedRepayToEvenAmount`
        // C < L+1 is not allowed because it would cause integer underflow error in `calculateDiscountedRepayToEvenAmount`
        newLiquidationDiscountPlusOne = addExp(
            newLiquidationDiscount,
            Exp({ mantissa: mantissaOne })
        );

        require(!lessThanOrEqualExp(newCollateralRatio, newLiquidationDiscountPlusOne), "INVALID_COMBINED_RISK_PARAMETERS");

        // Store new values
        collateralRatio = newCollateralRatio;
        liquidationDiscount = newLiquidationDiscount;

        return true;
    }


    /**
     * @notice Sets the interest rate model for a given market
     * @dev Admin function to set interest rate model
     * @param asset Asset to support
     */
    function _setMarketIRateModel(
        address asset,
        address interestRateModel
    ) public returns(bool) {
        require(
            msg.sender == admin,
            "SET_MARKET_INTEREST_RATE_MODEL_OWNER_CHECK"
        );
        require(interestRateModel != address(0), "Rate Model cannot be 0x0");

        // Set the interest rate model to `modelAddress`
        markets[asset].interestRateModel = interestRateModel;

        return true;
    }


    /**
     * @notice withdraws `amount` of `asset` from equity for asset, as long as `amount` <= equity. Equity = cash + borrows - supply
     * @dev withdraws `amount` of `asset` from equity  for asset, enforcing amount <= cash + borrows - supply
     * @param asset asset whose equity should be withdrawn
     * @param amount amount of equity to withdraw; must not exceed equity available
     */
    function _withdrawEquity(address asset, uint256 amount) public returns(bool) {
        require(msg.sender == admin, "EQUITY_WITHDRAWAL_MODEL_OWNER_CHECK");
        require(asset != address(0), "Asset can't be zero address");

        // Check that amount is less than cash (from ERC-20 of self) plus borrows minus supply.
        // Get supply and borrows with interest accrued till the latest block
        (
            uint256 supplyWithInterest,
            uint256 borrowWithInterest
        ) = getMarketBalances(asset);

        uint256 equity =
            getCash(asset) +
            borrowWithInterest -
            supplyWithInterest;

        require(amount < equity, "EQUITY_INSUFFICIENT_BALANCE");

        doTransferOut(asset, admin, amount);

        markets[asset].supplyRateMantissa = IRateModel(markets[asset].interestRateModel)
            .getSupplyRate(
                asset,
                getCash(asset) - amount,
                markets[asset].totalSupply
            );

        markets[asset].borrowRateMantissa = IRateModel(markets[asset].interestRateModel)
            .getBorrowRate(
                asset,
                getCash(asset) - amount,
                markets[asset].totalBorrows
            );

        emit EquityWithdrawn(asset, equity, amount, admin);

        return true;
    }


    /**
     * @notice supply `amount` of `asset` (which must be supported) to `msg.sender` in the protocol
     * @dev add amount of supported asset to msg.sender's account
     * @param asset The market asset to supply
     * @param amount The amount to supply
     */
    function supply(address asset, uint256 amount) public nonReentrant nonPaused returns(bool) {
        require(asset != address(0), "Asset can't be zero address");

        refreshSupplyIndex(asset, msg.sender);
 
        Market storage market = markets[asset];
        require(market.isSupported, "MARKET_NOT_SUPPORTED");

        Balance storage balance = supplyBalances[msg.sender][asset];
        SupplyLocalVars memory local; // Holds all our uint calculation results

        // Fail gracefully if asset is not approved or has insufficient balance
        checkTransferIn(asset, msg.sender, amount);

        // We calculate the newSupplyIndex, user's supplyCurrent and supplyUpdated for the asset
        local.newSupplyIndex = calculateInterestIndex(
            market.supplyIndex,
            market.supplyRateMantissa,
            market.blockNumber,
            block.number
        );

        local.userSupplyCurrent = calculateBalance(
            balance.principal,
            balance.interestIndex,
            local.newSupplyIndex
        );

        local.userSupplyUpdated = local.userSupplyCurrent + amount;

        // We calculate the protocol's totalSupply by subtracting the user's prior checkpointed balance, adding user's updated supply
        local.newTotalSupply =
            market.totalSupply +
            local.userSupplyUpdated -
            balance.principal;

        // We need to calculate what the updated cash will be after we transfer in from user
        local.currentCash = getCash(asset);

        local.updatedCash = local.currentCash + amount;

        // The utilization rate has changed! We calculate a new supply index and borrow index for the asset, and save it.
        local.newSupplyRateMantissa = IRateModel(market.interestRateModel)
            .getSupplyRate(asset, local.updatedCash, market.totalBorrows);

        // We calculate the newBorrowIndex (we already had newSupplyIndex)
        local.newBorrowIndex = calculateInterestIndex(
            market.borrowIndex,
            market.borrowRateMantissa,
            market.blockNumber,
            block.number
        );

        local.newBorrowRateMantissa = IRateModel(market.interestRateModel)
            .getBorrowRate(asset, local.updatedCash, market.totalBorrows);


        // Save market updates
        market.blockNumber = block.number;
        market.totalSupply = local.newTotalSupply;
        market.supplyRateMantissa = local.newSupplyRateMantissa;
        market.supplyIndex = local.newSupplyIndex;
        market.borrowRateMantissa = local.newBorrowRateMantissa;
        market.borrowIndex = local.newBorrowIndex;

        // Save user updates
        local.startingBalance = balance.principal; // save for use in `SupplyReceived` event
        balance.principal = local.userSupplyUpdated;
        balance.interestIndex = local.newSupplyIndex;

        doTransferIn(asset, msg.sender, amount);

        // Mint ibToken
        IVaultERC20(market.ibToken).mint(msg.sender, amount / 2);

        emit SupplyReceived(
            msg.sender,
            asset,
            amount,
            local.startingBalance,
            balance.principal
        );

        return true;
    }


    /**
     * @notice withdraw `amount` of `asset` from sender's account to sender's address
     * @dev withdraw `amount` of `asset` from msg.sender's account to msg.sender
     * @param asset The market asset to withdraw
     * @param requestedAmount The amount to withdraw (or -1 for max)
     */
    function withdraw(
        address asset, 
        uint256 requestedAmount
    ) public nonReentrant nonPaused returns(bool) {
        refreshSupplyIndex(asset, msg.sender);

        Market storage market = markets[asset];
        Balance storage supplyBalance = supplyBalances[msg.sender][asset];

        WithdrawLocalVars memory local; // Holds all our calculation results

        // We calculate the user's accountLiquidity and accountShortfall.
        (
            local.accountLiquidity,
            local.accountShortfall
        ) = calculateAccountLiquidity(msg.sender);

        // We calculate the newSupplyIndex, user's supplyCurrent and supplyUpdated for the asset
        local.newSupplyIndex = calculateInterestIndex(
            market.supplyIndex,
            market.supplyRateMantissa,
            market.blockNumber,
            block.number
        );

        local.userSupplyCurrent = calculateBalance(
            supplyBalance.principal,
            supplyBalance.interestIndex,
            local.newSupplyIndex
        );

        // If the user specifies -1 amount to withdraw ("max"),  withdrawAmount => the lesser of withdrawCapacity and supplyCurrent
        if(requestedAmount == MAX_UINT256) {
            local.withdrawCapacity = local.accountLiquidity.mantissa;

            local.withdrawAmount = min(
                local.withdrawCapacity,
                local.userSupplyCurrent
            );
        } else {
            local.withdrawAmount = requestedAmount;
        }

        // Fail gracefully if protocol has insufficient cash
        // If protocol has insufficient cash, the sub operation will underflow.
        local.currentCash = getCash(asset);
        local.updatedCash = local.currentCash - local.withdrawAmount;
        // We check that the amount is less than or equal to supplyCurrent
        // If amount is greater than supplyCurrent, this will fail with Error.INTEGER_UNDERFLOW
        local.userSupplyUpdated = local.userSupplyCurrent - local.withdrawAmount;

        // Fail if customer already has a shortfall
        require(isZeroExp(local.accountShortfall), "WITHDRAW_ACCOUNT_SHORTFALL_PRESENT");

        // We want to know the user's withdrawCapacity, denominated in the asset
        // Customer's withdrawCapacity of asset is (accountLiquidity in Eth)/ (price of asset in Eth)
        // Equivalently, we calculate the eth value of the withdrawal amount and compare it directly to the accountLiquidity in Eth
        local.ethValueOfWithdrawal = getPriceForAssetAmount(
            asset,
            local.withdrawAmount
        ); // amount * oraclePrice = ethValueOfWithdrawal


        // We check that the amount is less than withdrawCapacity (here), and less than or equal to supplyCurrent (below)
        require(
            !lessThanExp(
                local.accountLiquidity,
                local.ethValueOfWithdrawal
            ),
            "WITHDRAW_AMOUNT_LIQUIDITY_SHORTFALL"
        );

        // We calculate the protocol's totalSupply by subtracting the user's prior checkpointed balance, adding user's updated supply.
        // Note that, even though the customer is withdrawing, if they've accumulated a lot of interest since their last
        // action, the updated balance *could* be higher than the prior checkpointed balance.
        local.newTotalSupply =
            market.totalSupply +
            local.userSupplyUpdated -
            supplyBalance.principal;

        // The utilization rate has changed! We calculate a new supply index and borrow index for the asset, and save it.
        local.newSupplyRateMantissa = IRateModel(market.interestRateModel)
            .getSupplyRate(asset, local.updatedCash, market.totalBorrows);


        // We calculate the newBorrowIndex
        local.newBorrowIndex = calculateInterestIndex(
            market.borrowIndex,
            market.borrowRateMantissa,
            market.blockNumber,
            block.number
        );

        local.newBorrowRateMantissa = IRateModel(market.interestRateModel)
            .getBorrowRate(asset, local.updatedCash, market.totalBorrows);


        // Save market updates
        market.blockNumber = block.number;
        market.totalSupply = local.newTotalSupply;
        market.supplyRateMantissa = local.newSupplyRateMantissa;
        market.supplyIndex = local.newSupplyIndex;
        market.borrowRateMantissa = local.newBorrowRateMantissa;
        market.borrowIndex = local.newBorrowIndex;

        // Save user updates
        local.startingBalance = supplyBalance.principal; // save for use in `SupplyWithdrawn` event
        supplyBalance.principal = local.userSupplyUpdated;
        supplyBalance.interestIndex = local.newSupplyIndex;

        doTransferOut(asset, msg.sender, local.withdrawAmount);

        emit SupplyWithdrawn(
            msg.sender,
            asset,
            local.withdrawAmount,
            local.startingBalance,
            supplyBalance.principal
        );

        return true;
    }


    /**
     * @notice Gets the ETH values of the user's accumulated supply and borrow balances, scaled by 10e18.
     *         This includes any accumulated interest thus far but does NOT actually update anything in
     *         storage
     * @dev Gets ETH values of accumulated supply and borrow balances
     * @param userAddress account for which to sum values
     * @return (sum ETH value of supplies scaled by 10e18,
     *          sum ETH value of borrows scaled by 10e18)
     */
    function calculateAccountValues(address userAddress) external view returns(uint256, uint256) {
        (
            Exp memory supplyValue,
            Exp memory borrowValue
        ) = calculateAccountValuesInternal(userAddress);

        return (supplyValue.mantissa, borrowValue.mantissa);
    }


    /**
     * @notice Users repay borrowed assets from their own address to the protocol.
     * @param asset The market asset to repay
     * @param amount The amount to repay (or -1 for max)
     */
    function repayBorrow(
        address asset, 
        uint256 amount
    ) public nonReentrant nonPaused returns(bool) {
        refreshBorrowIndex(asset, msg.sender);
        
        PayBorrowLocalVars memory local;
        Market storage market = markets[asset];
        Balance storage borrowBalance = borrowBalances[msg.sender][asset];

        // We calculate the newBorrowIndex, user's borrowCurrent and borrowUpdated for the asset
        local.newBorrowIndex = calculateInterestIndex(
            market.borrowIndex,
            market.borrowRateMantissa,
            market.blockNumber,
            block.number
        );

        local.userBorrowCurrent = calculateBalance(
            borrowBalance.principal,
            borrowBalance.interestIndex,
            local.newBorrowIndex
        );

        // If the user specifies MAX_UINT256 amount to repay (“max”), repayAmount =>
        // the lesser of the senders ERC-20 balance and borrowCurrent
        if(amount == MAX_UINT256) {
            local.repayAmount = min(
                getBalanceOf(asset, msg.sender),
                local.userBorrowCurrent
            );
        } else {
            local.repayAmount = amount;
        }

        // Subtract the `repayAmount` from the `userBorrowCurrent` to get `userBorrowUpdated`
        // Note: this checks that repayAmount is less than borrowCurrent
        local.userBorrowUpdated = local.userBorrowCurrent - local.repayAmount;

        // Fail gracefully if asset is not approved or has insufficient balance
        // Note: this checks that repayAmount is less than or equal to their ERC-20 balance
        checkTransferIn(asset, msg.sender, local.repayAmount);

        // We calculate the protocol's totalBorrow by subtracting the user's prior checkpointed balance, adding user's updated borrow
        // Note that, even though the customer is paying some of their borrow, if they've accumulated a lot of interest since their last
        // action, the updated balance *could* be higher than the prior checkpointed balance.
        local.newTotalBorrows =
            market.totalBorrows +
            local.userBorrowUpdated -
            borrowBalance.principal;

        // We need to calculate what the updated cash will be after we transfer in from user
        local.currentCash = getCash(asset);

        local.updatedCash = local.currentCash + local.repayAmount;

        // We calculate a new supply index and borrow index for the asset, and save it.

        // We calculate the newSupplyIndex, but we have newBorrowIndex already
        local.newSupplyIndex = calculateInterestIndex(
            market.supplyIndex,
            market.supplyRateMantissa,
            market.blockNumber,
            block.number
        );

        local.newSupplyRateMantissa = IRateModel(market.interestRateModel)
            .getSupplyRate(
                asset,
                local.updatedCash,
                local.newTotalBorrows
            );

        local.newBorrowRateMantissa = IRateModel(market.interestRateModel)
            .getBorrowRate(
                asset,
                local.updatedCash,
                local.newTotalBorrows
            );


        // Save market updates
        market.blockNumber = block.number;
        market.totalBorrows = local.newTotalBorrows;
        market.supplyRateMantissa = local.newSupplyRateMantissa;
        market.supplyIndex = local.newSupplyIndex;
        market.borrowRateMantissa = local.newBorrowRateMantissa;
        market.borrowIndex = local.newBorrowIndex;

        // Save user updates
        local.startingBalance = borrowBalance.principal; // save for use in `BorrowRepaid` event
        borrowBalance.principal = local.userBorrowUpdated;
        borrowBalance.interestIndex = local.newBorrowIndex;


        doTransferIn(asset, msg.sender, local.repayAmount);

        supplyOriginationFeeAsAdmin(
            asset,
            msg.sender,
            local.repayAmount,
            market.supplyIndex
        );

        emit BorrowRepaid(
            msg.sender,
            asset,
            local.repayAmount,
            local.startingBalance,
            borrowBalance.principal
        );

        return true;
    }


    /**
     * @notice users repay all or some of an underwater borrow and receive collateral
     * @param targetAccount The account whose borrow should be liquidated
     * @param assetBorrow The market asset to repay
     * @param assetCollateral The borrower's market asset to receive in exchange
     * @param requestedAmountClose The amount to repay (or MAX_UINT256 for max)
     */
    function liquidateBorrow(
        address targetAccount,
        address assetBorrow,
        address assetCollateral,
        uint256 requestedAmountClose
    ) public nonPaused returns(bool) {
        refreshSupplyIndex(assetCollateral, targetAccount);
        refreshSupplyIndex(assetCollateral, msg.sender);
        refreshBorrowIndex(assetBorrow, targetAccount);

        LiquidateLocalVars memory local;

        // Copy these addresses into the struct for use with `emitLiquidationEvent`
        // We'll use local.liquidator inside this function for clarity vs using msg.sender.
        local.targetAccount = targetAccount;
        local.assetBorrow = assetBorrow;
        local.liquidator = msg.sender;
        local.assetCollateral = assetCollateral;

        Market storage borrowMarket = markets[assetBorrow];
        Market storage collateralMarket = markets[assetCollateral];
        Balance storage borrowBalance_TargeUnderwaterAsset = borrowBalances[ targetAccount][assetBorrow];
        Balance storage supplyBalance_TargetCollateralAsset = supplyBalances[targetAccount][assetCollateral];

        // Liquidator might already hold some of the collateral asset

        Balance storage supplyBalance_LiquidatorCollateralAsset = supplyBalances[local.liquidator][assetCollateral];

        local.collateralPrice = fetchAssetPrice(assetCollateral);

        // If the price oracle is not set, then we would have failed on the first call to fetchAssetPrice
        local.underwaterAssetPrice = fetchAssetPrice(assetBorrow);

        // We calculate newBorrowIndex_UnderwaterAsset and then use it to help calculate currentBorrowBalance_TargetUnderwaterAsset
        local.newBorrowIndex_UnderwaterAsset = calculateInterestIndex(
            borrowMarket.borrowIndex,
            borrowMarket.borrowRateMantissa,
            borrowMarket.blockNumber,
            block.number
        );

        local.currentBorrowBalance_TargetUnderwaterAsset = calculateBalance(
            borrowBalance_TargeUnderwaterAsset.principal,
            borrowBalance_TargeUnderwaterAsset.interestIndex,
            local.newBorrowIndex_UnderwaterAsset
        );

        // We calculate newSupplyIndex_CollateralAsset and then use it to help calculate currentSupplyBalance_TargetCollateralAsset
        local.newSupplyIndex_CollateralAsset = calculateInterestIndex(
            collateralMarket.supplyIndex,
            collateralMarket.supplyRateMantissa,
            collateralMarket.blockNumber,
            block.number
        );

        local.currentSupplyBalance_TargetCollateralAsset = calculateBalance(
            supplyBalance_TargetCollateralAsset.principal,
            supplyBalance_TargetCollateralAsset.interestIndex,
            local.newSupplyIndex_CollateralAsset
        );

        // Liquidator may or may not already have some collateral asset.
        // If they do, we need to accumulate interest on it before adding the seized collateral to it.
        // We re-use newSupplyIndex_CollateralAsset calculated above to help calculate currentSupplyBalance_LiquidatorCollateralAsset
        local.currentSupplyBalance_LiquidatorCollateralAsset = calculateBalance(
            supplyBalance_LiquidatorCollateralAsset.principal,
            supplyBalance_LiquidatorCollateralAsset.interestIndex,
            local.newSupplyIndex_CollateralAsset
        );

        // We update the protocol's totalSupply for assetCollateral in 2 steps, first by adding target user's accumulated
        // interest and then by adding the liquidator's accumulated interest.

        // Step 1 of 2: We add the target user's supplyCurrent and subtract their checkpointedBalance
        // (which has the desired effect of adding accrued interest from the target user)
        local.newTotalSupply_ProtocolCollateralAsset =
            collateralMarket.totalSupply +
            local.currentSupplyBalance_TargetCollateralAsset -
            supplyBalance_TargetCollateralAsset.principal;

        // Step 2 of 2: We add the liquidator's supplyCurrent of collateral asset and subtract their checkpointedBalance
        // (which has the desired effect of adding accrued interest from the calling user)
        local.newTotalSupply_ProtocolCollateralAsset =
            local.newTotalSupply_ProtocolCollateralAsset +
            local.currentSupplyBalance_LiquidatorCollateralAsset -
            supplyBalance_LiquidatorCollateralAsset.principal;

        // We calculate maxCloseableBorrowAmount_TargetUnderwaterAsset, the amount of borrow that can be closed from the target user
        // This is equal to the lesser of
        // 1. borrowCurrent; (already calculated)
        // 2. ONLY IF MARKET SUPPORTED: discountedRepayToEvenAmount:
        // discountedRepayToEvenAmount=
        //      shortfall / [Oracle price for the borrow * (collateralRatio - liquidationDiscount - 1)]
        // 3. discountedBorrowDenominatedCollateral
        //      [supplyCurrent / (1 + liquidationDiscount)] * (Oracle price for the collateral / Oracle price for the borrow)

        // Here we calculate item 3. discountedBorrowDenominatedCollateral =
        // [supplyCurrent / (1 + liquidationDiscount)] * (Oracle price for the collateral / Oracle price for the borrow)
        local.discountedBorrowDenominatedCollateral = calculateDiscountedBorrowDenominatedCollateral(
            local.underwaterAssetPrice,
            local.collateralPrice,
            local.currentSupplyBalance_TargetCollateralAsset
        );

        if(borrowMarket.isSupported) {
            // Market is supported, so we calculate item 2 from above.
            local.discountedRepayToEvenAmount = calculateDiscountedRepayToEvenAmount(
                targetAccount,
                local.underwaterAssetPrice,
                assetBorrow
            );

            // We need to do a two-step min to select from all 3 values
            // min1&3 = min(item 1, item 3)
            local.maxCloseableBorrowAmount_TargetUnderwaterAsset = min(
                local.currentBorrowBalance_TargetUnderwaterAsset,
                local.discountedBorrowDenominatedCollateral
            );

            // min1&3&2 = min(min1&3, 2)
            local.maxCloseableBorrowAmount_TargetUnderwaterAsset = min(
                local.maxCloseableBorrowAmount_TargetUnderwaterAsset,
                local.discountedRepayToEvenAmount
            );
        } else {
            // Market is not supported, so we don't need to calculate item 2.
            local.maxCloseableBorrowAmount_TargetUnderwaterAsset = min(
                local.currentBorrowBalance_TargetUnderwaterAsset,
                local.discountedBorrowDenominatedCollateral
            );
        }

        // If liquidateBorrowAmount = MAX_UINT256, then closeBorrowAmount_TargetUnderwaterAsset = maxCloseableBorrowAmount_TargetUnderwaterAsset
        if(requestedAmountClose == MAX_UINT256) {
            local.closeBorrowAmount_TargetUnderwaterAsset = local.maxCloseableBorrowAmount_TargetUnderwaterAsset;
        } else {
            local.closeBorrowAmount_TargetUnderwaterAsset = requestedAmountClose;
        }


        // Verify closeBorrowAmount_TargetUnderwaterAsset <= maxCloseableBorrowAmount_TargetUnderwaterAsset
        require(
            local.closeBorrowAmount_TargetUnderwaterAsset <
            local.maxCloseableBorrowAmount_TargetUnderwaterAsset,
            "LIQUIDATE_CLOSE_AMOUNT_TOO_HIGH"
        );

        // seizeSupplyAmount_TargetCollateralAsset = closeBorrowAmount_TargetUnderwaterAsset * priceBorrow/priceCollateral *(1+liquidationDiscount)
        local.seizeSupplyAmount_TargetCollateralAsset = calculateAmountSeize(
            local.underwaterAssetPrice,
            local.collateralPrice,
            local.closeBorrowAmount_TargetUnderwaterAsset
        );

        // We are going to ERC-20 transfer closeBorrowAmount_TargetUnderwaterAsset of assetBorrow into protocol
        // Fail gracefully if asset is not approved or has insufficient balance
        checkTransferIn(
            assetBorrow,
            local.liquidator,
            local.closeBorrowAmount_TargetUnderwaterAsset
        );

        // We are going to repay the target user's borrow using the calling user's funds
        // We update the protocol's totalBorrow for assetBorrow, by subtracting the target user's prior checkpointed balance,
        // adding borrowCurrent, and subtracting closeBorrowAmount_TargetUnderwaterAsset.

        // Subtract the `closeBorrowAmount_TargetUnderwaterAsset` from the `currentBorrowBalance_TargetUnderwaterAsset` to get `updatedBorrowBalance_TargetUnderwaterAsset`
        local.updatedBorrowBalance_TargetUnderwaterAsset = local.currentBorrowBalance_TargetUnderwaterAsset - local.closeBorrowAmount_TargetUnderwaterAsset;


        // We calculate the protocol's totalBorrow for assetBorrow by subtracting the user's prior checkpointed balance, adding user's updated borrow
        // Note that, even though the liquidator is paying some of the borrow, if the borrow has accumulated a lot of interest since the last
        // action, the updated balance *could* be higher than the prior checkpointed balance.
        local.newTotalBorrows_ProtocolUnderwaterAsset =
            borrowMarket.totalBorrows +
            local.updatedBorrowBalance_TargetUnderwaterAsset -
            borrowBalance_TargeUnderwaterAsset.principal;

        // We need to calculate what the updated cash will be after we transfer in from liquidator
        local.currentCash_ProtocolUnderwaterAsset = getCash(assetBorrow);
        local.updatedCash_ProtocolUnderwaterAsset =
            local.currentCash_ProtocolUnderwaterAsset +
            local.closeBorrowAmount_TargetUnderwaterAsset;

        // We calculate a new supply index, borrow index, supply rate, and borrow rate for assetBorrow
        // (Please note that we don't need to do the same thing for assetCollateral because neither cash nor borrows of assetCollateral happen in this process.)

        // We calculate the newSupplyIndex_UnderwaterAsset, but we already have newBorrowIndex_UnderwaterAsset so don't recalculate it.
        local.newSupplyIndex_UnderwaterAsset = calculateInterestIndex(
            borrowMarket.supplyIndex,
            borrowMarket.supplyRateMantissa,
            borrowMarket.blockNumber,
            block.number
        );

        local.newSupplyRateMantissa_ProtocolUnderwaterAsset = IRateModel(borrowMarket.interestRateModel).getSupplyRate(
            assetBorrow,
            local.updatedCash_ProtocolUnderwaterAsset,
            local.newTotalBorrows_ProtocolUnderwaterAsset
        );

        local.newBorrowRateMantissa_ProtocolUnderwaterAsset = IRateModel(borrowMarket.interestRateModel).getBorrowRate(
            assetBorrow,
            local.updatedCash_ProtocolUnderwaterAsset,
            local.newTotalBorrows_ProtocolUnderwaterAsset
        );

        // Now we look at collateral. We calculated target user's accumulated supply balance and the supply index above.
        // Now we need to calculate the borrow index.
        // We don't need to calculate new rates for the collateral asset because we have not changed utilization:
        //  - accumulating interest on the target user's collateral does not change cash or borrows
        //  - transferring seized amount of collateral internally from the target user to the liquidator does not change cash or borrows.
        local.newBorrowIndex_CollateralAsset = calculateInterestIndex(
            collateralMarket.borrowIndex,
            collateralMarket.borrowRateMantissa,
            collateralMarket.blockNumber,
            block.number
        );


        // We checkpoint the target user's assetCollateral supply balance, supplyCurrent - seizeSupplyAmount_TargetCollateralAsset at the updated index
        // The sub won't underflow because because seizeSupplyAmount_TargetCollateralAsset <= target user's collateral balance
        // maxCloseableBorrowAmount_TargetUnderwaterAsset is limited by the discounted borrow denominated collateral. That limits closeBorrowAmount_TargetUnderwaterAsset
        // which in turn limits seizeSupplyAmount_TargetCollateralAsset.
        local.updatedSupplyBalance_TargetCollateralAsset = 
            local.currentSupplyBalance_TargetCollateralAsset -
            local.seizeSupplyAmount_TargetCollateralAsset;

        // We checkpoint the liquidating user's assetCollateral supply balance, supplyCurrent + seizeSupplyAmount_TargetCollateralAsset at the updated index
        // We can't overflow here because if this would overflow, then we would have already overflowed above and failed
        // with LIQUIDATE_NEW_TOTAL_SUPPLY_BALANCE_CALCULATION_FAILED_LIQUIDATOR_COLLATERAL_ASSET
        local.updatedSupplyBalance_LiquidatorCollateralAsset = 
            local.currentSupplyBalance_LiquidatorCollateralAsset +
            local.seizeSupplyAmount_TargetCollateralAsset;


        // Save borrow market updates
        borrowMarket.blockNumber = block.number;
        borrowMarket.totalBorrows = local.newTotalBorrows_ProtocolUnderwaterAsset;
 
        // borrowMarket.totalSupply does not need to be updated
        borrowMarket.supplyRateMantissa = local.newSupplyRateMantissa_ProtocolUnderwaterAsset;
        borrowMarket.supplyIndex = local.newSupplyIndex_UnderwaterAsset;
        borrowMarket.borrowRateMantissa = local.newBorrowRateMantissa_ProtocolUnderwaterAsset;
        borrowMarket.borrowIndex = local.newBorrowIndex_UnderwaterAsset;

        // Save collateral market updates
        // We didn't calculate new rates for collateralMarket (because neither cash nor borrows changed), just new indexes and total supply.
        collateralMarket.blockNumber = block.number;
        collateralMarket.totalSupply = local.newTotalSupply_ProtocolCollateralAsset;
        collateralMarket.supplyIndex = local.newSupplyIndex_CollateralAsset;
        collateralMarket.borrowIndex = local.newBorrowIndex_CollateralAsset;

        local.startingBorrowBalance_TargetUnderwaterAsset = borrowBalance_TargeUnderwaterAsset.principal; // save for use in event
        borrowBalance_TargeUnderwaterAsset.principal = local.updatedBorrowBalance_TargetUnderwaterAsset;
        borrowBalance_TargeUnderwaterAsset.interestIndex = local.newBorrowIndex_UnderwaterAsset;

        local.startingSupplyBalance_TargetCollateralAsset = supplyBalance_TargetCollateralAsset.principal; // save for use in event
        supplyBalance_TargetCollateralAsset.principal = local.updatedSupplyBalance_TargetCollateralAsset;
        supplyBalance_TargetCollateralAsset.interestIndex = local.newSupplyIndex_CollateralAsset;

        local.startingSupplyBalance_LiquidatorCollateralAsset = supplyBalance_LiquidatorCollateralAsset.principal; // save for use in event
        supplyBalance_LiquidatorCollateralAsset.principal = local.updatedSupplyBalance_LiquidatorCollateralAsset;
        supplyBalance_LiquidatorCollateralAsset.interestIndex = local.newSupplyIndex_CollateralAsset;


        doTransferIn(
            assetBorrow,
            local.liquidator,
            local.closeBorrowAmount_TargetUnderwaterAsset
        );

        supplyOriginationFeeAsAdmin(
            assetBorrow,
            local.liquidator,
            local.closeBorrowAmount_TargetUnderwaterAsset,
            local.newSupplyIndex_UnderwaterAsset
        );

        emit BorrowLiquidated(
            local.targetAccount,
            local.assetBorrow,
            local.currentBorrowBalance_TargetUnderwaterAsset,
            local.closeBorrowAmount_TargetUnderwaterAsset,
            local.liquidator,
            local.assetCollateral,
            local.seizeSupplyAmount_TargetCollateralAsset
        );

        return true;
    }


    /**
     * @notice Users borrow assets from the protocol to their own address
     * @param asset The market asset to borrow
     * @param amount The amount to borrow
     */
    function borrow(
        address asset, 
        uint256 amount
    ) public nonReentrant nonPaused returns(bool) {
        refreshBorrowIndex(asset, msg.sender);
        
        BorrowLocalVars memory local;
        Market storage market = markets[asset];
        Balance storage borrowBalance = borrowBalances[msg.sender][asset];

        require(market.isSupported, "MARKET_NOT_SUPPORTED");

        // We calculate the newBorrowIndex, user's borrowCurrent and borrowUpdated for the asset
        local.newBorrowIndex = calculateInterestIndex(
            market.borrowIndex,
            market.borrowRateMantissa,
            market.blockNumber,
            block.number
        );

        local.userBorrowCurrent = calculateBalance(
            borrowBalance.principal,
            borrowBalance.interestIndex,
            local.newBorrowIndex
        );

        // Calculate origination fee.
        local.borrowAmountWithFee = calculateBorrowAmountWithFee(amount);

        uint256 orgFeeBalance = local.borrowAmountWithFee - amount;

        // Add the `borrowAmountWithFee` to the `userBorrowCurrent` to get `userBorrowUpdated`
        local.userBorrowUpdated = local.userBorrowCurrent + local.borrowAmountWithFee;

        // We calculate the protocol's totalBorrow by subtracting the user's prior checkpointed balance, adding user's updated borrow with fee
        local.newTotalBorrows =
            market.totalBorrows +
            local.userBorrowUpdated -
            borrowBalance.principal;

        // Check customer liquidity
        (
            local.accountLiquidity,
            local.accountShortfall
        ) = calculateAccountLiquidity(msg.sender);

        // Fail if customer already has a shortfall
        require(isZeroExp(local.accountShortfall), "BORROW_ACCOUNT_SHORTFALL_PRESENT");

        // Would the customer have a shortfall after this borrow (including origination fee)?
        // We calculate the eth-equivalent value of (borrow amount + fee) of asset and fail if it exceeds accountLiquidity.
        // This implements: `[(collateralRatio*oraclea*borrowAmount)*(1+borrowFee)] > accountLiquidity`
        local.ethValueOfBorrowAmountWithFee = getPriceForAssetAmountMulCollatRatio(
            asset,
            local.borrowAmountWithFee
        );

        require(
            !lessThanExp(
                local.accountLiquidity,
                local.ethValueOfBorrowAmountWithFee
            ),
            "BORROW_AMOUNT_LIQUIDITY_SHORTFALL"
        );

        // Fail gracefully if protocol has insufficient cash
        local.currentCash = getCash(asset);
        // We need to calculate what the updated cash will be after we transfer out to the user
        local.updatedCash = local.currentCash - amount;

        // The utilization rate has changed! We calculate a new supply index and borrow index for the asset, and save it.
        // We calculate the newSupplyIndex, but we have newBorrowIndex already
        local.newSupplyIndex = calculateInterestIndex(
            market.supplyIndex,
            market.supplyRateMantissa,
            market.blockNumber,
            block.number
        );

        local.newSupplyRateMantissa = IRateModel(market.interestRateModel)
            .getSupplyRate(
                asset,
                local.updatedCash,
                local.newTotalBorrows
            );

        local.newBorrowRateMantissa = IRateModel(market.interestRateModel)
            .getBorrowRate(
                asset,
                local.updatedCash,
                local.newTotalBorrows
            );


        // Save market updates
        market.blockNumber = block.number;
        market.totalBorrows = local.newTotalBorrows;
        market.supplyRateMantissa = local.newSupplyRateMantissa;
        market.supplyIndex = local.newSupplyIndex;
        market.borrowRateMantissa = local.newBorrowRateMantissa;
        market.borrowIndex = local.newBorrowIndex;

        // Save user updates
        local.startingBalance = borrowBalance.principal; // save for use in `BorrowTaken` event
        borrowBalance.principal = local.userBorrowUpdated;
        borrowBalance.interestIndex = local.newBorrowIndex;

        originationFeeBalance[msg.sender][asset] += orgFeeBalance;

        // Withdrawal should happen as Ether directly
        doTransferOut(asset, msg.sender, amount);

        emit BorrowTaken(
            msg.sender,
            asset,
            amount,
            local.startingBalance,
            local.borrowAmountWithFee,
            borrowBalance.principal
        );

        return true;
    }


    /**
     * @notice Get supply and borrows for a market
     * @param asset The market asset to find balances of
     * @return updated supply and borrows
     */
    function getMarketBalances(address asset) public view returns(uint256, uint256) {
        uint256 newSupplyIndex;
        uint256 marketSupplyCurrent;
        uint256 newBorrowIndex;
        uint256 marketBorrowCurrent;

        Market storage market = markets[asset];

        // Calculate the newSupplyIndex, needed to calculate market's supplyCurrent
        newSupplyIndex = calculateInterestIndex(
            market.supplyIndex,
            market.supplyRateMantissa,
            market.blockNumber,
            block.number
        );

        // Use newSupplyIndex and stored principal to calculate the accumulated balance
        marketSupplyCurrent = calculateBalance(
            market.totalSupply,
            market.supplyIndex,
            newSupplyIndex
        );

        // Calculate the newBorrowIndex, needed to calculate market's borrowCurrent
        newBorrowIndex = calculateInterestIndex(
            market.borrowIndex,
            market.borrowRateMantissa,
            market.blockNumber,
            block.number
        );

        // Use newBorrowIndex and stored principal to calculate the accumulated balance
        marketBorrowCurrent = calculateBalance(
            market.totalBorrows,
            market.borrowIndex,
            newBorrowIndex
        );

        return (marketSupplyCurrent, marketBorrowCurrent);
    }


    /**
     *  ============================
     *       Internal Methods
     *  ============================
    */
    /**
     * @dev Calculates a new supply/borrow index based on the prevailing interest rates applied over time
     *      This is defined as `we multiply the most recent supply/borrow index by (1 + blocks times rate)`
     * @return Return value is expressed in 1e18 scale
     */
    function calculateInterestIndex(
        uint256 startingInterestIndex,
        uint256 interestRateMantissa,
        uint256 blockStart,
        uint256 blockEnd
    ) internal pure returns(uint256) {
        // Get the block delta
        uint256 blockDelta = blockEnd - blockStart;
        // uint256 blockDelta = 7168 * 365; // one year
        // console.log("Block:", blockDelta);

        // Scale the interest rate times number of blocks
        // Note: Doing Exp construction inline to avoid `CompilerError: Stack too deep, try removing local variables.`
        Exp memory blocksTimesRate = mulScalar(
            Exp({ mantissa: interestRateMantissa }),
            // Exp({ mantissa: 35999999970 }),
            blockDelta
        );

        // Add one to that result (which is really Exp({mantissa: expScale}) which equals 1.0)
        Exp memory onePlusBlocksTimesRate = addExp(
            blocksTimesRate,
            Exp({ mantissa: mantissaOne })
        );

        // Then scale that accumulated interest by the old interest index to get the new interest index
        Exp memory newInterestIndexExp = mulScalar(
            onePlusBlocksTimesRate,
            startingInterestIndex
        );

        // Finally, truncate the interest index. This works only if interest index starts large enough
        // that is can be accurately represented with a whole number.
        return truncate(newInterestIndexExp);
    }


    /**
     * @dev Calculates a new balance based on a previous balance and a pair of interest indices
     *      This is defined as: `The user's last balance checkpoint is multiplied by the currentSupplyIndex
     *      value and divided by the user's checkpoint index value`
     * @return Return value is expressed in 1e18 scale
     */
    function calculateBalance(
        uint256 startingBalance,
        uint256 interestIndexStart,
        uint256 interestIndexEnd
    ) public pure returns(uint256) {
        if(startingBalance == 0) {
            // We are accumulating interest on any previous balance; if there's no previous balance, then there is
            // nothing to accumulate.
            return 0;
        }

        uint256 balanceTimesIndex = startingBalance * interestIndexEnd;

        return balanceTimesIndex / interestIndexStart;
    }


    /**
     * @dev Gets the price for the amount specified of the given asset.
     * @return Return value is expressed in a magnified scale per token decimals
     */
    function getPriceForAssetAmount(address asset, uint256 assetAmount) internal view returns(Exp memory) {
        Exp memory assetPrice = fetchAssetPrice(asset);

        require(!isZeroExp(assetPrice), "MISSING_ASSET_PRICE");

        return mulScalar(assetPrice, assetAmount); // assetAmountWei * oraclePrice = assetValueInEth
    }


    /**
     * @notice supply `amount` of `asset` (which must be supported) to `admin` in the protocol
     * @dev add amount of supported asset to admin's account
     * @param asset The market asset to supply
     * @param amount The amount to supply
     */
    function supplyOriginationFeeAsAdmin(
        address asset,
        address user,
        uint256 amount,
        uint256 newSupplyIndex
    ) private {
        refreshSupplyIndex(asset, admin);

        uint256 originationFeeRepaid = 0;
        if(originationFeeBalance[user][asset] != 0) {
            if(amount < originationFeeBalance[user][asset]) {
                originationFeeRepaid = amount;
            } else {
                originationFeeRepaid = originationFeeBalance[user][asset];
            }

            Balance storage balance = supplyBalances[admin][asset];

            SupplyLocalVars memory local; // Holds all our uint calculation results

            originationFeeBalance[user][asset] -= originationFeeRepaid;

            local.userSupplyCurrent = calculateBalance(
                balance.principal,
                balance.interestIndex,
                newSupplyIndex
            );

            local.userSupplyUpdated = local.userSupplyCurrent + originationFeeRepaid;

            // We calculate the protocol's totalSupply by subtracting the user's prior checkpointed balance, adding user's updated supply
            local.newTotalSupply =
                markets[asset].totalSupply +
                local.userSupplyUpdated -
                balance.principal;

            // Save market updates
            markets[asset].totalSupply = local.newTotalSupply;

            // Save user updates
            local.startingBalance = balance.principal;
            balance.principal = local.userSupplyUpdated;
            balance.interestIndex = newSupplyIndex;

            emit SupplyOrgFeeAsAdmin(
                admin,
                asset,
                originationFeeRepaid,
                local.startingBalance,
                local.userSupplyUpdated
            );
        }
    }



    /**
     * @dev Gets the price for the amount specified of the given asset multiplied by the current
     *      collateral ratio (i.e., assetAmountWei * collateralRatio * oraclePrice = totalValueInEth).
     *      We will group this as `(oraclePrice * collateralRatio) * assetAmountWei`
     * @return Return value is expressed in a magnified scale per token decimals
     */
    function getPriceForAssetAmountMulCollatRatio(
        address asset,
        uint256 assetAmount
    ) internal view returns(Exp memory) {
        Exp memory assetPrice;
        Exp memory scaledPrice;
        assetPrice = fetchAssetPrice(asset);

        require(!isZeroExp(assetPrice), "MISSING_ASSET_PRICE");

        // Now, multiply the assetValue by the collateral ratio
        scaledPrice = mulExp(collateralRatio, assetPrice);

        // Get the price for the given asset amount
        return mulScalar(scaledPrice, assetAmount);
    }

    // Calculates the origination fee added to a given borrowAmount
    // This is simply `(1 + originationFee) * borrowAmount`
    // @return Return value is expressed in 1e18 scale
    function calculateBorrowAmountWithFee(uint256 borrowAmount) internal view returns(uint256) {
        // When origination fee is zero, the amount with fee is simply equal to the amount
        if(isZeroExp(originationFee)) {
            return borrowAmount;
        }

        Exp memory originationFeeFactor = addExp(
            originationFee,
            Exp({ mantissa: mantissaOne })
        );

        Exp memory borrowAmountWithFee = mulScalar(
            originationFeeFactor,
            borrowAmount
        );

        return truncate(borrowAmountWithFee);
    }


    /**
     * @dev fetches the price of asset from the PriceOracle and converts it to Exp
     * @param asset asset whose price should be fetched
     * @return Return value is expressed in a magnified scale per token decimals
     */
    function fetchAssetPrice(address asset) public view returns(Exp memory) {
        require(address(priceOracle) != address(0), "Oracle is Zero");

        (uint256 priceMantissa, uint8 assetDecimals) = priceOracle.getAssetPrice(asset);
        uint256 magnification = 18 - uint256(assetDecimals);

        priceMantissa = priceMantissa * 10**magnification;

        return Exp({ mantissa: priceMantissa });
    }


    function min(uint256 a, uint256 b) internal pure returns(uint256) {
        if(a < b)
            return a;
        return b;
    }


    /**
     * @dev Adds a given asset to the list of collateral markets. This operation is impossible to reverse.
     *      Note: this will not add the asset if it already exists.
     */
    function _addCollateralMarket(address asset) internal {
        for(uint256 i = 0; i < collateralMarkets.length; i++) {
            if(collateralMarkets[i] == asset) {
                return;
            }
        }

        collateralMarkets.push(asset);
    }


    /**
     * @dev Gets the amount of the specified asset given the specified Eth value
     *      value / oraclePrice = assetAmountWei
     *      If there's no oraclePrice, this returns 0
     * @return Return value is expressed in a magnified scale per token decimals
     */
    function getAssetAmountForValue(address asset, Exp memory value) internal view returns(uint256) {
        Exp memory assetPrice = fetchAssetPrice(asset);
        Exp memory assetAmount = divExp(value, assetPrice);

        return truncate(assetAmount);
    }
    

    /**
     * @dev Gets the user's account liquidity and account shortfall balances. This includes
     *      any accumulated interest thus far but does NOT actually update anything in
     *      storage, it simply calculates the account liquidity and shortfall with liquidity being
     *      returned as the first Exp, ie (Error, accountLiquidity, accountShortfall).
     * @return Return values are expressed in 1e18 scale
     */
    function calculateAccountLiquidity(address userAddress) internal view returns(Exp memory, Exp memory) {
        (
            Exp memory sumSupplyValuesMantissa,
            Exp memory sumBorrowValuesMantissa
        ) = calculateAccountValuesInternal(userAddress);

        Exp memory result;
        Exp memory sumSupplyValuesFinal = Exp({ mantissa: sumSupplyValuesMantissa.mantissa });
        Exp memory sumBorrowValuesFinal; // need to apply collateral ratio

        sumBorrowValuesFinal = mulExp(
            collateralRatio,
            Exp({ mantissa: sumBorrowValuesMantissa.mantissa })
        );

        // if sumSupplies < sumBorrows, then the user is under collateralized and has account shortfall.
        // else the user meets the collateral ratio and has account liquidity.
        if(lessThanExp(sumSupplyValuesFinal, sumBorrowValuesFinal)) {
            // accountShortfall = borrows - supplies
            result = subExp(sumBorrowValuesFinal, sumSupplyValuesFinal);

            return (Exp({ mantissa: 0 }), result);
        } else {
            // accountLiquidity = supplies - borrows
            result = subExp(sumSupplyValuesFinal, sumBorrowValuesFinal);

            return (result, Exp({ mantissa: 0 }));
        }
    }


    /**
     * @notice Gets the ETH values of the user's accumulated supply and borrow balances, scaled by 10e18.
     *         This includes any accumulated interest thus far but does NOT actually update anything in
     *         storage
     * @dev Gets ETH values of accumulated supply and borrow balances
     * @param userAddress account for which to sum values
     * @return (error code, sum ETH value of supplies scaled by 10e18, sum ETH value of borrows scaled by 10e18)
     */
    function calculateAccountValuesInternal(address userAddress) internal view returns(Exp memory, Exp memory) {
        /** By definition, all collateralMarkets are those that contribute to the user's
         * liquidity and shortfall so we need only loop through those markets.
         * To handle avoiding intermediate negative results, we will sum all the user's
         * supply balances and borrow balances (with collateral ratio) separately and then
         * subtract the sums at the end.
         */
        AccountValueLocalVars memory local; // Re-used for all intermediate results
        local.sumSupplies = Exp({ mantissa: 0 });
        local.sumBorrows = Exp({ mantissa: 0 });
        local.collateralMarketsLength = collateralMarkets.length;

        for(uint256 i = 0; i < local.collateralMarketsLength; i++) {
            local.assetAddress = collateralMarkets[i];
            Market storage currentMarket = markets[local.assetAddress];
            Balance storage supplyBalance = supplyBalances[userAddress][local.assetAddress];
            Balance storage borrowBalance = borrowBalances[userAddress][local.assetAddress];

            if(supplyBalance.principal > 0) {
                // We calculate the newSupplyIndex and user’s supplyCurrent (includes interest)
                local.newSupplyIndex = calculateInterestIndex(
                    currentMarket.supplyIndex,
                    currentMarket.supplyRateMantissa,
                    currentMarket.blockNumber,
                    block.number
                );

                local.userSupplyCurrent = calculateBalance(
                    supplyBalance.principal,
                    supplyBalance.interestIndex,
                    local.newSupplyIndex
                );

                // We have the user's supply balance with interest so let's multiply by the asset price to get the total value
                local.supplyTotalValue = getPriceForAssetAmount(
                    local.assetAddress,
                    local.userSupplyCurrent
                ); // supplyCurrent * oraclePrice = supplyValueInEth

                // Add this to our running sum of supplies
                local.sumSupplies = addExp(
                    local.supplyTotalValue,
                    local.sumSupplies
                );
            }

            if(borrowBalance.principal > 0) {
                // We perform a similar actions to get the user's borrow balance
                local.newBorrowIndex = calculateInterestIndex(
                    currentMarket.borrowIndex,
                    currentMarket.borrowRateMantissa,
                    currentMarket.blockNumber,
                    block.number
                );

                local.userBorrowCurrent = calculateBalance(
                    borrowBalance.principal,
                    borrowBalance.interestIndex,
                    local.newBorrowIndex
                );

                // We have the user's borrow balance with interest so let's multiply by the asset price to get the total value
                local.borrowTotalValue = getPriceForAssetAmount(
                    local.assetAddress,
                    local.userBorrowCurrent
                ); // borrowCurrent * oraclePrice = borrowValueInEth

                // Add this to our running sum of borrows
                local.sumBorrows = addExp(
                    local.borrowTotalValue,
                    local.sumBorrows
                );
            }
        }

        return (
            local.sumSupplies,
            local.sumBorrows
        );
    }


    /**
     * @dev This should ONLY be called if market is supported. It returns shortfall / [Oracle price for the borrow * (collateralRatio - liquidationDiscount - 1)]
     *      If the market isn't supported, we support liquidation of asset regardless of shortfall because we want borrows of the unsupported asset to be closed.
     *      Note that if collateralRatio = liquidationDiscount + 1, then the denominator will be zero and the function will fail with DIVISION_BY_ZERO.
     * @return Return values are expressed in 1e18 scale
     */
    function calculateDiscountedRepayToEvenAmount(
        address targetAccount,
        Exp memory underwaterAssetPrice,
        address assetBorrow
    ) internal view returns(uint256) {
        Exp memory _accountLiquidity; // unused return value from calculateAccountLiquidity
        Exp memory accountShortfall_TargetUser;
        Exp memory collateralRatioMinusLiquidationDiscount; // collateralRatio - liquidationDiscount
        Exp memory discountedCollateralRatioMinusOne; // collateralRatioMinusLiquidationDiscount - 1, aka collateralRatio - liquidationDiscount - 1
        Exp memory discountedPrice_UnderwaterAsset;
        Exp memory rawResult;

        // we calculate the target user's shortfall, denominated in Ether, that the user is below the collateral ratio
        (
            _accountLiquidity,
            accountShortfall_TargetUser
        ) = calculateAccountLiquidity(targetAccount);

        collateralRatioMinusLiquidationDiscount = subExp(
            collateralRatio,
            liquidationDiscount
        );

        discountedCollateralRatioMinusOne = subExp(
            collateralRatioMinusLiquidationDiscount,
            Exp({mantissa: mantissaOne})
        );


        // calculateAccountLiquidity multiplies underwaterAssetPrice by collateralRatio
        // discountedCollateralRatioMinusOne < collateralRatio
        // so if underwaterAssetPrice * collateralRatio did not overflow then
        // underwaterAssetPrice * discountedCollateralRatioMinusOne can't overflow either
        discountedPrice_UnderwaterAsset = mulExp(
            underwaterAssetPrice,
            discountedCollateralRatioMinusOne
        );


        /* The liquidator may not repay more than what is allowed by the closeFactor */
        uint256 borrowBalance = getBorrowBalanceWithInterest(targetAccount, assetBorrow);
        Exp memory maxClose = mulScalar(
            Exp({ mantissa: closeFactorMantissa }),
            borrowBalance
        );

        rawResult = divExp(maxClose, discountedPrice_UnderwaterAsset);

        return truncate(rawResult);
    }


    /**
     * @dev discountedBorrowDenominatedCollateral = [supplyCurrent / (1 + liquidationDiscount)] * (Oracle price for the collateral / Oracle price for the borrow)
     * @return Return values are expressed in 1e18 scale
     */
    function calculateDiscountedBorrowDenominatedCollateral(
        Exp memory underwaterAssetPrice,
        Exp memory collateralPrice,
        uint256 supplyCurrent_TargetCollateralAsset
    ) internal view returns(uint256) {
        // To avoid rounding issues, we re-order and group the operations so we do 1 division and only at the end
        // [supplyCurrent * (Oracle price for the collateral)] / [ (1 + liquidationDiscount) * (Oracle price for the borrow) ]
        Exp memory onePlusLiquidationDiscount; // (1 + liquidationDiscount)
        Exp memory supplyCurrentTimesOracleCollateral; // supplyCurrent * Oracle price for the collateral
        Exp memory onePlusLiquidationDiscountTimesOracleBorrow; // (1 + liquidationDiscount) * Oracle price for the borrow
        Exp memory rawResult;

        onePlusLiquidationDiscount = addExp(
            Exp({ mantissa: mantissaOne }),
            liquidationDiscount
        );

        supplyCurrentTimesOracleCollateral = mulScalar(
            collateralPrice,
            supplyCurrent_TargetCollateralAsset
        );

        onePlusLiquidationDiscountTimesOracleBorrow = mulExp(
            onePlusLiquidationDiscount,
            underwaterAssetPrice
        );

        rawResult = divExp(
            supplyCurrentTimesOracleCollateral,
            onePlusLiquidationDiscountTimesOracleBorrow
        );

        return truncate(rawResult);
    }

    /**
     * @dev returns closeBorrowAmount_TargetUnderwaterAsset * (1+liquidationDiscount) * priceBorrow/priceCollateral
     * @return Return values are expressed in 1e18 scale
     */
    function calculateAmountSeize(
        Exp memory underwaterAssetPrice,
        Exp memory collateralPrice,
        uint256 closeBorrowAmount_TargetUnderwaterAsset
    ) internal view returns(uint256) {
        // To avoid rounding issues, we re-order and group the operations to move the division to the end, rather than just taking the ratio of the 2 prices:
        // underwaterAssetPrice * (1+liquidationDiscount) *closeBorrowAmount_TargetUnderwaterAsset) / collateralPrice

        // re-used for all intermediate errors

        // (1+liquidationDiscount)
        Exp memory liquidationMultiplier;

        // assetPrice-of-underwaterAsset * (1+liquidationDiscount)
        Exp memory priceUnderwaterAssetTimesLiquidationMultiplier;

        // priceUnderwaterAssetTimesLiquidationMultiplier * closeBorrowAmount_TargetUnderwaterAsset
        // or, expanded:
        // underwaterAssetPrice * (1+liquidationDiscount) * closeBorrowAmount_TargetUnderwaterAsset
        Exp memory finalNumerator;

        // finalNumerator / priceCollateral
        Exp memory rawResult;

        // liquidation discount will be enforced < 1, so 1 + liquidationDiscount can't overflow.
        liquidationMultiplier = addExp(
            Exp({ mantissa: mantissaOne }),
            liquidationDiscount
        );

        priceUnderwaterAssetTimesLiquidationMultiplier = mulExp(
            underwaterAssetPrice,
            liquidationMultiplier
        );

        finalNumerator = mulScalar(
            priceUnderwaterAssetTimesLiquidationMultiplier,
            closeBorrowAmount_TargetUnderwaterAsset
        );

        rawResult = divExp(finalNumerator, collateralPrice);

        return truncate(rawResult);
    }


    /**
     * @notice Trigger the underlying Reward Control contract to accrue DLT supply rewards for the supplier on the specified market
     * @param market The address of the market to accrue rewards
     * @param supplier The address of the supplier to accrue rewards
     */
    function refreshSupplyIndex(
        address market,
        address supplier
    ) internal {
        if(address(rewardControl) == address(0)) {
            return;
        }
        rewardControl.refreshSupplyIndex(market, supplier);
    }

    /**
     * @notice Trigger the underlying Reward Control contract to accrue ALK borrow rewards for the borrower on the specified market
     * @param market The address of the market to accrue rewards
     * @param borrower The address of the borrower to accrue rewards
     */
    function refreshBorrowIndex(
        address market,
        address borrower
    ) internal {
        if(address(rewardControl) == address(0)) {
            return;
        }
        rewardControl.refreshBorrowIndex(market, borrower);
    }
}