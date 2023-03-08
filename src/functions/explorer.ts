import { ChainId } from "../sdk"

// Multichain Explorer
const builders = {
    etherscan: (chainName: string, data: string, type: "transaction" | "token" | "address" | "block") => {
        const prefix = `https://${chainName ? `${chainName}.` : ""}etherscan.io`
        switch (type) {
            case "transaction":
                return `${prefix}/tx/${data}`
            default:
                return `${prefix}/${type}/${data}`
        }
    },

    matic: (chainName: string, data: string, type: "transaction" | "token" | "address" | "block") => {
        // const prefix = `https://explorer-${chainName}.maticvigil.com`
        const prefix = "https://polygonscan.com"
        switch (type) {
            case "transaction":
                return `${prefix}/tx/${data}`
            case "token":
                return `${prefix}/tokens/${data}`
            default:
                return `${prefix}/${type}/${data}`
        }
    },

    matic_testnet: (chainName: string, data: string, type: "transaction" | "token" | "address" | "block") => {
        // const prefix = `https://explorer-${chainName}.maticvigil.com`
        const prefix = "https://mumbai.polygonscan.com"
        switch (type) {
            case "transaction":
                return `${prefix}/tx/${data}`
            case "token":
                return `${prefix}/tokens/${data}`
            default:
                return `${prefix}/${type}/${data}`
        }
    },

    moonbase: (chainName: string, data: string, type: "transaction" | "token" | "address" | "block") => {
        const prefix = "https://moonbeam-explorer.netlify.app"
        switch (type) {
            case "transaction":
                return `${prefix}/tx/${data}`
            case "address":
                return `${prefix}/address/${data}`
            default:
                return `${prefix}/${type}/${data}`
        }
    },

    moonriver: (chainName: string, data: string, type: "transaction" | "token" | "address" | "block") => {
        const prefix = "https://blockscout.moonriver.moonbeam.network/"
        switch (type) {
            case "transaction":
                return `${prefix}/tx/${data}`
            case "address":
                return `${prefix}/address/${data}`
            default:
                return `${prefix}/${type}/${data}`
        }
    },

    fantom_testnet: (chainName: string, data: string, type: "transaction" | "token" | "address" | "block") => {
        const prefix = "https://testnet.ftmscan.com"
        switch (type) {
            case "transaction":
                return `${prefix}/tx/${data}`
            case "address":
                return `${prefix}/address/${data}`
            default:
                return `${prefix}/${type}/${data}`
        }
    },
}

interface ChainObject {
    [chainId: number]: {
        chainName: string
        builder: (chainName: string, data: string, type: "transaction" | "token" | "address" | "block") => string
    }
}

const chains: ChainObject = {
    [ChainId.MAINNET]: {
        chainName: "",
        builder: builders.etherscan,
    },
    [ChainId.FANTOM_TESTNET]: {
        chainName: "fantom_testnet",
        builder: builders.fantom_testnet,
    },
    [ChainId.MATIC]: {
        chainName: "mainnet",
        builder: builders.matic,
    },
    [ChainId.MATIC_TESTNET]: {
        chainName: "mumbai_testnet",
        builder: builders.matic_testnet,
    },
    [ChainId.MOONBEAM_TESTNET]: {
        chainName: "",
        builder: builders.moonbase,
    },
    [ChainId.MOONRIVER]: {
        chainName: "",
        builder: builders.moonriver,
    },
}

export function getExplorerLink(
    chainId: ChainId,
    data: string,
    type: "transaction" | "token" | "address" | "block"
): string {
    const chain = chains[chainId]
    return chain.builder(chain.chainName, data, type)
}
