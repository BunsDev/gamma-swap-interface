import fs from "fs"
import hre, { ethers } from "hardhat"
import { bn, getDeployments, saveDeployments } from "../utils"
import { BigNumber, BigNumberish } from "ethers"

async function main() {
    // ==== Read Configuration ====
    const [deployer] = await hre.ethers.getSigners()

    let deployments = getDeployments()
    let gammaFactory
    let gammaRouter02

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

    console.debug("Formatted:", format(1000))

    const GammaFactory = await ethers.getContractFactory("GammaFactory")
    gammaFactory = await GammaFactory.deploy(deployer.address)
    deployments.swap["GammaFactory"] = gammaFactory.address
    saveDeployments(deployments)

    const GammaRouter02 = await ethers.getContractFactory("GammaRouter02")
    gammaRouter02 = await GammaRouter02.deploy(
        deployments.swap.GammaFactory,
        deployments.tokens.wFTM
    )
    deployments.swap["GammaRouter02"] = gammaRouter02.address
    saveDeployments(deployments)

    gammaFactory = await ethers.getContractAt("GammaFactory", deployments.swap.GammaFactory)

    await gammaFactory.createPair(
        deployments.tokens.wFTM,
        deployments.tokens.DCT
    )
    await wait()

    await gammaFactory.createPair(
        deployments.tokens.wFTM,
        deployments.tokens.MAV
    )
    await wait()

    await gammaFactory.createPair(
        deployments.tokens.wFTM,
        deployments.tokens.WLR
    )
    await wait()

    await gammaFactory.createPair(
        deployments.tokens.DCT,
        deployments.tokens.MAV
    )
    await wait()

    await gammaFactory.createPair(
        deployments.tokens.DCT,
        deployments.tokens.DIB
    )

    await wait()

    await gammaFactory.createPair(
        deployments.tokens.DCT,
        deployments.tokens.WLR
    )
    await wait()

    await gammaFactory.createPair(
        deployments.tokens.MAV,
        deployments.tokens.DIB
    )
    await wait()

    await gammaFactory.createPair(
        deployments.tokens.MAV,
        deployments.tokens.WLR
    )
    await wait()

    const allPairsLength = await gammaFactory.allPairsLength()
    console.debug("allPairsLength:", allPairsLength.toString())
    let _res: any = {}
    let count = 0
    const tokens = deployments.tokens
    for(const i in tokens) {
        for(const j in tokens) {
            if(i === j || i === "mumbai" || j === "mumbai")
                continue

            let mixed = ""
            const tokenA = tokens[i]
            const tokenB = tokens[j]
            console.debug(count, ": ", { tokenA, tokenB })
            const pairAddress = await gammaFactory.getPair(tokenA, tokenB)
            if(pairAddress === ZERO_ADDRESS)
                continue

            mixed = `${tokenA}-${tokenB}`
            _res[mixed] = {
                id: count,
                tokenA: i,
                tokenB: j,
                pairAddress
            }

            mixed = `${tokenB}-${tokenA}`
            _res[mixed] = {
                id: count,
                tokenA: j,
                tokenB: i,
                pairAddress
            }

            count += 1
        }
    }

    console.debug("All pairs:", Object.keys(_res).length)
    deployments.pairs = _res
    saveDeployments(deployments)

    // =============
    // Add Liquidity
    // =============
    gammaRouter02 = await ethers.getContractAt("GammaRouter02", deployments.swap.GammaRouter02)

    const wFTM = await ethers.getContractAt("WETH9", deployments.tokens.wFTM)
    const DCT = await ethers.getContractAt("MockERC20", deployments.tokens.DCT)
    const DIB = await ethers.getContractAt("MockERC20", deployments.tokens.DIB)
    const MAV = await ethers.getContractAt("MockERC20", deployments.tokens.MAV)
    const WLR = await ethers.getContractAt("MockERC20", deployments.tokens.WLR)

    console.debug("Approving...");
    await DCT.approve(gammaRouter02.address, format(400000)); await wait()
    await DIB.approve(gammaRouter02.address, format(400000)); await wait()
    await MAV.approve(gammaRouter02.address, format(400000)); await wait()
    await WLR.approve(gammaRouter02.address, format(400000)); await wait()
    console.debug("Done...")

    const pairs: any = deployments.pairs
    for(const pair in pairs) {
        const tokenA = pair.split("-")[0]
        const tokenB = pair.split("-")[1]

        const val1 = pairs[pair].tokenA !== "wFTM" ? format(40000) : format(1500)
        const val2 = pairs[pair].tokenB !== "wFTM" ? format(80000) : format(1500)
        const value = [pairs[pair].tokenA, pairs[pair].tokenB].includes("wFTM") ? format(1500) : "0"

        console.debug("Deets:", {
            tokenA, tokenB, val1, val2, value
        })

        console.debug("Doing:", pair)

        if(value === "0") {
            await gammaRouter02.addLiquidity(
                tokenA,
                tokenB,
                val1,
                val2,
                val1,
                val2,
                deployer.address,
                (new Date()).setMinutes((new Date()).getMinutes() + 10)
            )
        } else {
            await gammaRouter02.addLiquidityETH(
                tokenA !== "wFTM" ? tokenA : tokenB,
                val1,
                val1,
                val2,
                deployer.address,
                (new Date()).setMinutes((new Date()).getMinutes() + 10),
                {
                    value: value
                }
            )
        }

        await wait();
    }

    await gammaRouter02.addLiquidity(
        deployments.tokens.DCT,
        deployments.tokens.MAV,
        format(40000),
        format(80000),
        format(40000),
        format(80000),
        deployer.address,
        (new Date()).setMinutes((new Date()).getMinutes() + 10)
    )
    await wait()

    await gammaRouter02.addLiquidity(
        deployments.tokens.DCT,
        deployments.tokens.DIB,
        format(40000),
        format(80000),
        format(40000),
        format(80000),
        deployer.address,
        (new Date()).setMinutes((new Date()).getMinutes() + 10)
    )
    await wait()

    await gammaRouter02.addLiquidityETH(
        deployments.tokens.DCT,
        format(40),
        format(40),
        format(10),
        deployer.address,
        (new Date()).setMinutes((new Date()).getMinutes() + 10),
        {
            value: format(10)
        }
    )
    await wait()

    await gammaRouter02.addLiquidityETH(
        deployments.tokens.MAV,
        format(30),
        format(30),
        format(10),
        deployer.address,
        (new Date()).setMinutes((new Date()).getMinutes() + 10),
        {
            value: format(10)
        }
    )
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
