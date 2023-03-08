import { ChainId } from ".."
import { NETWORK_ICON, NETWORK_LABEL } from "../../constants/networks"

export type Chain = {
    id: ChainId
    name?: string
    icon?: string
}

export const DEFAULT_CHAIN_FROM: Chain = {
    id: ChainId.FANTOM_TESTNET,
    icon: NETWORK_ICON[ChainId.FANTOM_TESTNET],
    name: NETWORK_LABEL[ChainId.FANTOM_TESTNET],
}

export const DEFAULT_CHAIN_TO: Chain = {
    id: ChainId.MATIC_TESTNET,
    icon: NETWORK_ICON[ChainId.MATIC_TESTNET],
    name: NETWORK_LABEL[ChainId.MATIC_TESTNET],
}
