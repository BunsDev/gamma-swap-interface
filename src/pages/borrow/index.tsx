/* eslint-disable @next/next/link-passhref */
import { useActiveWeb3React, useFuse } from "../../hooks"

import Head from "next/head"
import React, { useContext, useEffect, useState } from "react"
import Card from "../../components/Card"

import DoubleGlowShadow from "../../components/DoubleGlowShadow"
import { AVERAGE_BLOCK_TIME } from "../../constants"
import { VAULTS } from "../../constants/vaults"
import TauLogo from "../../components/TauLogo"
import BorrowVaultList from "../../features/borrow-vault/BorrowVaultList"
import { getBorrowMarkets } from "../../state/web3/vaults"
import { useWeb3React } from "@web3-react/core"

export default function Vault(): JSX.Element {
    const { account } = useWeb3React()
    const { chainId } = useActiveWeb3React()
    const [markets, setMarkets] = useState([])
    const vaults = markets

    useEffect(() => {
        getBorrowMarkets(account).then((res) => setMarkets(res))
    }, [account])

    const map = (pool) => {
        pool.owner = "Tau"
        pool.balance = 0

        const pair = VAULTS[chainId][pool.id]

        const blocksPerHour = 3600 / AVERAGE_BLOCK_TIME[chainId]

        return {
            ...pool,
            pair: {
                ...pair,
                decimals: 18,
            },
            blocksPerHour,
        }
    }
    const data = vaults.map(map)

    return (
        <>
            <Head>
                <title>Borrow | Gamma</title>
                <meta key="description" name="description" content="Borrowing Vaults" />
            </Head>

            <div className="container px-0 mx-auto pb-6">
                <div className={`mb-2 pb-4 grid grid-cols-12 gap-4`}>
                    <div className="flex justify-center items-center col-span-12 lg:justify">
                        <TauLogo />
                    </div>
                </div>

                <DoubleGlowShadow maxWidth={false} opacity={"0.4"}>
                    <div className={`grid grid-cols-12 gap-2 min-h-1/2`}>
                        <div className={`col-span-12`}>
                            <Card className="bg-dark-900 z-4">
                                <div className={`grid grid-cols-12 md:space-x-4 space-y-4 md:space-y-0 `}>
                                    <div className={`col-span-12 md:col-span-3 space-y-4`}>
                                        <div className={`hidden md:block`}>
                                            <div className={`col-span-12 md:col-span-4 bg-dark-800 px-6 py-4 rounded`}>
                                                <div className="mb-2 text-2xl text-emphesis">{`Borrowing Vault`}</div>
                                                <div className="mb-4 text-base text-secondary">
                                                    <p>
                                                        {`The Gamma Borrowing Vault is a set of high incentivized borrowing pools. Lenders may borrow up to 80%
                                                          of the value of their deposited collateral.`}
                                                    </p>
                                                    <p className="mt-2">
                                                        {`Borrowed assets earn interest which you must pay when repaying your loan. You will not be able to withdraw 
                                                          your deposited collateral until you've repayed any outstanding loans.`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={`col-span-12 md:col-span-9 bg-dark-800    py-4 md:px-6 md:py-4 rounded`}
                                    >
                                        <BorrowVaultList markets={data} />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </DoubleGlowShadow>
            </div>
        </>
    )
}
