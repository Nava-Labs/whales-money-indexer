import { BigInt } from "@graphprotocol/graph-ts";
import {
  User,
  RedeemLogs,
  ProtocolOverview,
  UserActivity,
  DefiIntegration,
} from "./types/schema";
import {
  Deposit as DepositEvent,
  CDRedeem as CDRedeemEvent,
  Redeem as RedeemEvent,
  Transfer as TransferEvent,
} from "./types/USDb/USDb";

import { checkRulesPoint } from "./helper/pointRules";
import { createActivity } from "./helper/activity";

export function handleDeposit(event: DepositEvent): void {
  // Protocol Overview
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.tvl = BigInt.fromI32(0);
    protocolOverview.tvlSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
  }

  protocolOverview.tvl = protocolOverview.tvl.plus(event.params.amount);
  protocolOverview.save();

  // defi integration
  let defiIntegration = DefiIntegration.load("USDb");
  if (defiIntegration == null) {
    defiIntegration = new DefiIntegration("USDb");
    defiIntegration.tvl = BigInt.fromI32(0);
    defiIntegration.txCount = BigInt.fromI32(0);
  }

  defiIntegration.tvl = defiIntegration.tvl.plus(event.params.amount);
  defiIntegration.txCount = defiIntegration.txCount.plus(BigInt.fromI32(1));
  defiIntegration.save();

  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.tvl = BigInt.fromI32(0);
    user.tvlSUSDB = BigInt.fromI32(0);
    user.redeemAmount = BigInt.fromI32(0);
    user.totalPoints = BigInt.fromI32(0);
  }

  user.tvl = user.tvl.plus(event.params.amount);
  // get point
  let getPoint = checkRulesPoint(
    event.params.user.toHex(),
    event.address.toHex(),
    event.params.amount,
    event.block.timestamp
  );
  user.totalPoints = user.totalPoints.plus(getPoint);
  // add relation
  user.protocolOverview = "BONDLINK";
  user.userInPoint = `${event.params.user.toHex()} - ${event.address.toHex()}`;

  // create activity
  createActivity(
    event.transaction.hash.toHex(),
    "DEPOSIT_USDB",
    event.params.user.toHex(),
    event.params.amount,
    event.block.timestamp,
    "USDb"
  );
}

export function handleCDRedeem(event: CDRedeemEvent): void {
  // protocol overview
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.tvl = BigInt.fromI32(0);
    protocolOverview.tvlSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
  }
  protocolOverview.tvl = protocolOverview.tvl.minus(event.params.amount);
  protocolOverview.totalOngoingRedeemUSDB = protocolOverview.totalOngoingRedeemUSDB.plus(
    event.params.amount
  );
  protocolOverview.save();

  // user
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.tvl = BigInt.fromI32(0);
    user.tvlSUSDB = BigInt.fromI32(0);
    user.redeemAmount = BigInt.fromI32(0);
    user.totalPoints = BigInt.fromI32(0);
  }
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
  createActivity(
    event.transaction.hash.toHex(),
    "CDREDEEM_USDB",
    event.params.user.toHex(),
    event.params.amount,
    event.block.timestamp,
    "USDb"
  );
}

export function handleRedeem(event: RedeemEvent): void {
  // protocol overview
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.tvl = BigInt.fromI32(0);
    protocolOverview.tvlSUSDB = BigInt.fromI32(0);
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
    user.tvl = BigInt.fromI32(0);
    user.tvlSUSDB = BigInt.fromI32(0);
    user.redeemAmount = BigInt.fromI32(0);
    user.totalPoints = BigInt.fromI32(0);
  }
  user.redeemAmount = BigInt.fromI32(0);
  user.protocolOverview = "BONDLINK";
  user.save();

  // create activity
  createActivity(
    event.transaction.hash.toHex(),
    "REDEEM_USDB",
    event.params.user.toHex(),
    event.params.amount,
    event.block.timestamp,
    "USDb"
  );
}

