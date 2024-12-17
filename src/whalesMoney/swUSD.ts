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
} from "../types/swUSD/swUSD";

import { swUSDwUSDExchangeRateChainlinkAdapter } from "../types/swUSD/swUSDwUSDExchangeRateChainlinkAdapter";

import { Rules } from "./rules";
import { createAndUpdateUserInPoint } from "./helper/pointRule";
import { isBoosted } from "../utils/boosted";
import { isBlacklisted } from "../utils/blacklist";

export function handleDeposit(event: DepositEvent): void {
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
  protocolOverview.totalVolumeWUSD = protocolOverview.totalVolumeWUSD.plus(
    event.params.assets
  );
  protocolOverview.totalVolumeSWUSD = protocolOverview.totalVolumeSWUSD.plus(
    event.params.assets
  );

  // defi integration
  let defiIntegration = DefiIntegration.load("swUSD");
  if (defiIntegration == null) {
    defiIntegration = new DefiIntegration("swUSD");
    defiIntegration.totalVolumeWUSD = BigInt.fromI32(0);
    defiIntegration.txCount = BigInt.fromI32(0);
    defiIntegration.balanceWUSD = BigInt.fromI32(0);
    defiIntegration.balanceSWUSD = BigInt.fromI32(0);
  }

  defiIntegration.totalVolumeWUSD = defiIntegration.totalVolumeWUSD.plus(
    event.params.assets
  );
  defiIntegration.balanceSWUSD = defiIntegration.balanceSWUSD.plus(
    event.params.assets
  );
  defiIntegration.txCount = defiIntegration.txCount.plus(BigInt.fromI32(1));
  defiIntegration.save();

  // user
  let user = User.load(event.params.owner.toHex());
  if (user == null) {
    user = new User(event.params.owner.toHex());
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
  user.totalVolumeWUSD = user.totalVolumeWUSD.minus(event.params.assets);
  user.totalVolumeSWUSD = user.totalVolumeSWUSD.plus(event.params.assets);
  // add relation
  user.protocolOverview = "WHALES-MONEY";

  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "STAKE_WUSD";
  activity.originType = "SWUSD";
  activity.amountInWUSD = event.params.assets;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.owner.toHex();
  activity.defiIntegration = "swUSD";
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
  let SWUSDPrice = fetchSWUSDPrice();
  protocolOverview.SWUSDPrice = SWUSDPrice;
  protocolOverview.save();

  // unrealized earnings
  let userBalanceSWUSD =
    user.balanceSWUSD != BigInt.fromI32(0)
      ? user.balanceSWUSD
      : BigInt.fromI32(1).times(scale);
  let totalFinalValue = userBalanceSWUSD.times(SWUSDPrice).div(scale);
  user.unrealizedEarnings = totalFinalValue.minus(user.balanceSWUSD);
  user.save();
}

export function handleYieldReceived(event: YieldReceivedEvent): void {
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
  protocolOverview.totalYieldDistributed = protocolOverview.totalYieldDistributed.plus(
    event.params.amount
  );

  // save the price
  let SWUSDPrice = fetchSWUSDPrice();
  protocolOverview.SWUSDPrice = SWUSDPrice;
  protocolOverview.save();

  // create yield history
  let yieldHistory = new YieldHistory(event.transaction.hash.toHex());
  yieldHistory.yieldAmountInWUSD = event.params.amount;
  yieldHistory.timestamp = event.block.timestamp;
  // relation
  yieldHistory.protocolOverview = "WHALES-MONEY";
  yieldHistory.save();
}

export function handleCDUnstake(event: CDUnstakeEvent): void {
  // create activity
  let activity = new UserActivity(event.transaction.hash.toHex());
  activity.activityType = "CDREDEEM_SWUSD";
  activity.originType = "SWUSD";
  activity.amountInWUSD = event.params.amount;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defiIntegration = "swUSD";
  activity.save();

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
  protocolOverview.totalVolumeSWUSD = protocolOverview.totalVolumeSWUSD.plus(
    event.params.amount
  );

  // save the price
  let scale = BigInt.fromI32(10).pow(18);
  let SWUSDPrice = fetchSWUSDPrice();
  protocolOverview.SWUSDPrice = SWUSDPrice;
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

  // add relation
  user.protocolOverview = "WHALES-MONEY";

  // realized earnings
  let userBalanceSWUSD =
    user.balanceSWUSD != BigInt.fromI32(0)
      ? user.balanceSWUSD
      : BigInt.fromI32(1).times(scale);

  let unstakeProportion = event.params.amount
    .times(scale)
    .div(userBalanceSWUSD);

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
  activity.activityType = "UNSTAKE_WUSD";
  activity.originType = "SWUSD";
  activity.amountInWUSD = event.params.amount;
  activity.timestamp = event.block.timestamp;
  // define relation
  activity.user = event.params.user.toHex();
  activity.defiIntegration = "swUSD";
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

  userFrom.balanceSWUSD = isBlacklisted(event.params.from.toHex())
    ? userFrom.balanceSWUSD.minus(BigInt.fromI32(0))
    : userFrom.balanceSWUSD.minus(event.params.value);
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

  userTo.balanceSWUSD = isBlacklisted(event.params.to.toHex())
    ? userTo.balanceSWUSD.plus(BigInt.fromI32(0))
    : userTo.balanceSWUSD.plus(event.params.value);
  userTo.totalAllTimeBalanceSWUSD = userTo.totalAllTimeBalanceSWUSD.plus(
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
    let activityType = isToDefi ? "STAKE_SWUSD_DEFI" : "UNSTAKE_SWUSD_DEFI";

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
          defiIntegration.totalVolumeWUSD = BigInt.fromI32(0);
          defiIntegration.txCount = BigInt.fromI32(0);
          defiIntegration.balanceWUSD = BigInt.fromI32(0);
          defiIntegration.balanceSWUSD = BigInt.fromI32(0);
        }
        defiIntegration.totalVolumeWUSD = isToDefi
          ? defiIntegration.totalVolumeWUSD.plus(event.params.value)
          : defiIntegration.totalVolumeWUSD.minus(event.params.value);

        defiIntegration.balanceSWUSD = isToDefi
          ? defiIntegration.balanceSWUSD.plus(event.params.value)
          : defiIntegration.balanceSWUSD.minus(event.params.value);

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

export function fetchSWUSDPrice(): BigInt {
  let contract = swUSDwUSDExchangeRateChainlinkAdapter.bind(
    Address.fromString("0x9468dd2AeA4Fc67C65A5C9A6f5979B84C631aa95")
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
