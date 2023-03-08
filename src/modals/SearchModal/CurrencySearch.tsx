import { ChainId, Currency, NATIVE, Token } from "../../sdk"
import React, { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { filterTokens, useSortedTokensByQuery } from "../../functions/filtering"
import { useAllTokens, useIsUserAddedToken, useSearchInactiveTokenLists, useToken } from "../../hooks/Tokens"

import AutoSizer from "react-virtualized-auto-sizer"
import Column from "../../components/Column"
import CommonBases from "./CommonBases"
import CurrencyList from "./CurrencyList"
import { FixedSizeList } from "react-window"
import ImportRow from "./ImportRow"
import ModalHeader from "../../components/ModalHeader"
import { isAddress } from "../../functions/validate"
import styled from "styled-components"

import { useActiveWeb3React } from "../../hooks/useActiveWeb3React"
import useDebounce from "../../hooks/useDebounce"

import { useOnClickOutside } from "../../hooks/useOnClickOutside"
import useToggle from "../../hooks/useToggle"
import { useTokenComparator } from "./sorting"

const ContentWrapper = styled(Column)`
    height: 100%;
    width: 100%;
    flex: 1 1;
    position: relative;
`

interface CurrencySearchProps {
    isOpen: boolean
    onDismiss: () => void
    selectedCurrency?: Currency | null
    onCurrencySelect: (currency: Currency) => void
    otherSelectedCurrency?: Currency | null
    showCommonBases?: boolean
    showManageView: () => void
    showImportView: () => void
    setImportToken: (token: Token) => void
    currencyList?: string[]
    includeNativeCurrency?: boolean
    allowManageTokenList?: boolean
}

export function CurrencySearch({
    selectedCurrency,
    onCurrencySelect,
    otherSelectedCurrency,
    showCommonBases,
    onDismiss,
    isOpen,
    showManageView,
    showImportView,
    setImportToken,
    currencyList,
    includeNativeCurrency = false,
    allowManageTokenList = false,
}: CurrencySearchProps) {
    const { chainId } = useActiveWeb3React()

    // refs for fixed size lists
    const fixedList = useRef<FixedSizeList>()

    const [searchQuery, setSearchQuery] = useState<string>("")
    const debouncedQuery = useDebounce(searchQuery, 200)

    const [invertSearchOrder] = useState<boolean>(false)

    let allTokens = useAllTokens()

    if (allTokens) {
        let _temp = {}
        for (const key in allTokens) {
            const token = allTokens[key]
            if (!token.symbol?.startsWith("ib") && !["tau", "wxdc"].includes(token.symbol?.toLowerCase())) {
                _temp[key] = token
            }
        }

        allTokens = _temp
    }

    if (currencyList) {
        allTokens = Object.keys(allTokens).reduce((obj, key) => {
            if (currencyList.includes(key)) obj[key] = allTokens[key]
            return obj
        }, {})
    }

    // if they input an address, use it
    const isAddressSearch = isAddress(debouncedQuery)
    const searchToken = useToken(debouncedQuery)
    const searchTokenIsAdded = useIsUserAddedToken(searchToken)
    const tokenComparator = useTokenComparator(invertSearchOrder)

    const filteredTokens: Token[] = useMemo(() => {
        return filterTokens(Object.values(allTokens), debouncedQuery)
    }, [allTokens, debouncedQuery])

    const sortedTokens: Token[] = useMemo(() => {
        return filteredTokens.sort(tokenComparator)
    }, [filteredTokens, tokenComparator])

    const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery)

    const ether = useMemo(() => chainId && NATIVE[chainId], [chainId])

    const filteredSortedTokensWithETH: Currency[] = useMemo(() => {
        const s = debouncedQuery.toLowerCase().trim()
        if (s === "" || s === "e" || s === "et" || s === "eth") {
            return ether ? [ether, ...filteredSortedTokens] : filteredSortedTokens
        }
        return filteredSortedTokens
    }, [debouncedQuery, ether, filteredSortedTokens])

    const handleCurrencySelect = useCallback(
        (currency: Currency) => {
            onCurrencySelect(currency)
            onDismiss()
        },
        [onDismiss, onCurrencySelect]
    )

    // clear the input on open
    useEffect(() => {
        if (isOpen) setSearchQuery("")
    }, [isOpen])

    // manage focus on modal show
    const inputRef = useRef<HTMLInputElement>()
    const handleInput = useCallback((event) => {
        const input = event.target.value
        const checksummedInput = isAddress(input)
        setSearchQuery(checksummedInput || input)
        fixedList.current?.scrollTo(0)
    }, [])

    const handleEnter = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                const s = debouncedQuery.toLowerCase().trim()
                if (s === "eth" && ether) {
                    handleCurrencySelect(ether)
                } else if (filteredSortedTokensWithETH.length > 0) {
                    if (
                        filteredSortedTokensWithETH[0].symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
                        filteredSortedTokensWithETH.length === 1
                    ) {
                        handleCurrencySelect(filteredSortedTokensWithETH[0])
                    }
                }
            }
        },
        [debouncedQuery, ether, filteredSortedTokensWithETH, handleCurrencySelect]
    )

    // menu ui
    const [open, toggle] = useToggle(false)
    const node = useRef<HTMLDivElement>()
    useOnClickOutside(node, open ? toggle : undefined)

    // if no results on main list, show option to expand into inactive
    const filteredInactiveTokens = useSearchInactiveTokenLists(
        filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined
    )

    return (
        <ContentWrapper>
            <ModalHeader onClose={onDismiss} title={`Select a token`} />
            {!currencyList && (
                <div className="mt-3 mb-8">
                    <input
                        type="text"
                        id="token-search-input"
                        placeholder={`Search name or paste address`}
                        autoComplete="off"
                        value={searchQuery}
                        ref={inputRef as RefObject<HTMLInputElement>}
                        onChange={handleInput}
                        onKeyDown={handleEnter}
                        className="w-full bg-transparent border border-dark-600 focus:border-dark-400 rounded placeholder-secondary focus:placeholder-primary font-bold text-base px-3 py-3"
                    />
                </div>
            )}
            {showCommonBases && false && (
                <div className="mb-4">
                    <CommonBases
                        chainId={chainId}
                        onSelect={handleCurrencySelect}
                        selectedCurrency={selectedCurrency}
                    />
                </div>
            )}

            {searchToken && !searchTokenIsAdded ? (
                <Column style={{ padding: "0px 0", height: "100%", justifyContent: "start" }}>
                    <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
                </Column>
            ) : filteredSortedTokens?.length > 0 || filteredInactiveTokens?.length > 0 ? (
                <div className="flex-1 h-full">
                    <AutoSizer disableWidth>
                        {({ height }) => (
                            <CurrencyList
                                height={height}
                                currencies={includeNativeCurrency ? filteredSortedTokensWithETH : filteredSortedTokens}
                                otherListTokens={filteredInactiveTokens}
                                onCurrencySelect={handleCurrencySelect}
                                otherCurrency={otherSelectedCurrency}
                                selectedCurrency={selectedCurrency}
                                fixedListRef={fixedList}
                                showImportView={showImportView}
                                setImportToken={setImportToken}
                            />
                        )}
                    </AutoSizer>
                </div>
            ) : (
                <Column style={{ padding: "20px", height: "100%" }}>
                    <div className="mb-8 text-center">{`No results found`}</div>
                </Column>
            )}
        </ContentWrapper>
    )
}
