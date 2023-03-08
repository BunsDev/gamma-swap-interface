// import { keccak256, pack } from '@ethersproject/solidity'
// import { INIT_CODE_HASH } from '../constants'
// import { getCreate2Address } from '@ethersproject/address'
import { Token, ZERO_ADDRESS } from "../sdk"

export function getTokensFromPairAddress(pairAddress: string) {
    // getDeployedAddresses()

    let token = `${ZERO_ADDRESS}-${ZERO_ADDRESS}`

    switch (pairAddress) {
        case "0xdac7747464B3C4407f867feFFDD1094b45F4d3e1": {
            token = "0x3d0440A3eA85e120864ae609d1383006A1490786-0x935B30d75F57659CF41Bd868A8032E58Fe53C369"
            break
        }
        case "0xdac7747464B3C4407f867feFFDD1094b45F4d3e1": {
            token = "0x935B30d75F57659CF41Bd868A8032E58Fe53C369-0x3d0440A3eA85e120864ae609d1383006A1490786"
            break
        }
        case "0x070716d7d94A45Eb5E9530949BDAD2b763cd912D": {
            token = "0x3d0440A3eA85e120864ae609d1383006A1490786-0xBc43C5D55d936cA74dB498a123433eb9EcA0882D"
            break
        }
        case "0x070716d7d94A45Eb5E9530949BDAD2b763cd912D": {
            token = "0xBc43C5D55d936cA74dB498a123433eb9EcA0882D-0x3d0440A3eA85e120864ae609d1383006A1490786"
            break
        }
        case "0xBa1462cbc3077EE35e955a78A4684a2AF7dC2ABe": {
            token = "0x3d0440A3eA85e120864ae609d1383006A1490786-0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613"
            break
        }
        case "0xBa1462cbc3077EE35e955a78A4684a2AF7dC2ABe": {
            token = "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613-0x3d0440A3eA85e120864ae609d1383006A1490786"
            break
        }
        case "0xC3fe0f555c1050Bd35b5063f4DF9E97c5891dDCF": {
            token = "0x935B30d75F57659CF41Bd868A8032E58Fe53C369-0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc"
            break
        }
        case "0xC3fe0f555c1050Bd35b5063f4DF9E97c5891dDCF": {
            token = "0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc-0x935B30d75F57659CF41Bd868A8032E58Fe53C369"
            break
        }
        case "0xf943bF7FaF237E460adffF85b642Df7C39e1Cf71": {
            token = "0x935B30d75F57659CF41Bd868A8032E58Fe53C369-0xBc43C5D55d936cA74dB498a123433eb9EcA0882D"
            break
        }
        case "0xf943bF7FaF237E460adffF85b642Df7C39e1Cf71": {
            token = "0xBc43C5D55d936cA74dB498a123433eb9EcA0882D-0x935B30d75F57659CF41Bd868A8032E58Fe53C369"
            break
        }
        case "0x6D3E824D3Ef7eE706324eFdB199209a7A7AdDdFe": {
            token = "0x935B30d75F57659CF41Bd868A8032E58Fe53C369-0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613"
            break
        }
        case "0x6D3E824D3Ef7eE706324eFdB199209a7A7AdDdFe": {
            token = "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613-0x935B30d75F57659CF41Bd868A8032E58Fe53C369"
            break
        }
        case "0xC20dd02FE4acfBBcbaE64F72939Ab50Fc8f24CFA": {
            token = "0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc-0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613"
            break
        }
        case "0xC20dd02FE4acfBBcbaE64F72939Ab50Fc8f24CFA": {
            token = "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613-0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc"
            break
        }
        case "0x6eA94f53A2f95b48F9A6bDbcD082bBf5700de853": {
            token = "0xBc43C5D55d936cA74dB498a123433eb9EcA0882D-0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613"
            break
        }
        case "0x6eA94f53A2f95b48F9A6bDbcD082bBf5700de853": {
            token = "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613-0xBc43C5D55d936cA74dB498a123433eb9EcA0882D"
            break
        }
    }

    return token.split("-")
}

