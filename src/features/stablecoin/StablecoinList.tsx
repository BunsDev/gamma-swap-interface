import Dots from "../../components/Dots"
import React from "react"
import StablecoinListItem from "./StablecoinListItem"

const StablecoinList = ({ markets }) => {
    return markets && markets.length > 0 ? (
        <>
            <div className="grid grid-cols-5 text-base font-bold text-primary">
                <div className="flex items-center col-span-2 px-4 lg:col-span-1">{`ibToken`}</div>
                <div className="flex items-center px-2">{`Available`}</div>
                <div className="flex items-center px-2">{`Total Deposited`}</div>
                <div className="flex items-center justify-end flex px-4">{`APY`}</div>
            </div>
            <div className="flex-col mt-2">
                {markets.map((market, index) => (
                    <StablecoinListItem key={index} market={market} />
                ))}
            </div>
        </>
    ) : (
        <div className="w-full py-6 text-center">
            <Dots>{`Loading`}</Dots>
        </div>
    )
}

export default StablecoinList
