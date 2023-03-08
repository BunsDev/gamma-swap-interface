import { ChainId, Token, ZERO_ADDRESS } from "../sdk"
import deployments from "./deployments.json"
import { FANTOM_TESTNET } from "./tokens"
import GAMMA_TOKENLIST from "../constants/token-lists/tau.tokenlist.json"

type AddressMap = { [chainId: number]: string }

export const TIMELOCK_ADDRESS = "0x1a9C8182C09F50C8318d769245beA52c32BE35BC"
export const FAUCET_ADDRESS = "0x5aec27384DbE84d46C29A20DFeFF09493711CD15"

export const DEPLOYMENTS = deployments
export function getDeployedAddresses() {
    return deployments
}

export const tokenAddressToToken = (tokenAddress: string) => {
    switch (tokenAddress) {
        case DEPLOYMENTS.tokens.wFTM: {
            return FANTOM_TESTNET.wFTM
        }
        case DEPLOYMENTS.tokens.DCT: {
            return FANTOM_TESTNET.DCT
        }
        case DEPLOYMENTS.tokens.MAV: {
            return FANTOM_TESTNET.MAV
        }
        case DEPLOYMENTS.tokens.WLR: {
            return FANTOM_TESTNET.WLR
        }
        case DEPLOYMENTS.tokens.DIB: {
            return FANTOM_TESTNET.DIB
        }
    }

    return new Token(ChainId.FANTOM_TESTNET, ZERO_ADDRESS, 18, "Zero address", "Zero address")
}

export const tokenAddressToLogo = (tokenAddress: string) => {
    switch (tokenAddress) {
        case DEPLOYMENTS.tokens.wFTM: {
            return GAMMA_TOKENLIST.tokens[0].logoURI
        }
        case DEPLOYMENTS.tokens.DCT: {
            return GAMMA_TOKENLIST.tokens[1].logoURI
        }
        case DEPLOYMENTS.tokens.WLR: {
            return GAMMA_TOKENLIST.tokens[2].logoURI
        }
        case DEPLOYMENTS.tokens.MAV: {
            return GAMMA_TOKENLIST.tokens[3].logoURI
        }
        case DEPLOYMENTS.tokens.DIB: {
            return GAMMA_TOKENLIST.tokens[4].logoURI
        }
        case DEPLOYMENTS.tokens.GAMMA: {
            return GAMMA_TOKENLIST.tokens[5].logoURI
        }
        case DEPLOYMENTS.vault.tokens.ibDCT: {
            return GAMMA_TOKENLIST.tokens[6].logoURI
        }
        case DEPLOYMENTS.vault.tokens.ibMAV: {
            return GAMMA_TOKENLIST.tokens[7].logoURI
        }
        case DEPLOYMENTS.vault.tokens.ibWLR: {
            return GAMMA_TOKENLIST.tokens[8].logoURI
        }
    }

    return undefined
}

export function tokenAddressToIbToken(asset: string) {
    switch (asset) {
        case DEPLOYMENTS.tokens.DCT:
            return DEPLOYMENTS.vault.tokens.ibDCT
        case DEPLOYMENTS.tokens.MAV:
            return DEPLOYMENTS.vault.tokens.ibMAV
        case DEPLOYMENTS.tokens.WLR:
            return DEPLOYMENTS.vault.tokens.ibWLR
    }

    return undefined
}

export function tokenNameToAddress(assetName: string, chainId: ChainId) {
    switch (assetName) {
        case "wFTM":
            return chainId !== ChainId.FANTOM_TESTNET ? DEPLOYMENTS.tokens.mumbai.wMATIC : DEPLOYMENTS.tokens.wFTM
        case "wMATIC":
            return chainId === ChainId.FANTOM_TESTNET ? DEPLOYMENTS.tokens.wFTM : DEPLOYMENTS.tokens.mumbai.wMATIC
        case "DCT":
            return chainId === ChainId.FANTOM_TESTNET ? DEPLOYMENTS.tokens.DCT : DEPLOYMENTS.tokens.mumbai.DCT
        case "MAV":
            return chainId === ChainId.FANTOM_TESTNET ? DEPLOYMENTS.tokens.MAV : DEPLOYMENTS.tokens.mumbai.MAV
        case "WLR":
            return chainId === ChainId.FANTOM_TESTNET ? DEPLOYMENTS.tokens.WLR : DEPLOYMENTS.tokens.mumbai.WLR
        case "DIB":
            return chainId === ChainId.FANTOM_TESTNET ? DEPLOYMENTS.tokens.DIB : DEPLOYMENTS.tokens.mumbai.DIB
    }
}

