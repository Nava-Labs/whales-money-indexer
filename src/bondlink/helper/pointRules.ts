import { Rules } from "../rules";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { UserInPoint, PointRules, Multiplier } from "../../types/schema";

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
      userInPoint.status = Rules.convertToEther(userInPoint.stakeAmount).ge(
        BigDecimal.fromString(rulesMinAmount.toString())
      )
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
      pointRulesEntity.iconUrl = bondlinkRule.iconUrl;
      pointRulesEntity.actionUrl = bondlinkRule.actionUrl;
      pointRulesEntity.origin = bondlinkRule.origin.toHex();
      pointRulesEntity.address = bondlinkRule.defiAddress.toHex();
      pointRulesEntity.minTransferAmount = bondlinkRule.minTransferAmount;
      pointRulesEntity.maxPoint = bondlinkRule.maxPoint;
      pointRulesEntity.basePoint = bondlinkRule.basePoint;
      pointRulesEntity.startTimestamp = bondlinkRule.startTimestamp;
      pointRulesEntity.endTimestamp = bondlinkRule.endTimestamp;
      pointRulesEntity.types = bondlinkRule.types;

      // Save the PointRules entity
      pointRulesEntity.save();
    } else {
      // if point rules already populated then break;
      break;
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
      pointRulesEntity.iconUrl = bondlinkRule.iconUrl;
      pointRulesEntity.actionUrl = bondlinkRule.actionUrl;
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
