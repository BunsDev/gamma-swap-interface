import { Apothem, ChainId } from "../sdk"

const Mainnet = "/images/networks/ethereum.png"
const Matic =
"/images/networks/polygon-network.jpg"
const Moonbeam = "/images/networks/moonbeam-network.jpg"
const Moonriver = "/images/networks/moonriver.png"
const Fantom = "/images/networks/fantom-network.jpg"
const XDC_APOTHEM = "https://xinfin.org/assets/images/brand-assets/xdc-icon.png"
export const NETWORK_ICON = {
    [ChainId.MAINNET]: Mainnet,
    [ChainId.MATIC]: Matic,
    [ChainId.MATIC_TESTNET]: Matic,
    [ChainId.MOONBEAM_TESTNET]: Moonbeam,
    [ChainId.MOONRIVER]: Moonriver,
    [ChainId.FANTOM_TESTNET]: Fantom,
    [ChainId.XDC_APOTHEM]: XDC_APOTHEM,
}

export const NETWORK_LABEL: { [chainId in ChainId]?: string } = {
    [ChainId.MAINNET]: "Ethereum",
    [ChainId.FANTOM_TESTNET]: "Fantom Testnet",
    [ChainId.XDC_APOTHEM]: "XDC Apothem",
    [ChainId.MATIC]: "Polygon (Matic)",
    [ChainId.MATIC_TESTNET]: "Polygon Mumbai",
    [ChainId.MOONBEAM_TESTNET]: "Moonbase",
    [ChainId.MOONRIVER]: "Moonriver",
}
