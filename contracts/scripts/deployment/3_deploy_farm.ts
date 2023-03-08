import fs from "fs"
import hre, { ethers } from "hardhat"
import { bn, getDeployments, saveDeployments } from "../utils"
import { BigNumber, BigNumberish } from "ethers"

async function main() {
    // ==== Read Configuration ====
    const [deployer] = await hre.ethers.getSigners()

    let deployments = getDeployments()
    let gammaDistributor
    let gammaDistributorv2
    let gammaVault

    const GammaDistributor = await ethers.getContractFactory("GammaDistributor")
    gammaDistributor = await GammaDistributor.deploy(deployments.tokens.GAMMA, "150")
    deployments.farms["GammaDistributor"] = gammaDistributor.address
    saveDeployments(deployments)

    await wait()

    // const GammaDistributorV2 = await ethers.getContractFactory("GammaDistributorV2")
    // let gammaDistributorv2 = await GammaDistributorV2.deploy(
    //     deployments.tokens.GAMMA,
    //     "100",
    //     deployer.address,
    //     deployer.address,
    //     deployer.address,
    //     "200",
    //     "100",
    //     "100",
    // )
    // deployments.farms["GammaDistributorV2"] = gammaDistributorv2.address
    // saveDeployments(deployments)

    // await wait()

    // const GammaVault = await ethers.getContractFactory("GammaVault")
    // let gammaVault = await GammaVault.deploy(
    //     deployments.tokens.GAMMA,
    //     "150"
    // )
    // deployments.farms["GammaVault"] = gammaVault.address
    // saveDeployments(deployments)

    //
    // Add Pairs
    //
    const allocPoints = [20, 10, 5, 1]
    // gammaDistributor = await ethers.getContractAt("GammaDistributor", deployments.farms.GammaDistributor)

    const pairs = deployments.pairs
    let pairAddresses: string[] = []
    for (const pair in pairs) {
        pairAddresses.push(pairs[pair].pairAddress)
    }

    pairAddresses = pairAddresses.filter((item, idx) => pairAddresses.indexOf(item) === idx)

    console.debug("Pair addresses:", pairAddresses, pairAddresses.length)

    for (const pairAddress of pairAddresses) {
        await gammaDistributor.add(
            allocPoints[Math.floor(Math.random() * allocPoints.length)].toString(),
            pairAddress,
            "10",
            "7",
            false
        )
        await wait()
    }

    const poolLength = await gammaDistributor.poolLength()
    console.debug("Pool length:", poolLength)
}

let count = 1
async function wait() {
    console.debug(`>>> [${count}] Waiting...`)
    count += 1
    return new Promise((resolve) => setTimeout(resolve, 4500))
}

function format(x: number, decimals: number = 18) {
    return bn(`${x}e${decimals}`).toString()
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
