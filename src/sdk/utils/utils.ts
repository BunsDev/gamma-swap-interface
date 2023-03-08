export const ADD_JSON_STORAGE = "add-tokens"

export function updateAddTokensRouter(tokenA: string, tokenB: string) {
    localStorage.setItem(ADD_JSON_STORAGE, JSON.stringify({ tokens: [tokenA, tokenB] }))
}
