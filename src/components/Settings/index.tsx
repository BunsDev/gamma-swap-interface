import React, { useRef, useState } from "react"
import {
    useExpertModeManager,
    useUserArcherUseRelay,
    useUserSingleHopOnly,
    useUserTransactionTTL,
} from "../../state/user/hooks"
import { useModalOpen, useToggleSettingsMenu } from "../../state/application/hooks"

import { ApplicationModal } from "../../state/application/actions"
import Button from "../Button"
import Modal from "../Modal"
import ModalHeader from "../ModalHeader"
import { ChainId, Percent } from "../../sdk"
import QuestionHelper from "../QuestionHelper"
import Toggle from "../Toggle"
import TransactionSettings from "../TransactionSettings"
import Typography from "../Typography"

import { useOnClickOutside } from "../../hooks/useOnClickOutside"
import { useActiveWeb3React } from "../../hooks"
import settings from "../../animation/settings-slider.json"
import HoverLottie from "../HoverLottie"

export default function SettingsTab({ placeholderSlippage }: { placeholderSlippage?: Percent }) {
    const { chainId } = useActiveWeb3React()

    const node = useRef<HTMLDivElement>(null)
    const open = useModalOpen(ApplicationModal.SETTINGS)
    const toggle = useToggleSettingsMenu()

    const [expertMode, toggleExpertMode] = useExpertModeManager()

    const [singleHopOnly, setSingleHopOnly] = useUserSingleHopOnly()

    // show confirmation view before turning on
    const [showConfirmation, setShowConfirmation] = useState(false)

    useOnClickOutside(node, open ? toggle : undefined)

    const [ttl, setTtl] = useUserTransactionTTL()

    const [userUseArcher, setUserUseArcher] = useUserArcherUseRelay()

    return (
        <div className="flex relative" ref={node}>
            <div
                className="rounded h-8 w-8 flex items-center justify-center cursor-pointer"
                onClick={toggle}
                id="open-settings-dialog-button"
            >
                <HoverLottie animationData={settings} className="w-[32px] h-[32px] transform rotate-90" />
            </div>
            {open && (
                <div className="absolute top-14 right-0 z-50 -mr-2.5 min-w-20 md:m-w-22 md:-mr-5 bg-dark-900 border-2 border-dark-800 rounded w-80 shadow-lg">
                    <div className="p-4 space-y-4">
                        <Typography weight={700} className="text-high-emphesis">
                            {`Transaction Settings`}
                        </Typography>

                        <TransactionSettings placeholderSlippage={placeholderSlippage} />

                        <Typography className="text-high-emphesis" weight={700}>
                            {`Interface Settings`}
                        </Typography>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <Typography variant="sm" className="text-primary">
                                    {`Toggle Expert Mode`}
                                </Typography>
                                <QuestionHelper
                                    text={`Bypasses confirmation modals and allows high slippage trades. Use at your own risk.`}
                                />
                            </div>
                            <Toggle
                                id="toggle-expert-mode-button"
                                isActive={expertMode}
                                toggle={
                                    expertMode
                                        ? () => {
                                              toggleExpertMode()
                                              setShowConfirmation(false)
                                          }
                                        : () => {
                                              toggle()
                                              setShowConfirmation(true)
                                          }
                                }
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <Typography variant="sm" className="text-primary">
                                    {`Disable Multihops`}
                                </Typography>
                                <QuestionHelper text={`Restricts swaps to direct pairs only.`} />
                            </div>
                            <Toggle
                                id="toggle-disable-multihop-button"
                                isActive={singleHopOnly}
                                toggle={() => (singleHopOnly ? setSingleHopOnly(false) : setSingleHopOnly(true))}
                            />
                        </div>
                        {chainId == ChainId.MAINNET && (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <Typography variant="sm" className="text-primary">
                                        {`MEV Shield by Archer DAO`}
                                    </Typography>
                                    <QuestionHelper
                                        text={`Send transaction privately to avoid front-running and sandwich attacks. Requires a miner tip to incentivize miners`}
                                    />
                                </div>
                                <Toggle
                                    id="toggle-use-archer"
                                    isActive={userUseArcher}
                                    toggle={() => setUserUseArcher(!userUseArcher)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Modal isOpen={showConfirmation} onDismiss={() => setShowConfirmation(false)}>
                <div className="space-y-4">
                    <ModalHeader title={`Are you sure?`} onClose={() => setShowConfirmation(false)} />
                    <Typography variant="lg">
                        {`Expert mode turns off the confirm transaction prompt and allows high slippage trades
                                that often result in bad rates and lost funds.`}
                    </Typography>
                    <Typography variant="sm" className="font-medium">
                        {`ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING.`}
                    </Typography>
                    <Button
                        color="red"
                        size="lg"
                        onClick={() => {
                            if (window.prompt(`Please type the word "confirm" to enable expert mode.`) === "confirm") {
                                toggleExpertMode()
                                setShowConfirmation(false)
                            }
                        }}
                    >
                        <Typography variant="lg" id="confirm-expert-mode">
                            {`Turn On Expert Mode`}
                        </Typography>
                    </Button>
                </div>
            </Modal>
        </div>
    )
}
