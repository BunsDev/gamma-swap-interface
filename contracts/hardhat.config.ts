import { config as dotEnvConfig } from "dotenv"
dotEnvConfig()

import "@openzeppelin/hardhat-upgrades"
import "@typechain/hardhat"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "hardhat-deploy"

const PRIVATE_KEY = ""
const ALCHEMY_MUMBAI = ""

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            gas: 12000000,
            blockGasLimit: 0x1fffffffffffff,
            allowUnlimitedContractSize: true,
            timeout: 1800000,
            mining: {
                auto: false,
                interval: 5000,
            },
        },
        fantom: {
            chainId: 0xfa2,
            url: "https://endpoints.omniatech.io/v1/fantom/testnet/public", // "https://rpc.testnet.fantom.network",
            // gas: 12000000,
            // gasLimit: 6721975,
            accounts: [PRIVATE_KEY],
            // gas: 2100000,
            // gasPrice: 8000000000,
        },
        mumbai: {
            url: ALCHEMY_MUMBAI,
            accounts: [PRIVATE_KEY],
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    solidity: {
        settings: {
            evmVersion: "istanbul",
            outputSelection: {
                "*": {
                    "": ["ast"],
                    "*": [
                        "evm.bytecode.object",
                        "evm.deployedBytecode.object",
                        "abi",
                        "evm.bytecode.sourceMap",
                        "evm.deployedBytecode.sourceMap",
                        "metadata",
                    ],
                },
            },
        },
        compilers: [
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
            {
                version: "0.8.0",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
            {
                version: "0.8.2",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
            {
                version: "0.8.7",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
            {
                version: "0.8.9",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
        ],
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "../src/constants/artifacts",
    },
    typechain: {
        outDir: "./typechain",
    },
    mocha: {
        timeout: 50000,
    },
}