export const LOCKER_ADDRESS: AddressMap = {
    [ChainId.ROPSTEN]: "",
    [ChainId.BSC]: "",
    [ChainId.MOONRIVER]: "0xA9Ead5d7C9D0B59A2900824A125F3913009fD638",
}

export const GAMMA_DISTRIBUTOR_ADDRESS: AddressMap = {
    [ChainId.ROPSTEN]: "",
    [ChainId.BSC]: "",
    [ChainId.MOONRIVER]: "0xf03b75831397D4695a6b9dDdEEA0E578faa30907",
    [ChainId.FANTOM_TESTNET]: DEPLOYMENTS.farms.GammaDistributor,
}

export const GAMMA_VAULT_ADDRESS: AddressMap = {
    [ChainId.MOONRIVER]: "0x7e6E03822D0077F3C417D33caeAc900Fc2645679",
    [ChainId.FANTOM_TESTNET]: DEPLOYMENTS.vault.GammaVault,
}

export const SOLAR_MOVR_PAIR: AddressMap = {
    [ChainId.ROPSTEN]: "",
    [ChainId.BSC]: "",
    [ChainId.MOONRIVER]: "0x7eDA899b3522683636746a2f3a7814e6fFca75e1",
}

export const MOVR_USDC_PAIR: AddressMap = {
    [ChainId.ROPSTEN]: "",
    [ChainId.BSC]: "",
    [ChainId.MOONRIVER]: "0xe537f70a8b62204832B8Ba91940B77d3f79AEb81",
}

export const RIB_MOVR_PAIR: AddressMap = {
    [ChainId.ROPSTEN]: "",
    [ChainId.BSC]: "",
    [ChainId.MOONRIVER]: "0x0acDB54E610dAbC82b8FA454b21AD425ae460DF9",
}

export const BNB_USD_PAIR: AddressMap = {
    [ChainId.ROPSTEN]: "",
    [ChainId.BSC]: "",
    [ChainId.MOONRIVER]: "",
}

export const ARCHER_ROUTER_ADDRESS: AddressMap = {
    [ChainId.MAINNET]: "0x9917C083FF9FbD29Df1367FBF7F2388A9a202431",
}

export const MINICHEF_ADDRESS: AddressMap = {
    [ChainId.MATIC]: "0x0769fd68dFb93167989C6f7254cd0D766Fb2841F",
    [ChainId.XDAI]: "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3",
    [ChainId.HARMONY]: "0x67dA5f2FfaDDfF067AB9d5F025F8810634d84287",
}

export const MASTERCHEF_V2_ADDRESS: AddressMap = {
    [ChainId.MAINNET]: "0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d",
}

export const ZAPPER_ADDRESS: AddressMap = {
    [ChainId.MAINNET]: "0xcff6eF0B9916682B37D80c19cFF8949bc1886bC2",
    [ChainId.ROPSTEN]: "0xcff6eF0B9916682B37D80c19cFF8949bc1886bC2",
}

// TODO: specify merkle distributor for mainnet
export const MERKLE_DISTRIBUTOR_ADDRESS: AddressMap = {
    [ChainId.MAINNET]: "0xcBE6B83e77cdc011Cc18F6f0Df8444E5783ed982",
    [ChainId.ROPSTEN]: "0x84d1f7202e0e7dac211617017ca72a2cb5e2b955",
}

