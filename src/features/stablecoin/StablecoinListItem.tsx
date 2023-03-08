import { Disclosure } from "@headlessui/react"
import DoubleLogo from "../../components/DoubleLogo"
import BorrowVaultListItemDetails from "./StablecoinListItemDetails"
import React, { useContext, useEffect, useState } from "react"
import { useCurrency } from "../../hooks/Tokens"
import { useActiveWeb3React } from "../../hooks"

import CurrencyLogo from "../../components/CurrencyLogo"
import { isMobile } from "react-device-detect"

import { classNames, formatNumber, formatNumberScale, formatPercent } from "../../functions"

const StablecoinVaultListItem = ({ market, ...rest }) => {
    const { chainId } = useActiveWeb3React()

    let token0 = useCurrency(market.pair.token0?.id)
    let token1 = useCurrency(market.pair.token1?.id)

    return (
        <React.Fragment>
            <Disclosure {...rest}>
                {({ open }) => (
                    <div className="mb-4">
                        <Disclosure.Button
                            className={classNames(
                                open && "rounded-b-none",
                                "w-full px-4 py-6 text-left rounded cursor-pointer select-none bg-dark-700    text-primary text-sm md:text-lg"
                            )}
                        >
                            <div className="grid grid-cols-5 ">
                                <div className="flex col-span-2 space-x-4 lg:col-span-1">
                                    {token1 ? (
                                        <DoubleLogo currency0={token0} currency1={token1} size={isMobile ? 32 : 40} />
                                    ) : (
                                        <div className="flex items-center">
                                            <CurrencyLogo currency={token0} size={isMobile ? 40 : 50} />
                                        </div>
                                    )}
                                    <div className={`flex flex-col justify-center ${token1 ? "md:flex-row" : ""}`}>
                                        <div>
                                            <span className="flex font-bold">{market?.pair?.token0?.symbol}</span>
                                            {token1 && (
                                                <span className="flex font-bold">{market?.pair?.token1?.symbol}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Available */}
                                {/* <div className="flex flex-col justify-center font-bold">
                                    {formatNumberScale(market.available, true, 2)}
                                </div> */}

                                {/* Liquidity */}
                                <div className="flex flex-col justify-center font-bold">
                                    {formatNumberScale(market.available, true, 2)}
                                </div>

                                {/* Total Borrowed */}
                                <div className="flex flex-col justify-center font-bold">
                                    {formatNumberScale(market.totalBorrowed, true, 2)}
                                </div>

                                {/* Stablecoin APY */}
                                <div className="flex flex-col items-end justify-center" style={{ color: "red" }}>
                                    <div className="font-bold flex justify items-center text-righttext-high-emphesis">
                                        {formatPercent(market.stablecoinAPY)}
                                    </div>
                                    <div className="text-xs text-right md:text-base text-secondary">{`annualized`}</div>
                                </div>
                            </div>
                        </Disclosure.Button>

                        {open && <BorrowVaultListItemDetails farm={market} />}
                    </div>
                )}
            </Disclosure>
        </React.Fragment>
    )
}

export default StablecoinVaultListItem
