import Badge from "../../components/Badge"
import { ChainId } from "../../sdk"
import NavLink from "../../components/NavLink"
import React from "react"
import { useActiveWeb3React } from "../../hooks"

import Search from "../../components/Search"

const MenuItem = ({ href, title }) => {
    return (
        <NavLink
            exact
            href={href}
            activeClassName="font-bold bg-transparent border rounded text-high-emphesis border-transparent border-gradient-r-purple-dark-900"
        >
            <a className="flex items-center justify-between px-6 py-6  text-base font-bold border border-transparent rounded cursor-pointer bg-dark-800">
                {title}
            </a>
        </NavLink>
    )
}
const Menu = ({ positionsLength, onSearch, term }) => {
    const { account, chainId } = useActiveWeb3React()

    return (
        <div className={`grid grid-cols-12`}>
            <div className="col-span-12 flex flex-col space-y-4">
                <MenuItem href="/farm" title={`All Farms`} />
                {account && positionsLength > 0 && <MenuItem href={`/farm?filter=my`} title={`My Farms`} />}

                {/* <MenuItem href="/farm?filter=solar" title="SOLAR Farms" />
        <MenuItem href="/farm?filter=moonriver" title="MOVR Farms" />
        <MenuItem href="/farm?filter=stables" title="Stables Farms" />
        <MenuItem href="/farm?filter=single" title="Single Asset" /> */}
            </div>
        </div>
    )
}

export default Menu