export const MULTICALL2_ADDRESS: AddressMap = {
    [ChainId.MAINNET]: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
    [ChainId.ROPSTEN]: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
    [ChainId.RINKEBY]: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
    [ChainId.GÖRLI]: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
    [ChainId.KOVAN]: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
    [ChainId.ARBITRUM]: "0xadF885960B47eA2CD9B55E6DAc6B42b7Cb2806dB",
    [ChainId.ARBITRUM_TESTNET]: "0xa501c031958F579dB7676fF1CE78AD305794d579",
    [ChainId.CELO]: "0x9aac9048fC8139667D6a2597B902865bfdc225d3",
    [ChainId.FANTOM]: "0x22D4cF72C45F8198CfbF4B568dBdB5A85e8DC0B5",
    [ChainId.MATIC]: "0x02817C1e3543c2d908a590F5dB6bc97f933dB4BD",
    [ChainId.MATIC_TESTNET]: "",
    [ChainId.XDAI]: "0x67dA5f2FfaDDfF067AB9d5F025F8810634d84287",
    [ChainId.BSC]: "0xa9193376D09C7f31283C54e56D013fCF370Cd9D9",
    [ChainId.BSC_TESTNET]: "0xA6949B8FBa9DF546b9c66F98CFCa960A96E3b68e",
    [ChainId.MOONBEAM_TESTNET]: "",
    [ChainId.MOONRIVER]: "0x43D002a2B468F048028Ea9C2D3eD4705a94e68Ae",
    [ChainId.AVALANCHE]: "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3",
    [ChainId.AVALANCHE_TESTNET]: "",
    [ChainId.HECO]: "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3",
    [ChainId.HECO_TESTNET]: "",
    [ChainId.HARMONY]: "0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3",
    [ChainId.HARMONY_TESTNET]: "",
    [ChainId.OKEX]: "0xF4d73326C13a4Fc5FD7A064217e12780e9Bd62c3",
    [ChainId.OKEX_TESTNET]: "",
    [ChainId.FANTOM_TESTNET]: DEPLOYMENTS.misc.Multicall2,
}

export const WETH9: AddressMap = {
    [ChainId.MAINNET]: "",
    [ChainId.ROPSTEN]: "",
    [ChainId.RINKEBY]: "",
    [ChainId.GÖRLI]: "",
    [ChainId.KOVAN]: "",
    [ChainId.ARBITRUM]: "",
    [ChainId.ARBITRUM_TESTNET]: "",
    [ChainId.CELO]: "",
    [ChainId.FANTOM]: "",
    [ChainId.MATIC]: "",
    [ChainId.MATIC_TESTNET]: "",
    [ChainId.XDAI]: "",
    [ChainId.BSC]: "",
    [ChainId.BSC_TESTNET]: "",
    [ChainId.MOONBEAM_TESTNET]: "",
    [ChainId.MOONRIVER]: "0x98878B06940aE243284CA214f92Bb71a2b032B8A",
    [ChainId.AVALANCHE]: "",
    [ChainId.AVALANCHE_TESTNET]: "",
    [ChainId.HECO]: "",
    [ChainId.HECO_TESTNET]: "",
    [ChainId.HARMONY]: "",
    [ChainId.HARMONY_TESTNET]: "",
    [ChainId.OKEX]: "",
    [ChainId.OKEX_TESTNET]: "",
    [ChainId.FANTOM_TESTNET]: DEPLOYMENTS.tokens.wFTM,
}

export const WNATIVE: AddressMap = {
    [ChainId.MAINNET]: "",
    [ChainId.ROPSTEN]: "",
    [ChainId.RINKEBY]: "",
    [ChainId.GÖRLI]: "",
    [ChainId.KOVAN]: "",
    [ChainId.ARBITRUM]: "",
    [ChainId.ARBITRUM_TESTNET]: "",
    [ChainId.CELO]: "",
    [ChainId.FANTOM]: "",
    [ChainId.MATIC]: "",
    [ChainId.MATIC_TESTNET]: "",
    [ChainId.XDAI]: "",
    [ChainId.BSC]: "",
    [ChainId.BSC_TESTNET]: "",
    [ChainId.MOONBEAM_TESTNET]: "",
    [ChainId.MOONRIVER]: "0x98878B06940aE243284CA214f92Bb71a2b032B8A",
    [ChainId.AVALANCHE]: "",
    [ChainId.AVALANCHE_TESTNET]: "",
    [ChainId.HECO]: "",
    [ChainId.HECO_TESTNET]: "",
    [ChainId.HARMONY]: "",
    [ChainId.HARMONY_TESTNET]: "",
    [ChainId.OKEX]: "",
    [ChainId.OKEX_TESTNET]: "",
    [ChainId.FANTOM_TESTNET]: DEPLOYMENTS.tokens.wFTM,
}
