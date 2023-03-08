import { setup, fromDecimals, toDecimals } from "./contracts"

import GammaFactory from "../../constants/artifacts/contracts/swap/GammaFactory.sol/GammaFactory.json"
import GammaPair from "../../constants/artifacts/contracts/swap/GammaPair.sol/GammaPair.json"
import GammaRouter02 from "../../constants/artifacts/contracts/swap/GammaRouter02.sol/GammaRouter02.json"
import { getDeployedAddresses } from "../../constants"

// Tau Factory
export async function getPair(account: string | undefined, tokenA: string, tokenB: string) {
    if (!account || !tokenA || !tokenB) return undefined

    const web3 = setup()

    const contract = new web3.eth.Contract(GammaFactory.abi as any, getDeployedAddresses().swap.GammaFactory)
    const pairAddress = await contract.methods.getPair(tokenA, tokenB).call()
    return pairAddress
}

export async function getReserves(account: string | undefined, pairAddress: string) {
    if (!account || !pairAddress) return undefined

    if (pairAddress === "0x0000000000000000000000000000000000000000") return [0, 0]

    const web3 = setup()

    const contract = new web3.eth.Contract(GammaPair.abi as any, pairAddress)
    const call = await contract.methods.getReserves().call()
    return [
        call[0],
        call[1],
        // +fromDecimals(call[0]),
        // +fromDecimals(call[1])
    ]
}