// export function handleTransfer(event: TransferEvent): void {
//   let transferActivity = checkWhitelist(
//     "USDb",
//     event.params.from.toHex(),
//     event.params.to.toHex()
//   );

//   if (transferActivity.type == "TRANSFER_USDB") {
//     let fromUser = User.load(event.params.from.toHex());
//     if (fromUser == null) {
//       fromUser = new User(event.params.from.toHex());
//       fromUser.totalVolume = BigInt.fromI32(0);
//       fromUser.redeemAmount = BigInt.fromI32(0);
//     }

//     fromUser.totalVolume = fromUser.totalVolume.minus(event.params.value);
//     fromUser.save();

//     let activity = new UserActivity(event.transaction.hash.toHex());
//     activity.type = transferActivity.type;
//     activity.amount = event.params.value;
//     activity.timestamp = event.block.timestamp;
//     activity.user = event.params.from.toHex();
//     activity.save();

//     let toUser = User.load(event.params.to.toHex());
//     if (toUser == null) {
//       toUser = new User(event.params.to.toHex());
//       toUser.totalVolume = BigInt.fromI32(0);
//       toUser.redeemAmount = BigInt.fromI32(0);
//     }
//     toUser.totalVolume = toUser.totalVolume.plus(event.params.value);
//     toUser.save();
//   } else if (transferActivity.type == "STAKE_USDB_DEFI") {
//     let fromUser = User.load(event.params.from.toHex());
//     if (fromUser == null) {
//       fromUser = new User(event.params.from.toHex());
//       fromUser.totalVolume = BigInt.fromI32(0);
//       fromUser.redeemAmount = BigInt.fromI32(0);
//     }

//     fromUser.totalVolume = fromUser.totalVolume.minus(event.params.value);
//     fromUser.save();

//     let activity = new UserActivity(event.transaction.hash.toHex());
//     activity.type = transferActivity.type;
//     activity.amount = event.params.value;
//     activity.timestamp = event.block.timestamp;
//     activity.user = event.params.from.toHex();
//     activity.save();

//     let defiIntegration = DefiIntegration.load(event.params.to.toHex());
//     if (defiIntegration == null) {
//       defiIntegration = new DefiIntegration(event.params.to.toHex());
//       defiIntegration.name = transferActivity.name;
//       defiIntegration.totalVolume = BigInt.fromI32(0);
//       defiIntegration.txCount = BigInt.fromI32(0);
//     }

//     defiIntegration.totalVolume = defiIntegration.totalVolume.plus(
//       event.params.value
//     );
//     defiIntegration.save();
//   } else if (transferActivity.type == "UNSTAKE_USDB_DEFI") {
//     let defiIntegration = DefiIntegration.load(event.params.from.toHex());
//     if (defiIntegration == null) {
//       defiIntegration = new DefiIntegration(event.params.from.toHex());
//       defiIntegration.name = transferActivity.name;
//       defiIntegration.totalVolume = BigInt.fromI32(0);
//       defiIntegration.txCount = BigInt.fromI32(0);
//     }

//     let activity = new UserActivity(event.transaction.hash.toHex());
//     activity.type = transferActivity.type;
//     activity.amount = event.params.value;
//     activity.timestamp = event.block.timestamp;
//     activity.user = event.params.from.toHex();
//     activity.save();

//     defiIntegration.totalVolume = defiIntegration.totalVolume.minus(
//       event.params.value
//     );
//     defiIntegration.save();

//     let toUser = User.load(event.params.to.toHex());
//     if (toUser == null) {
//       toUser = new User(event.params.from.toHex());
//       toUser.totalVolume = BigInt.fromI32(0);
//       toUser.redeemAmount = BigInt.fromI32(0);
//     }

//     toUser.totalVolume = toUser.totalVolume.minus(event.params.value);
//     toUser.save();
//   }
// }
