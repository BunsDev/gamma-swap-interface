// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IRewardControl {
    function addMarket(
        address market, 
        address ibToken
    ) external;

    /**
     * @notice Refresh ibToken supply index for the specified market and supplier
     * @param market The market whose supply index to update
     * @param supplier The address of the supplier to distribute ibToken to
     */
    function refreshSupplyIndex(
        address market,
        address supplier
    ) external;

    /**
     * @notice Refresh ibToken borrow index for the specified market and borrower
     * @param market The market whose borrow index to update
     * @param borrower The address of the borrower to distribute ibToken to
     */
    function refreshBorrowIndex(
        address market,
        address borrower
    ) external;

    /**
     * @notice Claim all the ibToken accrued by holder in all markets
     * @param holder The address to claim ibToken for
     */
    function claim(address holder) external;

    /**
     * @notice Claim all the ibToken accrued by holder by refreshing the indexes on the specified market only
     * @param holder The address to claim ibToken for
     * @param market The address of the market to refresh the indexes for
     */
    function claim(
        address holder,
        address market,
        address ibToken
    ) external;
}
