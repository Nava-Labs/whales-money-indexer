import { BondlinkRules } from "./bondlinkRules";
import { BigInt } from "@graphprotocol/graph-ts";

export function fetchTokenName(id: string): string {
  // static definitions overrides
  let staticDefinition = BondlinkRules.fromId(id);
  if (staticDefinition != null) {
    return (staticDefinition as BondlinkRules).name;
  } else {
    return "-";
  }
}

export function fetchTokenTag(id: string): string {
  // static definitions overrides
  let staticDefinition = BondlinkRules.fromId(id);
  if (staticDefinition != null) {
    return (staticDefinition as BondlinkRules).tag;
  } else {
    return "-";
  }
}

export function fetchTokenMinTransferAmount(id: string): BigInt {
  // static definitions overrides
  let staticDefinition = BondlinkRules.fromId(id);
  if (staticDefinition != null) {
    return (staticDefinition as BondlinkRules).minTransferAmount;
  } else {
    return BigInt.fromI32(0);
  }
}

export function fetchTokenMaxPoint(id: string): BigInt {
  // static definitions overrides
  let staticDefinition = BondlinkRules.fromId(id);
  if (staticDefinition != null) {
    return (staticDefinition as BondlinkRules).maxPoint;
  } else {
    return BigInt.fromI32(0);
  }
}

export function fetchTokenBasePointTx(id: string): BigInt {
  // static definitions overrides
  let staticDefinition = BondlinkRules.fromId(id);
  if (staticDefinition != null) {
    return (staticDefinition as BondlinkRules).basePointTx;
  } else {
    return BigInt.fromI32(0);
  }
}

export function fetchTokenMaxPointTx(id: string): BigInt {
  // static definitions overrides
  let staticDefinition = BondlinkRules.fromId(id);
  if (staticDefinition != null) {
    return (staticDefinition as BondlinkRules).maxPointTx;
  } else {
    return BigInt.fromI32(0);
  }
}

export function fetchTokenStartTimestamp(id: string): BigInt {
  // static definitions overrides
  let staticDefinition = BondlinkRules.fromId(id);
  if (staticDefinition != null) {
    return (staticDefinition as BondlinkRules).startTimestamp;
  } else {
    return BigInt.fromI32(0);
  }
}

export function fetchTokenEndTimestamp(id: string): BigInt {
  // static definitions overrides
  let staticDefinition = BondlinkRules.fromId(id);
  if (staticDefinition != null) {
    return (staticDefinition as BondlinkRules).endTimestamp;
  } else {
    return BigInt.fromI32(0);
  }
}

export function fetchTokenTypes(id: string): string {
  // static definitions overrides
  let staticDefinition = BondlinkRules.fromId(id);
  if (staticDefinition != null) {
    return (staticDefinition as BondlinkRules).types;
  } else {
    return "-";
  }
}
