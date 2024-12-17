import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  Approval,
  Blacklisted,
  Burn,
  CDPeriodChanged,
  CDRedeem,
  Deposit,
  EIP712DomainChanged,
  EnforcedOptionSet,
  FeeRecipientChanged,
  Mint,
  MintFeeRateChanged,
  ModeSwitch,
  MsgInspectorSet,
  OFTReceived,
  OFTSent,
  OracleChanged,
  OwnershipTransferStarted,
  OwnershipTransferred,
  Paused,
  PeerSet,
  PreCrimeSet,
  Redeem,
  RedeemFeeRateChanged,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  Transfer,
  TreasuryChanged,
  Unpaused
} from "../generated/wUSD/wUSD"

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createBlacklistedEvent(
  user: Address,
  isBlacklisted: boolean
): Blacklisted {
  let blacklistedEvent = changetype<Blacklisted>(newMockEvent())

  blacklistedEvent.parameters = new Array()

  blacklistedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  blacklistedEvent.parameters.push(
    new ethereum.EventParam(
      "isBlacklisted",
      ethereum.Value.fromBoolean(isBlacklisted)
    )
  )

  return blacklistedEvent
}

export function createBurnEvent(user: Address, amount: BigInt): Burn {
  let burnEvent = changetype<Burn>(newMockEvent())

  burnEvent.parameters = new Array()

  burnEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  burnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return burnEvent
}

export function createCDPeriodChangedEvent(newCDPeriod: i32): CDPeriodChanged {
  let cdPeriodChangedEvent = changetype<CDPeriodChanged>(newMockEvent())

  cdPeriodChangedEvent.parameters = new Array()

  cdPeriodChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newCDPeriod",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newCDPeriod))
    )
  )

  return cdPeriodChangedEvent
}

export function createCDRedeemEvent(
  user: Address,
  amount: BigInt,
  redeemEndedAt: BigInt
): CDRedeem {
  let cdRedeemEvent = changetype<CDRedeem>(newMockEvent())

  cdRedeemEvent.parameters = new Array()

  cdRedeemEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  cdRedeemEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  cdRedeemEvent.parameters.push(
    new ethereum.EventParam(
      "redeemEndedAt",
      ethereum.Value.fromUnsignedBigInt(redeemEndedAt)
    )
  )

  return cdRedeemEvent
}

export function createDepositEvent(user: Address, amount: BigInt): Deposit {
  let depositEvent = changetype<Deposit>(newMockEvent())

  depositEvent.parameters = new Array()

  depositEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return depositEvent
}

export function createEIP712DomainChangedEvent(): EIP712DomainChanged {
  let eip712DomainChangedEvent = changetype<EIP712DomainChanged>(newMockEvent())

  eip712DomainChangedEvent.parameters = new Array()

  return eip712DomainChangedEvent
}

export function createEnforcedOptionSetEvent(
  _enforcedOptions: Array<ethereum.Tuple>
): EnforcedOptionSet {
  let enforcedOptionSetEvent = changetype<EnforcedOptionSet>(newMockEvent())

  enforcedOptionSetEvent.parameters = new Array()

  enforcedOptionSetEvent.parameters.push(
    new ethereum.EventParam(
      "_enforcedOptions",
      ethereum.Value.fromTupleArray(_enforcedOptions)
    )
  )

  return enforcedOptionSetEvent
}

export function createFeeRecipientChangedEvent(
  newFeeRecipient: Address
): FeeRecipientChanged {
  let feeRecipientChangedEvent = changetype<FeeRecipientChanged>(newMockEvent())

  feeRecipientChangedEvent.parameters = new Array()

  feeRecipientChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newFeeRecipient",
      ethereum.Value.fromAddress(newFeeRecipient)
    )
  )

  return feeRecipientChangedEvent
}

export function createMintEvent(user: Address, amount: BigInt): Mint {
  let mintEvent = changetype<Mint>(newMockEvent())

  mintEvent.parameters = new Array()

  mintEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return mintEvent
}

export function createMintFeeRateChangedEvent(
  newFeeRate: BigInt
): MintFeeRateChanged {
  let mintFeeRateChangedEvent = changetype<MintFeeRateChanged>(newMockEvent())

  mintFeeRateChangedEvent.parameters = new Array()

  mintFeeRateChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newFeeRate",
      ethereum.Value.fromUnsignedBigInt(newFeeRate)
    )
  )

  return mintFeeRateChangedEvent
}

export function createModeSwitchEvent(mode: boolean): ModeSwitch {
  let modeSwitchEvent = changetype<ModeSwitch>(newMockEvent())

  modeSwitchEvent.parameters = new Array()

  modeSwitchEvent.parameters.push(
    new ethereum.EventParam("mode", ethereum.Value.fromBoolean(mode))
  )

  return modeSwitchEvent
}

export function createMsgInspectorSetEvent(
  inspector: Address
): MsgInspectorSet {
  let msgInspectorSetEvent = changetype<MsgInspectorSet>(newMockEvent())

  msgInspectorSetEvent.parameters = new Array()

  msgInspectorSetEvent.parameters.push(
    new ethereum.EventParam("inspector", ethereum.Value.fromAddress(inspector))
  )

  return msgInspectorSetEvent
}

