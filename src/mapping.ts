import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  PegSwap,
  LiquidityUpdated,
  OwnershipTransferRequested,
  OwnershipTransferred,
  StuckTokensRecovered,
  TokensSwapped
} from "../generated/PegSwap/PegSwap"
import { ERC20 as Token } from "../generated/PegSwap/ERC20"
import { Token as TokenEntity, User as UserEntity, PegSwap as PegSwapEntity, Swap as SwapEntity } from "../generated/schema"

function getOrCreateToken(address: Address): TokenEntity {
  let id = address.toHexString()

  let tokenEntity = TokenEntity.load(id)

  if (tokenEntity != null) {
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

  tokenEntity.save()

  return tokenEntity as TokenEntity
}

function getOrCreateUser(address: Address): UserEntity {
  let id = address.toHexString()

  let userEntity = UserEntity.load(id)
  if (userEntity != null) {
    return userEntity as UserEntity
  }

  userEntity = new UserEntity(id)
  userEntity.totalSourceAmountSwapped = BigInt.fromString('0')
  userEntity.totalTargetAmountSwapped = BigInt.fromString('0')
  userEntity.save()

  return userEntity as UserEntity
}

function getOrCreatePegSwap(address: Address): PegSwapEntity {
  let id = address.toHexString()

  let pegSwapEntity = PegSwapEntity.load(id)
  if (pegSwapEntity != null) {
    return pegSwapEntity as PegSwapEntity
  }

  pegSwapEntity = new PegSwapEntity(id)
  pegSwapEntity.totalSourceAmountSwapped = BigInt.fromString('0')
  pegSwapEntity.totalTargetAmountSwapped = BigInt.fromString('0')
  pegSwapEntity.save()

  return pegSwapEntity as PegSwapEntity
}

export function handleTokensSwapped(event: TokensSwapped): void {
  let sourceToken = getOrCreateToken(event.params.source)
  let targetToken = getOrCreateToken(event.params.target)

  let user = getOrCreateUser(event.params.caller)
  user.totalSourceAmountSwapped = user.totalSourceAmountSwapped.plus(event.params.sourceAmount)
  user.totalTargetAmountSwapped = user.totalTargetAmountSwapped.plus(event.params.targetAmount)
  user.save()

  let swap = new SwapEntity(event.transaction.hash.toHexString())
  swap.sourceAmount = event.params.sourceAmount
  swap.targetAmount = event.params.targetAmount
  swap.sourceToken = sourceToken.id
  swap.targetToken = targetToken.id
  swap.caller = event.params.caller
  swap.save()

  let pegswap = getOrCreatePegSwap(event.params.caller)
  pegswap.totalSourceAmountSwapped = pegswap.totalSourceAmountSwapped.plus(event.params.sourceAmount)
  pegswap.totalTargetAmountSwapped = pegswap.totalTargetAmountSwapped.plus(event.params.targetAmount)
  pegswap.save()
}
