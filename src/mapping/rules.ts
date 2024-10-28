import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
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

    let usdbMultiplierOne = new Multiplier(
      "multiplier-1",
      BigDecimal.fromString("1.5"),
      BigInt.fromI32(10)
    );

    let usdbMultiplierTwo = new Multiplier(
      "multiplier-2",
      BigDecimal.fromString("2.0"),
      BigInt.fromI32(50)
    );

    let usdbCampaignWithMultipleMultipliers = new Rules(
      "0x893df8e99f7e35995433bac6f59de17d3f07e094-0-0",
      "Stake USDb",
      "USDb",
      Address.fromString("0x893df8e99f7e35995433bac6f59de17d3f07e094"),
      BigInt.fromI32(5),
      BigDecimal.fromString("1000"),
      BigDecimal.fromString("100"),
      BigDecimal.fromString("0"),
      BigDecimal.fromString("0"),
      "ONETIME",
      [usdbMultiplierOne, usdbMultiplierTwo]
    );
    staticDefinitions.push(usdbCampaignWithMultipleMultipliers);

    let susdbMultiplierOne = new Multiplier(
      "multiplier-1",
      BigDecimal.fromString("2.5"),
      BigInt.fromI32(15)
    );

    let susdbMultiplierTwo = new Multiplier(
      "multiplier-2",
      BigDecimal.fromString("3.0"),
      BigInt.fromI32(70)
    );

    let susdbCampaignOneTimeWithTimestamp = new Rules(
      "0xb4f92f7e32827fb65b96587e46099090c2238e1b-0-0",
      "Stake SUSDb",
      "SUSDb",
      Address.fromString("0xb4f92f7e32827fb65b96587e46099090c2238e1b"),
      BigInt.fromI32(10),
      BigDecimal.fromString("1000"),
      BigDecimal.fromString("200"),
      BigDecimal.fromString("0"),
      BigDecimal.fromString("0"),
      "ONETIME",
      [susdbMultiplierOne, susdbMultiplierTwo]
    );
    staticDefinitions.push(susdbCampaignOneTimeWithTimestamp);

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
      "0xaf4a2cb5fa894576b7de6a2c4480867593203e73-1730140492-1730226955",
      "Add liquidity to Uniswap",
      "Uniswap",
      Address.fromString("0xaf4a2cb5fa894576b7de6a2c4480867593203e73"),
      BigInt.fromI32(5),
      BigDecimal.fromString("1000"),
      BigDecimal.fromString("0"),
      BigDecimal.fromString("1730140492"),
      BigDecimal.fromString("1730226955"),
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
      "0xa7f438f0206a06fce1e8128f30c4bb4970ec94f4-1730123441-0",
      "Add liquidity to Pendle",
      "Pendle",
      Address.fromString("0xa7f438f0206a06fce1e8128f30c4bb4970ec94f4"),
      BigInt.fromI32(5),
      BigDecimal.fromString("6000"),
      BigDecimal.fromString("10"),
      BigDecimal.fromString("1730123441"),
      BigDecimal.fromString("0"),
      "HOLD",
      [testLiquidityHold1, testLiquidityHold2]
    );
    staticDefinitions.push(testLiquidityHold);

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
    lastPointEarned: BigDecimal
  ): BigDecimal {
    let staticDefinitions = this.getStaticDefinitions();
    let pointGet = BigDecimal.fromString("0");
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
            if (
              lastStakeTimestamp &&
              nowTimestamp.le(staticDefinition.endTimestamp)
            ) {
              let timeElapsed = nowTimestamp.minus(lastStakeTimestamp);

              let pointEarned = timeElapsed
                .div(staticDefinition.endTimestamp)
                .times(staticDefinition.maxPoint);

              pointGet = pointGet.plus(pointEarned);
            } else if (
              lastStakeTimestamp &&
              nowTimestamp.gt(staticDefinition.endTimestamp)
            ) {
              let timeElapsed = staticDefinition.endTimestamp.minus(
                lastStakeTimestamp
              );

              let pointEarned = timeElapsed
                .div(staticDefinition.endTimestamp)
                .times(staticDefinition.maxPoint);

              pointGet = pointGet.plus(pointEarned);
            }
          } else if (staticDefinition.types == "HOLD") {
            if (nowTimestamp.ge(staticDefinition.startTimestamp)) {
              let pointEarned = nowTimestamp
                .minus(lastStakeTimestamp!)
                .times(staticDefinition.basePoint);
              pointGet = pointGet.plus(pointEarned);
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
            break;
          }
        }

        let totalPoints = pointGet.plus(lastPointEarned);

        if (totalPoints.ge(staticDefinition.maxPoint)) {
          let difference = staticDefinition.maxPoint.minus(lastPointEarned);

          pointGet = difference;
        }
      }
    }
    return pointGet;
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
      userInPoint.endStakeTimestamp = BigInt.fromI32(0);
      userInPoint.status = "IDLE";
      userInPoint.user = userAddress.toHex();
      userInPoint.pointRules = staticDefinition.id;
      userInPoint.save();
    }
  }
}
