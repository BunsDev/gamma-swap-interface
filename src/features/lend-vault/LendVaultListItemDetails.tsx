import { ApprovalState, useApproveCallback } from "../../hooks/useApproveCallback"
import { CurrencyAmount, Token, ZERO } from "../../sdk"
import { Disclosure, Transition } from "@headlessui/react"
import React, { useState } from "react"
import { usePendingSolar, useUserInfo } from "./hooks"
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
import { lend, withdraw } from "../../state/web3/vaults"

const LendVaultListItem = ({ farm }) => {
    const { account, chainId } = useActiveWeb3React()
    const [pendingTx, setPendingTx] = useState(false)
    const [depositValue, setDepositValue] = useState("")
    const [withdrawValue, setWithdrawValue] = useState("")
    const [currentAction, setCurrentAction] = useState({ action: null, lockup: null, callback: null })
    const [showConfirmation, setShowConfirmation] = useState(false)

    const addTransaction = useTransactionAdder()

    const liquidityToken = new Token(
        chainId,
        getAddress(farm.asset),
        farm.pair.token1 ? 18 : farm.pair.token0 ? farm.pair.token0.decimals : 18,
        farm.pair.token1 ? farm.pair.symbol : farm.pair.token0.symbol,
        farm.pair.token1 ? farm.pair.name : farm.pair.token0.name
    )

    // User liquidity token balance
    const balance = useTokenBalance(account, liquidityToken)
    // const balance = CurrencyAmount.fromRawAmount(tokenAddressToToken(farm.asset), farm.availableWithDecimals ?? 0)

    const available = +farm.available
    const lendBalance = +farm.lendBalance

    const borrowBalance = CurrencyAmount.fromRawAmount(
        tokenAddressToToken(farm.asset),
        farm.borrowBalanceWithDecimals ?? 0
    )

    // TODO: Replace these
    const { amount, nextHarvestUntil, userLockedUntil } = useUserInfo(farm, liquidityToken)

    const pendingTau = usePendingSolar(farm)

    const typedDepositValue = tryParseAmount(depositValue, liquidityToken)
    const typedWithdrawValue = tryParseAmount(withdrawValue, liquidityToken)

    const [approvalState, approve] = useApproveCallback(typedDepositValue, GAMMA_VAULT_ADDRESS[chainId])

    const { deposit, withdraw: hello, harvest } = useMasterChef()

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
                            {farm.depositFeeBP && (
                                <div className="pr-4 mb-2 text-left cursor-pointer text-red">{`${`Deposit Fee`}: ${formatPercent(
                                    farm.depositFeeBP / 100
                                )}`}</div>
                            )}
                            {account && (
                                <div className="pr-4 mb-2 text-left cursor-pointer text-secondary">
                                    {`Available`}: {formatNumberScale(available?.toFixed(2) ?? 0, false, 4)}
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
                                            if (!balance.equalTo(ZERO)) {
                                                setDepositValue(balance.toFixed(liquidityToken?.decimals))
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
                                    disabled={pendingTx || !typedDepositValue || available < +depositValue}
                                    onClick={async () => {
                                        setPendingTx(true)
                                        const tx = await lend(account, farm?.asset, depositValue.toBigNumber(18))

                                        addTransaction(
                                            { hash: tx.transactionHash, ...tx },
                                            {
                                                summary: `${`Deposit`} ${
                                                    farm.pair.token1
                                                        ? `${farm.pair.token0.symbol}/${farm.pair.token1.symbol}`
                                                        : farm.pair.token0.symbol
                                                }`,
                                            }
                                        )

                                        setPendingTx(false)
                                    }}
                                >
                                    {`Deposit`}
                                </Button>
                            )}
                        </div>

                        <div className="col-span-2 text-center md:col-span-1">
                            {farm.depositFeeBP && !isMobile && (
                                <div
                                    className="pr-4 mb-2 text-left cursor-pointer text-secondary"
                                    style={{ height: "24px" }}
                                />
                            )}

                            {account && (
                                <div className="pr-4 mb-2 text-left cursor-pointer text-secondary">
                                    {`Total Withdrawable`}: {formatNumberScale(lendBalance?.toFixed(2)) ?? 0}
                                </div>
                            )}

                            <div className="relative flex items-center w-full mb-4">
                                <NumericalInput
                                    className="w-full px-4 py-4 pr-20 rounded bg-dark-700 focus:ring focus:ring-dark-purple"
                                    value={withdrawValue}
                                    onUserInput={setWithdrawValue}
                                />
                                {account && (
                                    <Button
                                        variant="outlined"
                                        color="light-green"
                                        size="xs"
                                        onClick={() => {
                                            if (lendBalance !== 0) {
                                                setWithdrawValue(amount.toFixed(liquidityToken?.decimals))
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
                                disabled={
                                    pendingTx || !typedWithdrawValue || lendBalance < +withdrawValue
                                    // borrowBalance.lessThan(typedWithdrawValue) ||
                                    // (amount && !amount.equalTo(ZERO) &&
                                    //     farm?.lockupDuration > 0 &&
                                    //     moment.unix(userLockedUntil / 1000).isAfter(new Date()))
                                }
                                onClick={async () => {
                                    setPendingTx(true)
                                    try {
                                        // KMP decimals depend on asset, TLP is always 18
                                        const tx = await withdraw(account, farm?.asset, withdrawValue.toBigNumber(18))
                                        addTransaction(
                                            { hash: tx.transactionHash, ...tx },
                                            {
                                                summary: `${`Withdraw`} ${
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
                                {amount &&
                                !amount.equalTo(ZERO) &&
                                farm?.lockupDuration > 0 &&
                                moment.unix(userLockedUntil / 1000).isAfter(new Date())
                                    ? `Unlocks ${moment.unix(userLockedUntil / 1000).fromNow()} (${moment
                                          .unix(userLockedUntil / 1000)
                                          .format()})`
                                    : `Withdraw`}
                            </Button>
                        </div>
                    </div>

                    {pendingTau && pendingTau.greaterThan(ZERO) && (
                        <div className="px-4 pb-4">
                            <Button
                                color="gradient"
                                className="w-full"
                                variant={!!nextHarvestUntil && nextHarvestUntil > Date.now() ? "outlined" : "filled"}
                                disabled={!!nextHarvestUntil && nextHarvestUntil > Date.now()}
                                onClick={async () => {
                                    const fn = async () => {
                                        setPendingTx(true)
                                        try {
                                            const tx = await harvest(farm.id)
                                            addTransaction(tx, {
                                                summary: `${`Harvest`} ${
                                                    farm.pair.token1
                                                        ? `${farm.pair.token0.symbol}/${farm.pair.token1.symbol}`
                                                        : farm.pair.token0.symbol
                                                }`,
                                            })
                                        } catch (error) {
                                            console.error(error)
                                        }
                                        setPendingTx(false)
                                    }

                                    if (farm?.lockupDuration == 0) {
                                        fn()
                                    } else {
                                        setCurrentAction({
                                            action: "harvest",
                                            lockup: `${farm?.lockupDuration / 86400} days`,
                                            callback: fn,
                                        })
                                        setShowConfirmation(true)
                                    }
                                }}
                            >
                                {`Harvest ${formatNumber(pendingTau.toFixed(18))} SOLAR`}
                            </Button>
                        </div>
                    )}
                </Disclosure.Panel>
            </Transition>
        </>
    )
}

export default LendVaultListItem
