import "../bootstrap"
import "../styles/index.css"
import "@fontsource/dm-sans/index.css"
import "react-virtualized/styles.css"
import "react-tabs/style/react-tabs.css"
import "react-datetime/css/react-datetime.css"

import React, { Fragment, FunctionComponent } from "react"
import { NextComponentType, NextPageContext } from "next"

import type { AppProps } from "next/app"
import ApplicationUpdater from "../state/application/updater"
import DefaultLayout from "../layouts/Default"
import Head from "next/head"
import ListsUpdater from "../state/lists/updater"
import MulticallUpdater from "../state/multicall/updater"
import { PersistGate } from "redux-persist/integration/react"
import ReactGA from "react-ga"
import { Provider as ReduxProvider } from "react-redux"
import TransactionUpdater from "../state/transactions/updater"
import UserUpdater from "../state/user/updater"
import Web3ReactManager from "../components/Web3ReactManager"
import { createWeb3ReactRoot, Web3ReactProvider } from "@web3-react/core"
import dynamic from "next/dynamic"
import getLibrary from "../functions/getLibrary"

import store from "../state"
import { useEffect } from "react"
import { useRouter } from "next/router"
import PriceProvider from "../contexts/priceContext"
import FarmContext from "../contexts/farmContext"
import { usePricesApi } from "../features/farm/hooks"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"

const Web3ProviderNetwork = dynamic(() => import("../components/Web3ProviderNetwork"), { ssr: false })
const Web3ProviderNetworkBridge = dynamic(() => import("../components/Web3ProviderBridge"), { ssr: false })

if (typeof window !== "undefined" && !!window.ethereum) {
    window.ethereum.autoRefreshOnNetworkChange = false
}

function MyApp({
    Component,
    pageProps,
}: AppProps & {
    Component: NextComponentType<NextPageContext> & {
        Guard: FunctionComponent
        Layout: FunctionComponent
        Provider: FunctionComponent
    }
}) {
    const router = useRouter()
    const { pathname, query } = router

    // Allows for conditionally setting a provider to be hoisted per page
    const Provider = Component.Provider || Fragment
    // Allows for conditionally setting a layout to be hoisted per page
    const Layout = Component.Layout || DefaultLayout
    // Allows for conditionally setting a guard to be hoisted per page
    const Guard = Component.Guard || Fragment

    return (
        <Fragment>
            <Head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta
                    name="viewport"
                    content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
                />
                <title key="title">Gamma | Decentralized Exchange & Peer-to-Peer Transactions on Fantom</title>
                <meta key="description" name="description" content="Tau - AMM on Fantom" />
            </Head>

            <Web3ReactProvider getLibrary={getLibrary}>
                <Web3ProviderNetwork getLibrary={getLibrary}>
                    <Web3ProviderNetworkBridge getLibrary={getLibrary}>
                        <Web3ReactManager>
                            <ReduxProvider store={store}>
                                <PriceProvider>
                                    <ListsUpdater />
                                    <UserUpdater />
                                    <ApplicationUpdater />
                                    <TransactionUpdater />
                                    <MulticallUpdater />

                                    <Provider>
                                        <Layout>
                                            <Guard>
                                                <Component {...pageProps} />
                                            </Guard>
                                        </Layout>
                                    </Provider>
                                </PriceProvider>
                            </ReduxProvider>
                        </Web3ReactManager>
                    </Web3ProviderNetworkBridge>
                </Web3ProviderNetwork>
            </Web3ReactProvider>
        </Fragment>
    )
}

export default MyApp