export function createOFTReceivedEvent(
  guid: Bytes,
  srcEid: BigInt,
  toAddress: Address,
  amountReceivedLD: BigInt
): OFTReceived {
  let oftReceivedEvent = changetype<OFTReceived>(newMockEvent())

  oftReceivedEvent.parameters = new Array()

  oftReceivedEvent.parameters.push(
    new ethereum.EventParam("guid", ethereum.Value.fromFixedBytes(guid))
  )
  oftReceivedEvent.parameters.push(
    new ethereum.EventParam("srcEid", ethereum.Value.fromUnsignedBigInt(srcEid))
  )
  oftReceivedEvent.parameters.push(
    new ethereum.EventParam("toAddress", ethereum.Value.fromAddress(toAddress))
  )
  oftReceivedEvent.parameters.push(
    new ethereum.EventParam(
      "amountReceivedLD",
      ethereum.Value.fromUnsignedBigInt(amountReceivedLD)
    )
  )

  return oftReceivedEvent
}

export function createOFTSentEvent(
  guid: Bytes,
  dstEid: BigInt,
  fromAddress: Address,
  amountSentLD: BigInt,
  amountReceivedLD: BigInt
): OFTSent {
  let oftSentEvent = changetype<OFTSent>(newMockEvent())

  oftSentEvent.parameters = new Array()

  oftSentEvent.parameters.push(
    new ethereum.EventParam("guid", ethereum.Value.fromFixedBytes(guid))
  )
  oftSentEvent.parameters.push(
    new ethereum.EventParam("dstEid", ethereum.Value.fromUnsignedBigInt(dstEid))
  )
  oftSentEvent.parameters.push(
    new ethereum.EventParam(
      "fromAddress",
      ethereum.Value.fromAddress(fromAddress)
    )
  )
  oftSentEvent.parameters.push(
    new ethereum.EventParam(
      "amountSentLD",
      ethereum.Value.fromUnsignedBigInt(amountSentLD)
    )
  )
  oftSentEvent.parameters.push(
    new ethereum.EventParam(
      "amountReceivedLD",
      ethereum.Value.fromUnsignedBigInt(amountReceivedLD)
    )
  )

  return oftSentEvent
}

export function createOracleChangedEvent(newOracle: Address): OracleChanged {
  let oracleChangedEvent = changetype<OracleChanged>(newMockEvent())

  oracleChangedEvent.parameters = new Array()

  oracleChangedEvent.parameters.push(
    new ethereum.EventParam("newOracle", ethereum.Value.fromAddress(newOracle))
  )

  return oracleChangedEvent
}

export function createOwnershipTransferStartedEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferStarted {
  let ownershipTransferStartedEvent = changetype<OwnershipTransferStarted>(
    newMockEvent()
  )

  ownershipTransferStartedEvent.parameters = new Array()

  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferStartedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createPeerSetEvent(eid: BigInt, peer: Bytes): PeerSet {
  let peerSetEvent = changetype<PeerSet>(newMockEvent())

  peerSetEvent.parameters = new Array()

  peerSetEvent.parameters.push(
    new ethereum.EventParam("eid", ethereum.Value.fromUnsignedBigInt(eid))
  )
  peerSetEvent.parameters.push(
    new ethereum.EventParam("peer", ethereum.Value.fromFixedBytes(peer))
  )

  return peerSetEvent
}

export function createPreCrimeSetEvent(preCrimeAddress: Address): PreCrimeSet {
  let preCrimeSetEvent = changetype<PreCrimeSet>(newMockEvent())

  preCrimeSetEvent.parameters = new Array()

  preCrimeSetEvent.parameters.push(
    new ethereum.EventParam(
      "preCrimeAddress",
      ethereum.Value.fromAddress(preCrimeAddress)
    )
  )

  return preCrimeSetEvent
}

export function createRedeemEvent(user: Address, amount: BigInt): Redeem {
  let redeemEvent = changetype<Redeem>(newMockEvent())

  redeemEvent.parameters = new Array()

  redeemEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  redeemEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return redeemEvent
}

export function createRedeemFeeRateChangedEvent(
  newFeeRate: BigInt
): RedeemFeeRateChanged {
  let redeemFeeRateChangedEvent = changetype<RedeemFeeRateChanged>(
    newMockEvent()
  )

  redeemFeeRateChangedEvent.parameters = new Array()

  redeemFeeRateChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newFeeRate",
      ethereum.Value.fromUnsignedBigInt(newFeeRate)
    )
  )

  return redeemFeeRateChangedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}

export function createTreasuryChangedEvent(
  newTreasury: Address
): TreasuryChanged {
  let treasuryChangedEvent = changetype<TreasuryChanged>(newMockEvent())

  treasuryChangedEvent.parameters = new Array()

  treasuryChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newTreasury",
      ethereum.Value.fromAddress(newTreasury)
    )
  )

  return treasuryChangedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}
