import fs from "fs"
import hre, { ethers, upgrades } from "hardhat"
import { bn, getDeployments, saveDeployments } from "../utils"
import { BigNumber, BigNumberish } from "ethers"
import { formatBytes32String } from "ethers/lib/utils"

async function main() {
    // ==== Read Configuration ====
    const [deployer] = await hre.ethers.getSigners()

    let deployments = getDeployments()

    let result = { address: "" }
    const COLLATERAL_POOL_ID = formatBytes32String("ibWBNB")
    const COLLATERAL_TOKEN_ADDR = "0xd7D069493685A581d27824Fc46EdA46B7EfC0063"
    const REWARD_TOKEN_ADDR = "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F"
    const LAUNCH_ADDR = "0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F"
    const PID = 1
    const SHIELD_ADDR = "0x1963f84395C8cf464E5483dE7f2f434c3F1b4656"
    const TIME_LOCK_ADDR = "0x2D5408f2287BF9F9B05404794459a846651D0a59"
    const TREASURY_FEE_BPS = BigNumber.from(900) // 9%
    const TREASURY_ACCOUNT = "0x7E2308437c2f4C8934214663dc8476037625a270"

    const ORACLE = "0x166f56F2EDa9817cAB77118AE4FCAA0002A17eC7" // LYF's SimplePriceOracle
    const TOKEN_0 = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f" // ibBUSD
    const TOKEN_1 = "0xe9e7cea3dedca5984780bafc599bd69add087d56" // BUSD

    const STD_REFERENCE_PROXY_ADDR = "0xDA7a001b254CD22e46d3eAB04d937489c93174C3" // Band Protocol mainnet and testnet use the same address

    const PRIMARY_ORACLE = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f"
    const PRIMARY_TOKEN_0 = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f"
    const PRIMARY_TOKEN_1 = "0xe9e7cea3dedca5984780bafc599bd69add087d56"
    const SECONDARY_ORACLE = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f"
    const SECONDARY_TOKEN_0 = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f"
    const SECONDARY_TOKEN_1 = "0xe9e7cea3dedca5984780bafc599bd69add087d56"

    const IB_IN_BASE_PRICE_FEED_ADDR = "0xF7E3B6C8AC5047c6aCf328C6c9c43EcDf15cD534"
    const BASE_IN_USD_PRICE_FEED_ADDR = "0xdE375D37Be6399022D6583c954a011a9244a0b61"
    const TIME_DELAY = 900

    // const AccessControlConfig = await ethers.getContractFactory("AccessControlConfig")
    // result = await upgrades.deployProxy(AccessControlConfig)
    // deployments.stablecoin["AccessControlConfig"] = result.address
    // saveDeployments(deployments)
    // await wait()

    const MockStablecoin = await ethers.getContractFactory("MockStablecoin")
    result = await MockStablecoin.deploy("Gamma USD Stablecoin", "gamUSD")
    deployments.stablecoin["gamUSD"] = result.address
    saveDeployments(deployments)
    // await wait()

    // const TauStablecoin = await ethers.getContractFactory("TauStablecoin")
    // result = await upgrades.deployProxy(TauStablecoin, ["Tau USD Stablecoin", "gamUSD"])
    // deployments.stablecoin["gamUSD"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const CollateralPoolConfig = await ethers.getContractFactory("CollateralPoolConfig")
    // result = await upgrades.deployProxy(CollateralPoolConfig, [deployments.stablecoin.AccessControlConfig])
    // deployments.stablecoin["CollateralPoolConfig"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const BookKeeper = await ethers.getContractFactory("BookKeeper")
    // result = await upgrades.deployProxy(BookKeeper, [
    //     deployments.stablecoin.CollateralPoolConfig,
    //     deployments.stablecoin.AccessControlConfig,
    // ])
    // deployments.stablecoin["BookKeeper"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const ShowStopper = await ethers.getContractFactory("ShowStopper")
    // result = await upgrades.deployProxy(ShowStopper, [ deployments.stablecoin.BookKeeper ])
    // deployments.stablecoin["ShowStopper"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const PositionManager = await ethers.getContractFactory("PositionManager")
    // result = await upgrades.deployProxy(PositionManager, [
    //     deployments.stablecoin.BookKeeper,
    //     deployments.stablecoin.ShowStopper,
    // ])
    // deployments.stablecoin["PositionManager"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const GetPositions = await ethers.getContractFactory("GetPositions")
    // result = await upgrades.deployProxy(GetPositions)
    // deployments.stablecoin["GetPositions"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const SystemDebtEngine = await ethers.getContractFactory("SystemDebtEngine")
    // result = await upgrades.deployProxy(SystemDebtEngine, [deployments.stablecoin.BookKeeper])
    // deployments.stablecoin["SystemDebtEngine"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const StabilityFeeCollector = await ethers.getContractFactory("StabilityFeeCollector")
    // result = await upgrades.deployProxy(StabilityFeeCollector, [
    //     deployments.stablecoin.BookKeeper,
    //     deployments.stablecoin.SystemDebtEngine,
    // ])
    // deployments.stablecoin["StabilityFeeCollector"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const PriceOracle = await ethers.getContractFactory("PriceOracle")
    // result = await upgrades.deployProxy(PriceOracle, [deployments.stablecoin.BookKeeper])
    // deployments.stablecoin["PriceOracle"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const IbTokenAdapter = await ethers.getContractFactory("IbTokenAdapter")
    // result = await upgrades.deployProxy(IbTokenAdapter, [
    //     deployments.stablecoin.BookKeeper,
    //     COLLATERAL_POOL_ID,
    //     COLLATERAL_TOKEN_ADDR,
    //     REWARD_TOKEN_ADDR,
    //     LAUNCH_ADDR,
    //     PID,
    //     SHIELD_ADDR,
    //     TIME_LOCK_ADDR,
    //     TREASURY_FEE_BPS,
    //     TREASURY_ACCOUNT,
    //     deployments.stablecoin.PositionManager,
    // ])
    // deployments.stablecoin["IbTokenAdapter"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const StablecoinAdapter = await ethers.getContractFactory("StablecoinAdapter")
    // result = await upgrades.deployProxy(StablecoinAdapter, [
    //     deployments.stablecoin.BookKeeper,
    //     deployments.stablecoin.gamUSD,
    // ])
    // deployments.stablecoin["StablecoinAdapter"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const OraclePriceFeed = await ethers.getContractFactory("OraclePriceFeed")
    // result = await upgrades.deployProxy(OraclePriceFeed, [
    //     ORACLE,
    //     TOKEN_0,
    //     TOKEN_1,
    //     deployments.stablecoin.AccessControlConfig,
    // ])
    // deployments.stablecoin["OraclePriceFeed"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const BandPriceOracle = await ethers.getContractFactory("BandPriceOracle")
    // result = await upgrades.deployProxy(BandPriceOracle, [
    //     STD_REFERENCE_PROXY_ADDR,
    //     deployments.stablecoin.AccessControlConfig,
    // ])
    // deployments.stablecoin["BandPriceOracle"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const StrictOraclePriceFeed = await ethers.getContractFactory("StrictOraclePriceFeed")
    // result = await upgrades.deployProxy(StrictOraclePriceFeed, [
    //     PRIMARY_ORACLE,
    //     PRIMARY_TOKEN_0,
    //     PRIMARY_TOKEN_1,
    //     SECONDARY_ORACLE,
    //     SECONDARY_TOKEN_0,
    //     SECONDARY_TOKEN_1,
    //     deployments.stablecoin.AccessControlConfig,
    // ])
    // deployments.stablecoin["StrictOraclePriceFeed"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const IbTokenPriceFeed = await ethers.getContractFactory("IbTokenPriceFeed")
    // result = await upgrades.deployProxy(IbTokenPriceFeed, [
    //     IB_IN_BASE_PRICE_FEED_ADDR,
    //     BASE_IN_USD_PRICE_FEED_ADDR,
    //     deployments.stablecoin.AccessControlConfig,
    //     TIME_DELAY,
    // ])
    // deployments.stablecoin["IbTokenPriceFeed"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const LiquidationEngine = await ethers.getContractFactory("LiquidationEngine")
    // result = await upgrades.deployProxy(LiquidationEngine, [
    //     deployments.stablecoin.BookKeeper,
    //     deployments.stablecoin.SystemDebtEngine,
    // ])
    // deployments.stablecoin["LiquidationEngine"] = result.address
    // saveDeployments(deployments)
    // await wait()

    // const FixedSpreadLiquidationStrategy = await ethers.getContractFactory("FixedSpreadLiquidationStrategy")
    // result = await upgrades.deployProxy(FixedSpreadLiquidationStrategy, [
    //     deployments.stablecoin.BookKeeper,
    //     deployments.stablecoin.PriceOracle,
    //     deployments.stablecoin.LiquidationEngine,
    //     deployments.stablecoin.SystemDebtEngine,
    // ])
    // deployments.stablecoin["FixedSpreadLiquidationStrategy"] = result.address
    // saveDeployments(deployments)
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
