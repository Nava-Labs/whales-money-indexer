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
  Transfer as TransferEvent,
} from "./types/SUSDb/SUSDb";

import { checkRulesPoint } from "./helper/pointRules";
import { createActivity } from "./helper/activity";

export function handleDeposit(event: DepositEvent): void {
  // protocol overview
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.tvl = BigInt.fromI32(0);
    protocolOverview.tvlSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
  }

  protocolOverview.tvlSUSDB = protocolOverview.tvlSUSDB.plus(
    event.params.assets
  );
  protocolOverview.save();

  // defi integration
  let defiIntegration = DefiIntegration.load("SUSDb");
  if (defiIntegration == null) {
    defiIntegration = new DefiIntegration("SUSDb");
    defiIntegration.tvl = BigInt.fromI32(0);
    defiIntegration.txCount = BigInt.fromI32(0);
  }

  defiIntegration.tvl = defiIntegration.tvl.plus(event.params.assets);
  defiIntegration.txCount = defiIntegration.txCount.plus(BigInt.fromI32(1));
  defiIntegration.save();

  // user
  let user = User.load(event.params.owner.toHex());
  if (user == null) {
    user = new User(event.params.owner.toHex());
    user.tvl = BigInt.fromI32(0);
    user.tvlSUSDB = BigInt.fromI32(0);
    user.redeemAmount = BigInt.fromI32(0);
    user.totalPoints = BigInt.fromI32(0);
  }

  user.tvl = user.tvl.plus(event.params.assets);
  // get point
  let getPoint = checkRulesPoint(
    event.params.owner.toHex(),
    event.address.toHex(),
    event.params.assets,
    event.block.timestamp
  );
  user.totalPoints = user.totalPoints.plus(getPoint);
  // add relation
  user.protocolOverview = "BONDLINK";
  user.userInPoint = `${event.params.owner.toHex()} - ${event.address.toHex()}`;

  // create activity
  createActivity(
    event.transaction.hash.toHex(),
    "STAKED_USDB",
    event.params.owner.toHex(),
    event.params.assets,
    event.block.timestamp,
    "SUSDb"
  );
}

export function handleYieldReceived(event: YieldReceivedEvent): void {
  let protocolOverview = ProtocolOverview.load("BONDLINK");
  if (protocolOverview == null) {
    protocolOverview = new ProtocolOverview("BONDLINK");
    protocolOverview.tvl = BigInt.fromI32(0);
    protocolOverview.tvlSUSDB = BigInt.fromI32(0);
    protocolOverview.totalYieldDistributed = BigInt.fromI32(0);
    protocolOverview.totalOngoingRedeemUSDB = BigInt.fromI32(0);
  }

  protocolOverview.totalYieldDistributed = protocolOverview.totalYieldDistributed.plus(
    event.params.amount
  );
  protocolOverview.save();
}

// export function handleTransfer(event: TransferEvent): void {
//   let transferActivity = checkWhitelist(
//     "SUSDb",
//     event.params.from.toHex(),
//     event.params.to.toHex()
//   );

//   if (transferActivity.type == "TRANSFER_SUSDB") {
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
//   } else if (transferActivity.type == "STAKE_SUSDB_DEFI") {
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
//   } else if (transferActivity.type == "UNSTAKE_SUSDB_DEFI") {
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
