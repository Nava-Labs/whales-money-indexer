import { BigInt } from "@graphprotocol/graph-ts";
import {
  User,
  UserInRedeem,
  ProtocolOverview,
  DefiIntegration,
  UserActivity,
  TransferLog,
} from "../types/schema";
import {
  Deposit as DepositEvent,
  CDRedeem as CDRedeemEvent,
  Redeem as RedeemEvent,
  Transfer as TransferEvent,
} from "../types/USDb/USDb";

import { isWhitelisted } from "../utils/whitelist";
import { isBlacklisted } from "../utils/blacklist";
import { Rules } from "./rules";
import {
  createAndUpdateUserInPoint,
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
    defiIntegration.balanceUSDB = BigInt.fromI32(0);
    defiIntegration.balanceSUSDB = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  defiIntegration.totalVolume = defiIntegration.totalVolume.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  defiIntegration.balanceUSDB = defiIntegration.balanceUSDB.plus(
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
    user.realizedAmount = BigInt.fromI32(0);
    user.balanceUSDB = BigInt.fromI32(0);
    user.balanceSUSDB = BigInt.fromI32(0);
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
  activity.activityType = "DEPOSIT_USDB";
  activity.originType = "USDB";
  activity.amount = event.params.amount;
  activity.timestamp = event.block.timestamp;

  // define relation
  activity.user = event.params.user.toHex();
  activity.defiIntegration = "USDb";
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
          event.params.user.toHex(),
          ruleDetails.types,
          convertDecimal6ToDecimal18(event.params.amount),
          event.block.timestamp,
          true,
          checkWhitelisted
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
    convertDecimal6ToDecimal18(event.params.amount)
  );
  protocolOverview.save();

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

  // decimal 6 -> to decimal 18
  user.totalVolume = user.totalVolume.minus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  user.redeemAmount = user.redeemAmount.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  user.protocolOverview = "BONDLINK";
  user.save();

  // create redeem logs
  let redeem = UserInRedeem.load(event.params.user.toHex() + "-Redeem");
  if (redeem == null) {
    redeem = new UserInRedeem(event.params.user.toHex() + "-Redeem");
    redeem.amountInUsdb = BigInt.fromI32(0);
  }
  redeem.amountInUsdb = redeem.amountInUsdb.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  redeem.claimableDate = event.params.redeemEndedAt;
  redeem.status = "COOLDOWN";
  // relation
  redeem.user = event.params.user.toHex();
  redeem.protocolOverview = "BONDLINK";
  redeem.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "CDREDEEM_USDB";
  activity.originType = "USDB";
  activity.amount = convertDecimal6ToDecimal18(event.params.amount);
  activity.timestamp = event.block.timestamp;

  // define relation
  activity.user = event.params.user.toHex();
  activity.defiIntegration = "USDb";
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
    user.realizedAmount = BigInt.fromI32(0);
  }
  user.redeemAmount = BigInt.fromI32(0);
  user.protocolOverview = "BONDLINK";
  user.save();

  let redeem = UserInRedeem.load(event.params.user.toHex() + "-Redeem");
  if (redeem == null) {
    redeem = new UserInRedeem(event.params.user.toHex() + "-Redeem");
    redeem.amountInUsdb = BigInt.fromI32(0);
    redeem.claimableDate = BigInt.fromI32(0);
  }
  redeem.amountInUsdb = BigInt.fromI32(0);
  redeem.claimableDate = BigInt.fromI32(0);
  redeem.status = "COMPLETED";
  // relation
  redeem.user = event.params.user.toHex();
  redeem.protocolOverview = "BONDLINK";
  redeem.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "REDEEM_USDB";
  activity.originType = "USDB";
  activity.amount = convertDecimal6ToDecimal18(event.params.amount);
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defiIntegration = "USDb";
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

  userFrom.balanceUSDB = isBlacklisted(event.params.from.toHex())
    ? userFrom.balanceUSDB.minus(BigInt.fromI32(0))
    : userFrom.balanceUSDB.minus(event.params.value);
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

  userTo.balanceUSDB = isBlacklisted(event.params.to.toHex())
    ? userTo.balanceUSDB.plus(BigInt.fromI32(0))
    : userTo.balanceUSDB.plus(event.params.value);
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
    let activityType = isToDefi ? "STAKE_USDB_DEFI" : "UNSTAKE_USDB_DEFI";

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

        defiIntegration.balanceUSDB = isToDefi
          ? defiIntegration.balanceUSDB.plus(event.params.value)
          : defiIntegration.balanceUSDB.minus(event.params.value);

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
