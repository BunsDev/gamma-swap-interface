# Gamma

# Demo

* [Website](https://gamma-fantom.vercel.app/)
* [Demo video](https://youtu.be/7jS80-Zq95E)


# What is Gamma?

Gamma introduces a next-gen decentralized exchange providing liquidity, an auto-farming stablecoin, and enabling peer-to-peer transactions on the Fantom network. 
Gamma allows users on the [Fantom Network](https://fantom.foundation/) to trade directly from their wallets rather than through a 3rd-party -- your tokens never leave your custody, and are 100% owned by you. Further, low trading fees and high liquidity makes Gamma an attractive platform to trade with, and also helps provide a broad range of support to various facets of the Fantom community -- to continuously adapt to the changing markets by continuing to provide value to both token holders and the community. Gamma provides the following features:

1. High-efficiency swapping (fork of Uniswap; made more gas-efficient)
2. Yield Farming
3. Capital-efficient Lending & Borrowing Protocol
4. Auto-farming Stablecoin (`gamUSD`)
5. Secure Cross-chain Bridge



# 1. Swapping Crypto

Quickly swap crypto tokens on Fantom. Gamma's implementation is a more gas-optimized version of [Uniswap v2](https://uniswap.org/blog/uniswap-v2). You can also add liquidity to the various pools supported to further strengthen the protocol. 


[Try swapping crypto on Fantom](https://gamma-fantom.vercel.app/).



# 2. Yield Farming

With the liquidity pool tokens you receive when you supply liquidity, you can choose to farm these tokens in our high-yield farm vaults. In return, you receive an amount (scaled by demand) of `GAMMA` tokens, which are governance tokens on Gamma. The longer you stake your liquidity pool tokens, the more amount of `GAMMA` you will receive.


[Try yield farming on Fantom](https://gamma-fantom.vercel.app/farm).



# 3. Lending & Borrowing

Gamma introduces an institution-grade DeFi borrowing and lending protocol featuring ***permissionless*** liquidity pools, allowing anyone to lend and borrow assets at high APYs. The source code for Gamma's Lending & Borrowing protocol is [*massive* and *rigorously-tested*. Have a glance; I won't disappoint ;)](https://github.com/lugadaug/gamma/blob/dev/contracts/contracts/vaults/GammaVault.sol).


### Some points

1. Lenders receive an amount of interest-bearing tokens (`ibTokens`) which continously earn interest through their exchange rate. In addition, lenders may choose to mint the `gamUSD` stablecoin by depositing `ibTokens` (more on this later).
1. Borrowers pay 0.1% of the borrowed amount as an "origination" fee, which is added to the total borrow amount in its respective RToken.
2. Liquidations carry a 10% fee paid directly to the liquidator.
3. All transactions occur on the [Fantom Network](https://fantom.foundation/).


[Try lending/borrowing on Fantom](https://gamma-fantom.vercel.app/lend).


# 4. Stablecoin (`gamUSD`)

`gamUSD` is an *overcollateralized*, *auto-farming* stablecoin reinforced with **multi-layered pegging mechanisms** to maintain its peg at $1. Lenders on Gamma collateralize their `ibTokens` to borrow `gamUSD` (issued 1:1). Thus, lenders are able to continue earning high lending APR, while also borrowing `gamUSD` to use as they see fit. This, we believe, unlocks even higher profit potential and greatly increases the flexibility of user's capital. 

`gamUSD` is a mini-fork of the battle-tested MakerDAO, with the following improvements:

1. **Farmable Collateral**: For most lending protocols, users have to decide between staking their assets to earn yield, or staking their assets as collateral to borrow against. With Gamma, users don't need to make this tradeoff -- users can deposit their assets as collateral to borrow `gamUSD`, while also continuing to earn juicy lending APY. Also, because the lending APY for most vaults are much higher than the stability fee for `gamUSD` (2.5%), these loans are effectively better than interest-free: they are yield-bearing, auto-farming loans!

2. **Efficient Pegging**: Just being overcollateralized is not enough to maintain a stable peg. The protocol takes inspiration from MakerDAO, and automatically adjusts borrowing interest up/down to decrease/increase selling pressure depending on which side of $1 the collateral value falls to.

3. **Gentle Liquidation**: `gamUSD` has gentle liquidation, meaning that when a `gamUSD` borrowing position faces liquidation, only a *small* portion of the position is liquidated until it is brought back to health. This model results in lower associated costs and liquidation risk for `gamUSD` borrowers.

[Try minting `gamUSD` on Fantom](https://gamma-fantom.vercel.app/stablecoin).


# 5. Cross-Chain Bridge

Gamma has a secure, cross-chain bridge to facilitate interoperability between Fantom and other chains (such as Polygon). Currently, Gamma supports Fantom <=> Polygon Mumbai, with more chains being supported very soon. Bridging to and from non-EVM compatible networks is also possible with Gamma's unique bridging mechanism.

[Try bridging assets from Fantom to Polygon Mumbai](https://gamma-fantom.vercel.app/bridge).