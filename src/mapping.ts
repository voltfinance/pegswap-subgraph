import { TokensSwapped } from "../generated/PegSwap/PegSwap"
import { Swap as SwapEntity } from "../generated/schema"
import { getOrCreateToken, getOrCreateUser, getOrCreatePegSwap } from "./utils"

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
