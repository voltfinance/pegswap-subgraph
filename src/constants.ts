import { Address } from "@graphprotocol/graph-ts"

export const PEGSWAP_LAYERZERO_ADDRESS = Address.fromString(
  "0x56eE525bB9056BeD23A6055E60b2A2C5C225D1db"
)

export const PEGSWAP_LAYERZERO_TOKENS = [
  Address.fromString("0x28C3d1cD466Ba22f6cae51b1a4692a831696391A"), // USDC V2
  Address.fromString("0x68c9736781E9316ebf5c3d49FE0C1f45D2D104Cd"), // USDT V2
  Address.fromString("0xa722c13135930332Eb3d749B2F0906559D2C5b99"), // WETH V1
  Address.fromString("0x5622F6dC93e08a8b717B149677930C38d5d50682"), // WETH V2
  Address.fromString("0x620fd5fa44BE6af63715Ef4E65DDFA0387aD13F5"), // USDC V1
  Address.fromString("0xFaDbBF8Ce7D5b7041bE672561bbA99f79c532e10"), // USDT V1
]
