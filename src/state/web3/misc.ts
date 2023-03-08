import { setup, fromDecimals, toDecimals } from "./contracts"

import MockERC20 from "../../constants/artifacts/contracts/mock/MockERC20.sol/MockERC20.json"
import { DEPLOYMENTS } from "../../constants"

export async function getTokenBalance(account: string, tokenAddress: string) {
    if (!account) return 0

    const web3 = setup()

    const contract = new web3.eth.Contract(MockERC20.abi as any, tokenAddress)
    const balance = await contract.methods.balanceOf(account).call()
    return balance
}
