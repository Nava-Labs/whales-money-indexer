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
} from "../types/wUSD/wUSD";

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
  let protocolOverview = ProtocolOverview.load("WHALES-MONEY");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("WHALES-MONEY");
    protocolOverview.totalVolumeWUSD = BigInt.fromI32(0);
    protocolOverview.totalVolumeSWUSD = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemWUSD = BigInt.fromI32(0);
    protocolOverview.totalMintedWUSD = BigInt.fromI32(0);
    protocolOverview.SWUSDPrice = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  protocolOverview.totalVolumeWUSD = protocolOverview.totalVolumeWUSD.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );

  protocolOverview.totalMintedWUSD = protocolOverview.totalMintedWUSD.plus(
    totalMinted
  );
  protocolOverview.save();

  // defi integration
  let defiIntegration = DefiIntegration.load("wUSD");
  if (defiIntegration == null) {
    defiIntegration = new DefiIntegration("wUSD");
    defiIntegration.totalVolumeWUSD = BigInt.fromI32(0);
    defiIntegration.txCount = BigInt.fromI32(0);
    defiIntegration.balanceWUSD = BigInt.fromI32(0);
    defiIntegration.balanceSWUSD = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  defiIntegration.totalVolumeWUSD = defiIntegration.totalVolumeWUSD.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  defiIntegration.balanceWUSD = defiIntegration.balanceWUSD.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  defiIntegration.txCount = defiIntegration.txCount.plus(BigInt.fromI32(1));

  defiIntegration.save();

  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.totalVolumeWUSD = BigInt.fromI32(0);
    user.totalVolumeSWUSD = BigInt.fromI32(0);
    user.redeemAmountInUSDC = BigInt.fromI32(0);
    user.unrealizedEarnings = BigInt.fromI32(0);
    user.realizedEarnings = BigInt.fromI32(0);
    user.totalAllTimeBalanceWUSD = BigInt.fromI32(0);
    user.totalAllTimeBalanceSWUSD = BigInt.fromI32(0);
    user.balanceWUSD = BigInt.fromI32(0);
    user.balanceSWUSD = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  user.totalVolumeWUSD = user.totalVolumeWUSD.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );

  // whitelisted
  let checkWhitelisted = isBoosted(event.params.user.toHex());
  user.isBoosted = checkWhitelisted;

  // define relation
  user.protocolOverview = "WHALES-MONEY";
  user.save();

  // deployer
  let activityType = checkDeployer ? "DEPOSIT_WUSD_FIAT" : "DEPOSIT_WUSD";

  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = activityType;
  activity.originType = "WUSD";
  activity.amountInWUSD = totalMinted;
  activity.timestamp = event.block.timestamp;

  // define relation
  activity.user = event.params.user.toHex();
  activity.defiIntegration = "wUSD";
  activity.save();

  // point
  let rulesIds = Rules.getRulesIdByDefi(event.address);
  if (rulesIds.length > 0) {
    for (let i = 0; i < rulesIds.length; i++) {
      let ruleId = rulesIds[i];
      let ruleDetails = Rules.fromId(ruleId);
      if (ruleDetails && ruleDetails.origin == event.address) {
        // checkAndCreatePointRules(whalesMoneyruleDetails);
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
  let protocolOverview = ProtocolOverview.load("WHALES-MONEY");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("WHALES-MONEY");
    protocolOverview.totalVolumeWUSD = BigInt.fromI32(0);
    protocolOverview.totalVolumeSWUSD = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemWUSD = BigInt.fromI32(0);
    protocolOverview.totalMintedWUSD = BigInt.fromI32(0);
    protocolOverview.SWUSDPrice = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  protocolOverview.totalVolumeWUSD = protocolOverview.totalVolumeWUSD.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  protocolOverview.totalOngoingRedeemWUSD = protocolOverview.totalOngoingRedeemWUSD.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  protocolOverview.save();

  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.totalVolumeWUSD = BigInt.fromI32(0);
    user.totalVolumeSWUSD = BigInt.fromI32(0);
    user.redeemAmountInUSDC = BigInt.fromI32(0);
    user.unrealizedEarnings = BigInt.fromI32(0);
    user.realizedEarnings = BigInt.fromI32(0);
    user.totalAllTimeBalanceWUSD = BigInt.fromI32(0);
    user.totalAllTimeBalanceSWUSD = BigInt.fromI32(0);
    user.balanceWUSD = BigInt.fromI32(0);
    user.balanceSWUSD = BigInt.fromI32(0);
  }

  // decimal 6 -> to decimal 18
  user.totalVolumeWUSD = user.totalVolumeWUSD.minus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  user.redeemAmountInUSDC = user.redeemAmountInUSDC.plus(event.params.amount);
  user.protocolOverview = "WHALES-MONEY";
  user.save();

  // create redeem logs
  let redeem = UserInRedeem.load(event.params.user.toHex());
  if (redeem == null) {
    redeem = new UserInRedeem(event.params.user.toHex());
    redeem.amountInWUSD = BigInt.fromI32(0);
  }
  redeem.amountInWUSD = redeem.amountInWUSD.plus(
    convertDecimal6ToDecimal18(event.params.amount)
  );
  redeem.claimableTimestamp = event.params.redeemEndedAt;
  redeem.status = "ONGOING";
  // relation
  redeem.user = event.params.user.toHex();
  redeem.protocolOverview = "WHALES-MONEY";
  redeem.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "CDREDEEM_WUSD";
  activity.originType = "WUSD";
  activity.amountInWUSD = convertDecimal6ToDecimal18(event.params.amount);
  activity.timestamp = event.block.timestamp;

  // define relation
  activity.user = event.params.user.toHex();
  activity.defiIntegration = "wUSD";
  activity.save();
}

export function handleRedeem(event: RedeemEvent): void {
  // protocol overview
  let protocolOverview = ProtocolOverview.load("WHALES-MONEY");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("WHALES-MONEY");
    protocolOverview.totalVolumeWUSD = BigInt.fromI32(0);
    protocolOverview.totalVolumeSWUSD = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemWUSD = BigInt.fromI32(0);
    protocolOverview.totalMintedWUSD = BigInt.fromI32(0);
    protocolOverview.SWUSDPrice = BigInt.fromI32(0);
  }
  protocolOverview.totalOngoingRedeemWUSD = protocolOverview.totalOngoingRedeemWUSD.minus(
    event.params.amount
  );
  protocolOverview.save();

  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.totalVolumeWUSD = BigInt.fromI32(0);
    user.totalVolumeSWUSD = BigInt.fromI32(0);
    user.redeemAmountInUSDC = BigInt.fromI32(0);
    user.unrealizedEarnings = BigInt.fromI32(0);
    user.realizedEarnings = BigInt.fromI32(0);
    user.totalAllTimeBalanceWUSD = BigInt.fromI32(0);
    user.totalAllTimeBalanceSWUSD = BigInt.fromI32(0);
  }
  user.redeemAmountInUSDC = BigInt.fromI32(0);
  user.protocolOverview = "WHALES-MONEY";
  user.save();

  let redeem = UserInRedeem.load(event.params.user.toHex());
  if (redeem == null) {
    redeem = new UserInRedeem(event.params.user.toHex());
    redeem.amountInWUSD = BigInt.fromI32(0);
    redeem.claimableTimestamp = BigInt.fromI32(0);
  }
  redeem.amountInWUSD = BigInt.fromI32(0);
  redeem.claimableTimestamp = BigInt.fromI32(0);
  redeem.status = "COMPLETED";
  // relation
  redeem.user = event.params.user.toHex();
  redeem.protocolOverview = "WHALES-MONEY";
  redeem.save();

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "REDEEM_WUSD";
  activity.originType = "WUSD";
  activity.amountInWUSD = convertDecimal6ToDecimal18(event.params.amount);
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defiIntegration = "wUSD";
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
    userFrom.totalVolumeWUSD = BigInt.fromI32(0);
    userFrom.totalVolumeSWUSD = BigInt.fromI32(0);
    userFrom.redeemAmountInUSDC = BigInt.fromI32(0);
    userFrom.unrealizedEarnings = BigInt.fromI32(0);
    userFrom.realizedEarnings = BigInt.fromI32(0);
    userFrom.balanceWUSD = BigInt.fromI32(0);
    userFrom.balanceSWUSD = BigInt.fromI32(0);
    userFrom.totalAllTimeBalanceWUSD = BigInt.fromI32(0);
    userFrom.totalAllTimeBalanceSWUSD = BigInt.fromI32(0);
  }

  userFrom.balanceWUSD = isBlacklisted(event.params.from.toHex())
    ? userFrom.balanceWUSD.minus(BigInt.fromI32(0))
    : userFrom.balanceWUSD.minus(event.params.value);
  userFrom.protocolOverview = "WHALES-MONEY";
  userFrom.isBoosted = isBoosted(event.params.from.toHex());
  userFrom.save();

  // Handle user to
  let userTo = User.load(event.params.to.toHex());
  if (userTo == null) {
    userTo = new User(event.params.to.toHex());
    userTo.totalVolumeWUSD = BigInt.fromI32(0);
    userTo.totalVolumeSWUSD = BigInt.fromI32(0);
    userTo.redeemAmountInUSDC = BigInt.fromI32(0);
    userTo.unrealizedEarnings = BigInt.fromI32(0);
    userTo.realizedEarnings = BigInt.fromI32(0);
    userTo.balanceWUSD = BigInt.fromI32(0);
    userTo.balanceSWUSD = BigInt.fromI32(0);
    userTo.totalAllTimeBalanceWUSD = BigInt.fromI32(0);
    userTo.totalAllTimeBalanceSWUSD = BigInt.fromI32(0);
  }

  userTo.balanceWUSD = isBlacklisted(event.params.to.toHex())
    ? userTo.balanceWUSD.plus(BigInt.fromI32(0))
    : userTo.balanceWUSD.plus(event.params.value);

  userTo.totalAllTimeBalanceWUSD = userTo.totalAllTimeBalanceWUSD.plus(
    event.params.value
  );
  userTo.protocolOverview = "WHALES-MONEY";
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
    let activityType = isToDefi ? "STAKE_WUSD_DEFI" : "UNSTAKE_WUSD_DEFI";

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
          defiIntegration.totalVolumeWUSD = BigInt.fromI32(0);
          defiIntegration.txCount = BigInt.fromI32(0);
          defiIntegration.balanceWUSD = BigInt.fromI32(0);
          defiIntegration.balanceSWUSD = BigInt.fromI32(0);
        }
        defiIntegration.totalVolumeWUSD = isToDefi
          ? defiIntegration.totalVolumeWUSD.plus(event.params.value)
          : defiIntegration.totalVolumeWUSD.minus(event.params.value);

        defiIntegration.balanceWUSD = isToDefi
          ? defiIntegration.balanceWUSD.plus(event.params.value)
          : defiIntegration.balanceWUSD.minus(event.params.value);

        defiIntegration.txCount = defiIntegration.txCount.plus(
          BigInt.fromI32(1)
        );
        defiIntegration.save();

        // Create activity
        let activity = new UserActivity(event.transaction.hash.toHex());
        activity.activityType = activityType;
        activity.originType = "WUSD";
        activity.amountInWUSD = event.params.value;
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
