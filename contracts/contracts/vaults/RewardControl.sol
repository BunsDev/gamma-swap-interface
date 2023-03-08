// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./ExponentialNoError.sol";
import "./interfaces/IRewardControl.sol";
import "./interfaces/IEIP20.sol";
import "./GammaVault.sol";

contract RewardControl is IRewardControl, ExponentialNoError {
    struct MarketState {
        // @notice The market's last updated supplyIndex or borrowIndex
        uint224 index;
        // @notice The block number the index was last updated at
        uint32 block;
    }

    // @notice A list of all markets in the reward program mapped to respective vault
    address[] allMarkets;

    // @notice A list of all ibTokens for each market. Mapped 1-1 to allMarkets
    address[] allIbTokens;

    // @notice The index for checking whether a market is already in the reward program
    mapping(address => bool) allMarketsIndex;

    // @notice The rate at which the Reward Control distributes Delta per block
    uint256 ibRate;

    // @notice The portion of ibRate that each market currently receives
    mapping(address => uint256) speeds;

    // @notice The Delta market supply state for each market
    mapping(address => MarketState) ibSupplyState;

    // @notice The Delta market borrow state for each market
    mapping(address => MarketState) ibBorrowState;

    /// @notice The snapshot of Delta index for each market for each supplier as of the last time they accrued Delta
    /// @dev market => supplier => supplierIndex
    mapping(address => mapping(address => uint256)) ibSupplierIndex;

    /// @notice The snapshot of Delta index for each market for each borrower as of the last time they accrued Delta
    /// @dev market => borrower => borrowerIndex
    mapping(address => mapping(address => uint256)) ibBorrowerIndex;

    // @notice The Delta accrued but not yet transferred to each participant
    mapping(address => uint256) tauAccrued;

    // @notice To make sure initializer is called only once
    bool public initializationDone;

    // @notice The address of the current owner of this contract
    address public owner;

    // @notice The underlying GammaVault contract
    GammaVault public deltaOpen;

    // Hard cap on the maximum number of markets
    uint8 public MAXIMUM_NUMBER_OF_MARKETS;


    /**
     * Events
     */

    /// @notice Emitted when a new ibToken speed is calculated for a market
    event SpeedUpdated(
        address indexed market,
        uint256 newSpeed
    );

    /// @notice Emitted when ibToken is distributed to a supplier
    event DistributedSupplier(
        address indexed market,
        address indexed supplier,
        uint256 supplierDelta,
        uint256 supplierAccrued,
        uint256 supplyIndexMantissa
    );

    /// @notice Emitted when ibToken is distributed to a borrower
    event DistributedBorrower(
        address indexed market,
        address indexed borrower,
        uint256 borrowerDelta,
        uint256 borrowerAccrued,
        uint256 borrowIndexMantissa
    );

    /// @notice Emitted when ibToken is transferred to a participant
    event Transferred(
        address indexed participant,
        uint256 participantAccrued,
        address market
    );

    /// @notice Emitted when the owner of the contract is updated
    event OwnerUpdated(address indexed owner, address indexed newOwner);

    /// @notice Emitted when a market is added
    event MarketAdded(
        address indexed market,
        uint256 numberOfMarkets
    );

    /// @notice Emitted when a market is removed
    event MarketRemoved(
        address indexed market,
        uint256 numberOfMarkets
    );


    modifier onlyOwner() {
        require(msg.sender == owner, "non-owner");
        _;
    }


    /**
     * @notice `RewardControl` is the contract to calculate and distribute reward tokens
     */
    constructor(address tauVault_) {
        require(
            tauVault_ != address(0),
            "Inputs cannot be 0x00"
        );

        owner = msg.sender;
        setGammaVault(tauVault_);

        // Total Liquidity rewards for 4 years = 70,000,000
        // Liquidity per year = 70,000,000/4 = 17,500,000
        // Divided by blocksPerYear (assuming 13.3 seconds avg. block time) = 17,500,000/2,371,128 = 7.380453522542860000
        // 7380453522542860000 (Tokens scaled by token decimals of 18) divided by 2 (half for lending and half for borrowing)
        setIbRate(3690226761271430000);
        
        MAXIMUM_NUMBER_OF_MARKETS = 16;
    }


    function setGammaVault(address tauVault_) public onlyOwner {
        require(tauVault_ != address(0), "Address is empty");
        deltaOpen = GammaVault(tauVault_);
    }


    function setIbRate(uint256 _ibRate) public onlyOwner {
        ibRate = _ibRate;
    }


    /**
     * @notice Refresh ibToken supply index for the specified market and supplier
     * @param market The market whose supply index to update
     * @param supplier The address of the supplier to distribute ibToken to
     */
    function refreshSupplyIndex(
        address market,
        address supplier
    ) external {
        if(!allMarketsIndex[market]) {
            return;
        }

        refreshSpeeds();
        updateSupplyIndex(market);
        distributeSupplier(market, supplier);
    }


    /**
     * @notice Refresh ibToken borrow index for the specified market and borrower
     * @param market The market whose borrow index to update
     * @param borrower The address of the borrower to distribute ibToken to
     */
    function refreshBorrowIndex(
        address market,
        address borrower
    ) external {
        if(!allMarketsIndex[market]) {
            return;
        }

        refreshSpeeds();
        updateBorrowIndex(market);
        distributeBorrower(market, borrower);
    }


    /**
     * @notice Claim all the ibToken accrued by holder in all markets
     * @param holder The address to claim ibToken for
     */
    function claim(address holder) external {
        claim(holder, allMarkets, allIbTokens);
    }


    /**
     * @notice Claim all the ibToken accrued by holder by refreshing the indexes on the specified market only
     * @param holder The address to claim ibToken for
     * @param market The address of the market to refresh the indexes for
     */
    function claim(
        address holder,
        address market,
        address ibToken
    ) external {
        require(allMarketsIndex[market], "Market does not exist");
        address[] memory markets = new address[](1);
        markets[0] = market;
        address[] memory ibTokens = new address[](1);
        ibTokens[0] = ibToken;
        
        claim(holder, markets, ibTokens);
    }


    /**
     * Private functions
     */

    /**
     * @notice Recalculate and update ibToken speeds for all markets
     */
    function refreshMarketLiquidity() internal view returns(Exp[] memory, Exp memory) {
        Exp memory totalLiquidity = Exp({ mantissa: 0 });
        Exp[] memory marketTotalLiquidity = new Exp[](
            add_(allMarkets.length, allMarkets.length)
        );

        address currentMarket;
        uint256 currentMarketTotalSupply = 0;
        uint256 currentMarketTotalBorrows = 0;
        Exp memory currentMarketTotalLiquidity;

        for(uint256 i = 0; i < allMarkets.length; i++) {
            currentMarket = allMarkets[i];
            currentMarketTotalSupply = mul_(
                getMarketTotalSupply(currentMarket),
                deltaOpen.assetPrices(currentMarket)
            );
            currentMarketTotalBorrows = mul_(
                getMarketTotalBorrows(currentMarket),
                deltaOpen.assetPrices(currentMarket)
            );
            currentMarketTotalLiquidity = Exp({
                mantissa: add_(
                    currentMarketTotalSupply,
                    currentMarketTotalBorrows
                )
            });
            marketTotalLiquidity[i] = currentMarketTotalLiquidity;
            totalLiquidity = add_(totalLiquidity, currentMarketTotalLiquidity);
        }
        return (marketTotalLiquidity, totalLiquidity);
    }


    /**
     * @notice Recalculate and update ibToken speeds for all markets
     */
    function refreshSpeeds() public {
        address currentMarket;
        (
            Exp[] memory marketTotalLiquidity,
            Exp memory totalLiquidity
        ) = refreshMarketLiquidity();

        uint256 newSpeed;

        for(uint256 i = 0; i < allMarkets.length; i++) {
            currentMarket = allMarkets[i];
            newSpeed = totalLiquidity.mantissa > 0
                ? mul_(ibRate, div_(marketTotalLiquidity[i], totalLiquidity))
                : 0;
            speeds[currentMarket] = newSpeed;
            emit SpeedUpdated(currentMarket, newSpeed);
        }
    }


    /**
     * @notice Accrue ibToken to the market by updating the supply index
     * @param market The market whose supply index to update
     */
    function updateSupplyIndex(address market) public {
        MarketState storage supplyState = ibSupplyState[market];
        uint256 marketSpeed = speeds[market];
        uint256 blockNumber = block.number;
        uint256 blocks = sub_(blockNumber, uint256(supplyState.block));
        
        if(blocks > 0 && marketSpeed > 0) {
            uint256 marketTotalSupply = getMarketTotalSupply(market);
            uint256 supplyAccrued = mul_(blocks, marketSpeed);

            Double memory ratio = marketTotalSupply > 0
                ? fraction(supplyAccrued, marketTotalSupply)
                : Double({ mantissa: 0 });
            Double memory index = add_(
                Double({ mantissa: supplyState.index }),
                ratio
            );

            ibSupplyState[market] = MarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(blockNumber, "block number exceeds 32 bits")
            });
        } else if(blocks > 0) {
            supplyState.block = safe32(
                blockNumber,
                "block number exceeds 32 bits"
            );
        }
    }


    /**
     * @notice Accrue ibToken to the market by updating the borrow index
     * @param market The market whose borrow index to update
     */
    function updateBorrowIndex(address market) public {
        MarketState storage borrowState = ibBorrowState[market];
        uint256 marketSpeed = speeds[market];
        uint256 blockNumber = block.number;
        uint256 blocks = sub_(blockNumber, uint256(borrowState.block));

        if(blocks > 0 && marketSpeed > 0) {
            uint256 marketTotalBorrows = getMarketTotalBorrows(market);
            uint256 borrowAccrued = mul_(blocks, marketSpeed);
            Double memory ratio = marketTotalBorrows > 0
                ? fraction(borrowAccrued, marketTotalBorrows)
                : Double({ mantissa: 0 });

            Double memory index = add_(
                Double({mantissa: borrowState.index}),
                ratio
            );
            ibBorrowState[market] = MarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(blockNumber, "block number exceeds 32 bits")
            });
        } else if(blocks > 0) {
            borrowState.block = safe32(
                blockNumber,
                "block number exceeds 32 bits"
            );
        }
    }

    /**
     * @notice Calculate ibToken accrued by a supplier and add it on top of tauAccrued[supplier]
     * @param market The market in which the supplier is interacting
     * @param supplier The address of the supplier to distribute ibToken to
     */
    function distributeSupplier(
        address market,
        address supplier
    ) public {
        MarketState storage supplyState = ibSupplyState[market];
        Double memory supplyIndex = Double({mantissa: supplyState.index});
        Double memory supplierIndex = Double({
            mantissa: ibSupplierIndex[market][supplier]
        });
        ibSupplierIndex[market][supplier] = supplyIndex.mantissa;

        if(supplierIndex.mantissa > 0) {
            Double memory deltaIndex = sub_(supplyIndex, supplierIndex);
            uint256 supplierBalance = getSupplyBalanceWithInterest(
                market,
                supplier
            );
            uint256 supplierDelta = mul_(supplierBalance, deltaIndex);
            tauAccrued[supplier] = add_(tauAccrued[supplier], supplierDelta);
            emit DistributedSupplier(
                market,
                supplier,
                supplierDelta,
                tauAccrued[supplier],
                supplyIndex.mantissa
            );
        }
    }


    /**
     * @notice Calculate ibToken accrued by a borrower and add it on top of tauAccrued[borrower]
     * @param market The market in which the borrower is interacting
     * @param borrower The address of the borrower to distribute ibToken to
     */
    function distributeBorrower(
        address market,
        address borrower
    ) public {
        MarketState storage borrowState = ibBorrowState[market];
        Double memory borrowIndex = Double({mantissa: borrowState.index});
        Double memory borrowerIndex = Double({
            mantissa: ibBorrowerIndex[market][borrower]
        });
        ibBorrowerIndex[market][borrower] = borrowIndex.mantissa;

        if(borrowerIndex.mantissa > 0) {
            Double memory deltaIndex = sub_(borrowIndex, borrowerIndex);
            uint256 borrowerBalance = getBorrowBalanceWithInterest(
                market,
                borrower
            );
            uint256 borrowerDelta = mul_(borrowerBalance, deltaIndex);
            tauAccrued[borrower] = add_(tauAccrued[borrower], borrowerDelta);
            emit DistributedBorrower(
                market,
                borrower,
                borrowerDelta,
                tauAccrued[borrower],
                borrowIndex.mantissa
            );
        }
    }


    /**
     * @notice Claim all the ibToken accrued by holder in the specified markets
     * @param holder The address to claim ibToken for
     * @param markets The list of markets to claim ibToken in
     */
    function claim(
        address holder,
        address[] memory markets,
        address[] memory ibTokens
    ) internal {
        require(markets.length == ibTokens.length, "Must be the same length");

        for(uint256 i = 0; i < markets.length; i++) {
            address market = markets[i];
            address ibToken = ibTokens[i];

            updateSupplyIndex(market);
            distributeSupplier(market, holder);

            updateBorrowIndex(market);
            distributeBorrower(market, holder);

            tauAccrued[holder] = transferIbToken(
                holder,
                tauAccrued[holder],
                market,
                ibToken
            );
        }
    }


    /**
     * @notice Transfer ibToken to the participant
     * @dev Note: If there is not enough ibToken, we do not perform the transfer all.
     * @param participant The address of the participant to transfer ibToken to
     * @param participantAccrued The amount of ibToken to (possibly) transfer
     * @param market Market for which ibToken is transferred
     * @return The amount of ibToken which was NOT transferred to the participant
     */
    function transferIbToken(
        address participant,
        uint256 participantAccrued,
        address market,
        address asset_
    ) internal returns(uint256) {
        if(participantAccrued > 0) {
            IEIP20 asset = IEIP20(asset_);
            uint256 balance = asset.balanceOf(address(this));

            if(participantAccrued <= balance) {
                asset.transfer(participant, participantAccrued);

                emit Transferred(
                    participant,
                    participantAccrued,
                    market
                );

                return 0;
            }
        }

        return participantAccrued;
    }


    /**
     * @notice Get the current accrued ibToken for a participant
     * @param participant The address of the participant
     * @return The amount of accrued ibToken for the participant
     */
    function getIbAccrued(address participant) public view returns(uint256) {
        return tauAccrued[participant];
    }


    /**
     * @notice Get market statistics from the Vault contract
     * @param market The address of the market
     */
    function getMarketStats(address market) public view returns(
        bool isSupported,
        uint256 blockNumber,
        address interestRateModel,
        uint256 totalSupply,
        uint256 supplyRateMantissa,
        uint256 supplyIndex,
        uint256 totalBorrows,
        uint256 borrowRateMantissa,
        uint256 borrowIndex,
        address ibToken
    ) {
        return deltaOpen.markets(market);
    }

    /**
     * @notice Get market total supply from the Vault contract
     * @param market The address of the market
     * @return Market total supply for the given market
     */
    function getMarketTotalSupply(address market) public view returns(uint256) {
        uint256 totalSupply;
        (, , , totalSupply, , , , , ,) = getMarketStats(market);
        return totalSupply;
    }


    /**
     * @notice Get market total borrows from the Vault contract
     * @param market The address of the market
     * @return Market total borrows for the given market
     */
    function getMarketTotalBorrows(address market) public view returns(uint256) {
        uint256 totalBorrows;
        (, , , , , , totalBorrows, , ,) = getMarketStats(market);
        return totalBorrows;
    }


    /**
     * @notice Get supply balance of the specified market and supplier
     * @param market The address of the market
     * @param supplier The address of the supplier
     * @return Supply balance of the specified market and supplier
     */
    function getSupplyBalanceWithInterest(
        address market,
        address supplier
    ) public view returns(uint256) {
        return deltaOpen.getSupplyBalanceWithInterest(supplier, market);
    }


    /**
     * @notice Get borrow balance of the specified market and borrower
     * @param market The address of the market
     * @param borrower The address of the borrower
     * @return Borrow balance of the specified market and borrower
     */
    function getBorrowBalanceWithInterest(
        address market,
        address borrower
    ) public view returns(uint256) {
        return deltaOpen.getBorrowBalanceWithInterest(borrower, market);
    }


    /**
     * Admin functions
     */

    /**
     * @notice Transfer the ownership of this contract to the new owner. The ownership will not be transferred until the new owner accept it.
     * @param newOwner_ The address of the new owner
     */
    function transferOwnership(address newOwner_) external onlyOwner {
        require(newOwner_ != owner, "TransferOwnership: the same owner.");
        owner = newOwner_;
    }


    /**
     * @notice Add new market to the reward program
     * @param market The address of the new market to be added to the reward program
     */
    function addMarket(
        address market, 
        address ibToken
    ) external {
        require(!allMarketsIndex[market], "Market already exists");
        require(
            allMarkets.length < uint256(MAXIMUM_NUMBER_OF_MARKETS),
            "Exceeding the max number of markets allowed"
        );

        allMarketsIndex[market] = true;
        allMarkets.push(market);
        allIbTokens.push(ibToken);

        emit MarketAdded(
            market,
            allMarkets.length
        );
    }


    /**
     * @notice Remove a market from the reward program based on array index
     * @param id The index of the `allMarkets` array to be removed
     */
    function removeMarket(uint256 id) external onlyOwner {
        if(id >= allMarkets.length) {
            return;
        }
        allMarketsIndex[allMarkets[id]] = false;
        address removedMarket = allMarkets[id];

        for(uint256 i = id; i < allMarkets.length - 1; i++) {
            allMarkets[i] = allMarkets[i + 1];
            allIbTokens[i] = allIbTokens[i + 1];
        }
        allMarkets.pop();
        allIbTokens.pop();
        
        // reset the ibToken speeds for the removed market and refresh ibToken speeds
        speeds[removedMarket] = 0;
        refreshSpeeds();

        emit MarketRemoved(
            removedMarket,
            allMarkets.length
        );
    }


    /**
     * @notice Get latest ibToken rewards
     * @param user the supplier/borrower
     */
    function getIbRewards(address user) external view returns(uint256) {
        // Refresh ibToken speeds
        uint256 rewards = tauAccrued[user];
        (
            Exp[] memory marketTotalLiquidity,
            Exp memory totalLiquidity
        ) = refreshMarketLiquidity();

        for(uint256 i = 0; i < allMarkets.length; i++) {
            rewards = add_(
                rewards,
                add_(
                    getSupplyRewards(
                        totalLiquidity,
                        marketTotalLiquidity,
                        user,
                        i,
                        i
                    ),
                    getBorrowRewards(
                        totalLiquidity,
                        marketTotalLiquidity,
                        user,
                        i,
                        i
                    )
                )
            );
        }

        return rewards;
    }


    /**
     * @notice Get latest Supply ibToken rewards
     * @param totalLiquidity Total Liquidity of all markets
     * @param marketTotalLiquidity Array of individual market liquidity
     * @param user the supplier
     * @param i index of the market in marketTotalLiquidity array
     * @param j index of the market in the verified/public allMarkets array
     */
    function getSupplyRewards(
        Exp memory totalLiquidity,
        Exp[] memory marketTotalLiquidity,
        address user,
        uint256 i,
        uint256 j
    ) internal view returns(uint256) {
        uint256 newSpeed = totalLiquidity.mantissa > 0
            ? mul_(ibRate, div_(marketTotalLiquidity[i], totalLiquidity))
            : 0;
        MarketState memory supplyState = ibSupplyState[allMarkets[j]];

        if(
            sub_(block.number, uint256(supplyState.block)) > 0 &&
            newSpeed > 0
        ) {
            Double memory index = add_(
                Double({mantissa: supplyState.index}),
                (
                    getMarketTotalSupply(allMarkets[j]) > 0
                        ? fraction(
                            mul_(
                                sub_(
                                    block.number,
                                    uint256(supplyState.block)
                                ),
                                newSpeed
                            ),
                            getMarketTotalSupply(allMarkets[j])
                        )
                        : Double({ mantissa: 0 })
                )
            );
            supplyState = MarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(block.number, "block number exceeds 32 bits")
            });
        } else if(sub_(block.number, uint256(supplyState.block)) > 0) {
            supplyState.block = safe32(
                block.number,
                "block number exceeds 32 bits"
            );
        }


        if(Double({ mantissa: ibSupplierIndex[allMarkets[j]][user] }).mantissa > 0) {
            uint256 bal = deltaOpen.getSupplyBalanceWithInterest(
                user,
                allMarkets[j]
            );

            return
                mul_(
                    bal,
                    sub_(
                        Double({mantissa: supplyState.index}),
                        Double({
                            mantissa: ibSupplierIndex[allMarkets[j]][user]
                        })
                    )
                );
        } else {
            return 0;
        }
    }


    /**
     * @notice Get latest Borrow ibToken rewards
     * @param totalLiquidity Total Liquidity of all markets
     * @param marketTotalLiquidity Array of individual market liquidity
     * @param user the borrower
     * @param i index of the market in marketTotalLiquidity array
     * @param j index of the market in the verified/public allMarkets array
     */
    function getBorrowRewards(
        Exp memory totalLiquidity,
        Exp[] memory marketTotalLiquidity,
        address user,
        uint256 i,
        uint256 j
    ) internal view returns(uint256) {
        uint256 newSpeed = totalLiquidity.mantissa > 0
            ? mul_(ibRate, div_(marketTotalLiquidity[i], totalLiquidity))
            : 0;

        MarketState memory borrowState = ibBorrowState[allMarkets[j]];

        if(
            sub_(block.number, uint256(borrowState.block)) > 0 &&
            newSpeed > 0
        ) {
            Double memory index = add_(
                Double({mantissa: borrowState.index}),
                (
                    getMarketTotalBorrows(allMarkets[j]) > 0
                        ? fraction(
                            mul_(
                                sub_(
                                    block.number,
                                    uint256(borrowState.block)
                                ),
                                newSpeed
                            ),
                            getMarketTotalBorrows(allMarkets[j])
                        )
                        : Double({ mantissa: 0 })
                )
            );
            borrowState = MarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(block.number, "block number exceeds 32 bits")
            });
        } else if(sub_(block.number, uint256(borrowState.block)) > 0) {
            borrowState.block = safe32(
                block.number,
                "block number exceeds 32 bits"
            );
        }

        if(Double({ mantissa: ibBorrowerIndex[allMarkets[j]][user] }).mantissa > 0) {
            uint256 bal = deltaOpen.getBorrowBalanceWithInterest(
                user,
                allMarkets[j]
            );

            return
                mul_(
                    bal,
                    sub_(
                        Double({ mantissa: borrowState.index }),
                        Double({
                            mantissa: ibBorrowerIndex[allMarkets[j]][user]
                        })
                    )
                );
        } else {
            return 0;
        }
    }
}
