import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  User,
  ProtocolOverview,
  UserActivity,
  DefiIntegration,
  TransferLog,
  YieldHistory,
} from "../types/schema";
import {
  Deposit as DepositEvent,
  YieldReceived as YieldReceivedEvent,
  CDUnstake as CDUnstakeEvent,
  Unstake as UnstakeEvent,
  Transfer as TransferEvent,
} from "../types/SUSDb/SUSDb";

import { sUSDbUSDbExchangeRateChainlinkAdapter } from "../types/SUSDb/sUSDbUSDbExchangeRateChainlinkAdapter";

import { Rules } from "./rules";
import { createAndUpdateUserInPoint } from "./helper/pointRule";
import { isBoosted } from "../utils/boosted";
import { isBlacklisted } from "../utils/blacklist";

export function handleDeposit(event: DepositEvent): void {
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
  protocolOverview.totalVolumeUSDB = protocolOverview.totalVolumeUSDB.plus(
    event.params.assets
  );
  protocolOverview.totalVolumeSUSDB = protocolOverview.totalVolumeSUSDB.plus(
    event.params.assets
  );

  // defi integration
  let defiIntegration = DefiIntegration.load("SUSDb");
  if (defiIntegration == null) {
    defiIntegration = new DefiIntegration("SUSDb");
    defiIntegration.totalVolumeUSDB = BigInt.fromI32(0);
    defiIntegration.txCount = BigInt.fromI32(0);
    defiIntegration.balanceUSDB = BigInt.fromI32(0);
    defiIntegration.balanceSUSDB = BigInt.fromI32(0);
  }

  defiIntegration.totalVolumeUSDB = defiIntegration.totalVolumeUSDB.plus(
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
    user.totalVolumeUSDB = BigInt.fromI32(0);
    user.totalVolumeSUSDB = BigInt.fromI32(0);
    user.redeemAmountInUSDC = BigInt.fromI32(0);
    user.unrealizedEarnings = BigInt.fromI32(0);
    user.realizedEarnings = BigInt.fromI32(0);
    user.balanceUSDB = BigInt.fromI32(0);
    user.balanceSUSDB = BigInt.fromI32(0);
  }
  user.totalVolumeUSDB = user.totalVolumeUSDB.minus(event.params.assets);
  user.totalVolumeSUSDB = user.totalVolumeSUSDB.plus(event.params.assets);
  // add relation
  user.protocolOverview = "BONDLINK";

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "STAKE_USDB";
  activity.originType = "SUSDB";
  activity.amountInUSDB = event.params.assets;
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
          ruleDetails.endTimestamp,
          ruleDetails.minTransferAmount,
          event.params.assets,
          event.block.timestamp,
          true,
          isBoosted(event.params.owner.toHex())
        );
      }
    }
  }

  // save the price
  let scale = BigInt.fromI32(10).pow(18);
  let susdbPrice = fetchSUSDBPrice();
  protocolOverview.susdbPrice = susdbPrice;
  protocolOverview.save();

  // unrealized earnings
  let userBalanceSUSDB =
    user.balanceSUSDB != BigInt.fromI32(0)
      ? user.balanceSUSDB
      : BigInt.fromI32(1).times(scale);
  let totalFinalValue = userBalanceSUSDB.times(susdbPrice).div(scale);
  user.unrealizedEarnings = totalFinalValue.minus(user.balanceSUSDB);
  user.save();
}

export function handleYieldReceived(event: YieldReceivedEvent): void {
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
  protocolOverview.totalYieldDistributed = protocolOverview.totalYieldDistributed.plus(
    event.params.amount
  );

  // save the price
  let susdbPrice = fetchSUSDBPrice();
  protocolOverview.susdbPrice = susdbPrice;
  protocolOverview.save();

  // create yield history
  let yieldHistory = new YieldHistory(event.transaction.hash.toHex());
  yieldHistory.yieldAmountInUSDB = event.params.amount;
  yieldHistory.timestamp = event.block.timestamp;
  // relation
  yieldHistory.protocolOverview = "BONDLINK";
  yieldHistory.save();
}

export function handleCDUnstake(event: CDUnstakeEvent): void {
  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "CDREDEEM_SUSDB";
  activity.originType = "SUSDB";
  activity.amountInUSDB = event.params.amount;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defiIntegration = "SUSDb";
  activity.save();

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
  protocolOverview.totalVolumeSUSDB = protocolOverview.totalVolumeSUSDB.plus(
    event.params.amount
  );

  // save the price
  let scale = BigInt.fromI32(10).pow(18);
  let susdbPrice = fetchSUSDBPrice();
  protocolOverview.susdbPrice = susdbPrice;
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
    user.balanceUSDB = BigInt.fromI32(0);
    user.balanceSUSDB = BigInt.fromI32(0);
  }

  // add relation
  user.protocolOverview = "BONDLINK";

  // realized earnings
  let userBalanceSUSDB =
    user.balanceSUSDB != BigInt.fromI32(0)
      ? user.balanceSUSDB
      : BigInt.fromI32(1).times(scale);

  let unstakeProportion = event.params.amount
    .times(scale)
    .div(userBalanceSUSDB);

  user.realizedEarnings = unstakeProportion
    .times(user.unrealizedEarnings)
    .div(scale);

  user.unrealizedEarnings = user.unrealizedEarnings.minus(
    user.realizedEarnings
  );
  user.save();
}

export function handleUnstake(event: UnstakeEvent): void {
  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "UNSTAKE_USDB";
  activity.originType = "SUSDB";
  activity.amountInUSDB = event.params.amount;
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
    userFrom.totalVolumeUSDB = BigInt.fromI32(0);
    userFrom.totalVolumeSUSDB = BigInt.fromI32(0);
    userFrom.redeemAmountInUSDC = BigInt.fromI32(0);
    userFrom.unrealizedEarnings = BigInt.fromI32(0);
    userFrom.realizedEarnings = BigInt.fromI32(0);
    userFrom.balanceUSDB = BigInt.fromI32(0);
    userFrom.balanceSUSDB = BigInt.fromI32(0);
  }

  userFrom.balanceSUSDB = isBlacklisted(event.params.from.toHex())
    ? userFrom.balanceSUSDB.minus(BigInt.fromI32(0))
    : userFrom.balanceSUSDB.minus(event.params.value);
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
  }

  userTo.balanceSUSDB = isBlacklisted(event.params.to.toHex())
    ? userTo.balanceSUSDB.plus(BigInt.fromI32(0))
    : userTo.balanceSUSDB.plus(event.params.value);
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
          defiIntegration.totalVolumeUSDB = BigInt.fromI32(0);
          defiIntegration.txCount = BigInt.fromI32(0);
          defiIntegration.balanceUSDB = BigInt.fromI32(0);
          defiIntegration.balanceSUSDB = BigInt.fromI32(0);
        }
        defiIntegration.totalVolumeUSDB = isToDefi
          ? defiIntegration.totalVolumeUSDB.plus(event.params.value)
          : defiIntegration.totalVolumeUSDB.minus(event.params.value);

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

export function fetchSUSDBPrice(): BigInt {
  let contract = sUSDbUSDbExchangeRateChainlinkAdapter.bind(
    Address.fromString("0x42E968536aB9c65Fcd7314ac29BeEbAD1A448B6E")
  );
  let price = BigInt.zero();
  let result = contract.try_latestRoundData();
  if (result.reverted) {
    log.info("price reverted", []);
  } else {
    log.info("price success", []);
    price = result.value.getValue1();
  }

  return price;
}
