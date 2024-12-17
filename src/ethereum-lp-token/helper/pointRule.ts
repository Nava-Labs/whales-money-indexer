import { Rules } from "../rules";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { UserInPoint, PointRule, Multiplier } from "../../types/schema";

export function createAndUpdateUserInPoint(
  rulesId: string,
  user: string,
  rulesType: string,
  rulesEndtime: BigDecimal,
  rulesMinAmount: BigInt,
  amount: BigInt,
  nowTimestamp: BigInt,
  isToDefi: boolean,
  isBoosted: boolean
): void {
  let initialUserInPoint = UserInPoint.load(rulesId + "-" + user);

  // if null, populate userInPoint
  if (initialUserInPoint == null) {
    Rules.createInitialUserInPoint(Address.fromString(user));
  }
  let userInPoint = UserInPoint.load(rulesId + "-" + user)!;

  let pointEarned = BigDecimal.fromString("0");
  let appliedMultiplier = BigDecimal.fromString("1");

  if (isToDefi) {
    if (userInPoint.status != "COMPLETED" && rulesType == "ONETIME") {
      let amountToEther = Rules.convertToEther(amount);

      // Use the new `getPoint` function and split the result manually
      let result = Rules.getPoint(
        rulesId,
        amountToEther,
        BigDecimal.fromString(nowTimestamp.toString()),
        null,
        userInPoint.totalPointEarned,
        isBoosted
      );
      let resultArray = result.split("-");
      let pointEarnedStr = resultArray[0];
      let appliedMultiplierStr = resultArray[1];
      pointEarned = BigDecimal.fromString(pointEarnedStr);
      appliedMultiplier = BigDecimal.fromString(appliedMultiplierStr);

      if (pointEarned != BigDecimal.fromString("0")) {
        userInPoint.totalPointEarned = pointEarned;
        userInPoint.stakeAmount = userInPoint.stakeAmount.plus(amount);
        userInPoint.lastStakeTimestamp = nowTimestamp;
        userInPoint.lastMultipliers = appliedMultiplier;
        userInPoint.status = "COMPLETED";
      }
    } else if (userInPoint.status != "COMPLETED" && rulesType != "ONETIME") {
      // For "INTERVAL" types
      // if stake amount = 0, do nothing
      if (userInPoint.stakeAmount != BigInt.fromI32(0)) {
        let previousStakeAmountToEther = Rules.convertToEther(
          userInPoint.stakeAmount
        );

        // Use the new `getPoint` function and split the result manually
        let result = Rules.getPoint(
          rulesId,
          previousStakeAmountToEther,
          BigDecimal.fromString(nowTimestamp.toString()),
          BigDecimal.fromString(userInPoint.lastStakeTimestamp.toString()),
          userInPoint.totalPointEarned,
          isBoosted
        );
        let resultArray = result.split("-");
        let pointEarnedStr = resultArray[0];
        let appliedMultiplierStr = resultArray[1];
        pointEarned = BigDecimal.fromString(pointEarnedStr);
        appliedMultiplier = BigDecimal.fromString(appliedMultiplierStr);

        // Add the earned points
        userInPoint.totalPointEarned = pointEarned;
      }
      userInPoint.stakeAmount = userInPoint.stakeAmount.plus(amount);
      userInPoint.lastStakeTimestamp = nowTimestamp;
      userInPoint.lastMultipliers = appliedMultiplier;
      userInPoint.status = userInPoint.stakeAmount.ge(rulesMinAmount)
        ? "ONGOING"
        : "NOT ELIGIBLE";
    }
  } else {
    if (userInPoint.status != "COMPLETED" && rulesType != "ONETIME") {
      // Unstake only for rules types "INTERVAL"
      let previousStakeAmountToEther = Rules.convertToEther(
        userInPoint.stakeAmount
      );

      // Use the new `getPoint` function and split the result manually
      let result = Rules.getPoint(
        rulesId,
        previousStakeAmountToEther,
        BigDecimal.fromString(nowTimestamp.toString()),
        BigDecimal.fromString(userInPoint.lastStakeTimestamp.toString()),
        userInPoint.totalPointEarned,
        isBoosted
      );
      let resultArray = result.split("-");
      let pointEarnedStr = resultArray[0];
      let appliedMultiplierStr = resultArray[1];
      pointEarned = BigDecimal.fromString(pointEarnedStr);
      appliedMultiplier = BigDecimal.fromString(appliedMultiplierStr);

      // Add the earned points
      userInPoint.totalPointEarned = pointEarned;
      userInPoint.stakeAmount = userInPoint.stakeAmount.minus(amount);
      userInPoint.lastStakeTimestamp = nowTimestamp;
      userInPoint.lastMultipliers = appliedMultiplier;

      // Check for completion
      if (
        userInPoint.stakeAmount == BigInt.fromI32(0) &&
        BigDecimal.fromString(nowTimestamp.toString()).ge(rulesEndtime)
      ) {
        userInPoint.status = "COMPLETED";
        userInPoint.lastStakeTimestamp = nowTimestamp;
        userInPoint.lastMultipliers = appliedMultiplier;
      }
    }
  }
  // Define relation
  userInPoint.user = user;
  userInPoint.pointRule = rulesId;
  userInPoint.save();
}

