import { AlertTriangle, ArrowUpCircle, CheckCircle } from "react-feather"
import { ChainId, Currency } from "../../sdk"
import React, { FC } from "react"

import Button from "../../components/Button"
import CloseIcon from "../../components/CloseIcon"
import ExternalLink from "../../components/ExternalLink"
import Image from "../../components/Image"
import Lottie from "lottie-react"
import Modal from "../../components/Modal"
import ModalHeader from "../../components/ModalHeader"
import { RowFixed } from "../../components/Row"
import { getExplorerLink } from "../../functions/explorer"
import loadingRollingCircle from "../../animation/loading-rolling-circle.json"
import solarbeamLoading from "../../animation/solarbeam-loading.json"
import { useActiveWeb3React } from "../../hooks/useActiveWeb3React"
import useAddTokenToMetaMask from "../../hooks/useAddTokenToMetaMask"

interface ConfirmationPendingContentProps {
    onDismiss: () => void
    pendingText: string
    pendingText2: string
}

export const ConfirmationPendingContent: FC<ConfirmationPendingContentProps> = ({
    onDismiss,
    pendingText,
    pendingText2,
}) => {
    return (
        <div>
            <div className="flex justify-end">
                <CloseIcon onClick={onDismiss} />
            </div>
            <div className="w-24 pb-4 m-auto">
                <Lottie animationData={solarbeamLoading} autoplay loop />
            </div>
            <div className="flex flex-col items-center justify-center gap-3">
                <div className="text-xl font-bold text-high-emphesis">{`Waiting for Confirmation`}</div>
                <div className="font-bold">{pendingText}</div>
                <div className="font-bold">{pendingText2}</div>
                <div className="text-sm font-bold text-secondary">{`Confirm this transaction in your wallet`}</div>
            </div>
        </div>
    )
}

interface TransactionSubmittedContentProps {
    onDismiss: () => void
    hash: string | undefined
    chainId: ChainId
    currencyToAdd?: Currency | undefined
    inline?: boolean // not in modal
}

export const TransactionSubmittedContent: FC<TransactionSubmittedContentProps> = ({
    onDismiss,
    chainId,
    hash,
    currencyToAdd,
}) => {
    return (
        <div>
            <div className="flex justify-end">
                <CloseIcon onClick={onDismiss} />
            </div>
            <div className="w-24 pb-4 m-auto">
                <ArrowUpCircle strokeWidth={0.5} size={90} className="text-yellow" />
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
                <div className="text-xl font-bold">{`Transaction Submitted`}</div>
                {chainId && hash && (
                    <ExternalLink href={getExplorerLink(chainId, hash, "transaction")}>
                        <div className="font-bold text-yellow">{`View on explorer`}</div>
                    </ExternalLink>
                )}
                {/* {currencyToAdd && library?.provider?.isMetaMask && (
                    <Button color="gradient" onClick={addToken} className="w-auto mt-4">
                        {!success ? (
                            <RowFixed className="mx-auto space-x-2">
                                <span>{`Add ${currencyToAdd.symbol} to MetaMask`}</span>
                                <Image
                                    src="/images/wallets/metamask.png"
                                    alt={`Add ${currencyToAdd.symbol} to MetaMask`}
                                    width={24}
                                    height={24}
                                    className="ml-1"
                                />
                            </RowFixed>
                        ) : (
                            <RowFixed>
                                {`Added`} {currencyToAdd.symbol}
                            </RowFixed>
                        )}
                    </Button>
                )} */}
            </div>
        </div>
    )
}

interface ConfirmationModelContentProps {
    title: string
    onDismiss: () => void
    topContent: () => React.ReactNode
    bottomContent: () => React.ReactNode
}

export const ConfirmationModalContent: FC<ConfirmationModelContentProps> = ({
    title,
    bottomContent,
    onDismiss,
    topContent,
}) => {
    return (
        <div className="grid gap-4">
            <ModalHeader title={title} onClose={onDismiss} />
            {topContent()}
            {bottomContent()}
        </div>
    )
}

interface TransactionErrorContentProps {
    message: string
    onDismiss: () => void
}

export const TransactionErrorContent: FC<TransactionErrorContentProps> = ({ message, onDismiss }) => {
    return (
        <div className="grid gap-6">
            <div>
                <div className="flex justify-between">
                    <div className="text-lg font-medium text-high-emphesis">{`Error`}</div>
                    <CloseIcon onClick={onDismiss} />
                </div>
                <div className="flex flex-col items-center justify-center gap-3">
                    <AlertTriangle className="text-red" style={{ strokeWidth: 1.5 }} size={64} />
                    <div className="font-bold text-red">{message}</div>
                </div>
            </div>
            <div>
                <Button color="gradient" size="lg" onClick={onDismiss}>
                    Dismiss
                </Button>
            </div>
        </div>
    )
}

interface ConfirmationModalProps {
    isOpen: boolean
    onDismiss: () => void
    hash: string | undefined
    content: () => React.ReactNode
    attemptingTxn: boolean
    pendingText: string
    pendingText2?: string
    currencyToAdd?: Currency | undefined
}

const TransactionConfirmationModal: FC<ConfirmationModalProps> = ({
    isOpen,
    onDismiss,
    attemptingTxn,
    hash,
    pendingText,
    pendingText2,
    content,
    currencyToAdd,
}) => {
    const { chainId } = useActiveWeb3React()

    if (!chainId) return null

    // confirmation screen
    return (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
            {attemptingTxn ? (
                <ConfirmationPendingContent
                    onDismiss={onDismiss}
                    pendingText={pendingText}
                    pendingText2={pendingText2}
                />
            ) : hash ? (
                <TransactionSubmittedContent
                    chainId={chainId}
                    hash={hash}
                    onDismiss={onDismiss}
                    currencyToAdd={currencyToAdd}
                />
            ) : (
                content()
            )}
        </Modal>
    )
}

export default TransactionConfirmationModal
