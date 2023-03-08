import { Web3Provider } from "@ethersproject/providers"
import { ChainId } from "../sdk"
import { InjectedConnector } from "@web3-react/injected-connector"
import { NetworkConnector } from "./NetworkConnector"

export const RPC = {
    [ChainId.MAINNET]: "https://mainnet.infura.io/v3/6120c21d46cb482d9cdabe463da74dd5",
    [ChainId.ROPSTEN]: "https://eth-ropsten.alchemyapi.io/v2/cidKix2Xr-snU3f6f6Zjq_rYdalKKHmW",
    [ChainId.RINKEBY]: "https://eth-rinkeby.alchemyapi.io/v2/XVLwDlhGP6ApBXFz_lfv0aZ6VmurWhYD",
    [ChainId.GÖRLI]: "https://eth-goerli.alchemyapi.io/v2/Dkk5d02QjttYEoGmhZnJG37rKt8Yl3Im",
    [ChainId.KOVAN]: "https://eth-kovan.alchemyapi.io/v2/6OVAa_B_rypWWl9HqtiYK26IRxXiYqER",
    [ChainId.FANTOM]: "https://rpcapi.fantom.network",
    [ChainId.FANTOM_TESTNET]: "https://endpoints.omniatech.io/v1/fantom/testnet/public",
    [ChainId.XDC_APOTHEM]: "https://erpc.apothem.network",
    [ChainId.MATIC]: "https://rpc-mainnet.maticvigil.com",
    [ChainId.MATIC_TESTNET]: "https://rpc-mumbai.maticvigil.com",
    [ChainId.XDAI]: "https://rpc.xdaichain.com",
    [ChainId.BSC]: "https://bsc-dataseed.binance.org/",
    [ChainId.BSC_TESTNET]: "https://data-seed-prebsc-2-s3.binance.org:8545",
    [ChainId.MOONBEAM_TESTNET]: "https://rpc.testnet.moonbeam.network",
    [ChainId.AVALANCHE]: "https://api.avax.network/ext/bc/C/rpc",
    [ChainId.AVALANCHE_TESTNET]: "https://api.avax-test.network/ext/bc/C/rpc",
    [ChainId.HECO]: "https://http-mainnet.hecochain.com",
    [ChainId.HECO_TESTNET]: "https://http-testnet.hecochain.com",
    [ChainId.HARMONY]: "https://api.harmony.one",
    [ChainId.HARMONY_TESTNET]: "https://api.s0.b.hmny.io",
    [ChainId.OKEX]: "https://exchainrpc.okex.org",
    [ChainId.OKEX_TESTNET]: "https://exchaintestrpc.okex.org",
    [ChainId.ARBITRUM]: "https://arb1.arbitrum.io/rpc",
    [ChainId.MOONRIVER]: "https://moonriver-api.bwarelabs.com/0e63ad82-4f98-46f9-8496-f75657e3a8e4", //'https://moonriver.api.onfinality.io/public',
}

export const network = new NetworkConnector({
    defaultChainId: Number(ChainId.FANTOM_TESTNET),
    urls: RPC,
})

let networkLibrary: Web3Provider | undefined

export function getNetworkLibrary(): Web3Provider {
    return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
    supportedChainIds: [Number(ChainId.FANTOM_TESTNET), Number(ChainId.MOONRIVER)],
})

export const bridgeInjected = new InjectedConnector({
    supportedChainIds: [
        Number(ChainId.MATIC_TESTNET),
        Number(ChainId.BSC_TESTNET),
        Number(ChainId.FANTOM_TESTNET),
        Number(ChainId.MOONRIVER),
    ],
})
