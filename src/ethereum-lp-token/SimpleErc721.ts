import { BigInt } from "@graphprotocol/graph-ts";
import { DefiIntegration, UserActivity, TransferLog } from "../types/schema";
import { Transfer as TransferEvent } from "../types/USDb/USDb";

import { isBlacklisted } from "../utils/blacklist";
import { Rules } from "../bondlink/rules";
import {
  createAndUpdateUserInPoint,
  populatePointRulesAndMultipliers,
} from "./helper/pointRules";
import { isWhitelisted } from "../utils/whitelist";

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
  //   userFrom.totalVolume = BigInt.fromI32(0);
  //   userFrom.totalVolumeSUSDB = BigInt.fromI32(0);
  //   userFrom.redeemAmount = BigInt.fromI32(0);
  //   userFrom.realizedAmount = BigInt.fromI32(0);
  //   userFrom.balanceUSDB = BigInt.fromI32(0);
  //   userFrom.balanceSUSDB = BigInt.fromI32(0);
  // }

  // userFrom.balanceSUSDB = isBlacklisted(event.params.from.toHex())
  //   ? userFrom.balanceSUSDB.minus(BigInt.fromI32(0))
  //   : userFrom.balanceSUSDB.minus(event.params.value);
  // userFrom.protocolOverview = "BONDLINK";
  // userFrom.isWhitelisted = isWhitelisted(event.params.from.toHex());
  // userFrom.save();

  // // Handle user to
  // let userTo = User.load(event.params.to.toHex());
  // if (userTo == null) {
  //   userTo = new User(event.params.to.toHex());
  //   userTo.totalVolume = BigInt.fromI32(0);
  //   userTo.totalVolumeSUSDB = BigInt.fromI32(0);
  //   userTo.redeemAmount = BigInt.fromI32(0);
  //   userTo.realizedAmount = BigInt.fromI32(0);
  //   userTo.balanceUSDB = BigInt.fromI32(0);
  //   userTo.balanceSUSDB = BigInt.fromI32(0);
  // }

  // userTo.balanceSUSDB = isBlacklisted(event.params.to.toHex())
  //   ? userTo.balanceSUSDB.plus(BigInt.fromI32(0))
  //   : userTo.balanceSUSDB.plus(event.params.value);
  // userTo.protocolOverview = "BONDLINK";
  // userTo.isWhitelisted = isWhitelisted(event.params.to.toHex());
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
          defiIntegration.totalVolume = BigInt.fromI32(0);
          defiIntegration.txCount = BigInt.fromI32(0);
          defiIntegration.balanceUSDB = BigInt.fromI32(0);
          defiIntegration.balanceSUSDB = BigInt.fromI32(0);
        }
        defiIntegration.totalVolume = isToDefi
          ? defiIntegration.totalVolume.plus(event.params.value)
          : defiIntegration.totalVolume.minus(event.params.value);

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
