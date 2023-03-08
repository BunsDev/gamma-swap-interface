import React from "react"

import NavLink from "../NavLink"
import { Popover } from "@headlessui/react"
import Web3Status from "../Web3Status"
import { useActiveWeb3React } from "../../hooks/useActiveWeb3React"

function AppBar(): JSX.Element {
    const { chainId } = useActiveWeb3React()

    return (
        <header className="flex-shrink-0 w-full">
            <Popover as="nav" className="z-10 w-full bg-transparent">
                {({ open }) => (
                    <div className="px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="hidden sm:block sm:ml-4">
                                    <div className="flex space-x-2">
                                        <NavLink href="/exchange/swap">
                                            <a
                                                id={`swap-nav-link`}
                                                className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                                            >
                                                {`Swap`}
                                            </a>
                                        </NavLink>
                                        <NavLink href="/exchange/pool">
                                            <a
                                                id={`pool-nav-link`}
                                                className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                                            >
                                                {`Pool`}
                                            </a>
                                        </NavLink>
                                        <NavLink href={"/farm"}>
                                            <a
                                                id={`farm-nav-link`}
                                                className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                                            >
                                                {`Farm`}
                                            </a>
                                        </NavLink>
                                        <NavLink href={"/lend"}>
                                            <a
                                                id={`lend-vaults-nav-link`}
                                                className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                                            >
                                                {`Lend`}
                                            </a>
                                        </NavLink>
                                        <NavLink href={"/borrow"}>
                                            <a
                                                id={`borrow-vaults-nav-link`}
                                                className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                                            >
                                                {`Borrow`}
                                            </a>
                                        </NavLink>
                                        <NavLink href={"/stablecoin"}>
                                            <a
                                                id={`farm-nav-link`}
                                                className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                                            >
                                                {`Stablecoin`}
                                            </a>
                                        </NavLink>
                                        <NavLink href={"/bridge"}>
                                            <a className="p-2 text-base text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap">
                                                {`Bridge`}
                                            </a>
                                        </NavLink>
                                    </div>
                                </div>
                            </div>

                            <div className="fixed bottom-0 left-0 z-10 flex flex-row items-center justify-center w-full p-4 lg:w-auto bg-dark-1000 lg:relative lg:p-0 lg:bg-transparent">
                                <div className="flex items-center justify-between w-full space-x-2 sm:justify-end">
                                    <div className="w-auto flex items-center rounded bg-transparent shadow-sm text-primary text-xs hover:bg-dark-900 whitespace-nowrap text-xs font-bold cursor-pointer select-none pointer-events-auto">
                                        <Web3Status />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Popover>
        </header>
    )
}

export default AppBar
