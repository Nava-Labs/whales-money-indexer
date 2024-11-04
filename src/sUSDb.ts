import { BigInt } from "@graphprotocol/graph-ts";
import {
  User,
  ProtocolOverview,
  UserActivity,
  DefiIntegration,
} from "./types/schema";
import {
  Deposit as DepositEvent,
  YieldReceived as YieldReceivedEvent,
  CDUnstake as CDUnstakeEvent,
  Unstake as UnstakeEvent,
  Transfer as TransferEvent,
} from "./types/SUSDb/SUSDb";

import { Rules } from "./mapping/rules";
import { createUserInPoint } from "./helper/pointRules";
import { isWhitelisted } from "./utils/whitelist";

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
    user.realizedAmount = BigInt.fromI32(0);
  }
  user.totalVolume = user.totalVolume.minus(event.params.assets);
  user.totalVolumeSUSDB = user.totalVolumeSUSDB.plus(event.params.assets);
  // add relation
  user.protocolOverview = "BONDLINK";
  user.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "STAKE_USDB";
  activity.originType = "SUSDB";
  activity.amount = event.params.assets;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.owner.toHex();
  activity.defi = "SUSDb";
  activity.save();

  // point
  let rulesIds = Rules.getRulesIdByDefi(event.address);
  if (rulesIds.length > 0) {
    for (let i = 0; i < rulesIds.length; i++) {
      let ruleId = rulesIds[i];
      let ruleDetails = Rules.fromId(ruleId);
      if (ruleDetails && ruleDetails.origin == event.address) {
        // checkAndCreatePointRules(bondlinkruleDetails);
        createUserInPoint(
          ruleDetails.id,
          event.params.owner.toHex(),
          ruleDetails.types,
          event.params.assets,
          event.block.timestamp,
          true
        );
      }
    }
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

export function handleCDUnstake(event: CDUnstakeEvent): void {
  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "CDREDEEM_SUSDB";
  activity.originType = "SUSDB";
  activity.amount = event.params.amount;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defi = "SUSDb";
  activity.save();
}

export function handleUnstake(event: UnstakeEvent): void {
  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.totalVolume = BigInt.fromI32(0);
    user.totalVolumeSUSDB = BigInt.fromI32(0);
    user.redeemAmount = BigInt.fromI32(0);
    user.realizedAmount = BigInt.fromI32(0);
  }
  user.realizedAmount = user.realizedAmount.plus(event.params.amount);
  // add relation
  user.protocolOverview = "BONDLINK";
  user.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "UNSTAKE_USDB";
  activity.originType = "SUSDB";
  activity.amount = event.params.amount;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defi = "SUSDb";
  activity.save();
}

export function handleTransfer(event: TransferEvent): void {
  // check is if to defi
  let isToDefi =
    Rules.getRulesIdByDefi(event.params.to).length > 0 ? true : false;

  let initiateUser = isToDefi
    ? event.params.from.toHex()
    : event.params.to.toHex();

  let rulesIds = isToDefi
    ? Rules.getRulesIdByDefi(event.params.to)
    : Rules.getRulesIdByDefi(event.params.from);

  let activityType = isToDefi ? "STAKE_USDB_DEFI" : "UNSTAKE_USDB_DEFI";

  for (let i = 0; i < rulesIds.length; i++) {
    let ruleId = rulesIds[i];
    let ruleDetails = Rules.fromId(ruleId);
    if (ruleDetails && ruleDetails.origin == event.address) {
      // defi integration
      let defiIntegration = DefiIntegration.load(ruleDetails.tag);
      if (defiIntegration == null) {
        defiIntegration = new DefiIntegration(ruleDetails.tag);
        defiIntegration.totalVolume = BigInt.fromI32(0);
        defiIntegration.txCount = BigInt.fromI32(0);
      }
      defiIntegration.totalVolume = defiIntegration.totalVolume.plus(
        event.params.value
      );
      defiIntegration.txCount = defiIntegration.txCount.plus(BigInt.fromI32(1));
      defiIntegration.save();

      // user
      let user = User.load(initiateUser);
      if (user == null) {
        user = new User(initiateUser);
        user.totalVolume = BigInt.fromI32(0);
        user.totalVolumeSUSDB = BigInt.fromI32(0);
        user.redeemAmount = BigInt.fromI32(0);
        user.realizedAmount = BigInt.fromI32(0);
      }
      user.redeemAmount = BigInt.fromI32(0);
      user.protocolOverview = "BONDLINK";
      let checkWhitelisted = isWhitelisted(initiateUser);
      user.isWhitelisted = checkWhitelisted;
      user.save();

      // create activity
      let activity = new UserActivity(event.transaction.hash.toHex());
      activity.activityType = activityType;
      activity.originType = "SUSDB";
      activity.amount = event.params.value;
      activity.timestamp = event.block.timestamp;

      // define relation
      activity.user = initiateUser;
      activity.defi = ruleDetails.tag;
      activity.save();

      // point
      createUserInPoint(
        ruleDetails.id,
        initiateUser,
        ruleDetails.types,
        event.params.value,
        event.block.timestamp,
        isToDefi
      );
    }
  }
}
