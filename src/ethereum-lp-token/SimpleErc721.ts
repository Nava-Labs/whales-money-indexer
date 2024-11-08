import { BigInt } from "@graphprotocol/graph-ts";
import { DefiIntegration, UserActivity, TransferLog } from "../types/schema";
import { Transfer as TransferEvent } from "../types/USDb/USDb";

import { isBlacklisted } from "../utils/blacklist";
import { Rules } from "../bondlink/rules";
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
  //   userFrom.totalVolumeUSDB = BigInt.fromI32(0);
  //   userFrom.totalVolumeSUSDB = BigInt.fromI32(0);
  //   userFrom.redeemAmountInUSDC = BigInt.fromI32(0);
  //   userFrom.realizedYieldAmountInUSDB = BigInt.fromI32(0);
  //   userFrom.balanceUSDB = BigInt.fromI32(0);
  //   userFrom.balanceSUSDB = BigInt.fromI32(0);
  // }

  // userFrom.balanceSUSDB = isBlacklisted(event.params.from.toHex())
  //   ? userFrom.balanceSUSDB.minus(BigInt.fromI32(0))
  //   : userFrom.balanceSUSDB.minus(event.params.value);
  // userFrom.protocolOverview = "BONDLINK";
  // userFrom.isBoosted = isBoosted(event.params.from.toHex());
  // userFrom.save();

  // // Handle user to
  // let userTo = User.load(event.params.to.toHex());
  // if (userTo == null) {
  //   userTo = new User(event.params.to.toHex());
  //   userTo.totalVolumeUSDB = BigInt.fromI32(0);
  //   userTo.totalVolumeSUSDB = BigInt.fromI32(0);
  //   userTo.redeemAmountInUSDC = BigInt.fromI32(0);
  //   userTo.realizedYieldAmountInUSDB = BigInt.fromI32(0);
  //   userTo.balanceUSDB = BigInt.fromI32(0);
  //   userTo.balanceSUSDB = BigInt.fromI32(0);
  // }

  // userTo.balanceSUSDB = isBlacklisted(event.params.to.toHex())
  //   ? userTo.balanceSUSDB.plus(BigInt.fromI32(0))
  //   : userTo.balanceSUSDB.plus(event.params.value);
  // userTo.protocolOverview = "BONDLINK";
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
          defiIntegration.totalVolumeUSDB = BigInt.fromI32(0);
          defiIntegration.txCount = BigInt.fromI32(0);
          defiIntegration.balanceUSDB = BigInt.fromI32(0);
          defiIntegration.balanceSUSDB = BigInt.fromI32(0);
        }
        defiIntegration.totalVolumeUSDB = isToDefi
          ? defiIntegration.totalVolumeUSDB.plus(event.params.value)
          : defiIntegration.totalVolumeUSDB.minus(event.params.value);

        // defiIntegration.balanceSUSDB = isToDefi
        //   ? defiIntegration.balanceSUSDB.plus(event.params.value)
        //   : defiIntegration.balanceSUSDB.minus(event.params.value);

        defiIntegration.txCount = defiIntegration.txCount.plus(
          BigInt.fromI32(1)
        );
        defiIntegration.save();

        // Create activity
        let activity = new UserActivity(event.transaction.hash.toHex());
        activity.activityType = activityType;
        activity.originType = "ETH-LP-Token";
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
