import { BigInt } from "@graphprotocol/graph-ts";
import {
  User,
  RedeemLogs,
  ProtocolOverview,
  DefiIntegration,
  UserActivity,
} from "./types/schema";
import {
  Deposit as DepositEvent,
  CDRedeem as CDRedeemEvent,
  Redeem as RedeemEvent,
  Transfer as TransferEvent,
} from "./types/USDb/USDb";

import { isWhitelisted } from "./utils/whitelist";
import { Rules } from "./mapping/rules";
import {
  createUserInPoint,
  convertDecimal6ToDecimal18,
  populatePointRulesAndMultipliers,
} from "./helper/pointRules";

export function handleDeposit(event: DepositEvent): void {
  // populate point rules
  populatePointRulesAndMultipliers();

  // Protocol Overview
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.totalVolume = BigInt.fromI32(0);
    protocolOverview.totalVolumeSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  protocolOverview.totalVolume = protocolOverview.totalVolume.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  protocolOverview.save();

  // defi integration
  let defiIntegration = DefiIntegration.load("USDb");
  if (defiIntegration == null) {
    defiIntegration = new DefiIntegration("USDb");
    defiIntegration.totalVolume = BigInt.fromI32(0);
    defiIntegration.txCount = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  defiIntegration.totalVolume = defiIntegration.totalVolume.plus(
    convertDecimal6ToDecimal18(event.params.amount)
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

  // decimal 6 -> to decimal 18
  user.totalVolume = user.totalVolume.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );

  // whitelisted
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
          event.params.user.toHex(),
          ruleDetails.types,
          convertDecimal6ToDecimal18(event.params.amount),
          event.block.timestamp,
          true
        );
      }
    }
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

  // decimal 6 -> to decimal 18
  protocolOverview.totalVolume = protocolOverview.totalVolume.minus(
    convertDecimal6ToDecimal18(event.params.amount)
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

  // decimal 6 -> to decimal 18
  user.totalVolume = user.totalVolume.minus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
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
  // check is if to defi
  let isToDefi =
    Rules.getRulesIdByDefi(event.params.to).length > 0 ? true : false;

  let initiateUser = isToDefi
    ? event.params.from.toHex()
    : event.params.to.toHex();

  let rulesIds = isToDefi
    ? Rules.getRulesIdByDefi(event.params.to)
    : Rules.getRulesIdByDefi(event.params.from);

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
      }
      user.redeemAmount = BigInt.fromI32(0);
      user.protocolOverview = "BONDLINK";
      let checkWhitelisted = isWhitelisted(initiateUser);
      user.isWhitelisted = checkWhitelisted;
      user.save();

      // create activity
      let activity = new UserActivity(event.transaction.hash.toHex());
      activity.type = "STAKE_USDB_DEFI";
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
