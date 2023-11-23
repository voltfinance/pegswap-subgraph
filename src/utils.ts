import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { ERC20 as Token } from "../generated/PegSwapV1/ERC20"
import { Token as TokenEntity, User as UserEntity, PegSwap as PegSwapEntity } from "../generated/schema"

export function getOrCreateToken(address: Address, pegswap: PegSwapEntity): TokenEntity {
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

    tokenEntity.balance = BigDecimal.fromString('0')
  
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
    userEntity.totalSourceAmountSwapped = BigInt.fromString('0')
    userEntity.totalTargetAmountSwapped = BigInt.fromString('0')
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