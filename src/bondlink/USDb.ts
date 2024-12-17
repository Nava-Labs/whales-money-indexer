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

import { isBoosted } from "../utils/boosted";
import { isBlacklisted } from "../utils/blacklist";
import { isDeployer } from "../utils/deployer";
import { Rules } from "./rules";
import {
  createAndUpdateUserInPoint,
  convertDecimal6ToDecimal18,
  populatePointRulesAndMultipliers,
} from "./helper/pointRule";

export function handleDeposit(event: DepositEvent): void {
  // populate point rules
  populatePointRulesAndMultipliers();

  // Check deployer
  let checkDeployer = isDeployer(event.params.user.toHex());
  let totalMinted = checkDeployer
    ? event.params.amount
    : convertDecimal6ToDecimal18(event.params.amount);

  // Protocol Overview
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.totalVolumeUSDB = BigInt.fromI32(0);
    protocolOverview.totalVolumeSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
    protocolOverview.totalMintedUSDB = BigInt.fromI32(0);
    protocolOverview.susdbPrice = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  protocolOverview.totalVolumeUSDB = protocolOverview.totalVolumeUSDB.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );

  protocolOverview.totalMintedUSDB = protocolOverview.totalMintedUSDB.plus(
    totalMinted
  );
  protocolOverview.save();

  // defi integration
  let defiIntegration = DefiIntegration.load("USDb");
  if (defiIntegration == null) {
    defiIntegration = new DefiIntegration("USDb");
    defiIntegration.totalVolumeUSDB = BigInt.fromI32(0);
    defiIntegration.txCount = BigInt.fromI32(0);
    defiIntegration.balanceUSDB = BigInt.fromI32(0);
    defiIntegration.balanceSUSDB = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  defiIntegration.totalVolumeUSDB = defiIntegration.totalVolumeUSDB.plus(
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
    user.totalVolumeUSDB = BigInt.fromI32(0);
    user.totalVolumeSUSDB = BigInt.fromI32(0);
    user.redeemAmountInUSDC = BigInt.fromI32(0);
    user.unrealizedEarnings = BigInt.fromI32(0);
    user.realizedEarnings = BigInt.fromI32(0);
    user.totalAllTimeBalanceUSDB = BigInt.fromI32(0);
    user.totalAllTimeBalanceSUSDB = BigInt.fromI32(0);
    user.balanceUSDB = BigInt.fromI32(0);
    user.balanceSUSDB = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  user.totalVolumeUSDB = user.totalVolumeUSDB.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );

  // whitelisted
  let checkWhitelisted = isBoosted(event.params.user.toHex());
  user.isBoosted = checkWhitelisted;

  // define relation
  user.protocolOverview = "BONDLINK";
  user.save();

  // deployer
  let activityType = checkDeployer ? "DEPOSIT_USDB_FIAT" : "DEPOSIT_USDB";

  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = activityType;
  activity.originType = "USDB";
  activity.amountInUSDB = totalMinted;
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
          ruleDetails.endTimestamp,
          ruleDetails.minTransferAmount,
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
    protocolOverview.totalVolumeUSDB = BigInt.fromI32(0);
    protocolOverview.totalVolumeSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
    protocolOverview.totalMintedUSDB = BigInt.fromI32(0);
    protocolOverview.susdbPrice = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  protocolOverview.totalVolumeUSDB = protocolOverview.totalVolumeUSDB.plus(
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
    user.totalVolumeUSDB = BigInt.fromI32(0);
    user.totalVolumeSUSDB = BigInt.fromI32(0);
    user.redeemAmountInUSDC = BigInt.fromI32(0);
    user.unrealizedEarnings = BigInt.fromI32(0);
    user.realizedEarnings = BigInt.fromI32(0);
    user.totalAllTimeBalanceUSDB = BigInt.fromI32(0);
    user.totalAllTimeBalanceSUSDB = BigInt.fromI32(0);
    user.balanceUSDB = BigInt.fromI32(0);
    user.balanceSUSDB = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  user.totalVolumeUSDB = user.totalVolumeUSDB.minus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  user.redeemAmountInUSDC = user.redeemAmountInUSDC.plus(event.params.amount);
  user.protocolOverview = "BONDLINK";
  user.save();

  // create redeem logs
  let redeem = UserInRedeem.load(event.params.user.toHex());
  if (redeem == null) {
    redeem = new UserInRedeem(event.params.user.toHex());
    redeem.amountInUSDB = BigInt.fromI32(0);
  }
  redeem.amountInUSDB = redeem.amountInUSDB.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  redeem.claimableTimestamp = event.params.redeemEndedAt;
  redeem.status = "ONGOING";
  // relation
  redeem.user = event.params.user.toHex();
  redeem.protocolOverview = "BONDLINK";
  redeem.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "CDREDEEM_USDB";
  activity.originType = "USDB";
  activity.amountInUSDB = convertDecimal6ToDecimal18(event.params.amount);
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
    protocolOverview.totalVolumeUSDB = BigInt.fromI32(0);
    protocolOverview.totalVolumeSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
    protocolOverview.totalMintedUSDB = BigInt.fromI32(0);
    protocolOverview.susdbPrice = BigInt.fromI32(0);
  }
  protocolOverview.totalOngoingRedeemUSDB = protocolOverview.totalOngoingRedeemUSDB.minus(
    event.params.amount
  );
  protocolOverview.save();

  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.totalVolumeUSDB = BigInt.fromI32(0);
    user.totalVolumeSUSDB = BigInt.fromI32(0);
    user.redeemAmountInUSDC = BigInt.fromI32(0);
    user.unrealizedEarnings = BigInt.fromI32(0);
    user.realizedEarnings = BigInt.fromI32(0);
    user.totalAllTimeBalanceUSDB = BigInt.fromI32(0);
    user.totalAllTimeBalanceSUSDB = BigInt.fromI32(0);
  }
  user.redeemAmountInUSDC = BigInt.fromI32(0);
  user.protocolOverview = "BONDLINK";
  user.save();

  let redeem = UserInRedeem.load(event.params.user.toHex());
  if (redeem == null) {
    redeem = new UserInRedeem(event.params.user.toHex());
    redeem.amountInUSDB = BigInt.fromI32(0);
    redeem.claimableTimestamp = BigInt.fromI32(0);
  }
  redeem.amountInUSDB = BigInt.fromI32(0);
  redeem.claimableTimestamp = BigInt.fromI32(0);
  redeem.status = "COMPLETED";
  // relation
  redeem.user = event.params.user.toHex();
  redeem.protocolOverview = "BONDLINK";
  redeem.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "REDEEM_USDB";
  activity.originType = "USDB";
  activity.amountInUSDB = convertDecimal6ToDecimal18(event.params.amount);
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
    userFrom.totalVolumeUSDB = BigInt.fromI32(0);
    userFrom.totalVolumeSUSDB = BigInt.fromI32(0);
    userFrom.redeemAmountInUSDC = BigInt.fromI32(0);
    userFrom.unrealizedEarnings = BigInt.fromI32(0);
    userFrom.realizedEarnings = BigInt.fromI32(0);
    userFrom.balanceUSDB = BigInt.fromI32(0);
    userFrom.balanceSUSDB = BigInt.fromI32(0);
    userFrom.totalAllTimeBalanceUSDB = BigInt.fromI32(0);
    userFrom.totalAllTimeBalanceSUSDB = BigInt.fromI32(0);
  }

  userFrom.balanceUSDB = isBlacklisted(event.params.from.toHex())
    ? userFrom.balanceUSDB.minus(BigInt.fromI32(0))
    : userFrom.balanceUSDB.minus(event.params.value);
  userFrom.protocolOverview = "BONDLINK";
  userFrom.isBoosted = isBoosted(event.params.from.toHex());
  userFrom.save();

  // Handle user to
  let userTo = User.load(event.params.to.toHex());
  if (userTo == null) {
    userTo = new User(event.params.to.toHex());
    userTo.totalVolumeUSDB = BigInt.fromI32(0);
    userTo.totalVolumeSUSDB = BigInt.fromI32(0);
    userTo.redeemAmountInUSDC = BigInt.fromI32(0);
    userTo.unrealizedEarnings = BigInt.fromI32(0);
    userTo.realizedEarnings = BigInt.fromI32(0);
    userTo.balanceUSDB = BigInt.fromI32(0);
    userTo.balanceSUSDB = BigInt.fromI32(0);
    userTo.totalAllTimeBalanceUSDB = BigInt.fromI32(0);
    userTo.totalAllTimeBalanceSUSDB = BigInt.fromI32(0);
  }

  userTo.balanceUSDB = isBlacklisted(event.params.to.toHex())
    ? userTo.balanceUSDB.plus(BigInt.fromI32(0))
    : userTo.balanceUSDB.plus(event.params.value);

  userTo.totalAllTimeBalanceUSDB = userTo.totalAllTimeBalanceUSDB.plus(
    event.params.value
  );
  userTo.protocolOverview = "BONDLINK";
  userTo.isBoosted = isBoosted(event.params.to.toHex());
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
        // update transfer log
        transferLog.amount = event.params.value;
        transferLog.to = event.params.to.toHex();
        transferLog.isValuable = true;
        transferLog.save();

        // Handle Defi integration
        let defiIntegration = DefiIntegration.load(ruleDetails.tag);
        if (defiIntegration == null) {
          defiIntegration = new DefiIntegration(ruleDetails.tag);
          defiIntegration.totalVolumeUSDB = BigInt.fromI32(0);
          defiIntegration.txCount = BigInt.fromI32(0);
          defiIntegration.balanceUSDB = BigInt.fromI32(0);
          defiIntegration.balanceSUSDB = BigInt.fromI32(0);
        }
        defiIntegration.totalVolumeUSDB = isToDefi
          ? defiIntegration.totalVolumeUSDB.plus(event.params.value)
          : defiIntegration.totalVolumeUSDB.minus(event.params.value);

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
        activity.amountInUSDB = event.params.value;
        activity.timestamp = event.block.timestamp;
        activity.user = initiateUser;
        activity.defiIntegration = ruleDetails.tag;
        activity.save();

        // Update points
        createAndUpdateUserInPoint(
          ruleDetails.id,
          initiateUser,
          ruleDetails.types,
          ruleDetails.endTimestamp,
          ruleDetails.minTransferAmount,
          event.params.value,
          event.block.timestamp,
          isToDefi,
          isBoosted(initiateUser)
        );
      }
    }
  }
}
