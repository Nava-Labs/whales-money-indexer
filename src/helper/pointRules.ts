import { BondlinkRules } from "../mapping/bondlinkRules";
import { BigInt } from "@graphprotocol/graph-ts";
import { UserInPoint } from "../types/schema";

export function createProtocolOverviewUserInPoint(
  bondlinkRuleId: string,
  user: string,
  bondlinkType: string,
  amount: BigInt,
  timestamp: BigInt
): void {
  let userInPoint = UserInPoint.load(bondlinkRuleId + "-" + user);
  if (userInPoint == null) {
    userInPoint = new UserInPoint(bondlinkRuleId + "-" + user);
    userInPoint.totalPointEarned = BigInt.fromI32(0);
    userInPoint.stakeAmount = BigInt.fromI32(0);
    userInPoint.stakeTimestamp = BigInt.fromI32(0);
    userInPoint.endStakeTimestamp = BigInt.fromI32(0);
    userInPoint.status = "ACTIVE";
  }

  let pointEarned = BigInt.fromI32(0);
  if (userInPoint.status != "COMPLETED" && bondlinkType == "ONETIME") {
    let amountToEther = BondlinkRules.convertToEther(amount);
    pointEarned = BondlinkRules.getPoint(bondlinkRuleId, amountToEther);
    userInPoint.totalPointEarned = userInPoint.totalPointEarned.plus(
      pointEarned
    );
    userInPoint.stakeAmount = userInPoint.stakeAmount.plus(amount);
    userInPoint.stakeTimestamp = timestamp;
    userInPoint.endStakeTimestamp = timestamp;
    userInPoint.status = "COMPLETED";
  } else if (userInPoint.status != "COMPLETED" && bondlinkType != "ONETIME") {
    userInPoint.totalPointEarned = userInPoint.totalPointEarned.plus(
      pointEarned
    );
    userInPoint.stakeAmount = userInPoint.stakeAmount.plus(amount);
    userInPoint.stakeTimestamp = timestamp;
    userInPoint.endStakeTimestamp = BigInt.fromI32(0);
    userInPoint.status = "ONGOING";
  }

  // define relation
  userInPoint.user = user;
  userInPoint.pointRules = bondlinkRuleId;
  userInPoint.save();
}

export function createUserInPoint(
  bondlinkRuleId: string,
  user: string,
  bondlinkType: string,
  amount: BigInt,
  timestamp: BigInt,
  isTo: boolean
): void {
  let userInPoint = UserInPoint.load(bondlinkRuleId + "-" + user);
  if (userInPoint == null) {
    userInPoint = new UserInPoint(bondlinkRuleId + "-" + user);
    userInPoint.totalPointEarned = BigInt.fromI32(0);
    userInPoint.stakeAmount = BigInt.fromI32(0);
    userInPoint.stakeTimestamp = BigInt.fromI32(0);
    userInPoint.endStakeTimestamp = BigInt.fromI32(0);
    userInPoint.status = "ACTIVE";
  }

  let pointEarned = BigInt.fromI32(0);
  if (isTo) {
    if (userInPoint.status != "COMPLETED" && bondlinkType == "ONETIME") {
      let amountToEther = BondlinkRules.convertToEther(amount);
      pointEarned = BondlinkRules.getPoint(bondlinkRuleId, amountToEther);
      userInPoint.totalPointEarned = userInPoint.totalPointEarned.plus(
        pointEarned
      );
      userInPoint.stakeAmount = userInPoint.stakeAmount.plus(amount);
      userInPoint.stakeTimestamp = timestamp;
      userInPoint.endStakeTimestamp = timestamp;
      userInPoint.status = "COMPLETED";
    } else if (userInPoint.status != "COMPLETED" && bondlinkType != "ONETIME") {
      userInPoint.totalPointEarned = userInPoint.totalPointEarned.plus(
        pointEarned
      );
      userInPoint.stakeAmount = userInPoint.stakeAmount.plus(amount);
      userInPoint.stakeTimestamp = timestamp;
      userInPoint.endStakeTimestamp = BigInt.fromI32(0);
      userInPoint.status = "ONGOING";
    }
  } else {
    if (userInPoint.status != "COMPLETED" && bondlinkType != "ONETIME") {
      userInPoint.totalPointEarned = userInPoint.totalPointEarned.plus(
        pointEarned
      );
      userInPoint.stakeAmount = userInPoint.stakeAmount.plus(amount);
      userInPoint.endStakeTimestamp = timestamp;
      userInPoint.status = "COMPLETED";
    }
  }
  // define relation
  userInPoint.user = user;
  userInPoint.pointRules = bondlinkRuleId;
  userInPoint.save();
}