export const computePairAddress = ({
    factoryAddress,
    tokenA,
    tokenB,
}: {
    factoryAddress: string
    tokenA: Token
    tokenB: Token
}): string => {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks

    // const pairs = DEPLOYMENTS

    const mixedAddress = `${token0.address}-${token1.address}`
    let address = ZERO_ADDRESS
    // try {
    //     address = pairs[mixedAddress]
    // } catch(err) { }

    // console.debug("Found pair address:", address)

    switch (mixedAddress) {
        case "0x3d0440A3eA85e120864ae609d1383006A1490786-0x935B30d75F57659CF41Bd868A8032E58Fe53C369": {
            address = "0xdac7747464B3C4407f867feFFDD1094b45F4d3e1"
            break
        }
        case "0x935B30d75F57659CF41Bd868A8032E58Fe53C369-0x3d0440A3eA85e120864ae609d1383006A1490786": {
            address = "0xdac7747464B3C4407f867feFFDD1094b45F4d3e1"
            break
        }
        case "0x3d0440A3eA85e120864ae609d1383006A1490786-0xBc43C5D55d936cA74dB498a123433eb9EcA0882D": {
            address = "0x070716d7d94A45Eb5E9530949BDAD2b763cd912D"
            break
        }
        case "0xBc43C5D55d936cA74dB498a123433eb9EcA0882D-0x3d0440A3eA85e120864ae609d1383006A1490786": {
            address = "0x070716d7d94A45Eb5E9530949BDAD2b763cd912D"
            break
        }
        case "0x3d0440A3eA85e120864ae609d1383006A1490786-0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613": {
            address = "0xBa1462cbc3077EE35e955a78A4684a2AF7dC2ABe"
            break
        }
        case "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613-0x3d0440A3eA85e120864ae609d1383006A1490786": {
            address = "0xBa1462cbc3077EE35e955a78A4684a2AF7dC2ABe"
            break
        }
        case "0x935B30d75F57659CF41Bd868A8032E58Fe53C369-0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc": {
            address = "0xC3fe0f555c1050Bd35b5063f4DF9E97c5891dDCF"
            break
        }
        case "0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc-0x935B30d75F57659CF41Bd868A8032E58Fe53C369": {
            address = "0xC3fe0f555c1050Bd35b5063f4DF9E97c5891dDCF"
            break
        }
        case "0x935B30d75F57659CF41Bd868A8032E58Fe53C369-0xBc43C5D55d936cA74dB498a123433eb9EcA0882D": {
            address = "0xf943bF7FaF237E460adffF85b642Df7C39e1Cf71"
            break
        }
        case "0xBc43C5D55d936cA74dB498a123433eb9EcA0882D-0x935B30d75F57659CF41Bd868A8032E58Fe53C369": {
            address = "0xf943bF7FaF237E460adffF85b642Df7C39e1Cf71"
            break
        }
        case "0x935B30d75F57659CF41Bd868A8032E58Fe53C369-0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613": {
            address = "0x6D3E824D3Ef7eE706324eFdB199209a7A7AdDdFe"
            break
        }
        case "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613-0x935B30d75F57659CF41Bd868A8032E58Fe53C369": {
            address = "0x6D3E824D3Ef7eE706324eFdB199209a7A7AdDdFe"
            break
        }
        case "0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc-0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613": {
            address = "0xC20dd02FE4acfBBcbaE64F72939Ab50Fc8f24CFA"
            break
        }
        case "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613-0x4beC7Ad5a195fc04b8eB600d975Fc70fB534d4Fc": {
            address = "0xC20dd02FE4acfBBcbaE64F72939Ab50Fc8f24CFA"
            break
        }
        case "0xBc43C5D55d936cA74dB498a123433eb9EcA0882D-0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613": {
            address = "0x6eA94f53A2f95b48F9A6bDbcD082bBf5700de853"
            break
        }
        case "0xf0BB8e57747b9C06b204Be6bb1Ce066F4611B613-0xBc43C5D55d936cA74dB498a123433eb9EcA0882D": {
            address = "0x6eA94f53A2f95b48F9A6bDbcD082bBf5700de853"
            break
        }
    }

    return address
    // const [token0, token1] = tokenA.sortsBefore(tokenB)
    //     ? [tokenA, tokenB]
    //     : [tokenB, tokenA] // does safety checks
    // return getCreate2Address(
    //     factoryAddress,
    //     keccak256(
    //         ['bytes'],
    //         [pack(['address', 'address'], [token0.address, token1.address])]
    //     ),
    //     INIT_CODE_HASH
    // )
}
