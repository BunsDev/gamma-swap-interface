import { ChainId } from "../sdk"

export type TokenInfo = {
    id: string
    name: string
    symbol: string
    decimals?: number
}

type PairInfo = {
    id: number
    token0: TokenInfo
    token1?: TokenInfo
    name?: string
    symbol?: string
}

type AddressMap = {
    [chainId: number]: {
        [address: string]: PairInfo
    }
}

export const POOLS: AddressMap = {
    [ChainId.FANTOM_TESTNET]: {
        "0xdac7747464B3C4407f867feFFDD1094b45F4d3e1": {
            id: 1,
            name: "Gamma LP",
            symbol: "GLP",
            token0: {
                name: "NAME:DCT",
                id: "0x935B30d75F57659CF41Bd868A8032E58Fe53C369",
                symbol: "DCT",
                decimals: 18,
            },
            token1: {
                name: "NAME:wFTM",
                id: "0x3d0440A3eA85e120864ae609d1383006A1490786",
                symbol: "wFTM",
                decimals: 18,
            },
        },
        "0x070716d7d94A45Eb5E9530949BDAD2b763cd912D": {
            id: 3,
            name: "Gamma LP",
            symbol: "GLP",
            token0: {
                name: "NAME:WLR",
                id: "0xBc43C5D55d936cA74dB498a123433eb9EcA0882D",
                symbol: "WLR",
                decimals: 18,
            },
            token1: {
                name: "NAME:wFTM",
                id: "0x3d0440A3eA85e120864ae609d1383006A1490786",
                symbol: "wFTM",
                decimals: 18,
            },
        },
        "0xBa1462cbc3077EE35e955a78A4684a2AF7dC2ABe": {
            id: 5,
            name: "Gamma LP",
            symbol: "GLP",
            token0: {
                name: "NAME:MAV",
                id: "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "NAME:wFTM",
                id: "0x3d0440A3eA85e120864ae609d1383006A1490786",
                symbol: "wFTM",
                decimals: 18,
            },
        },
        "0xC3fe0f555c1050Bd35b5063f4DF9E97c5891dDCF": {
            id: 7,
            name: "Gamma LP",
            symbol: "GLP",
            token0: {
                name: "NAME:DIB",
                id: "0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc",
                symbol: "DIB",
                decimals: 18,
            },
            token1: {
                name: "NAME:DCT",
                id: "0x935B30d75F57659CF41Bd868A8032E58Fe53C369",
                symbol: "DCT",
                decimals: 18,
            },
        },
        "0xf943bF7FaF237E460adffF85b642Df7C39e1Cf71": {
            id: 9,
            name: "Gamma LP",
            symbol: "GLP",
            token0: {
                name: "NAME:WLR",
                id: "0xBc43C5D55d936cA74dB498a123433eb9EcA0882D",
                symbol: "WLR",
                decimals: 18,
            },
            token1: {
                name: "NAME:DCT",
                id: "0x935B30d75F57659CF41Bd868A8032E58Fe53C369",
                symbol: "DCT",
                decimals: 18,
            },
        },
        "0x6D3E824D3Ef7eE706324eFdB199209a7A7AdDdFe": {
            id: 11,
            name: "Gamma LP",
            symbol: "GLP",
            token0: {
                name: "NAME:MAV",
                id: "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "NAME:DCT",
                id: "0x935B30d75F57659CF41Bd868A8032E58Fe53C369",
                symbol: "DCT",
                decimals: 18,
            },
        },
        "0xC20dd02FE4acfBBcbaE64F72939Ab50Fc8f24CFA": {
            id: 13,
            name: "Gamma LP",
            symbol: "GLP",
            token0: {
                name: "NAME:MAV",
                id: "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "NAME:DIB",
                id: "0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc",
                symbol: "DIB",
                decimals: 18,
            },
        },
        "0x6eA94f53A2f95b48F9A6bDbcD082bBf5700de853": {
            id: 15,
            name: "Gamma LP",
            symbol: "GLP",
            token0: {
                name: "NAME:MAV",
                id: "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "NAME:WLR",
                id: "0xBc43C5D55d936cA74dB498a123433eb9EcA0882D",
                symbol: "WLR",
                decimals: 18,
            },
        },
    },
    [ChainId.XDC_APOTHEM]: {
        "0xB5399CB5A75dDb18e0ae5EB677426Cb0227b7d85": {
            id: 0,
            token0: {
                name: "Doggy Coin Token",
                id: "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8",
                symbol: "DCT",
                decimals: 18,
            },
            token1: {
                name: "Wrapped XDC",
                id: "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8",
                symbol: "wFTM",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x59b9E0c57593428e4c4B3453be8b51714aEAC826": {
            id: 1,
            token0: {
                name: "Wallaroo Token",
                id: "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e",
                symbol: "WLR",
                decimals: 18,
            },
            token1: {
                name: "Wrapped XDC",
                id: "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8",
                symbol: "wFTM",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0xCCB6a346238A2f1965FDECCCbf6e31Bf15486236": {
            id: 2,
            token0: {
                name: "Maverick Token",
                id: "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "Wrapped XDC",
                id: "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8",
                symbol: "wFTM",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x7291Cf59709B229627f86b78149851c6Da22B3F5": {
            id: 3,
            token0: {
                name: "Dibs Token",
                id: "0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E",
                symbol: "DIB",
                decimals: 18,
            },
            token1: {
                name: "Doggy Coin Token",
                id: "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8",
                symbol: "DCT",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x5745A37EC850419BaA043f1CfCdE29491C9DFe18": {
            id: 4,
            token0: {
                name: "Wallaroo Token",
                id: "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e",
                symbol: "WLR",
                decimals: 18,
            },
            token1: {
                name: "Doggy Coin Token",
                id: "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8",
                symbol: "DCT",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x29f4D96b4d0CEdCBe57FDE86952D6C79E8FA2DaF": {
            id: 5,
            token0: {
                name: "Maverick Token",
                id: "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "Doggy Coin Token",
                id: "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8",
                symbol: "DCT",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x5C36135a73F0b232192bA345Bef99049D0F21245": {
            id: 6,
            token0: {
                name: "Maverick Token",
                id: "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "Dibs Token",
                id: "0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E",
                symbol: "DIB",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x16623630E2fF68954fd7B1c2598A897b31502e45": {
            id: 7,
            token0: {
                name: "Maverick Token",
                id: "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "Wallaroo Token",
                id: "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e",
                symbol: "WLR",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
    },
}
