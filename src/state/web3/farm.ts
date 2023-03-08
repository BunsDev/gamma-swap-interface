import { setup, fromDecimals, toDecimals } from "./contracts"

import GammaDistributor from "../../constants/artifacts/contracts/farm/GammaDistributor.sol/GammaDistributor.json"
import { DEPLOYMENTS } from "../../constants"
import { POOLS } from "../../constants/farms"
import { ChainId } from "../../sdk"

export async function getPoolLength() {
    const web3 = setup()

    const contract = new web3.eth.Contract(GammaDistributor.abi as any, DEPLOYMENTS.farms.GammaDistributor)
    const poolLength = await contract.methods.poolLength().call()
    return poolLength
}

export async function getTauPerBlock() {
    const web3 = setup()

    const contract = new web3.eth.Contract(GammaDistributor.abi as any, DEPLOYMENTS.farms.GammaDistributor)
    const tauPerBlock = await contract.methods.tauPerBlock().call()
    return tauPerBlock
}

export async function getPoolInfos() {
    const web3 = setup()

    const contract = new web3.eth.Contract(GammaDistributor.abi as any, DEPLOYMENTS.farms.GammaDistributor)

    const poolLength = await getPoolLength()

    let res = []
    for (let i = 0; i < poolLength; i++) {
        res.push(await contract.methods.poolInfo(i).call())
    }

    let _temp = []
    for (const pool of res) {
        const r = POOLS[ChainId.FANTOM_TESTNET][pool.lpToken]
        if (
            (r.token0.symbol === "MAV" && r.token1.symbol === "DCT") ||
            (r.token0.symbol === "DIB" && r.token1.symbol === "DCT")
        ) {
            _temp.push(pool)
        }
    }

    // return res.slice(0, 5)
    return _temp
}

export async function getDistributorInfo() {
    const web3 = setup()

    const contract = new web3.eth.Contract(GammaDistributor.abi as any, DEPLOYMENTS.farms.GammaDistributor)
    const tauPerBlock = await contract.methods.tauPerBlock().call()
    const totalAllocPoint = await contract.methods.totalAllocPoint().call()

    const data = {
        tauPerBlock: +tauPerBlock,
        totalAllocPoint: +totalAllocPoint,
    }

    return data
}
