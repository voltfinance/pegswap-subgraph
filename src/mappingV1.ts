import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { ERC20 } from "../generated/PegSwapV1/ERC20"
import { TokensSwapped } from "../generated/PegSwapV1/PegSwapV1"
import { Swap as SwapEntity, Token as TokenEntity } from "../generated/schema"
import { getOrCreatePegSwap, getOrCreateToken, updateTokenHistory } from "./utils"

export function handleTokensSwapped(event: TokensSwapped): void {
  updateTokenHistory(event)

  log.info("TokensSwapped txHash: {}", [event.transaction.hash.toHexString()])

  let pegswap = getOrCreatePegSwap(event.params._event.address)

  let sourceToken = getOrCreateToken(event.params.source, pegswap)
  let targetToken = getOrCreateToken(event.params.target, pegswap)

  let swap = new SwapEntity(event.transaction.hash.toHexString())
  swap.sourceAmount = event.params.amount
  swap.targetAmount = event.params.amount
  swap.sourceToken = sourceToken.id
  swap.targetToken = targetToken.id
  swap.caller = event.params.caller
  swap.save()

  for (let i = 0; i < pegswap.tokens.length; i++) {
    let token = pegswap.tokens[i]
    let tokenEntity = TokenEntity.load(token)
    let tokenContract = ERC20.bind(Address.fromString(token))

    let balance = tokenContract.balanceOf(Address.fromString(pegswap.id))

    let decimals = tokenContract.decimals()

    if (tokenEntity) {
      tokenEntity.balance = balance.toBigDecimal().div(
        BigInt.fromString("10")
          .pow(decimals as u8)
          .toBigDecimal()
      )
      tokenEntity.save()
    }
  }

  pegswap.save()
}
