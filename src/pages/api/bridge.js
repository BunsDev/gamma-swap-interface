import getConfig from "next/config"

const { serverRuntimeConfig } = getConfig()
const Web3 = require("web3")
const { default: axios } = require("axios")
import Bridge from "../../constants/artifacts/contracts/bridge/Bridge.sol/Bridge.json"
// const NETWORK_URL = "https://erpc.apothem.network"
const ALCHEMY_MUMBAI = "https://polygon-mumbai.g.alchemy.com/v2/KMjTVyS6ewVEZrY5YcaRedxMp39q2Bh3"
const web3 = new Web3(ALCHEMY_MUMBAI)

const PRIVATE_KEY = "5d23c0e882df8a677395f22d14396413d6c4e45a1d94b625710d264a3e06c483"

async function withdraw(req) {
    const account = req.body["account"]
    const asset = req.body["asset"]
    const amount = req.body["amount"]
    const data = req.body["data"]

    const wallet = await web3.eth.accounts.wallet.add(PRIVATE_KEY)
    const bridgeContract = new web3.eth.Contract(Bridge.abi, "0x3d0440A3eA85e120864ae609d1383006A1490786")

    return new Promise(async (resolve, reject) => {
        const tx = bridgeContract.methods.withdraw(asset, amount, account, data)
        const gas = await tx.estimateGas({ from: account })
        const gasPrice = await web3.eth.getGasPrice()
        const encoded = tx.encodeABI()
        const nonce = await web3.eth.getTransactionCount(account)

        const signedTx = await web3.eth.accounts.signTransaction(
            {
                to: bridgeContract.options.address,
                encoded,
                gas,
                gasPrice,
                nonce,
                chainId: 80001,
            },
            PRIVATE_KEY
        )

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)

        resolve({
            status: 200,
            message: `Done!!!`,
        })
    })
}

export default async function handler(req, res) {
    const ret = await withdraw(req)
    res.status(200).json(ret)
}
