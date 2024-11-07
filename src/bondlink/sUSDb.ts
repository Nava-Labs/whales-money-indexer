import { BigInt } from "@graphprotocol/graph-ts";
import {
  User,
  ProtocolOverview,
  UserActivity,
  DefiIntegration,
  TransferLog,
} from "../types/schema";
import {
  Deposit as DepositEvent,
  YieldReceived as YieldReceivedEvent,
  CDUnstake as CDUnstakeEvent,
  Unstake as UnstakeEvent,
  Transfer as TransferEvent,
} from "../types/SUSDb/SUSDb";

import { Rules } from "./rules";
import { createAndUpdateUserInPoint } from "./helper/pointRules";
import { isWhitelisted } from "../utils/whitelist";
import { isBlacklisted } from "../utils/blacklist";

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
    defiIntegration.balanceUSDB = BigInt.fromI32(0);
    defiIntegration.balanceSUSDB = BigInt.fromI32(0);
  }

  defiIntegration.totalVolume = defiIntegration.totalVolume.plus(
    event.params.assets
  );
  defiIntegration.balanceSUSDB = defiIntegration.balanceSUSDB.plus(
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
    user.balanceUSDB = BigInt.fromI32(0);
    user.balanceSUSDB = BigInt.fromI32(0);
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
  activity.defiIntegration = "SUSDb";
  activity.save();

  // point
  let rulesIds = Rules.getRulesIdByDefi(event.address);
  if (rulesIds.length > 0) {
    for (let i = 0; i < rulesIds.length; i++) {
      let ruleId = rulesIds[i];
      let ruleDetails = Rules.fromId(ruleId);
      if (ruleDetails && ruleDetails.origin == event.address) {
        // checkAndCreatePointRules(bondlinkruleDetails);
        createAndUpdateUserInPoint(
          ruleDetails.id,
          event.params.owner.toHex(),
          ruleDetails.types,
          event.params.assets,
          event.block.timestamp,
          true,
          isWhitelisted(event.params.owner.toHex())
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
  activity.defiIntegration = "SUSDb";
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
    user.balanceUSDB = BigInt.fromI32(0);
    user.balanceSUSDB = BigInt.fromI32(0);
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
  activity.defiIntegration = "SUSDb";
  activity.save();
}

export function handleTransfer(event: TransferEvent): void {
  let transferLog = TransferLog.load(event.transaction.hash.toHex());
  if (transferLog == null) {
    transferLog = new TransferLog(event.transaction.hash.toHex());
    transferLog.from = event.params.from.toHex();
    transferLog.to = event.params.to.toHex();
    transferLog.amount = event.params.value;
    transferLog.timestamp = event.block.timestamp;
    transferLog.origin = event.address.toHex();
    transferLog.isValuable = false;
    transferLog.save();
  }

  // Handle user from
  let userFrom = User.load(event.params.from.toHex());
  if (userFrom == null) {
    userFrom = new User(event.params.from.toHex());
    userFrom.totalVolume = BigInt.fromI32(0);
    userFrom.totalVolumeSUSDB = BigInt.fromI32(0);
    userFrom.redeemAmount = BigInt.fromI32(0);
    userFrom.realizedAmount = BigInt.fromI32(0);
    userFrom.balanceUSDB = BigInt.fromI32(0);
    userFrom.balanceSUSDB = BigInt.fromI32(0);
  }

  userFrom.balanceSUSDB = isBlacklisted(event.params.from.toHex())
    ? userFrom.balanceSUSDB.minus(BigInt.fromI32(0))
    : userFrom.balanceSUSDB.minus(event.params.value);
  userFrom.protocolOverview = "BONDLINK";
  userFrom.isWhitelisted = isWhitelisted(event.params.from.toHex());
  userFrom.save();

  // Handle user to
  let userTo = User.load(event.params.to.toHex());
  if (userTo == null) {
    userTo = new User(event.params.to.toHex());
    userTo.totalVolume = BigInt.fromI32(0);
    userTo.totalVolumeSUSDB = BigInt.fromI32(0);
    userTo.redeemAmount = BigInt.fromI32(0);
    userTo.realizedAmount = BigInt.fromI32(0);
    userTo.balanceUSDB = BigInt.fromI32(0);
    userTo.balanceSUSDB = BigInt.fromI32(0);
  }

  userTo.balanceSUSDB = isBlacklisted(event.params.to.toHex())
    ? userTo.balanceSUSDB.plus(BigInt.fromI32(0))
    : userTo.balanceSUSDB.plus(event.params.value);
  userTo.protocolOverview = "BONDLINK";
  userTo.isWhitelisted = isWhitelisted(event.params.to.toHex());
  userTo.save();

  let isToDefi =
    Rules.getRulesIdByDefi(event.params.to).length > 0 ? true : false;

  let initiateUser = isToDefi ? transferLog.from : event.params.to.toHex();
  let checkIsBlacklisted = isBlacklisted(initiateUser);

  if (!checkIsBlacklisted) {
    let rulesIds = isToDefi
      ? Rules.getRulesIdByDefi(event.params.to)
      : Rules.getRulesIdByDefi(event.params.from);
    let activityType = isToDefi ? "STAKE_SUSDB_DEFI" : "UNSTAKE_SUSDB_DEFI";

    for (let i = 0; i < rulesIds.length; i++) {
      let ruleId = rulesIds[i];
      let ruleDetails = Rules.fromId(ruleId);
      if (ruleDetails && ruleDetails.origin == event.address) {
        // update transer log
        transferLog.to = event.params.to.toHex();
        transferLog.isValuable = true;
        transferLog.save();

        // Handle Defi integration
        let defiIntegration = DefiIntegration.load(ruleDetails.tag);
        if (defiIntegration == null) {
          defiIntegration = new DefiIntegration(ruleDetails.tag);
          defiIntegration.totalVolume = BigInt.fromI32(0);
          defiIntegration.txCount = BigInt.fromI32(0);
          defiIntegration.balanceUSDB = BigInt.fromI32(0);
          defiIntegration.balanceSUSDB = BigInt.fromI32(0);
        }
        defiIntegration.totalVolume = isToDefi
          ? defiIntegration.totalVolume.plus(event.params.value)
          : defiIntegration.totalVolume.minus(event.params.value);

        defiIntegration.balanceSUSDB = isToDefi
          ? defiIntegration.balanceSUSDB.plus(event.params.value)
          : defiIntegration.balanceSUSDB.minus(event.params.value);

        defiIntegration.txCount = defiIntegration.txCount.plus(
          BigInt.fromI32(1)
        );
        defiIntegration.save();

        // Create activity
        let activity = new UserActivity(event.transaction.hash.toHex());
        activity.activityType = activityType;
        activity.originType = "USDB";
        activity.amount = event.params.value;
        activity.timestamp = event.block.timestamp;
        activity.user = initiateUser;
        activity.defiIntegration = ruleDetails.tag;
        activity.save();

        // Update points
        createAndUpdateUserInPoint(
          ruleDetails.id,
          initiateUser,
          ruleDetails.types,
          event.params.value,
          event.block.timestamp,
          isToDefi,
          isWhitelisted(initiateUser)
        );
      }
    }
  }
}