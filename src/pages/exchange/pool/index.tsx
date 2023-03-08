import { ChainId, CurrencyAmount, JSBI, NATIVE, Pair, Currency } from "../../../sdk"
import React, { useEffect, useMemo } from "react"
import { classNames, currencyId } from "../../../functions"
import { toV2LiquidityToken, useTrackedTokenPairs } from "../../../state/user/hooks"

import Button from "../../../components/Button"
import Container from "../../../components/Container"
import Dots from "../../../components/Dots"
import Empty from "../../../components/Empty"
import FullPositionCard from "../../../components/PositionCard"
import Head from "next/head"
import { MigrationSupported } from "../../../features/migration"
import Typography from "../../../components/Typography"
import Web3Connect from "../../../components/Web3Connect"

import { useActiveWeb3React } from "../../../hooks/useActiveWeb3React"

import { useRouter } from "next/router"
import { useTokenBalancesWithLoadingIndicator } from "../../../state/wallet/hooks"
import { useV2Pairs } from "../../../hooks/useV2Pairs"
import DoubleGlowShadow from "../../../components/DoubleGlowShadow"
import TauLogo from "../../../components/TauLogo"
import { updateAddTokensRouter } from "../../../sdk/utils/utils"

export default function Pool() {
    const router = useRouter()
    const { account, chainId } = useActiveWeb3React()

    console.debug("call")

    const trackedTokenPairs = useTrackedTokenPairs()

    const tokenPairsWithLiquidityTokens = useMemo(() => {
        if (!chainId) {
            return []
        }

        return trackedTokenPairs.map((tokens) => ({
            liquidityToken: toV2LiquidityToken(tokens),
            tokens,
        }))
    }, [chainId])

    const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken), [])

    const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
        account ?? undefined,
        liquidityTokens
    )

    // fetch the reserves for all V2 pools in which the user has a balance
    const liquidityTokensWithBalances = useMemo(
        () =>
            tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
                v2PairsBalances[liquidityToken?.address]?.greaterThan("0")
            ),
        [tokenPairsWithLiquidityTokens, v2PairsBalances]
    )

    const v2Pairs = useV2Pairs(
        liquidityTokensWithBalances.map(({ tokens }) => tokens),
        true
    )

    const v2IsLoading =
        fetchingV2PairBalances ||
        // v2Pairs?.length < liquidityTokensWithBalances.length ||
        v2Pairs?.some((V2Pair) => !V2Pair)

    const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

    const migrationSupported = chainId in MigrationSupported

    return (
        <>
            <Head>
                <title>{`Pools`} | Gamma</title>
                <meta
                    key="description"
                    name="description"
                    content="Gamma liquidity pools are markets for trades between the two tokens, you can provide these tokens and become a liquidity provider 
                    to earn 0.25% of fees from trades."
                />
            </Head>
            <TauLogo />

            <DoubleGlowShadow opacity="0.6">
                <Container maxWidth="2xl" className="space-y-6">
                    <div className="p-4 space-y-4 rounded bg-dark-900">
                        <div className="p-4 mb-3 space-y-3">
                            <div className="text-center">
                                <Typography component="h1" variant="h2">
                                    {`My Liquidity Positions`}
                                </Typography>
                            </div>
                        </div>

                        <div className="grid grid-flow-row gap-3">
                            {!account ? (
                                <Web3Connect size="lg" color="gradient" className="w-full" />
                            ) : v2IsLoading ? (
                                <Empty>
                                    <Dots>{`Loading`}</Dots>
                                </Empty>
                            ) : allV2PairsWithLiquidity?.length > 0 ? (
                                <>
                                    {allV2PairsWithLiquidity.map((v2Pair) => (
                                        <FullPositionCard
                                            key={v2Pair.liquidityToken.address}
                                            pair={v2Pair}
                                            stakedBalance={CurrencyAmount.fromRawAmount(v2Pair.liquidityToken, "0")}
                                        />
                                    ))}
                                </>
                            ) : (
                                <Empty className="flex text-lg text-center text-low-emphesis">
                                    <div className="px-4 py-2">{`No liquidity was found. `}</div>
                                </Empty>
                            )}

                            {account && (
                                <div
                                    className={classNames(
                                        "grid gap-4",
                                        migrationSupported ? "grid-cols-3" : "grid-cols-2"
                                    )}
                                >
                                    <Button
                                        id="add-pool-button"
                                        color="gradient"
                                        className="grid items-center justify-center grid-flow-col gap-2 whitespace-nowrap"
                                        onClick={() => {
                                            updateAddTokensRouter(currencyId(NATIVE[chainId]), undefined)
                                            router.push(`/exchange/add`)
                                        }}
                                    >
                                        {`Add`}
                                    </Button>
                                    <Button
                                        id="add-pool-button"
                                        color="gray"
                                        onClick={() => router.push(`/exchange/find`)}
                                    >
                                        {`Import`}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Container>
            </DoubleGlowShadow>
        </>
    )
}
