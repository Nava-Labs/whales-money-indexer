import { BigInt } from "@graphprotocol/graph-ts";
import {
  User,
  RedeemLogs,
  ProtocolOverview,
  DefiIntegration,
  UserActivity,
  PointRules,
} from "./types/schema";
import {
  Deposit as DepositEvent,
  CDRedeem as CDRedeemEvent,
  Redeem as RedeemEvent,
  Transfer as TransferEvent,
} from "./types/USDb/USDb";

import { isWhitelisted } from "./utils/whitelist";
import { BondlinkRules } from "./mapping/bondlinkRules";
import {
  createProtocolOverviewUserInPoint,
  createUserInPoint,
} from "./helper/pointRules";

export function handleDeposit(event: DepositEvent): void {
  // Protocol Overview
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.totalVolume = BigInt.fromI32(0);
    protocolOverview.totalVolumeSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
  }

  protocolOverview.totalVolume = protocolOverview.totalVolume.plus(
    event.params.amount
  );
  protocolOverview.save();

  // defi integration
  let defiIntegration = DefiIntegration.load("USDb");
  if (defiIntegration == null) {
    defiIntegration = new DefiIntegration("USDb");
    defiIntegration.totalVolume = BigInt.fromI32(0);
    defiIntegration.txCount = BigInt.fromI32(0);
  }

  defiIntegration.totalVolume = defiIntegration.totalVolume.plus(
    event.params.amount
  );
  defiIntegration.txCount = defiIntegration.txCount.plus(BigInt.fromI32(1));
  defiIntegration.save();

  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.totalVolume = BigInt.fromI32(0);
    user.totalVolumeSUSDB = BigInt.fromI32(0);
    user.redeemAmount = BigInt.fromI32(0);
  }
  user.totalVolume = user.totalVolume.plus(event.params.amount);
  let checkWhitelisted = isWhitelisted(event.params.user.toHex());
  user.isWhitelisted = checkWhitelisted;
  // define relation
  user.protocolOverview = "BONDLINK";
  user.save();

  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.type = "DEPOSIT_USDB";
  activity.amount = event.params.amount;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defi = "USDb";
  activity.save();

  let bondlinkRule = BondlinkRules.fromId(event.address.toHex());
  if (bondlinkRule) {
    let pointRulesEntity = PointRules.load(event.address.toHex());
    // If the entity doesn't exist, create a new one
    if (pointRulesEntity == null) {
      pointRulesEntity = new PointRules(event.address.toHex());
      pointRulesEntity.name = bondlinkRule.name;
      pointRulesEntity.tag = bondlinkRule.tag;
      pointRulesEntity.minTransferAmount = bondlinkRule.minTransferAmount;
      pointRulesEntity.maxPoint = bondlinkRule.maxPoint;
      pointRulesEntity.basePointTx = bondlinkRule.basePointTx;
      pointRulesEntity.maxPointTx = bondlinkRule.maxPointTx;
      pointRulesEntity.startTimestamp = bondlinkRule.startTimestamp;
      pointRulesEntity.endTimestamp = bondlinkRule.endTimestamp;
      pointRulesEntity.types = bondlinkRule.types;

      pointRulesEntity.save();
    }

    createProtocolOverviewUserInPoint(
      bondlinkRule.id,
      event.params.user.toHex(),
      bondlinkRule.types,
      event.params.amount,
      event.block.timestamp
    );
  }
}

export function handleCDRedeem(event: CDRedeemEvent): void {
  // protocol overview
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.totalVolume = BigInt.fromI32(0);
    protocolOverview.totalVolumeSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
  }
  protocolOverview.totalVolume = protocolOverview.totalVolume.minus(
    event.params.amount
  );
  protocolOverview.totalOngoingRedeemUSDB = protocolOverview.totalOngoingRedeemUSDB.plus(
    event.params.amount
  );
  protocolOverview.save();
  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.totalVolume = BigInt.fromI32(0);
    user.totalVolumeSUSDB = BigInt.fromI32(0);
    user.redeemAmount = BigInt.fromI32(0);
  }
  user.totalVolume = user.totalVolume.minus(event.params.amount);
  user.redeemAmount = user.redeemAmount.plus(event.params.amount);
  user.protocolOverview = "BONDLINK";
  user.save();

  // create redeem logs
  let redeem = new RedeemLogs(event.transaction.hash.toHex());
  redeem.user = event.params.user.toHex();
  redeem.amount = event.params.amount;
  redeem.claimableDate = event.params.redeemEndedAt;
  redeem.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.type = "CDREDEEM_USDB";
  activity.amount = event.params.amount;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defi = "USDb";
  activity.save();
}

