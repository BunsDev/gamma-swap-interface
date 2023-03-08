import fs from "fs"
import hre, { ethers, upgrades } from "hardhat"
import { bn, getDeployments, saveDeployments } from "../utils"
import { BigNumber, BigNumberish } from "ethers"
import { formatBytes32String } from "ethers/lib/utils"

async function main() {
    // ==== Read Configuration ====
    const [deployer] = await hre.ethers.getSigners()

    let deployments = getDeployments()

    // const Faucet = await ethers.getContractFactory("Faucet")
    // const faucet = await Faucet.deploy()
    // deployments.bridge["Faucet"] = faucet.address
    // saveDeployments(deployments)

    // await wait()

    // const Bridge = await ethers.getContractFactory("Bridge")
    // const bridge = await Bridge.deploy()
    // deployments.bridge["Bridge_Fantom"] = bridge.address
    // saveDeployments(deployments)

    let res
    // res = await ethers.getContractAt("MockERC20", deployments.tokens.mumbai.DCT)
    // await res.mint(deployments.bridge.Bridge_Mumbai, format(100000))
    // await wait()

    // res = await ethers.getContractAt("MockERC20", deployments.tokens.mumbai.MAV)
    // await res.mint(deployments.bridge.Bridge_Mumbai, format(100000))
    // await wait()

    // res = await ethers.getContractAt("MockERC20", deployments.tokens.mumbai.WLR)
    // await res.mint(deployments.bridge.Bridge_Mumbai, format(100000))
    // await wait()

    // res = await ethers.getContractAt("MockERC20", deployments.tokens.mumbai.DIB)
    // await res.mint(deployments.bridge.Bridge_Mumbai, format(100000))
    // await wait()
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
