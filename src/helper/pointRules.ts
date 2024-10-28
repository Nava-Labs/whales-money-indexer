import { Rules } from "../mapping/rules";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { UserInPoint, PointRules, Multiplier } from "../types/schema";

export function createUserInPoint(
  rulesId: string,
  user: string,
  rulesType: string,
  amount: BigInt,
  timestamp: BigInt,
  isToDefi: boolean
): void {
  let initialUserInPoint = UserInPoint.load(rulesId + "-" + user);
  if (initialUserInPoint == null) {
    Rules.createInitialUserInPoint(Address.fromString(user));
  }
  let userInPoint = UserInPoint.load(rulesId + "-" + user)!;

  let pointEarned = BigDecimal.fromString("0");
  if (isToDefi) {
    if (userInPoint.status != "COMPLETED" && rulesType == "ONETIME") {
      let amountToEther = Rules.convertToEther(amount);
      pointEarned = Rules.getPoint(
        rulesId,
        amountToEther,
        BigDecimal.fromString(timestamp.toString()),
        null,
        userInPoint.totalPointEarned
      );

      if (pointEarned != BigDecimal.fromString("0")) {
        userInPoint.totalPointEarned = userInPoint.totalPointEarned.plus(
          pointEarned
        );
        userInPoint.stakeAmount = userInPoint.stakeAmount.plus(amount);
        userInPoint.lastStakeTimestamp = timestamp;
        userInPoint.endStakeTimestamp = timestamp;
        userInPoint.status = "COMPLETED";
      }
    } else if (userInPoint.status != "COMPLETED" && rulesType != "ONETIME") {
      // case rules type "INTERVAL" or "HOLD"
      if (userInPoint.stakeAmount != BigInt.fromI32(0)) {
        let previousStakeAmountToEther = Rules.convertToEther(
          userInPoint.stakeAmount
        );

        // recap point
        pointEarned = Rules.getPoint(
          rulesId,
          previousStakeAmountToEther,
          BigDecimal.fromString(timestamp.toString()),
          BigDecimal.fromString(userInPoint.lastStakeTimestamp.toString()),
          userInPoint.totalPointEarned
        );

        // add recap point
        userInPoint.totalPointEarned = userInPoint.totalPointEarned.plus(
          pointEarned
        );
      }
      userInPoint.stakeAmount = userInPoint.stakeAmount.plus(amount);
      userInPoint.lastStakeTimestamp = timestamp;
      userInPoint.endStakeTimestamp = BigInt.fromI32(0);
      userInPoint.status = "ONGOING";
    }
  } else {
    if (userInPoint.status != "COMPLETED" && rulesType != "ONETIME") {
      let previousStakeAmountToEther = Rules.convertToEther(
        userInPoint.stakeAmount
      );

      // recap point
      pointEarned = Rules.getPoint(
        rulesId,
        previousStakeAmountToEther,
        BigDecimal.fromString(timestamp.toString()),
        BigDecimal.fromString(userInPoint.lastStakeTimestamp.toString()),
        userInPoint.totalPointEarned
      );

      // add recap point
      userInPoint.totalPointEarned = userInPoint.totalPointEarned.plus(
        pointEarned
      );
      userInPoint.stakeAmount = userInPoint.stakeAmount.minus(amount);

      if (userInPoint.stakeAmount == BigInt.fromI32(0)) {
        userInPoint.status = "COMPLETED";
      }
    }
  }
  // define relation
  userInPoint.user = user;
  userInPoint.pointRules = rulesId;
  userInPoint.save();
}

export function convertDecimal6ToDecimal18(amount: BigInt): BigInt {
  let divisor = BigInt.fromI32(10).pow(12);
  return amount.times(divisor);
}

export function populatePointRulesAndMultipliers(): void {
  let bondlinkRulesArray = Rules.getStaticDefinitions();

  for (let i = 0; i < bondlinkRulesArray.length; i++) {
    let bondlinkRule = bondlinkRulesArray[i];

    let pointRulesEntity = PointRules.load(bondlinkRule.id);
    if (pointRulesEntity == null) {
      // Create a new PointRules entity
      pointRulesEntity = new PointRules(bondlinkRule.id);
      pointRulesEntity.name = bondlinkRule.name;
      pointRulesEntity.tag = bondlinkRule.tag;
      pointRulesEntity.address = bondlinkRule.defiAddress.toHex();
      pointRulesEntity.minTransferAmount = bondlinkRule.minTransferAmount;
      pointRulesEntity.maxPoint = bondlinkRule.maxPoint;
      pointRulesEntity.basePoint = bondlinkRule.basePoint;
      pointRulesEntity.startTimestamp = bondlinkRule.startTimestamp;
      pointRulesEntity.endTimestamp = bondlinkRule.endTimestamp;
      pointRulesEntity.types = bondlinkRule.types;

      // Save the PointRules entity
      pointRulesEntity.save();
    }

    for (let j = 0; j < bondlinkRule.multipliers.length; j++) {
      let multiplierData = bondlinkRule.multipliers[j];

      // Create a unique ID for each Multiplier entity
      let multiplierId = bondlinkRule.id + "-mul" + j.toString();
      let multiplierEntity = Multiplier.load(multiplierId);

      // If the Multiplier doesn't exist, create it
      if (multiplierEntity == null) {
        multiplierEntity = new Multiplier(multiplierId);
        multiplierEntity.multiplier = multiplierData.multiplier;
        multiplierEntity.minThresholdMultiplier =
          multiplierData.minThresholdMultiplier;

        // define relation
        multiplierEntity.pointRules = bondlinkRule.id;

        // Save the Multiplier entity
        multiplierEntity.save();
      }
    }
  }
}

export function checkAndCreatePointRules(bondlinkRuleId: string): void {
  let bondlinkRule = Rules.fromId(bondlinkRuleId);
  if (bondlinkRule) {
    let pointRulesEntity = PointRules.load(bondlinkRule.id);
    if (pointRulesEntity == null) {
      // Create a new PointRules entity
      pointRulesEntity = new PointRules(bondlinkRule.id);
      pointRulesEntity.name = bondlinkRule.name;
      pointRulesEntity.tag = bondlinkRule.tag;
      pointRulesEntity.minTransferAmount = bondlinkRule.minTransferAmount;
      pointRulesEntity.maxPoint = bondlinkRule.maxPoint;
      pointRulesEntity.basePoint = bondlinkRule.basePoint;
      pointRulesEntity.startTimestamp = bondlinkRule.startTimestamp;
      pointRulesEntity.endTimestamp = bondlinkRule.endTimestamp;
      pointRulesEntity.types = bondlinkRule.types;

      // Save the PointRules entity
      pointRulesEntity.save();
    }

    for (let j = 0; j < bondlinkRule.multipliers.length; j++) {
      let multiplierData = bondlinkRule.multipliers[j];

      // Create a unique ID for each Multiplier entity
      let multiplierId = bondlinkRule.id + "-mul" + j.toString();
      let multiplierEntity = Multiplier.load(multiplierId);

      // If the Multiplier doesn't exist, create it
      if (multiplierEntity == null) {
        multiplierEntity = new Multiplier(multiplierId);
        multiplierEntity.multiplier = multiplierData.multiplier;
        multiplierEntity.minThresholdMultiplier =
          multiplierData.minThresholdMultiplier;

        // define relation
        multiplierEntity.pointRules = bondlinkRule.id;

        // Save the Multiplier entity
        multiplierEntity.save();
      }
    }
  }
}
