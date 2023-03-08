import {
    AbstractCurrency,
    Apothem,
    Binance,
    ChainId,
    Currency,
    CurrencyAmount,
    Ether,
    JSBI,
    Moonriver,
    NATIVE,
    Token,
    WNATIVE,
} from "../../sdk"
import React, { useCallback, useEffect, useState } from "react"

import { AutoRow } from "../../components/Row"
import Container from "../../components/Container"
import Head from "next/head"
import { ArrowDown, ArrowRight, Clock, Settings } from "react-feather"
import Typography from "../../components/Typography"
import Web3Connect from "../../components/Web3Connect"

import { useActiveWeb3React } from "../../hooks/useActiveWeb3React"

import { useMultichainCurrencyBalance, useTokenBalance } from "../../state/wallet/hooks"
import DoubleGlowShadow from "../../components/DoubleGlowShadow"
import TauLogo from "../../components/TauLogo"
import { BottomGrouping, Dots } from "../../features/swap/styleds"
import Button from "../../components/Button"
import DualChainCurrencyInputPanel from "../../components/DualChainCurrencyInputPanel"
import ChainSelect from "../../components/ChainSelect"
import { Chain, DEFAULT_CHAIN_FROM, DEFAULT_CHAIN_TO } from "../../sdk/entities/Chain"
import { useBridgeInfo } from "../../features/bridge/hooks"
import useSWR, { SWRResponse } from "swr"
import { formatBytes32String, getAddress } from "ethers/lib/utils"
import { formatNumber, tryParseAmount } from "../../functions"
import { SUPPORTED_NETWORKS } from "../../modals/ChainModal"
import { NETWORK_ICON, NETWORK_LABEL } from "../../constants/networks"
import { ethers } from "ethers"
import { ApprovalState, useAnyswapTokenContract, useApproveCallback, useTokenContract } from "../../hooks"
import Loader from "../../components/Loader"
import { getWeb3ReactContext, useWeb3React } from "@web3-react/core"
import { BridgeContextName, DEPLOYMENTS, tokenAddressToIbToken, tokenNameToAddress } from "../../constants"
import { bridgeInjected } from "../../connectors"
import NavLink from "../../components/NavLink"
import { useTransactionAdder } from "../../state/transactions/hooks"
import { useRouter } from "next/router"
import Modal from "../../components/Modal"
import ModalHeader from "../../components/ModalHeader"
import { bridge, deposit, withdraw } from "../../state/web3/bridge"
import axios from "axios"

type AnyswapTokenInfo = {
    ID: string
    Name: string
    Symbol: string
    Decimals: number
    Description: string
    BaseFeePercent: number
    BigValueThreshold: number
    DepositAddress: string
    ContractAddress: string
    DcrmAddress: string
    DisableSwap: boolean
    IsDelegateContract: boolean
    MaximumSwap: number
    MaximumSwapFee: number
    MinimumSwap: number
    MinimumSwapFee: number
    PlusGasPricePercentage: number
    SwapFeeRate: number
}

type AnyswapResultPairInfo = {
    DestToken: AnyswapTokenInfo
    PairID: string
    SrcToken: AnyswapTokenInfo
    destChainID: string
    logoUrl: string
    name: string
    srcChainID: string
    symbol: string
}

type AvailableChainsInfo = {
    id: string
    token: AnyswapTokenInfo
    other: AnyswapTokenInfo
    logoUrl: string
    name: string
    symbol: string
    destChainID: string
}

export type AnyswapTokensMap = { [chainId: number]: { [contract: string]: AvailableChainsInfo } }

