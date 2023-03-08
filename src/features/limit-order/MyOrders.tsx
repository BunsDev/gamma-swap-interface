import React, { FC } from "react"
import Badge from "../../components/Badge"
import useLimitOrders from "../../hooks/useLimitOrders"

import NavLink from "../../components/NavLink"
import HoverLottie from "../../components/HoverLottie"
import orderHistoryJson from "../../animation/order-history.json"

const MyOrders: FC = () => {
    const { pending } = useLimitOrders()

    return (
        <NavLink href="/open-order">
            <a className="text-secondary hover:text-high-emphesis">
                <div className="md:flex hidden gap-3 items-center">
                    <div>{`My Orders`}</div>
                    <Badge color="blue">{pending.totalOrders}</Badge>
                </div>
                <div className="flex md:hidden">
                    <HoverLottie animationData={orderHistoryJson} className="w-[32px] h-[32px]" />
                </div>
            </a>
        </NavLink>
    )
}

export default MyOrders
