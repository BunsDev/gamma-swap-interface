import { Token, WNATIVE } from "../Token"

import { Currency } from "../Currency"
import { NativeCurrency } from "../NativeCurrency"
import invariant from "tiny-invariant"

export class Apothem extends NativeCurrency {
    public readonly address: string
    protected constructor(chainId: number) {
        super(chainId, 18, "wFTM", "Wrapped XDC")
    }

    public get wrapped(): Token {
        const wnative = WNATIVE[this.chainId]
        invariant(!!wnative, "WRAPPED")
        return wnative
    }

    private static _cache: { [chainId: number]: Apothem } = {}

    public static onChain(chainId: number): Apothem {
        return this._cache[chainId] ?? (this._cache[chainId] = new Apothem(chainId))
    }

    public equals(other: Currency): boolean {
        return other.isNative && other.chainId === this.chainId
    }

    public sortsBefore(other: Token): boolean {
        return false
    }
}
