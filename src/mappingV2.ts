import { log, Address, BigInt } from "@graphprotocol/graph-ts"
import { ERC20 } from "../generated/PegSwapV1/ERC20"
import { TokensSwapped } from "../generated/PegSwapV2/PegSwapV2"
import { Swap as SwapEntity, Token as TokenEntity } from "../generated/schema"
import { getOrCreateToken, getOrCreateUser, getOrCreatePegSwap } from "./utils"

export function handleTokensSwapped(event: TokensSwapped): void {
  log.info('TokensSwapped txHash: {}', [event.transaction.hash.toHexString()])

  let pegswap = getOrCreatePegSwap(event.params._event.address)

  let sourceToken = getOrCreateToken(event.params.source, pegswap)
  let targetToken = getOrCreateToken(event.params.target, pegswap)

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

  for (let i = 0; i < pegswap.tokens.length; i++) {
    let token = pegswap.tokens[i]
    if (token == '0x68c9736781e9316ebf5c3d49fe0c1f45d2d104cd') {
      continue
    }

    let tokenEntity = TokenEntity.load(token)
    let tokenContract = ERC20.bind(Address.fromString(token))

    let balance = tokenContract.balanceOf(Address.fromString(pegswap.id))
    let decimals = tokenContract.decimals()

    if (tokenEntity) {
      tokenEntity.balance = balance.toBigDecimal().div(BigInt.fromString('10').pow(decimals as u8).toBigDecimal())
      tokenEntity.save()
    }
  }

  pegswap.save()
}
