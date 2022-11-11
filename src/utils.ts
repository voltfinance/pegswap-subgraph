import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ERC20 as Token } from "../generated/PegSwap/ERC20"
import { Token as TokenEntity, User as UserEntity, PegSwap as PegSwapEntity } from "../generated/schema"

export function getOrCreateToken(address: Address): TokenEntity {
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
    pegSwapEntity.totalSourceAmountSwapped = BigInt.fromString('0')
    pegSwapEntity.totalTargetAmountSwapped = BigInt.fromString('0')
    pegSwapEntity.save()
  
    return pegSwapEntity as PegSwapEntity
  }