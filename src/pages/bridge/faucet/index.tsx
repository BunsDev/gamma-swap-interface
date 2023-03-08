/* eslint-disable @next/next/link-passhref */
import Head from "next/head"
import React, { useCallback, useState } from "react"

import { ButtonError } from "../../../components/Button"
import { AutoColumn } from "../../../components/Column"
import { AutoRow } from "../../../components/Row"
import DoubleGlowShadow from "../../../components/DoubleGlowShadow"
import TauLogo from "../../../components/TauLogo"
import Container from "../../../components/Container"
import Typography from "../../../components/Typography"

import { useActiveWeb3React } from "../../../hooks"
import Web3Connect from "../../../components/Web3Connect"
import { Loader } from "react-feather"
import NavLink from "../../../components/NavLink"
import { useTransactionAdder } from "../../../state/transactions/hooks"
import { faucet } from "../../../state/web3/bridge"

export default function Faucet(): JSX.Element {
    const { account } = useActiveWeb3React()
    const [pendingTx, setPendingTx] = useState(false)
    const [requested, setRequested] = useState(false)
    const addTransaction = useTransactionAdder()

    const [faucetResult, setFaucetResult] = useState({ status: 200, message: null })

    const handleRequest = async () => {
        setPendingTx(true)

        try {
            const tx = await faucet(account)

            addTransaction(
                { hash: tx.transactionHash },
                {
                    summary: `Faucet`,
                }
            )
        } catch (err) {
            console.error(err)
            setRequested(false)
        } finally {
            setPendingTx(false)
        }
    }

    return (
        <>
            <Head>
                <title>Faucet | Gamma</title>
                <meta key="description" name="description" content="Moonriver Faucet" />
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
                        <div className="h-[570px] flex flex-col justify-center items-center">
                            <div className="p-4 mb-3 space-y-3 text-center">
                                <Typography component="h1" variant="base">
                                    The faucet provides you with some test tokens for you to test out this app. These
                                    tokens do not have any value, and only exist on Fantom Testnet. Use it wisely!
                                </Typography>
                            </div>

                            <AutoColumn gap={"md"}>
                                <div className={"flex items-center w-full"}>
                                    {!account ? (
                                        <Web3Connect size="lg" color="gradient" className="w-full" />
                                    ) : (
                                        <ButtonError
                                            className="font-bold text-light"
                                            onClick={handleRequest}
                                            style={{
                                                width: "100%",
                                            }}
                                            disabled={pendingTx || requested}
                                        >
                                            {pendingTx ? (
                                                <div>
                                                    <AutoRow gap="6px" justify="center" align="center">
                                                        Requesting <Loader stroke="white" />
                                                    </AutoRow>
                                                </div>
                                            ) : (
                                                `Give me some tokens!`
                                            )}
                                        </ButtonError>
                                    )}
                                </div>
                            </AutoColumn>
                            <div className="p-4 mb-3 space-y-3 text-center">
                                {faucetResult?.message && (
                                    <Typography
                                        component="h1"
                                        variant="base"
                                        className={`${faucetResult?.status == 200 ? "text-green" : "text-red"}`}
                                    >
                                        {faucetResult?.message}
                                    </Typography>
                                )}
                            </div>
                        </div>
                    </div>
                </DoubleGlowShadow>
            </Container>
        </>
    )
}