export default function Bridge() {
    const { account: activeAccount, chainId: activeChainId } = useActiveWeb3React()
    const { account, chainId, library, activate } = useWeb3React(BridgeContextName)
    const { push } = useRouter()
    const availableChains = [ChainId.FANTOM_TESTNET, ChainId.MATIC_TESTNET]

    const addTransaction = useTransactionAdder()

    const MIN_SWAP = 0.05
    const MAX_SWAP = 100000
    const MIN_SWAP_FEE = 0.014
    const MAX_SWAP_FEE = 0.22
    const SWAP_FEE_RATE = 0.001

    const currentChainFrom = chainId &&
        SUPPORTED_NETWORKS[chainId] && { id: chainId, icon: NETWORK_ICON[chainId], name: NETWORK_LABEL[chainId] }

    useEffect(() => {
        activate(bridgeInjected)
        if (chainId) {
            if (chainId == chainTo.id) {
                setChainTo(chainFrom)
            }
            setChainFrom({ id: chainId, icon: NETWORK_ICON[chainId], name: NETWORK_LABEL[chainId] })
        }
    }, [activate, chainId, activeAccount, activeChainId])

    const [chainFrom, setChainFrom] = useState<Chain | null>(currentChainFrom || DEFAULT_CHAIN_FROM)

    const [chainTo, setChainTo] = useState<Chain | null>(
        chainId == ChainId.MOONRIVER ? DEFAULT_CHAIN_FROM : DEFAULT_CHAIN_TO
    )

    const [tokenList, setTokenList] = useState<Currency[] | null>([])
    const [currency0, setCurrency0] = useState<Currency | null>(null)
    const [currencyAmount, setCurrencyAmount] = useState<string | null>("")
    const [tokenToBridge, setTokenToBridge] = useState<Token | null>(null)
    const currencyContract = useTokenContract(currency0?.isToken && currency0?.address, true)
    // const anyswapCurrencyContract = useAnyswapTokenContract(
    //     currency0 && currency0.chainId == ChainId.MOONRIVER && tokenToBridge.other.ContractAddress,
    //     true
    // )
    const [loading, setLoading] = useState(false)
    const [pendingTx, setPendingTx] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)

    const liquidityToken = new Token(activeChainId, DEPLOYMENTS.tokens.DCT, 18, "dummy", "dummy")
    const typedDepositValue = tryParseAmount(currencyAmount, liquidityToken)
    const [approvalState, approve] = useApproveCallback(typedDepositValue, DEPLOYMENTS.bridge.Bridge_Fantom)

    const selectedCurrencyBalance = useMultichainCurrencyBalance(
        chainFrom?.id,
        account ?? undefined,
        currency0 ?? undefined
    )

    const { data: anyswapInfo, error }: SWRResponse<AnyswapTokensMap, Error> = useSWR(
        "https://bridgeapi.anyswap.exchange/v2/serverInfo/1285",
        (url) =>
            fetch(url)
                .then((result) => result.json())
                .then((data) => {
                    let result: AnyswapTokensMap = {}

                    Object.keys(data || {}).map((key) => {
                        const info: AnyswapResultPairInfo = data[key]

                        let sourceContractAddress = info.SrcToken.ContractAddress
                        if (!sourceContractAddress) {
                            sourceContractAddress = WNATIVE[parseInt(info.srcChainID)].address
                        }

                        sourceContractAddress = sourceContractAddress.toLowerCase()

                        let existingSource = result[parseInt(info.srcChainID)]
                        if (!existingSource) {
                            result[parseInt(info.srcChainID)] = {
                                [sourceContractAddress]: {
                                    destChainID: info.destChainID,
                                    id: info.PairID,
                                    logoUrl: info.logoUrl,
                                    name: info.name,
                                    symbol: info.symbol,
                                    token: info.DestToken,
                                    other: info.SrcToken,
                                },
                            }
                        } else {
                            result[parseInt(info.srcChainID)][sourceContractAddress] = {
                                destChainID: info.destChainID,
                                id: info.PairID,
                                logoUrl: info.logoUrl,
                                name: info.name,
                                symbol: info.symbol,
                                token: info.DestToken,
                                other: info.SrcToken,
                            }
                        }

                        let destContractAddress = info.DestToken.ContractAddress
                        if (!destContractAddress) {
                            destContractAddress = WNATIVE[parseInt(info.destChainID)].address
                        }

                        destContractAddress = destContractAddress.toLowerCase()

                        let existingDestination = result[parseInt(info.destChainID)]
                        if (!existingDestination) {
                            result[parseInt(info.destChainID)] = {
                                [destContractAddress]: {
                                    destChainID: info.srcChainID,
                                    id: info.PairID,
                                    logoUrl: info.logoUrl,
                                    name: info.name,
                                    symbol: info.symbol,
                                    token: info.SrcToken,
                                    other: info.DestToken,
                                },
                            }
                        } else {
                            result[parseInt(info.destChainID)][destContractAddress] = {
                                destChainID: info.srcChainID,
                                id: info.PairID,
                                logoUrl: info.logoUrl,
                                name: info.name,
                                symbol: info.symbol,
                                token: info.SrcToken,
                                other: info.DestToken,
                            }
                        }
                    })

                    return result
                })
    )

    useEffect(() => {
        const meTokens = [chainFrom.id === ChainId.FANTOM_TESTNET ? "wFTM" : "wMATIC", "DCT", "MAV", "WLR", "DIB"]

        let tokens: Currency[] = meTokens.map((r) => {
            return new Token(chainFrom.id, tokenNameToAddress(r, chainFrom.id), 18, r, r)
        })

        // let tokens: Currency[] = Object.keys((anyswapInfo && anyswapInfo[chainFromId]) || {})
        //     .filter((r) => anyswapInfo[chainFromId][r].destChainID == chainTo.id.toString())
        //     .map((r) => {
        //         const info: AvailableChainsInfo = anyswapInfo[chainFromId][r]
        //         if(r.toLowerCase() == WNATIVE[chainFromId].address.toLowerCase()) {
        //             if(chainFromId == ChainId.MOONRIVER) {
        //                 return Moonriver.onChain(chainFromId)
        //             }
        //             if(chainFromId == ChainId.BSC) {
        //                 return Binance.onChain(chainFromId)
        //             }
        //             if(chainFromId == ChainId.MAINNET) {
        //                 return Ether.onChain(chainFromId)
        //             }
        //         }
        //         return new Token(chainFromId, getAddress(r), info.token.Decimals, info.token.Symbol, info.name)
        //     })

        console.debug("Tokens:", tokens)

        setTokenList(tokens)
        setCurrency0(null)
        setCurrencyAmount("")
    }, [chainFrom.id, anyswapInfo, chainTo.id])

    const handleChainFrom = useCallback(
        (chain: Chain) => {
            let changeTo = chainTo
            if (chainTo.id == chain.id) {
                changeTo = chainFrom
            }
            if (changeTo.id !== ChainId.FANTOM_TESTNET && chain.id !== ChainId.FANTOM_TESTNET) {
                setChainTo(DEFAULT_CHAIN_TO)
            } else {
                setChainTo(changeTo)
            }
            setChainFrom(chain)
        },
        [chainFrom, chainTo]
    )

    const handleChainTo = useCallback(
        (chain: Chain) => {
            let changeFrom = chainFrom
            if (chainFrom.id == chain.id) {
                changeFrom = chainTo
            }
            if (changeFrom.id !== ChainId.FANTOM_TESTNET && chain.id !== ChainId.FANTOM_TESTNET) {
                setChainFrom(DEFAULT_CHAIN_TO)
            } else {
                setChainFrom(changeFrom)
            }
            setChainTo(chain)
        },
        [chainFrom, chainTo]
    )

    const handleTypeInput = useCallback(
        (value: string) => {
            setCurrencyAmount(value)
        },
        [setCurrencyAmount]
    )

    const handleCurrencySelect = useCallback(
        (currency: Currency) => {
            setCurrency0(currency)
            handleTypeInput("")
            if (currency) {
                const tokenToAddress = tokenNameToAddress(currency.name, chainTo.id)
                console.debug("Currency :", currency.isToken && currency.address)
                console.debug("Token to address:", tokenToAddress)
                setTokenToBridge(new Token(chainTo.id, tokenToAddress, 18, currency.symbol, currency.name) as any)
            }
        },
        [anyswapInfo, chainFrom.id, handleTypeInput]
    )

    const insufficientBalance = () => {
        if (currencyAmount && selectedCurrencyBalance) {
            try {
                const balance = parseFloat(selectedCurrencyBalance.toFixed(currency0.decimals))
                const amount = parseFloat(currencyAmount)
                return amount > balance
            } catch (ex) {
                return false
            }
        }
        return false
    }

    const aboveMin = () => {
        if (currencyAmount && tokenToBridge) {
            const amount = parseFloat(currencyAmount)
            const minAmount = parseFloat(MIN_SWAP.toString())
            return amount >= minAmount
        }
        return false
    }

    const belowMax = () => {
        if (currencyAmount && tokenToBridge) {
            const amount = parseFloat(currencyAmount)
            const maxAmount = parseFloat(MAX_SWAP.toString())
            return amount <= maxAmount
        }
        return false
    }

    const getAmountToReceive = () => {
        if (!tokenToBridge) return 0

        let fee = parseFloat(currencyAmount) * SWAP_FEE_RATE
        if (fee < MIN_SWAP_FEE) {
            fee = MIN_SWAP_FEE
        } else if (fee > MAX_SWAP_FEE) {
            fee = MIN_SWAP_FEE
        }

        return (parseFloat(currencyAmount) - fee).toFixed(6)
    }

    const buttonDisabled =
        (chainFrom && chainFrom.id !== chainId) ||
        !currency0 ||
        !currencyAmount ||
        currencyAmount == "" ||
        !aboveMin() ||
        !belowMax() ||
        insufficientBalance() ||
        pendingTx

    const buttonText =
        chainFrom && chainFrom.id !== chainId
            ? `Switch to ${chainFrom.name} Network`
            : !currency0
            ? `Select a Token`
            : !currencyAmount || currencyAmount == ""
            ? "Enter an Amount"
            : !aboveMin()
            ? `Below Minimum Amount`
            : !belowMax()
            ? `Above Maximum Amount`
            : insufficientBalance()
            ? `Insufficient Balance`
            : pendingTx
            ? `Confirming Transaction`
            : `Bridge ${currency0?.symbol}`

    const bridgeToken = async () => {
        setPendingTx(true)

        const token = tokenToBridge
        const amountToBridge = ethers.utils.parseUnits(currencyAmount, 18)
        console.debug("amountToBridge:", amountToBridge.toString())
        const data = formatBytes32String(`${amountToBridge}`)

        try {
            setPendingTx(true)
            setLoading(true)

            bridge(
                account,
                currency0.isToken ? currency0.address : currency0.wrapped.address, // assetFrom
                token.address, // assetTo
                amountToBridge.toString(),
                data
            ).then((receipt: any) => {
                setShowConfirmation(false)
                addTransaction(
                    { hash: receipt.transactionHash },
                    {
                        summary: `${`Bridge `} ${tokenToBridge.symbol}`,
                    }
                )
                setLoading(false)
            })
        } catch (err) {
            console.error("Error:", err.toString())
        } finally {
            setPendingTx(false)
            setLoading(false)
        }
    }

    return (
        <>
            <Modal isOpen={showConfirmation} onDismiss={() => setShowConfirmation(false)}>
                <div className="space-y-4">
                    <ModalHeader title={`Bridge ${currency0?.symbol}`} onClose={() => setShowConfirmation(false)} />
                    <Typography variant="sm" className="font-medium">
                        {`You are sending ${formatNumber(currencyAmount)} ${currency0?.symbol} from ${chainFrom?.name}`}
                    </Typography>
                    <Typography variant="sm" className="font-medium">
                        {`You will receive ${formatNumber(getAmountToReceive())} ${currency0?.symbol} on ${
                            chainTo?.name
                        }`}
                    </Typography>

                    {approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING ? (
                        <Button
                            color="gradient"
                            size="lg"
                            disabled={approvalState === ApprovalState.PENDING}
                            onClick={approve}
                        >
                            <Typography variant="lg">
                                {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : `Approve`}
                            </Typography>
                        </Button>
                    ) : (
                        <Button color="gradient" size="lg" disabled={loading} onClick={() => bridgeToken()}>
                            <Typography variant="lg">
                                {loading ? (
                                    <div className={"p-2"}>
                                        <AutoRow gap="6px" justify="center">
                                            Loading {buttonText} <Loader stroke="white" />
                                        </AutoRow>
                                    </div>
                                ) : (
                                    `Bridge ${currency0?.symbol}`
                                )}
                            </Typography>
                        </Button>
                    )}
                </div>
            </Modal>

            <Head>
                <title>Bridge | Gamma</title>
                <meta key="description" name="description" content="Bridge" />
            </Head>

            <TauLogo />

            <Container maxWidth="2xl" className="space-y-6">
                <DoubleGlowShadow opacity="0.6">
                    <div className="p-4 space-y-4 rounded bg-dark-900" style={{ zIndex: 1 }}>
                        <div className="flex items-center justify-center mb-4 space-x-3">
                            <div className="grid grid-cols-2 rounded p-3px bg-dark-800 h-[46px]">
                                <NavLink
                                    activeClassName="font-bold border rounded text-high-emphesis border-dark-700 bg-dark-700"
                                    exact
                                    href={{ pathname: "/bridge" }}
                                >
                                    <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis ">
                                        <Typography component="h1" variant="lg">
                                            {`Bridge`}
                                        </Typography>
                                    </a>
                                </NavLink>
                                <NavLink
                                    activeClassName="font-bold border rounded text-high-emphesis border-dark-700 bg-dark-700"
                                    exact
                                    href={{ pathname: "/bridge/faucet" }}
                                >
                                    <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis">
                                        <Typography component="h1" variant="lg">
                                            {`Faucet`}
                                        </Typography>
                                    </a>
                                </NavLink>
                            </div>
                        </div>

                        <div className="p-4 text-center">
                            <div className="justify-between space-x-3 items-center">
                                <Typography component="h3" variant="base">
                                    {`Bridge tokens to and from the Fantom Network`}
                                </Typography>
                            </div>
                        </div>

                        <div className="flex flex-row justify-between items-center text-center">
                            <ChainSelect
                                availableChains={availableChains}
                                label="From"
                                chain={chainFrom}
                                otherChain={chainTo}
                                onChainSelect={(chain) => handleChainFrom(chain)}
                                switchOnSelect={true}
                            />
                            <button className={"sm:m-6"}>
                                <ArrowRight size="32" />
                            </button>
                            <ChainSelect
                                availableChains={availableChains}
                                label="To"
                                chain={chainTo}
                                otherChain={chainFrom}
                                onChainSelect={(chain) => handleChainTo(chain)}
                                switchOnSelect={false}
                            />
                        </div>

                        <DualChainCurrencyInputPanel
                            label={`Token to bridge:`}
                            value={currencyAmount}
                            currency={currency0}
                            onUserInput={handleTypeInput}
                            onMax={(amount) => handleTypeInput(amount)}
                            onCurrencySelect={(currency) => {
                                handleCurrencySelect(currency)
                            }}
                            chainFrom={chainFrom}
                            chainTo={chainTo}
                            tokenList={tokenList}
                            chainList={anyswapInfo}
                        />

                        <BottomGrouping>
                            {!account ? (
                                <Web3Connect size="lg" color="gradient" className="w-full" />
                            ) : (
                                <Button
                                    onClick={() => setShowConfirmation(true)}
                                    color={buttonDisabled ? "gray" : "gradient"}
                                    size="lg"
                                    disabled={buttonDisabled}
                                >
                                    {pendingTx ? (
                                        <div className={"p-2"}>
                                            <AutoRow gap="6px" justify="center">
                                                {buttonText} <Loader stroke="white" />
                                            </AutoRow>
                                        </div>
                                    ) : (
                                        buttonText
                                    )}
                                </Button>
                            )}
                        </BottomGrouping>

                        {currency0 && (
                            <div className={"p-2 sm:p-5 rounded bg-dark-800"}>
                                {MIN_SWAP_FEE > 0 && (
                                    <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                                        <div className="text-sm font-medium text-secondary">
                                            Minimum Bridge Fee: {formatNumber(MIN_SWAP_FEE)} {tokenToBridge?.symbol}
                                        </div>
                                    </div>
                                )}
                                {MAX_SWAP_FEE > 0 && (
                                    <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                                        <div className="text-sm font-medium text-secondary">
                                            Maximum Bridge Fee: {formatNumber(MAX_SWAP_FEE)} {tokenToBridge?.symbol}
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                                    <div className="text-sm font-medium text-secondary">
                                        Minimum Bridge Amount: {MIN_SWAP} {tokenToBridge?.symbol}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                                    <div className="text-sm font-medium text-secondary">
                                        Maximum Bridge Amount: {MAX_SWAP} {tokenToBridge?.symbol}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                                    <div className="text-sm font-medium text-secondary">
                                        Fee: {formatNumber(SWAP_FEE_RATE * 100)} %
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                                    <div className="text-sm font-medium text-secondary">
                                        Amounts greater than {formatNumber(320)} {tokenToBridge?.symbol} could take up
                                        to 12 hours.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DoubleGlowShadow>
            </Container>
        </>
    )
}
