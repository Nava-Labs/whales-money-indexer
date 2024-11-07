import {
  Address,
  BigInt,
  BigDecimal,
  bigDecimal,
} from "@graphprotocol/graph-ts";
import { UserInPoint } from "../types/schema";

export class Multiplier {
  id: string;
  multiplier: BigDecimal;
  minThresholdMultiplier: BigInt;

  constructor(
    id: string,
    multiplier: BigDecimal,
    minThresholdMultiplier: BigInt
  ) {
    this.id = id;
    this.multiplier = multiplier;
    this.minThresholdMultiplier = minThresholdMultiplier;
  }
}

export class Rules {
  id: string;
  name: string;
  tag: string;
  origin: Address;
  defiAddress: Address;

  minTransferAmount: BigInt;
  maxPoint: BigDecimal;

  basePoint: BigDecimal;

  startTimestamp: BigDecimal;
  endTimestamp: BigDecimal;

  types: string;

  multipliers: Array<Multiplier>; // Array of multipliers

  constructor(
    id: string,
    name: string,
    tag: string,
    origin: Address,
    defiAddress: Address,
    minTransferAmount: BigInt,
    maxPoint: BigDecimal,
    basePoint: BigDecimal,
    startTimestamp: BigDecimal,
    endTimestamp: BigDecimal,
    types: string,
    multipliers: Array<Multiplier> = [] // Initialize as an empty array
  ) {
    this.id = id;
    this.name = name;
    this.tag = tag;
    this.origin = origin;
    this.defiAddress = defiAddress;
    this.minTransferAmount = minTransferAmount;
    this.maxPoint = maxPoint;
    this.basePoint = basePoint;
    this.startTimestamp = startTimestamp;
    this.endTimestamp = endTimestamp;
    this.types = types;
    this.multipliers = multipliers;
  }

  // Static method to get all BondlinkRules with Multipliers
  static getStaticDefinitions(): Array<Rules> {
    let staticDefinitions = new Array<Rules>();

    let testLiquidityInterval1 = new Multiplier(
      "multiplier-1",
      BigDecimal.fromString("2.5"),
      BigInt.fromI32(20)
    );

    let testLiquidityInterval2 = new Multiplier(
      "multiplier-2",
      BigDecimal.fromString("4.0"),
      BigInt.fromI32(70)
    );

    let testLiquidityInterval = new Rules(
      "0x4c89c59b10048cc5b46c7619d5695faac7a0d205-0xaf4a2cb5fa894576b7de6a2c4480867593203e73-1730728237-1731246637",
      "Add liquidity to Uniswap",
      "Uniswap",
      Address.fromString("0x4c89c59b10048cc5b46c7619d5695faac7a0d205"),
      Address.fromString("0xaf4a2cb5fa894576b7de6a2c4480867593203e73"),
      BigInt.fromI32(5),
      BigDecimal.fromString("1000"),
      BigDecimal.fromString("0.2"),
      BigDecimal.fromString("1730728237"),
      BigDecimal.fromString("1731246637"),
      "INTERVAL",
      [testLiquidityInterval1, testLiquidityInterval2]
    );
    staticDefinitions.push(testLiquidityInterval);

    let testLiquidityHold1 = new Multiplier(
      "multiplier-1",
      BigDecimal.fromString("2.5"),
      BigInt.fromI32(10)
    );

    let testLiquidityHold2 = new Multiplier(
      "multiplier-2",
      BigDecimal.fromString("3.0"),
      BigInt.fromI32(50)
    );

    let testLiquidityHold = new Rules(
      "0x4c89c59b10048cc5b46c7619d5695faac7a0d205-0xa7f438f0206a06fce1e8128f30c4bb4970ec94f4-1730728237-0",
      "Add liquidity to Pendle",
      "Pendle",
      Address.fromString("0x4c89c59b10048cc5b46c7619d5695faac7a0d205"),
      Address.fromString("0xa7f438f0206a06fce1e8128f30c4bb4970ec94f4"),
      BigInt.fromI32(5),
      BigDecimal.fromString("6000"),
      BigDecimal.fromString("10"),
      BigDecimal.fromString("1730728237"),
      BigDecimal.fromString("0"),
      "INTERVAL",
      [testLiquidityHold1, testLiquidityHold2]
    );
    staticDefinitions.push(testLiquidityHold);

    let testMultipleTransfer1 = new Multiplier(
      "multiplier-1",
      BigDecimal.fromString("2.5"),
      BigInt.fromI32(10)
    );

    let testMultipleTransfer2 = new Multiplier(
      "multiplier-2",
      BigDecimal.fromString("3.0"),
      BigInt.fromI32(50)
    );

    let testMultipleTransfer = new Rules(
      "0x4c89c59b10048cc5b46c7619d5695faac7a0d205-0xd76e2a1c4a1eb7328c742479f7d92847c493c986-1730728237-0",
      "Add liquidity to Beefy",
      "Beefy",
      Address.fromString("0x4c89c59b10048cc5b46c7619d5695faac7a0d205"),
      Address.fromString("0xd76e2a1c4a1eb7328c742479f7d92847c493c986"),
      BigInt.fromI32(5),
      BigDecimal.fromString("6000"),
      BigDecimal.fromString("1"),
      BigDecimal.fromString("1730728237"),
      BigDecimal.fromString("0"),
      "INTERVAL",
      [testMultipleTransfer1, testMultipleTransfer2]
    );
    staticDefinitions.push(testMultipleTransfer);

    return staticDefinitions;
  }