export function convertDecimal6ToDecimal18(amount: BigInt): BigInt {
  let divisor = BigInt.fromI32(10).pow(12);
  return amount.times(divisor);
}

export function populatePointRulesAndMultipliers(): void {
  let whalesMoneyRulesArray = Rules.getStaticDefinitions();

  for (let i = 0; i < whalesMoneyRulesArray.length; i++) {
    let whalesMoneyRule = whalesMoneyRulesArray[i];

    let pointRulesEntity = PointRule.load(whalesMoneyRule.id);
    if (pointRulesEntity == null) {
      // Create a new PointRule entity
      pointRulesEntity = new PointRule(whalesMoneyRule.id);
      pointRulesEntity.name = whalesMoneyRule.name;
      pointRulesEntity.tag = whalesMoneyRule.tag;
      pointRulesEntity.pair = whalesMoneyRule.pair;
      pointRulesEntity.iconUrl = whalesMoneyRule.iconUrl;
      pointRulesEntity.actionUrl = whalesMoneyRule.actionUrl;
      pointRulesEntity.origin = whalesMoneyRule.origin.toHex();
      pointRulesEntity.address = whalesMoneyRule.defiAddress.toHex();
      pointRulesEntity.minTransferAmount = whalesMoneyRule.minTransferAmount;
      pointRulesEntity.maxPoint = whalesMoneyRule.maxPoint;
      pointRulesEntity.basePoint = whalesMoneyRule.basePoint;
      pointRulesEntity.startTimestamp = whalesMoneyRule.startTimestamp;
      pointRulesEntity.endTimestamp = whalesMoneyRule.endTimestamp;
      pointRulesEntity.types = whalesMoneyRule.types;

      // Save the PointRule entity
      pointRulesEntity.save();
    } else {
      // if point rules already populated then break;
      break;
    }

    for (let j = 0; j < whalesMoneyRule.multipliers.length; j++) {
      let multiplierData = whalesMoneyRule.multipliers[j];

      // Create a unique ID for each Multiplier entity
      let multiplierId = whalesMoneyRule.id + "-mul" + j.toString();
      let multiplierEntity = Multiplier.load(multiplierId);

      // If the Multiplier doesn't exist, create it
      if (multiplierEntity == null) {
        multiplierEntity = new Multiplier(multiplierId);
        multiplierEntity.multiplier = multiplierData.multiplier;
        multiplierEntity.minThresholdMultiplier =
          multiplierData.minThresholdMultiplier;

        // define relation
        multiplierEntity.pointRule = whalesMoneyRule.id;

        // Save the Multiplier entity
        multiplierEntity.save();
      }
    }
  }
}

export function checkAndCreatePointRules(whalesMoneyRuleId: string): void {
  let whalesMoneyRule = Rules.fromId(whalesMoneyRuleId);
  if (whalesMoneyRule) {
    let pointRulesEntity = PointRule.load(whalesMoneyRule.id);
    if (pointRulesEntity == null) {
      // Create a new PointRule entity
      pointRulesEntity = new PointRule(whalesMoneyRule.id);
      pointRulesEntity.name = whalesMoneyRule.name;
      pointRulesEntity.tag = whalesMoneyRule.tag;
      pointRulesEntity.pair = whalesMoneyRule.pair;
      pointRulesEntity.iconUrl = whalesMoneyRule.iconUrl;
      pointRulesEntity.actionUrl = whalesMoneyRule.actionUrl;
      pointRulesEntity.minTransferAmount = whalesMoneyRule.minTransferAmount;
      pointRulesEntity.maxPoint = whalesMoneyRule.maxPoint;
      pointRulesEntity.basePoint = whalesMoneyRule.basePoint;
      pointRulesEntity.startTimestamp = whalesMoneyRule.startTimestamp;
      pointRulesEntity.endTimestamp = whalesMoneyRule.endTimestamp;
      pointRulesEntity.types = whalesMoneyRule.types;

      // Save the PointRule entity
      pointRulesEntity.save();
    }

    for (let j = 0; j < whalesMoneyRule.multipliers.length; j++) {
      let multiplierData = whalesMoneyRule.multipliers[j];

      // Create a unique ID for each Multiplier entity
      let multiplierId = whalesMoneyRule.id + "-mul" + j.toString();
      let multiplierEntity = Multiplier.load(multiplierId);

      // If the Multiplier doesn't exist, create it
      if (multiplierEntity == null) {
        multiplierEntity = new Multiplier(multiplierId);
        multiplierEntity.multiplier = multiplierData.multiplier;
        multiplierEntity.minThresholdMultiplier =
          multiplierData.minThresholdMultiplier;

        // define relation
        multiplierEntity.pointRule = whalesMoneyRule.id;

        // Save the Multiplier entity
        multiplierEntity.save();
      }
    }
  }
}
