import { BigNumber, BigNumberish } from "ethers"

import GammaVault from "../../constants/artifacts/contracts/vaults/GammaVault.sol/GammaVault.json"
import TauStablecoin from "../../constants/artifacts/contracts/stablecoin/MockStablecoin.sol/MockStablecoin.json"
import { DEPLOYMENTS, tokenAddressToIbToken } from "../../constants"
import { setup, fromDecimals, toDecimals } from "./contracts"
import { getTokenBalance } from "./misc"

const stablecoinAPYs = ["2.1", "1.3", "0.8", "0.1"]

export async function getStablecoinMarkets(account: string): Promise<any[]> {
    if (!account) return []

    const web3 = setup()

    const vaultContract = new web3.eth.Contract(GammaVault.abi as any, DEPLOYMENTS.vault.GammaVault)
    const stablecoinContract = new web3.eth.Contract(TauStablecoin.abi as any, DEPLOYMENTS.stablecoin.gamUSD)

    const marketsLength = await vaultContract.methods.marketsLength().call()

    let markets = []
    for (let i = 0; i < +marketsLength.toString(); i++) {
        const asset = await vaultContract.methods.collateralMarkets(i).call()
        const market = await vaultContract.methods.markets(asset).call()

        const ibToken = tokenAddressToIbToken(asset)
        const available = await getTokenBalance(account, ibToken)
        const totalBorrowed = await stablecoinContract.methods.getCollateralTotalSupply(ibToken).call()
        const collateralBalance = await stablecoinContract.methods.getCollateralBalance(account, ibToken).call()

        markets.push({
            id: i.toString(),
            asset: asset,
            ibToken: ibToken,
            stablecoinAPY: stablecoinAPYs[i],

            available: fromDecimals(available),
            totalBorrowed: fromDecimals(totalBorrowed),
            collateralBalance: fromDecimals(collateralBalance),
            ...market,
        })
    }

    return markets
}

export async function mint(account: string, collateral: string, amount: BigNumber) {
    if (!account) return undefined

    const web3 = setup()

    const contract = new web3.eth.Contract(TauStablecoin.abi as any, DEPLOYMENTS.stablecoin.gamUSD)
    const result = await contract.methods.mint(collateral, amount).send({ from: account })

    console.debug("Receipt:", result)

    return result
}