  static fromId(id: string): Rules | null {
    let staticDefinitions = this.getStaticDefinitions();

    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      if (staticDefinition.id == id) {
        return staticDefinition;
      }
    }
    return null;
  }

  static getPoint(
    id: string,
    amount: BigDecimal,
    nowTimestamp: BigDecimal,
    lastStakeTimestamp: BigDecimal | null,
    lastPointEarned: BigDecimal,
    isBoosted: boolean
  ): string {
    // Return a formatted string
    let staticDefinitions = this.getStaticDefinitions();
    let pointGet = BigDecimal.fromString("0");
    let appliedMultiplier = BigDecimal.fromString("1"); // Store the multiplier used

    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      if (staticDefinition.id == id) {
        if (
          amount.ge(
            BigDecimal.fromString(staticDefinition.minTransferAmount.toString())
          )
        ) {
          if (staticDefinition.types == "ONETIME") {
            pointGet = pointGet.plus(staticDefinition.basePoint);
          } else if (staticDefinition.types == "INTERVAL") {
            let timestampPointer = BigDecimal.fromString("0");
            // if last stake timestamp before rules start
            if (
              lastStakeTimestamp &&
              lastStakeTimestamp.le(staticDefinition.startTimestamp)
            ) {
              timestampPointer = staticDefinition.startTimestamp;
            } else {
              timestampPointer = lastStakeTimestamp!;
            }

            // if now within the rules time
            if (nowTimestamp.ge(timestampPointer)) {
              // if within rules time
              if (nowTimestamp.le(staticDefinition.endTimestamp)) {
                let timeElapsed = nowTimestamp.minus(timestampPointer);
                let pointEarned = timeElapsed.times(staticDefinition.basePoint);
                pointGet = pointGet.plus(pointEarned);
                // if rules ended
              } else if (nowTimestamp.gt(staticDefinition.endTimestamp)) {
                let timeElapsed = staticDefinition.endTimestamp.minus(
                  timestampPointer
                );
                let pointEarned = timeElapsed.times(staticDefinition.basePoint);
                pointGet = pointGet.plus(pointEarned);
              }
            }
          }
        }

        // Apply all multipliers that meet their threshold
        for (let j = staticDefinition.multipliers.length - 1; j >= 0; j--) {
          let multiplier = staticDefinition.multipliers[j];
          if (
            amount.ge(
              BigDecimal.fromString(
                multiplier.minThresholdMultiplier.toString()
              )
            )
          ) {
            pointGet = pointGet.times(multiplier.multiplier);
            appliedMultiplier = multiplier.multiplier; // Store the multiplier applied
            break;
          }
        }

        // if total point get bigger then max, return max
        let totalPoints = pointGet.plus(lastPointEarned);
        if (totalPoints.ge(staticDefinition.maxPoint)) {
          pointGet = staticDefinition.maxPoint;
        } else {
          pointGet = totalPoints;
        }

        // check if the person whitelisted for 25%
        if (isBoosted) {
          let boost = pointGet.times(BigDecimal.fromString("0.25"));
          pointGet = pointGet.plus(boost);
        }
      }
    }

    // Return as a string formatted as "pointGet-appliedMultiplier"
    return `${pointGet.toString()}-${appliedMultiplier.toString()}`;
  }

  static convertToEther(amount: BigInt): BigDecimal {
    let divisor = BigInt.fromI32(10).pow(18); // 10^18 as BigInt
    return amount.toBigDecimal().div(divisor.toBigDecimal());
  }

  static getRulesIdByDefi(address: Address): Array<string> {
    let staticDefinitions = this.getStaticDefinitions();
    let addressHex = address.toHexString();
    let matchedDefinitions = new Array<string>();

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      if (staticDefinition.defiAddress.toHexString() == addressHex) {
        // Combine address, start, and end timestamps into a string
        let definitionId =
          staticDefinition.origin.toHexString() +
          "-" +
          staticDefinition.defiAddress.toHexString() +
          "-" +
          staticDefinition.startTimestamp.toString() +
          "-" +
          staticDefinition.endTimestamp.toString();
        matchedDefinitions.push(definitionId);
      }
    }

    if (matchedDefinitions.length == 0) {
      return [];
    }

    return matchedDefinitions;
  }

  static createInitialUserInPoint(userAddress: Address): void {
    let staticDefinitions = this.getStaticDefinitions();
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      let userInPoint = new UserInPoint(
        staticDefinition.id + "-" + userAddress.toHex()
      );
      userInPoint.totalPointEarned = BigDecimal.fromString("0");
      userInPoint.stakeAmount = BigInt.fromI32(0);
      userInPoint.lastStakeTimestamp = BigInt.fromI32(0);
      userInPoint.lastMultipliers = BigDecimal.fromString("1");
      userInPoint.status = "IDLE";
      userInPoint.user = userAddress.toHex();
      userInPoint.pointRules = staticDefinition.id;
      userInPoint.save();
    }
  }
}
