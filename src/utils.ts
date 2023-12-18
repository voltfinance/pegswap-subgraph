import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts"
import { ERC20, ERC20 as Token } from "../generated/PegSwapV1/ERC20"
import {
  PegSwap as PegSwapEntity,
  TokenDayData,
  Token as TokenEntity,
  User as UserEntity,
} from "../generated/schema"
import { TokensSwapped } from "../generated/PegSwapV1/PegSwapV1"
export const BIG_DECIMAL_ZERO = BigDecimal.fromString("0")
import { VoltagePair } from "../generated/PegSwapV1/VoltagePair"

const WFUSE_BUSD_PAIR = "0x91520fc2942fd52949514f159aa4927b8850178d"
const WFUSE_WETH_PAIR = "0x7fe1a61e4fe983d275cb5669072a9d1dee9bd45c"
const WRAPPED_ETHER_ON_FUSE = "0xa722c13135930332eb3d749b2f0906559d2c5b99"
const WRAPPED_ETHER = "0x5622f6dc93e08a8b717b149677930c38d5d50682"
const BIG_DECIMAL_1E18 = BigDecimal.fromString("1000000000000000000")

export function getOrCreateToken(address: Address, pegswap: PegSwapEntity): TokenEntity {
  let id = address.toHexString()

  let tokenEntity = TokenEntity.load(id)

  if (tokenEntity !== null) {
    return tokenEntity as TokenEntity
  }

  tokenEntity = new TokenEntity(id)

  let token = Token.bind(address)

  let name = token.try_name()
  if (!name.reverted) {
    tokenEntity.name = name.value
  }

  let symbol = token.try_symbol()
  if (!symbol.reverted) {
    tokenEntity.symbol = symbol.value
  }

  let decimals = token.try_decimals()
  if (!decimals.reverted) {
    tokenEntity.decimals = decimals.value
  }

  tokenEntity.balance = BigDecimal.fromString("0")

  tokenEntity.save()

  let tokens = pegswap.tokens
  tokens.push(id)
  pegswap.tokens = tokens

  pegswap.save()

  return tokenEntity as TokenEntity
}

export function getOrCreateUser(address: Address): UserEntity {
  let id = address.toHexString()

  let userEntity = UserEntity.load(id)
  if (userEntity != null) {
    return userEntity as UserEntity
  }

  userEntity = new UserEntity(id)
  userEntity.totalSourceAmountSwapped = BigInt.fromString("0")
  userEntity.totalTargetAmountSwapped = BigInt.fromString("0")
  userEntity.save()

  return userEntity as UserEntity
}

export function getOrCreatePegSwap(address: Address): PegSwapEntity {
  let id = address.toHexString()

  let pegSwapEntity = PegSwapEntity.load(id)
  if (pegSwapEntity != null) {
    return pegSwapEntity as PegSwapEntity
  }

  pegSwapEntity = new PegSwapEntity(id)
  pegSwapEntity.tokens = []
  pegSwapEntity.save()

  return pegSwapEntity as PegSwapEntity
}

export function getDay(timestamp: BigInt): BigInt {
  return timestamp.div(BigInt.fromI32(86400))
}

export function updateTokenHistory(event: TokensSwapped): void {
  updateSourceTokenHistory(event)
}

export function updateSourceTokenHistory(event: TokensSwapped): TokenDayData {
  let day = getDay(event.block.timestamp)
  const id = event.params.source
    .toHexString()
    .concat("-")
    .concat(day.toString())

  let pegswap = getOrCreatePegSwap(event.params._event.address)

  const token = getOrCreateToken(event.params.source, pegswap)
  let tokenDayData = TokenDayData.load(id)

  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(id)
    tokenDayData.sourceAmount = BIG_DECIMAL_ZERO
    tokenDayData.targetAmount = BIG_DECIMAL_ZERO
    tokenDayData.volume = BIG_DECIMAL_ZERO
    tokenDayData.blockNumber = event.block.number
    tokenDayData.balance = BIG_DECIMAL_ZERO
    tokenDayData.balanceUSD = BIG_DECIMAL_ZERO
    tokenDayData.volumeUSD = BIG_DECIMAL_ZERO
    tokenDayData.token = event.params.source.toHexString()
    tokenDayData.timestamp = event.block.timestamp
    tokenDayData.reserve0 = getPairPrice(WFUSE_WETH_PAIR)

    tokenDayData.reserve1 = getPairPrice(WFUSE_BUSD_PAIR)
    tokenDayData.priceUSD = BIG_DECIMAL_ZERO
  }
  let tokenContract = ERC20.bind(Address.fromString(token.id))
  let balance = tokenContract
    .balanceOf(Address.fromString(pegswap.id))
    .toBigDecimal()
    .div(
      BigInt.fromString("10")
        .pow(token.decimals as u8)
        .toBigDecimal()
    )

  const amount = event.params.amount.toBigDecimal().div(
    BigInt.fromString("10")
      .pow(token.decimals as u8)
      .toBigDecimal()
  )

  tokenDayData.balance = balance
  tokenDayData.volume = tokenDayData.volume.plus(amount)

  tokenDayData.timestamp = event.block.timestamp

  if (
    event.params.source.toHexString() == WRAPPED_ETHER_ON_FUSE ||
    event.params.source.toHexString() == WRAPPED_ETHER
  ) {
    tokenDayData.balanceUSD = getPairPrice(WFUSE_WETH_PAIR)
      .times(balance)
      .div(getPairPrice(WFUSE_BUSD_PAIR))

    tokenDayData.volumeUSD = tokenDayData.volumeUSD.plus(
      getPairPrice(WFUSE_WETH_PAIR)
        .times(amount)
        .div(getPairPrice(WFUSE_BUSD_PAIR))
    )

    tokenDayData.priceUSD = getPairPrice(WFUSE_WETH_PAIR)
      .times(BigDecimal.fromString("1"))
      .div(getPairPrice(WFUSE_BUSD_PAIR))
  } else {
    tokenDayData.balanceUSD = balance
    tokenDayData.volumeUSD = tokenDayData.volumeUSD.plus(amount)
    tokenDayData.priceUSD = BigDecimal.fromString("1")
  }

  tokenDayData.save()

  return tokenDayData as TokenDayData
}

export function getPairPrice(address: string): BigDecimal {
  const pair = VoltagePair.bind(Address.fromBytes(Address.fromHexString(address)))

  const reservesResult = pair.try_getReserves()
  if (reservesResult.reverted) {
    log.info("[getJoePrice] getReserves reverted", [])
    return BIG_DECIMAL_ZERO
  }
  const reserves = reservesResult.value
  if (reserves.value1.toBigDecimal().equals(BigDecimal.fromString("0"))) {
    log.error("[getJoePrice] USDC reserve 0", [])
    return BIG_DECIMAL_ZERO
  }

  return reserves.value0
    .toBigDecimal()
    .times(BIG_DECIMAL_1E18)
    .div(reserves.value1.toBigDecimal())
    .div(BIG_DECIMAL_1E18)
}
