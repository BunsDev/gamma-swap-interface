import Dots from "../../components/Dots"
import FarmListItem2 from "./FarmListItem2"
import React from "react"

import useSortableData from "../../hooks/useSortableData"

const FarmList = ({ farms, term, filter }) => {
    const { items } = useSortableData(farms)

    const singlePools = items.filter((i) => i.pair.token1).sort((a, b) => b.allocPoint - a.allocPoint)
    const liquidityPools = items.filter((i) => !i.pair.token1).sort((a, b) => b.allocPoint - a.allocPoint)
    const pools = singlePools.concat(liquidityPools)

    return items ? (
        <>
            <div className="grid grid-cols-4 text-base font-bold text-primary">
                <div className="flex items-center col-span-2 px-4 cursor-pointer md:col-span-1">
                    <div className="hover:text-high-emphesis">{`Stake`}</div>
                </div>
                <div className="flex items-center px-2 cursor-pointer hover:text-high-emphesis">{`TVL`}</div>
                <div className="items-center justify-start hidden px-2 md:flex hover:text-high-emphesis">
                    {`Allocation`}
                </div>
                <div className="flex items-center justify-end px-4 cursor-pointer hover:text-high-emphesis">
                    {`APR`}
                </div>
            </div>
            <div className="flex-col mt-2">
                {pools.map((farm, index) => (
                    <FarmListItem2 key={index} farm={farm} />
                ))}
            </div>
        </>
    ) : (
        <div className="w-full py-6 text-center">{term ? <span>{`No Results`}</span> : <Dots>{`Loading`}</Dots>}</div>
    )
}

export default FarmList
