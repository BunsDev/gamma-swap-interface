// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./Exponential.sol";
import "./interfaces/IRateModel.sol";

// import "hardhat/console.sol";

/**
 * @title  Earn Interest Rate Model
 * @author ShiftForex
 * @notice See Model here
 */

contract RateModel is Exponential, IRateModel {
    // Assuming avg. block time of 13.3 seconds; can be updated using changeBlocksPerYear() by the admin
    uint256 public blocksPerYear = 2616320;

    address public owner;
    address public newOwner;

    uint8 private hundred = 100;


    Exp internal spreadLow;
    Exp internal breakpointLow;
    Exp internal reserveLow;
    Exp internal reserveMid;
    Exp internal spreadMid;
    Exp internal breakpointHigh;
    Exp internal reserveHigh;
    Exp internal spreadHigh;

    Exp internal actualMinRate;
    Exp internal actualHealthyMinUR;
    Exp internal actualHealthyMinRate;
    Exp internal actualMaxRate;
    Exp internal actualHealthyMaxUR;
    Exp internal actualHealthyMaxRate;


    modifier onlyOwner() {
        require(msg.sender == owner, "non-owner");
        _;
    }

    event OwnerUpdate(
        address indexed owner, 
        address indexed newOwner
    );

    event BlocksPerYearUpdated(
        uint256 oldBlocksPerYear,
        uint256 newBlocksPerYear
    );


    constructor(
        uint256 minRate_,
        uint256 healthyMinUR_,
        uint256 healthyMinRate_,
        uint256 maxRate_,
        uint256 healthyMaxUR_,
        uint256 healthyMaxRate_
    ) {
        // Remember to enter percentage times 100. ex., if it is 2.50%, enter 250
        // Checks for reasonable interest rate parameters
        require(minRate_ < maxRate_, "Min Rate should be lesser than Max Rate");
        require(
            healthyMinUR_ < healthyMaxUR_,
            "healthyMinUR_ should be lesser than healthyMaxUR_"
        );

        require(
            healthyMinRate_ < healthyMaxRate_,
            "healthyMinRate_ should be lesser than healthyMaxRate_"
        );

        owner = msg.sender;

        changeRates(
            minRate_,
            healthyMinUR_,
            healthyMinRate_,
            maxRate_,
            healthyMaxUR_,
            healthyMaxRate_
        );
    }


    function changeRates(
        uint256 minRate_,
        uint256 healthyMinUR_,
        uint256 healthyMinRate_,
        uint256 maxRate_,
        uint256 healthyMaxUR_,
        uint256 healthyMaxRate_
    ) public onlyOwner {
        // Remember to enter percentage times 100. ex., if it is 2.50%, enter 250 as solidity does not recognize floating point numbers
        // Checks for reasonable interest rate parameters
        require(minRate_ < maxRate_, "[changeRates] Min Rate should be lesser than Max Rate");
        require(
            healthyMinUR_ < healthyMaxUR_,
            "HealthyMinUR should be lesser than HealthyMaxUR"
        );
        require(
            healthyMinRate_ < healthyMaxRate_,
            "HealthyMinRate should be lesser than HealthyMaxRate"
        );
        Exp memory temp1;
        Exp memory temp2;
        Exp memory HundredMantissa;

        HundredMantissa = getExp(hundred, 1);

        // Rates are divided by 1e2 to scale down inputs to actual values
        // Inputs are expressed in percentage times 1e2, so we need to scale it down again by 1e2
        // Resulting values like actualMinRate etc., are represented in 1e20 scale
        // The return values for getSupplyRate() and getBorrowRate() functions are divided by 1e2 at the end to bring it down to 1e18 scale
        actualMinRate = getExp(minRate_, hundred);
        actualHealthyMinUR = getExp(healthyMinUR_, hundred);
        actualHealthyMinRate = getExp(healthyMinRate_, hundred);
        actualMaxRate = getExp(maxRate_, hundred);
        actualHealthyMaxUR = getExp(healthyMaxUR_, hundred);
        actualHealthyMaxRate = getExp(healthyMaxRate_, hundred);

        spreadLow = actualMinRate;
        breakpointLow = actualHealthyMinUR;
        breakpointHigh = actualHealthyMaxUR;

        // reserveLow = (HealthyMinRate-spreadLow)/breakpointLow;
        temp1 = subExp(actualHealthyMinRate, spreadLow);
        reserveLow = divExp(temp1, breakpointLow);

        // reserveMid = (HealthyMaxRate-HealthyMinRate)/(HealthyMaxUR-HealthyMinUR);
        temp1 = subExp(actualHealthyMaxRate, actualHealthyMinRate);
        temp2 = subExp(actualHealthyMaxUR, actualHealthyMinUR);
        reserveMid = divExp(temp1, temp2);

        // spreadMid = HealthyMinRate - (reserveMid * breakpointLow);
        temp1 = mulExp(reserveMid, breakpointLow);
        spreadMid = subExp(actualHealthyMinRate, temp1);
        require(
            spreadMid.mantissa >= 0,
            "Spread Mid cannot be a negative number"
        );

        // reserveHigh = (MaxRate - HealthyMaxRate) / (100 - HealthyMaxUR);
        temp1 = subExp(actualMaxRate, actualHealthyMaxRate);
        temp2 = subExp(HundredMantissa, actualHealthyMaxUR);
        reserveHigh = divExp(temp1, temp2);


        // spreadHigh = (reserveHigh * breakpointHigh) - HealthyMaxRate;
        temp2 = mulExp(reserveHigh, breakpointHigh);
        spreadHigh = subExp(temp2, actualHealthyMaxRate);
        require(
            spreadHigh.mantissa >= 0,
            "Spread High cannot be a negative number"
        );
    }


    function changeBlocksPerYear(uint256 _blocksPerYear) external onlyOwner {
        uint256 oldBlocksPerYear = blocksPerYear;
        blocksPerYear = _blocksPerYear;
        emit BlocksPerYearUpdated(oldBlocksPerYear, _blocksPerYear);
    }


    function transferOwnership(address newOwner_) external onlyOwner {
        require(newOwner_ != owner, "TransferOwnership: the same owner.");
        newOwner = newOwner_;
    }


    function acceptOwnership() external {
        require(
            msg.sender == newOwner,
            "AcceptOwnership: only new owner can do this."
        );
        emit OwnerUpdate(owner, newOwner);
        owner = newOwner;
        newOwner = address(0x0);
    }


    /*
     * @dev Calculates the utilization rate (borrows / (cash + borrows)) as an Exp in 1e18 scale
     */
    function getUtilizationRate(uint256 cash, uint256 borrows) internal view returns(Exp memory) {
        if(borrows == 0) {
            // Utilization rate is zero when there's no borrows
            return Exp({ mantissa: 0 });
        }

        uint256 cashPlusBorrows = cash + borrows;

        Exp memory utilizationRate = getExp(
            borrows,
            cashPlusBorrows
        );

        utilizationRate = mulScalar(utilizationRate, hundred);

        return utilizationRate;
    }


    /*
     * @dev Calculates the utilization and borrow rates for use by get{Supply,Borrow}Rate functions
     * Both Utilization Rate and Borrow Rate are returned in 1e18 scale
     */
    function getUtilizationAndAnnualBorrowRate(uint256 cash, uint256 borrows) internal view returns(
        Exp memory,
        Exp memory
    ) {
        Exp memory utilizationRate = getUtilizationRate(cash, borrows);

        /**
         *  Borrow Rate
         *  0 < UR < 20% :      spreadLow + UR * reserveLow
         *  20% <= UR <= 80% :  spreadMid + UR * reserveMid
         *  80% < UR :          UR * reserveHigh - spreadHigh
         */

        uint256 annualBorrowRateScaled;
        Exp memory tempScaled;
        Exp memory tempScaled2;

        if(utilizationRate.mantissa < breakpointLow.mantissa) {
            tempScaled = mulExp(utilizationRate, reserveLow);
            tempScaled2 = addExp(tempScaled, spreadLow);
            annualBorrowRateScaled = tempScaled2.mantissa;
        } else if(utilizationRate.mantissa > breakpointHigh.mantissa) {
            tempScaled = mulExp(utilizationRate, reserveHigh);
            tempScaled2 = subExp(tempScaled, spreadHigh);
            annualBorrowRateScaled = tempScaled2.mantissa;
        } else if(
            utilizationRate.mantissa >= breakpointLow.mantissa &&
            utilizationRate.mantissa <= breakpointHigh.mantissa
        ) {
            tempScaled = mulExp(utilizationRate, reserveMid);
            tempScaled2 = addExp(tempScaled, spreadMid);
            annualBorrowRateScaled = tempScaled2.mantissa;
        }
 
        return (
            utilizationRate,
            Exp({ mantissa: annualBorrowRateScaled })
        );
    }


    /**
     * @notice Gets the current supply interest rate based on the given asset, total cash and total borrows
     * @dev The return value should be scaled by 1e18, thus a return value of
     *      `(true, 1000000000000)` implies an interest rate of 0.000001 or 0.0001% *per block*.
     * @param _asset The asset to get the interest rate of
     * @param cash The total cash of the asset in the market
     * @param borrows The total borrows of the asset in the market
     * @return Success or failure and the supply interest rate per block scaled by 1e18
     */
    function getSupplyRate(
        address _asset,
        uint256 cash,
        uint256 borrows
    ) public view returns(uint256) {
        _asset; // pragma ignore unused argument
        (
            Exp memory utilizationRate0,
            Exp memory annualBorrowRate
        ) = getUtilizationAndAnnualBorrowRate(cash, borrows);


        /**
         *  Supply Rate
         *  = BorrowRate * utilizationRate * (1 - spreadLow)
         */
        Exp memory temp1 = getExp(hundred, 1);
        Exp memory oneMinusSpreadBasisPoints = subExp(temp1, spreadLow);

        // Next multiply this product times the borrow rate
        // Borrow rate should be divided by 1e2 to get product at 1e18 scale
        temp1 = mulExp(
            utilizationRate0,
            Exp({ mantissa: annualBorrowRate.mantissa / hundred })
        );

        // oneMinusSpreadBasisPoints i.e.,(1 - spreadLow) should be divided by 1e2 to get product at 1e18 scale
        temp1 = mulExp(
            temp1,
            Exp({ mantissa: oneMinusSpreadBasisPoints.mantissa / hundred })
        );

        // And then divide down by the spread's denominator (basis points divisor)
        // as well as by blocks per year.
        Exp memory supplyRate = Exp({ mantissa: temp1.mantissa / blocksPerYear }); // basis points * blocks per year

        // Note: supplyRate.mantissa is the rate scaled 1e20 ex., 23%
        // Note: we then divide by 1e2 to scale it down to the expected 1e18 scale, which matches the expected result ex., 0.2300
        // return (supplyRate.mantissa / hundred) + 1234533;
        return supplyRate.mantissa;
    }

    /**
     * @notice Gets the current borrow interest rate based on the given asset, total cash and total borrows
     * @dev The return value should be scaled by 1e18, thus a return value of
     *      `(true, 1000000000000)` implies an interest rate of 0.000001 or 0.0001% *per block*.
     * @param asset The asset to get the interest rate of
     * @param cash The total cash of the asset in the market
     * @param borrows The total borrows of the asset in the market
     * @return Success or failure and the borrow interest rate per block scaled by 1e18
     */ 
    function getBorrowRate(
        address asset,
        uint256 cash,
        uint256 borrows
    ) public view returns(uint256) {
        asset; // pragma ignore unused argument

        (, Exp memory annualBorrowRate) = getUtilizationAndAnnualBorrowRate(cash, borrows);

        // And then divide down by blocks per year.
        Exp memory borrowRate = Exp({ mantissa: annualBorrowRate.mantissa / blocksPerYear }); // basis points * blocks per year

        // Note: borrowRate.mantissa is the rate scaled 1e20 ex., 23%
        // Note: we then divide by 1e2 to scale it down to the expected 1e18 scale, which matches the expected result ex., 0.2300
        return borrowRate.mantissa / 5;
    }
}
