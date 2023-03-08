import { FC, useCallback } from "react"

import QuestionHelper from "../../components/QuestionHelper"
import { useDispatch } from "react-redux"
import { AppDispatch } from "../../state"
import { setOrderExpiration } from "../../state/limit-order/actions"
import { useLimitOrderState } from "../../state/limit-order/hooks"
import { OrderExpiration } from "../../state/limit-order/reducer"
import NeonSelect, { NeonSelectItem } from "../../components/Select"

const OrderExpirationDropdown: FC = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { orderExpiration } = useLimitOrderState()
    const items = {
        [OrderExpiration.never]: `Never`,
        [OrderExpiration.hour]: `1 Hour`,
        [OrderExpiration.day]: `24 Hours`,
        [OrderExpiration.week]: `1 Week`,
        [OrderExpiration.month]: `30 Days`,
    }

    const handler = useCallback(
        (e, item) => {
            dispatch(
                setOrderExpiration({
                    label: items[item],
                    value: item,
                })
            )
        },
        [dispatch, items]
    )

    return (
        <>
            <div className="flex items-center text-secondary gap-3 cursor-pointer">
                <div className="flex flex-row items-center">
                    <span className="text-sm">{`Order Expiration`}:</span>
                    <QuestionHelper text={`Expiration is the time at which the order will become invalid`} />
                </div>
                <NeonSelect value={orderExpiration.label}>
                    {Object.entries(items).map(([k, v]) => (
                        <NeonSelectItem key={k} value={k} onClick={handler}>
                            {v}
                        </NeonSelectItem>
                    ))}
                </NeonSelect>
            </div>
        </>
    )
}

export default OrderExpirationDropdown
