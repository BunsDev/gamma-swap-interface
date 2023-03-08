import { BigNumber, BigNumberish } from "ethers"

import GammaVault from "../../constants/artifacts/contracts/vaults/GammaVault.sol/GammaVault.json"
import { DEPLOYMENTS } from "../../constants"
import { setup, fromDecimals, toDecimals } from "./contracts"
import { getTokenBalance } from "./misc"

const lendAPYs = ["25.43", "13.87", "9.333", "6.768"]
const borrowAPYs = ["34.135", "20.69", "14.49", "10.13"]

export async function getLendMarkets(account: string): Promise<any[]> {
    if (!account) return []

    const web3 = setup()

    const contract = new web3.eth.Contract(GammaVault.abi as any, DEPLOYMENTS.vault.GammaVault)

    const marketsLength = await contract.methods.marketsLength().call()

    let _markets = []
    for (let i = 0; i < +marketsLength.toString(); i++) {
        const asset = await contract.methods.collateralMarkets(i).call()
        const market = await contract.methods.markets(asset).call()

        const balance = await getTokenBalance(account, asset)
        const liquidity = await getTokenBalance(DEPLOYMENTS.vault.GammaVault, asset)
        const lendBalance = await contract.methods.getSupplyBalance(account, asset).call()
        const lendBalanceWithInterest = await contract.methods.getSupplyBalanceWithInterest(account, asset).call()

        _markets.push({
            id: i.toString(),
            asset: asset,
            lendAPY: lendAPYs[i],
            liquidity: fromDecimals(liquidity),
            available: fromDecimals(balance),

            // Lend
            lendBalance: fromDecimals(lendBalance),
            lendBalanceWithInterest: fromDecimals(lendBalanceWithInterest),
            lendBalanceInterest: fromDecimals(
                (BigInt(lendBalanceWithInterest.toString()) - BigInt(lendBalance.toString())).toString()
            ),
            ...market,
        })
    }

    return _markets
}

export async function getBorrowMarkets(account: string): Promise<any[]> {
    if (!account) return []

    const web3 = setup()

    const contract = new web3.eth.Contract(GammaVault.abi as any, DEPLOYMENTS.vault.GammaVault)

    const marketsLength = await contract.methods.marketsLength().call()

    let temp = []
    let totalLendBalance = BigNumber.from("0")
    for (let i = 0; i < +marketsLength.toString(); i++) {
        const asset = await contract.methods.collateralMarkets(i).call()
        const market = await contract.methods.markets(asset).call()
        const collateralRatio = await contract.methods.collateralRatio().call()

        const balance = await getTokenBalance(account, asset)
        const liquidity = await getTokenBalance(DEPLOYMENTS.vault.GammaVault, asset)
        const borrowBalance = await contract.methods.getBorrowBalance(account, asset).call()
        const borrowBalanceWithInterest = await contract.methods.getBorrowBalanceWithInterest(account, asset).call()
        const lendBalanceWithInterest = await contract.methods.getSupplyBalanceWithInterest(account, asset).call()
        totalLendBalance = totalLendBalance.add(lendBalanceWithInterest)
        // const maxBorrow = lendBalanceWithInterest / collateralRatio
        // console.debug("Max borrow:", maxBorrow)

        temp.push({
            id: i.toString(),
            asset: asset,
            borrowAPY: borrowAPYs[i],
            liquidity: fromDecimals(liquidity),
            available: fromDecimals(balance),

            // Borrow
            borrowBalance: fromDecimals(borrowBalance),
            borrowBalanceWithInterest: fromDecimals(borrowBalanceWithInterest),
            borrowBalanceInterest: fromDecimals(
                (BigInt(borrowBalanceWithInterest.toString()) - BigInt(borrowBalance.toString())).toString()
            ),
            collateralRatio: collateralRatio,
            ...market,
        })
    }

    console.debug("Total lend balance:", totalLendBalance.toString())
    let markets = []
    for (const market of temp) {
        console.error("Market deets:", market.liquidity)
        let maxBorrow = totalLendBalance.div(market.collateralRatio)
        console.debug("Before max borrow:", maxBorrow.toString())

        if (market.liquidity < maxBorrow) {
            maxBorrow = BigNumber.from(market.liquidity)
        }

        markets.push({
            maxBorrow: maxBorrow.toString(),
            ...market,
        })
    }

    return markets
}

export async function lend(account: string, asset: string, amount: BigNumber) {
    if (!account) return undefined

    const web3 = setup()

    const contract = new web3.eth.Contract(GammaVault.abi as any, DEPLOYMENTS.vault.GammaVault)
    const result = await contract.methods.supply(asset, amount).send({ from: account })

    console.debug("Receipt:", result)

    return result
}

export async function withdraw(account: string, asset: string, amount: BigNumber) {
    if (!account) return undefined

    const web3 = setup()

    const contract = new web3.eth.Contract(GammaVault.abi as any, DEPLOYMENTS.vault.GammaVault)
    const result = await contract.methods.withdraw(asset, amount).send({ from: account })

    console.debug("Receipt:", result)

    return result
}

export async function borrow(account: string, asset: string, amount: BigNumber) {
    if (!account) return undefined

    const web3 = setup()

    const contract = new web3.eth.Contract(GammaVault.abi as any, DEPLOYMENTS.vault.GammaVault)
    const result = await contract.methods.borrow(asset, amount).send({ from: account })

    console.debug("Receipt:", result)

    return result
}

export async function repay(account: string, asset: string, amount: BigNumber) {
    if (!account) return undefined

    const web3 = setup()

    const contract = new web3.eth.Contract(GammaVault.abi as any, DEPLOYMENTS.vault.GammaVault)
    const result = await contract.methods.repayBorrow(asset, amount).send({ from: account })

    console.debug("Receipt:", result)

    return result
}