export function handleRedeem(event: RedeemEvent): void {
  // protocol overview
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.totalVolume = BigInt.fromI32(0);
    protocolOverview.totalVolumeSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
  }
  protocolOverview.totalOngoingRedeemUSDB = protocolOverview.totalOngoingRedeemUSDB.minus(
    event.params.amount
  );
  protocolOverview.save();
  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.totalVolume = BigInt.fromI32(0);
    user.totalVolumeSUSDB = BigInt.fromI32(0);
    user.redeemAmount = BigInt.fromI32(0);
  }
  user.redeemAmount = BigInt.fromI32(0);
  user.protocolOverview = "BONDLINK";
  user.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.type = "REDEEM_USDB";
  activity.amount = event.params.amount;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defi = "USDb";
  activity.save();
}

export function handleTransfer(event: TransferEvent): void {
  let toDefi = BondlinkRules.fromId(event.params.to.toHex());
  if (toDefi) {
    // defi integration
    let defiIntegration = DefiIntegration.load(toDefi.tag);
    if (defiIntegration == null) {
      defiIntegration = new DefiIntegration(toDefi.tag);
      defiIntegration.totalVolume = BigInt.fromI32(0);
      defiIntegration.txCount = BigInt.fromI32(0);
    }
    defiIntegration.totalVolume = defiIntegration.totalVolume.plus(
      event.params.value
    );
    defiIntegration.txCount = defiIntegration.txCount.plus(BigInt.fromI32(1));
    defiIntegration.save();
    // create activity
    let activity = new UserActivity(event.transaction.hash.toHex());
    activity.type = "STAKE_USDB_DEFI";
    activity.amount = event.params.value;
    activity.timestamp = event.block.timestamp;
    // define relation
    activity.user = event.params.from.toHex();
    activity.defi = toDefi.tag;
    activity.save();
    let pointRulesEntity = PointRules.load(toDefi.id);
    // If the entity doesn't exist, create a new one
    if (pointRulesEntity == null) {
      pointRulesEntity = new PointRules(toDefi.id);
      pointRulesEntity.name = toDefi.name;
      pointRulesEntity.tag = toDefi.tag;
      pointRulesEntity.minTransferAmount = toDefi.minTransferAmount;
      pointRulesEntity.maxPoint = toDefi.maxPoint;
      pointRulesEntity.basePointTx = toDefi.basePointTx;
      pointRulesEntity.maxPointTx = toDefi.maxPointTx;
      pointRulesEntity.startTimestamp = toDefi.startTimestamp;
      pointRulesEntity.endTimestamp = toDefi.endTimestamp;
      pointRulesEntity.types = toDefi.types;
      pointRulesEntity.save();
    }
    createUserInPoint(
      toDefi.id,
      event.params.from.toHex(),
      toDefi.types,
      event.params.value,
      event.block.timestamp,
      true
    );
  } else {
    let fromDefi = BondlinkRules.fromId(event.params.from.toHex());
    if (fromDefi) {
      let defiIntegration = DefiIntegration.load(fromDefi.tag);
      if (defiIntegration == null) {
        defiIntegration = new DefiIntegration(fromDefi.tag);
        defiIntegration.totalVolume = BigInt.fromI32(0);
        defiIntegration.txCount = BigInt.fromI32(0);
      }
      defiIntegration.totalVolume = defiIntegration.totalVolume.minus(
        event.params.value
      );
      defiIntegration.txCount = defiIntegration.txCount.plus(BigInt.fromI32(1));
      defiIntegration.save();
      // create activity
      let activity = new UserActivity(event.transaction.hash.toHex());
      activity.type = "UNSTAKE_USDB_DEFI";
      activity.amount = event.params.value;
      activity.timestamp = event.block.timestamp;
      // define relation
      activity.user = event.params.to.toHex();
      activity.defi = fromDefi.tag;
      activity.save();
      let pointRulesEntity = PointRules.load(fromDefi.id);
      // If the entity doesn't exist, create a new one
      if (pointRulesEntity == null) {
        pointRulesEntity = new PointRules(fromDefi.id);
        pointRulesEntity.name = fromDefi.name;
        pointRulesEntity.tag = fromDefi.tag;
        pointRulesEntity.minTransferAmount = fromDefi.minTransferAmount;
        pointRulesEntity.maxPoint = fromDefi.maxPoint;
        pointRulesEntity.basePointTx = fromDefi.basePointTx;
        pointRulesEntity.maxPointTx = fromDefi.maxPointTx;
        pointRulesEntity.startTimestamp = fromDefi.startTimestamp;
        pointRulesEntity.endTimestamp = fromDefi.endTimestamp;
        pointRulesEntity.types = fromDefi.types;
        pointRulesEntity.save();
      }
      createUserInPoint(
        fromDefi.id,
        event.params.to.toHex(),
        fromDefi.types,
        event.params.value,
        event.block.timestamp,
        false
      );
    }
  }
}
