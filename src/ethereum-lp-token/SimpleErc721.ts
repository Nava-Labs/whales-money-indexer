import { BigInt } from "@graphprotocol/graph-ts";
import { DefiIntegration, UserActivity, TransferLog } from "../types/schema";
import { Transfer as TransferEvent } from "../types/wUSD/wUSD";

import { isBlacklisted } from "../utils/blacklist";
import { Rules } from "../whalesMoney/rules";
import {
  createAndUpdateUserInPoint,
  populatePointRulesAndMultipliers,
} from "./helper/pointRule";
import { isBoosted } from "../utils/boosted";

export function handleTransfer(event: TransferEvent): void {
  // Populate
  populatePointRulesAndMultipliers();

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

  // // Handle user from
  // let userFrom = User.load(event.params.from.toHex());
  // if (userFrom == null) {
  //   userFrom = new User(event.params.from.toHex());
  //   userFrom.totalVolumeWUSD = BigInt.fromI32(0);
  //   userFrom.totalVolumeSWUSD = BigInt.fromI32(0);
  //   userFrom.redeemAmountInUSDC = BigInt.fromI32(0);
  //   userFrom.realizedYieldAmountInWUSD = BigInt.fromI32(0);
  //   userFrom.balanceWUSD = BigInt.fromI32(0);
  //   userFrom.balanceSWUSD = BigInt.fromI32(0);
  // }

  // userFrom.balanceSWUSD = isBlacklisted(event.params.from.toHex())
  //   ? userFrom.balanceSWUSD.minus(BigInt.fromI32(0))
  //   : userFrom.balanceSWUSD.minus(event.params.value);
  // userFrom.protocolOverview = "WHALES-MONEY";
  // userFrom.isBoosted = isBoosted(event.params.from.toHex());
  // userFrom.save();

  // // Handle user to
  // let userTo = User.load(event.params.to.toHex());
  // if (userTo == null) {
  //   userTo = new User(event.params.to.toHex());
  //   userTo.totalVolumeWUSD = BigInt.fromI32(0);
  //   userTo.totalVolumeSWUSD = BigInt.fromI32(0);
  //   userTo.redeemAmountInUSDC = BigInt.fromI32(0);
  //   userTo.realizedYieldAmountInWUSD = BigInt.fromI32(0);
  //   userTo.balanceWUSD = BigInt.fromI32(0);
  //   userTo.balanceSWUSD = BigInt.fromI32(0);
  // }

  // userTo.balanceSWUSD = isBlacklisted(event.params.to.toHex())
  //   ? userTo.balanceSWUSD.plus(BigInt.fromI32(0))
  //   : userTo.balanceSWUSD.plus(event.params.value);
  // userTo.protocolOverview = "WHALES-MONEY";
  // userTo.isBoosted = isBoosted(event.params.to.toHex());
  // userTo.save();

  let isToDefi =
    Rules.getRulesIdByDefi(event.params.to).length > 0 ? true : false;

  let initiateUser = isToDefi ? transferLog.from : event.params.to.toHex();
  let checkIsBlacklisted = isBlacklisted(initiateUser);

  if (!checkIsBlacklisted) {
    let rulesIds = isToDefi
      ? Rules.getRulesIdByDefi(event.params.to)
      : Rules.getRulesIdByDefi(event.params.from);
    let activityType = isToDefi ? "STAKE_LP_DEFI" : "UNSTAKE_LP_DEFI";

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

        // defiIntegration.balanceSWUSD = isToDefi
        //   ? defiIntegration.balanceSWUSD.plus(event.params.value)
        //   : defiIntegration.balanceSWUSD.minus(event.params.value);

        defiIntegration.txCount = defiIntegration.txCount.plus(
          BigInt.fromI32(1)
        );
        defiIntegration.save();

        // Create activity
        let activity = new UserActivity(event.transaction.hash.toHex());
        activity.activityType = activityType;
        activity.originType = "ETH-LP-Token";
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
