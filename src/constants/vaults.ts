import { ChainId } from "../sdk"
import { DEPLOYMENTS } from "./addresses"

export type TokenInfo = {
    id: string
    name: string
    symbol: string
    decimals?: number
}

type PairInfo = {
    id: number
    lpToken: string
    token0: TokenInfo
    token1?: TokenInfo
    name?: string
    symbol?: string
}

type AddressMap = {
    [chainId: number]: {
        [id: string]: PairInfo
    }
}

export const VAULTS: AddressMap = {
    [ChainId.FANTOM_TESTNET]: {
        "0": {
            id: 0,
            lpToken: DEPLOYMENTS.vault.tokens.ibDCT,
            token0: {
                id: DEPLOYMENTS.tokens.DCT,
                name: "DCT",
                symbol: "DCT",
                decimals: 18,
            },
        },
        "1": {
            id: 1,
            lpToken: DEPLOYMENTS.vault.tokens.ibWLR,
            token0: {
                id: DEPLOYMENTS.tokens.WLR,
                name: "WLR",
                symbol: "WLR",
                decimals: 18,
            },
        },
        "2": {
            id: 2,
            lpToken: DEPLOYMENTS.vault.tokens.ibMAV,
            token0: {
                id: DEPLOYMENTS.tokens.MAV,
                name: "MAV",
                symbol: "MAV",
                decimals: 18,
            },
        },
    },
}
