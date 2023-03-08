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

export const STABLECOIN_MARKETS: AddressMap = {
    [ChainId.FANTOM_TESTNET]: {
        "0": {
            id: 0,
            lpToken: DEPLOYMENTS.vault.tokens.ibDCT,
            token0: {
                id: DEPLOYMENTS.vault.tokens.ibDCT,
                name: "ibDCT",
                symbol: "ibDCT",
                decimals: 18,
            },
        },
        "1": {
            id: 1,
            lpToken: DEPLOYMENTS.vault.tokens.ibWLR,
            token0: {
                id: DEPLOYMENTS.vault.tokens.ibWLR,
                name: "ibWLR",
                symbol: "ibWLR",
                decimals: 18,
            },
        },
        "2": {
            id: 2,
            lpToken: DEPLOYMENTS.vault.tokens.ibMAV,
            token0: {
                id: DEPLOYMENTS.vault.tokens.ibMAV,
                name: "ibMAV",
                symbol: "ibMAV",
                decimals: 18,
            },
        },
    },
}
