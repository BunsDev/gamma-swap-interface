import React, { FC, useCallback } from "react"
import { injected } from "../../connectors"

import { AppDispatch } from "../../state"
import Button from "../Button"
import Copy from "./Copy"
import ExternalLink from "../ExternalLink"
import Image from "next/image"
import { ExternalLink as LinkIcon } from "react-feather"
import ModalHeader from "../ModalHeader"
import { SUPPORTED_WALLETS } from "../../constants"
import Transaction from "./Transaction"
import { clearAllTransactions } from "../../state/transactions/actions"
import { getExplorerLink } from "../../functions/explorer"
import { shortenAddress } from "../../functions"
import { useActiveWeb3React } from "../../hooks/useActiveWeb3React"
import { useDispatch } from "react-redux"
import Typography from "../Typography"

const WalletIcon: FC<{ size?: number; src: string; alt: string; children: any }> = ({ size, src, alt, children }) => {
    return (
        <div className="flex flex-row flex-nowrap items-end md:items-center justify-center mr-2">
            <Image src={src} alt={alt} width={size} height={size} />
            {children}
        </div>
    )
}

function renderTransactions(transactions: string[]) {
    return (
        <div className="flex flex-col flex-nowrap gap-2">
            {transactions.map((hash, i) => {
                return <Transaction key={i} hash={hash} />
            })}
        </div>
    )
}

interface AccountDetailsProps {
    toggleWalletModal: () => void
    pendingTransactions: string[]
    confirmedTransactions: string[]
    ENSName?: string
    openOptions: () => void
}

const AccountDetails: FC<AccountDetailsProps> = ({
    toggleWalletModal,
    pendingTransactions,
    confirmedTransactions,
    ENSName,
    openOptions,
}) => {
    const { chainId, account, connector } = useActiveWeb3React()
    const dispatch = useDispatch<AppDispatch>()

    function formatConnectorName() {
        const { ethereum } = window
        const isMetaMask = !!(ethereum && ethereum.isMetaMask)
        const name = Object.keys(SUPPORTED_WALLETS)
            .filter(
                (k) =>
                    SUPPORTED_WALLETS[k].connector === connector &&
                    (connector !== injected || isMetaMask === (k === "METAMASK"))
            )
            .map((k) => SUPPORTED_WALLETS[k].name)[0]
        return <div className="font-medium text-baseline text-secondary">{`Connected with ${name}`}</div>
    }

    function getStatusIcon() {
        return null
    }

    const clearAllTransactionsCallback = useCallback(() => {
        if (chainId) dispatch(clearAllTransactions({ chainId }))
    }, [dispatch, chainId])

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <ModalHeader title={`Account`} onClose={toggleWalletModal} />
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        {formatConnectorName()}
                        <div className="flex space-x-3">
                            {connector !== injected && (
                                <Button
                                    variant="outlined"
                                    color="gray"
                                    size="xs"
                                    onClick={() => {
                                        ;(connector as any).close()
                                    }}
                                >
                                    {`Disconnect`}
                                </Button>
                            )}
                            <Button
                                variant="outlined"
                                color="gray"
                                size="xs"
                                onClick={() => {
                                    openOptions()
                                }}
                            >
                                {`Change`}
                            </Button>
                        </div>
                    </div>
                    <div id="web3-account-identifier-row" className="flex flex-col justify-center space-y-3">
                        {ENSName ? (
                            <div className="bg-dark-800">
                                {getStatusIcon()}
                                <Typography>{ENSName}</Typography>
                            </div>
                        ) : (
                            <div className="bg-dark-800 py-2 px-3 rounded">
                                {getStatusIcon()}
                                <Typography>{account && shortenAddress(account)}</Typography>
                            </div>
                        )}
                        <div className="flex items-center justify-between space-x-3 gap-2">
                            {chainId && account && (
                                <ExternalLink
                                    color="light-green"
                                    startIcon={<LinkIcon size={16} />}
                                    href={chainId && getExplorerLink(chainId, ENSName || account, "address")}
                                >
                                    <Typography variant="sm">{`View on explorer`}</Typography>
                                </ExternalLink>
                            )}
                            {account && (
                                <Copy toCopy={account}>
                                    <Typography variant="sm">{`Copy Address`}</Typography>
                                </Copy>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Typography weight={700}>{`Recent Transactions`}</Typography>
                    <div>
                        <Button variant="outlined" color="gray" size="xs" onClick={clearAllTransactionsCallback}>
                            {`Clear all`}
                        </Button>
                    </div>
                </div>
                {!!pendingTransactions.length || !!confirmedTransactions.length ? (
                    <>
                        {renderTransactions(pendingTransactions)}
                        {renderTransactions(confirmedTransactions)}
                    </>
                ) : (
                    <Typography variant="sm" className="text-secondary">
                        {`Your transactions will appear here...`}
                    </Typography>
                )}
            </div>
        </div>
    )
}

export default AccountDetails
