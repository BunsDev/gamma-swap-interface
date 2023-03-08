import Web3 from "web3"

export function setup() {
    return new Web3((window as any).ethereum)
}

export function fromDecimals(num: string, decimals: number = 18) {
    let str: any = "ether"
    if (decimals === 12) str = "szabo"
    if (decimals === 6) str = "mwei"

    const web3 = setup()
    return web3.utils.fromWei(num, str).toString()
}

export function toDecimals(num: string, decimals: number = 18) {
    let str: any = "ether"
    if (decimals === 12) str = "szabo"
    if (decimals === 6) str = "mwei"

    const web3 = setup()
    return web3.utils.toWei(num, str).toString()
}
