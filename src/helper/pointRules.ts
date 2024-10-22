import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { checkFromRules } from "../utils/pointRules";
import { PointRules } from "../types/schema";

export function checkRulesPoint(
  from: string,
  to: string,
  amount: BigInt,
  timestamp: BigInt
): BigInt {
  // from is obviously user
  let rules = checkFromRules(to);
  let point = 0;

  if (rules == false) {
    return BigInt.fromI32(0);
  } else {
    // create point rules if null
    let pointRules = PointRules.load(to);
    if (pointRules == null) {
      pointRules = new PointRules(to);
      pointRules.name = rules.name;
      pointRules.tag = rules.tag;
      pointRules.minTransferAmount = BigInt.fromI32(
        rules.threshold.minTransferAmount
      );
      pointRules.maxPoint = BigInt.fromI32(rules.threshold.maxPoint);
      pointRules.basePointTx = BigInt.fromI32(rules.pointDetails.basePointTx);
      pointRules.maxPointTx = BigInt.fromI32(rules.pointDetails.maxPointTx);
      pointRules.startTimestamp = BigInt.fromI32(
        rules.timestampPeriod.startTimestamp
      );
      pointRules.endTimestamp = BigInt.fromI32(
        rules.timestampPeriod.endTimestamp
      );
      pointRules.types = rules.types;
      pointRules.userInPoint = `${from} - ${to}`;
      pointRules.save(); // Save the new PointRules entity
    }

    // Convert startTimestamp and endTimestamp to BigInt for comparison
    let startTimestamp = BigInt.fromI32(rules.timestampPeriod.startTimestamp);
    let endTimestamp = BigInt.fromI32(rules.timestampPeriod.endTimestamp);
    if (
      (startTimestamp != BigInt.fromI32(0) &&
        endTimestamp != BigInt.fromI32(0)) ||
      (startTimestamp.le(timestamp) && timestamp.le(endTimestamp))
    ) {
      // Convert minTransferAmount to BigDecimal for comparison
      let minTransferAmount = BigDecimal.fromString(
        rules.threshold.minTransferAmount.toString()
      );

      // Check minimum contribution
      if (convertToEther(amount).gt(minTransferAmount)) {
        point = point + rules.pointDetails.basePointTx;
      }

      // check multiplier
      let multiplier = getMultiplier(amount, rules.multiplierDetail);
      if (multiplier > 0) {
        // Apply the multiplier to the base points
        point = point * multiplier;
      }
    }
  }

  // Return the calculated point value
  return BigInt.fromI32(point);
}

function convertToEther(amount: BigInt): BigDecimal {
  let divisor = BigInt.fromI32(10).pow(18); // 10^18 as BigInt
  return amount.toBigDecimal().div(divisor.toBigDecimal());
}

// Function to find the correct multiplier based on amount
function getMultiplier(
  amount: BigInt,
  multiplierDetail: { [key: number]: number }
): number {
  // Convert amount to BigDecimal for comparison
  let amountAsDecimal = convertToEther(amount);

  let selectedMultiplier = 0;

  // Loop through the multiplierDetail keys to find the best match
  for (let threshold in multiplierDetail) {
    let thresholdAsDecimal = BigDecimal.fromString(threshold);

    // Check if the amount is greater than or equal to the current threshold
    if (amountAsDecimal.ge(thresholdAsDecimal)) {
      // Update selectedMultiplier with the current one
      selectedMultiplier = multiplierDetail[parseFloat(threshold)];
    }
  }

  return selectedMultiplier;
}
