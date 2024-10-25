import { BigInt } from "@graphprotocol/graph-ts";
import {
  User,
  ProtocolOverview,
  UserActivity,
  DefiIntegration,
  PointRules,
} from "./types/schema";
import {
  Deposit as DepositEvent,
  YieldReceived as YieldReceivedEvent,
  Transfer as TransferEvent,
} from "./types/SUSDb/SUSDb";

import { BondlinkRules } from "./mapping/bondlinkRules";
import {
  createProtocolOverviewUserInPoint,
  createUserInPoint,
} from "./helper/pointRules";

export function handleDeposit(event: DepositEvent): void {
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
    event.params.assets
  );
  protocolOverview.totalVolumeSUSDB = protocolOverview.totalVolumeSUSDB.plus(
    event.params.assets
  );
  protocolOverview.save();

  // defi integration
  let defiIntegration = DefiIntegration.load("SUSDb");
  if (defiIntegration == null) {
    defiIntegration = new DefiIntegration("SUSDb");
    defiIntegration.totalVolume = BigInt.fromI32(0);
    defiIntegration.txCount = BigInt.fromI32(0);
  }

  defiIntegration.totalVolume = defiIntegration.totalVolume.plus(
    event.params.assets
  );
  defiIntegration.txCount = defiIntegration.txCount.plus(BigInt.fromI32(1));
  defiIntegration.save();

  // user
  let user = User.load(event.params.owner.toHex());
  if (user == null) {
    user = new User(event.params.owner.toHex());
    user.totalVolume = BigInt.fromI32(0);
    user.totalVolumeSUSDB = BigInt.fromI32(0);
    user.redeemAmount = BigInt.fromI32(0);
  }
  user.totalVolume = user.totalVolume.minus(event.params.assets);
  user.totalVolumeSUSDB = user.totalVolumeSUSDB.plus(event.params.assets);
  // add relation
  user.protocolOverview = "BONDLINK";
  user.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.type = "STAKED_USDB";
  activity.amount = event.params.assets;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.owner.toHex();
  activity.defi = "SUSDb";
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
      event.params.owner.toHex(),
      bondlinkRule.types,
      event.params.assets,
      event.block.timestamp
    );
  }
}

export function handleYieldReceived(event: YieldReceivedEvent): void {
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.totalVolume = BigInt.fromI32(0);
    protocolOverview.totalVolumeSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
  }
  protocolOverview.totalYieldDistributed = protocolOverview.totalYieldDistributed.plus(
    event.params.amount
  );
  protocolOverview.save();
}

export function handleTransfer(event: TransferEvent): void {
  let isFromDefi = false;
  let isToDefi = false;

  let fromDefi = BondlinkRules.fromId(event.params.from.toHex());
  let toDefi = BondlinkRules.fromId(event.params.to.toHex());

  // check where is defi
  if (fromDefi != null) {
    isFromDefi = true;
  } else if (toDefi != null) {
    isToDefi = true;
  }

  if (isToDefi) {
    // defi integration
    if (toDefi != null) {
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
      activity.type = "STAKE_SUSDB_DEFI";
      activity.amount = event.params.value;
      activity.timestamp = event.block.timestamp;
      // define relation
      activity.user = event.params.from.toHex();
      activity.defi = toDefi.tag;
      activity.save();

      let pointRulesEntity = PointRules.load(event.params.to.toHex());
      // If the entity doesn't exist, create a new one
      if (pointRulesEntity == null) {
        pointRulesEntity = new PointRules(event.params.to.toHex());
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

        createUserInPoint(
          toDefi.id,
          event.params.from.toHex(),
          toDefi.types,
          event.params.value,
          event.block.timestamp,
          true
        );
      }
    }
  }

  if (isFromDefi) {
    if (fromDefi != null) {
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
      activity.type = "UNSTAKE_SUSDB_DEFI";
      activity.amount = event.params.value;
      activity.timestamp = event.block.timestamp;
      // define relation
      activity.user = event.params.from.toHex();
      activity.defi = fromDefi.tag;
      activity.save();

      let pointRulesEntity = PointRules.load(event.params.from.toHex());
      // If the entity doesn't exist, create a new one
      if (pointRulesEntity == null) {
        pointRulesEntity = new PointRules(event.params.from.toHex());
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
}
