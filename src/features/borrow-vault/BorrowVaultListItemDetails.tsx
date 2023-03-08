import { ApprovalState, useApproveCallback } from "../../hooks/useApproveCallback"
import { CurrencyAmount, Token, ZERO } from "../../sdk"
import { Disclosure, Transition } from "@headlessui/react"
import React, { useState } from "react"
import { useUserInfo } from "./hooks"
import Button from "../../components/Button"
import Dots from "../../components/Dots"
import { GAMMA_VAULT_ADDRESS, tokenAddressToToken } from "../../constants/addresses"
import { Input as NumericalInput } from "../../components/NumericalInput"
import { formatNumber, formatNumberScale, formatPercent } from "../../functions"
import { getAddress } from "@ethersproject/address"

import { tryParseAmount } from "../../functions/parse"
import useActiveWeb3React from "../../hooks/useActiveWeb3React"

import useMasterChef from "./useMasterChef"
import { useTransactionAdder } from "../../state/transactions/hooks"
import { isMobile } from "react-device-detect"
import Modal from "../../components/Modal"
import ModalHeader from "../../components/ModalHeader"
import Typography from "../../components/Typography"
import moment from "moment"
import { useTokenBalance } from "../../state/wallet/hooks"
import { borrow, repay, withdraw } from "../../state/web3/vaults"

const BorrowVaultListItemDetails = ({ farm }) => {
    const { account, chainId } = useActiveWeb3React()
    const [pendingTx, setPendingTx] = useState(false)
    const [depositValue, setDepositValue] = useState("")
    const [repayValue, setRepayValue] = useState("")
    const [currentAction, setCurrentAction] = useState({ action: null, lockup: null, callback: null })
    const [showConfirmation, setShowConfirmation] = useState(false)

    const addTransaction = useTransactionAdder()

    const liquidityToken = new Token(
        chainId,
        getAddress(farm.asset),
        18,
        farm.pair.token1 ? farm.pair.symbol : farm.pair.token0.symbol,
        farm.pair.token1 ? farm.pair.name : farm.pair.token0.name
    )

    const maxBorrow = +farm.maxBorrow
    const borrowBalance = +farm.borrowBalance

    const typedDepositValue = tryParseAmount(depositValue, liquidityToken)
    const typedWithdrawValue = tryParseAmount(repayValue, liquidityToken)

    const [approvalState, approve] = useApproveCallback(typedDepositValue, GAMMA_VAULT_ADDRESS[chainId])

    return (
        <>
            <Transition
                show={true}
                enter="transition-opacity duration-0"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <Disclosure.Panel className="flex flex-col w-full border-t-0 rounded rounded-t-none bg-dark-800" static>
                    <div className="grid grid-cols-2 gap-4 p-4">
                        <div className="col-span-2 text-center md:col-span-1">
                            {account && (
                                <div className="pr-4 mb-2 text-left cursor-pointer text-secondary">
                                    {`Max Borrowable`}: {formatNumberScale(maxBorrow?.toFixed(2) ?? 0, false, 4)}
                                </div>
                            )}

                            <div className="relative flex items-center w-full mb-4">
                                <NumericalInput
                                    className="w-full px-4 py-4 pr-20 rounded bg-dark-700 focus:ring focus:ring-dark-purple"
                                    value={depositValue}
                                    onUserInput={setDepositValue}
                                />
                                {account && (
                                    <Button
                                        variant="outlined"
                                        color="light-green"
                                        size="xs"
                                        onClick={() => {
                                            if (maxBorrow !== 0) {
                                                setDepositValue(maxBorrow.toFixed(6))
                                            }
                                        }}
                                        className="absolute border-0 right-4 focus:ring focus:ring-light-purple"
                                    >
                                        {`MAX`}
                                    </Button>
                                )}
                            </div>

                            {approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING ? (
                                <Button
                                    className="w-full"
                                    size="sm"
                                    variant="outlined"
                                    color="gradient"
                                    disabled={approvalState === ApprovalState.PENDING}
                                    onClick={approve}
                                >
                                    {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : `Approve`}
                                </Button>
                            ) : (
                                <Button
                                    className="w-full"
                                    size="sm"
                                    variant="outlined"
                                    color="gradient"
                                    disabled={pendingTx || !typedDepositValue || maxBorrow < +depositValue}
                                    onClick={async () => {
                                        setPendingTx(true)
                                        try {
                                            const tx = await borrow(account, farm?.asset, depositValue.toBigNumber(18))

                                            addTransaction(
                                                { hash: tx.transactionHash, ...tx },
                                                {
                                                    summary: `${`Borrow`} ${
                                                        farm.pair.token1
                                                            ? `${farm.pair.token0.symbol}/${farm.pair.token1.symbol}`
                                                            : farm.pair.token0.symbol
                                                    }`,
                                                }
                                            )
                                        } catch (error) {
                                            console.error(error)
                                        }
                                        setPendingTx(false)
                                    }}
                                >
                                    {`Borrow`}
                                </Button>
                            )}
                        </div>

                        <div className="col-span-2 text-center md:col-span-1">
                            {account && (
                                <div className="pr-4 mb-2 text-left cursor-pointer text-secondary">
                                    {`Total Repayable`}: {formatNumberScale(borrowBalance?.toFixed(2)) ?? 0}
                                </div>
                            )}

                            <div className="relative flex items-center w-full mb-4">
                                <NumericalInput
                                    className="w-full px-4 py-4 pr-20 rounded bg-dark-700 focus:ring focus:ring-dark-purple"
                                    value={repayValue}
                                    onUserInput={setRepayValue}
                                />
                                {account && (
                                    <Button
                                        variant="outlined"
                                        color="light-green"
                                        size="xs"
                                        onClick={() => {
                                            if (borrowBalance !== 0) {
                                                setRepayValue(borrowBalance.toFixed(6))
                                            }
                                        }}
                                        className="absolute border-0 right-4 focus:ring focus:ring-light-purple"
                                    >
                                        {`MAX`}
                                    </Button>
                                )}
                            </div>

                            <Button
                                className="w-full"
                                size="sm"
                                variant="outlined"
                                color="gradient"
                                disabled={pendingTx || !typedWithdrawValue || borrowBalance < +repayValue}
                                onClick={async () => {
                                    setPendingTx(true)
                                    try {
                                        const tx = await withdraw(account, farm?.asset, repayValue.toBigNumber(18))

                                        addTransaction(
                                            { hash: tx.transactionHash },
                                            {
                                                summary: `${`Repay`} ${
                                                    farm.pair.token1
                                                        ? `${farm.pair.token0.symbol}/${farm.pair.token1.symbol}`
                                                        : farm.pair.token0.symbol
                                                }`,
                                            }
                                        )
                                    } catch (error) {
                                        console.error(error)
                                    }

                                    setPendingTx(false)
                                }}
                            >
                                Repay
                            </Button>
                        </div>
                    </div>
                </Disclosure.Panel>
            </Transition>
        </>
    )
}

export default BorrowVaultListItemDetails
