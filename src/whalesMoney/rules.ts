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
  pair: string;
  iconUrl: string;
  actionUrl: string;
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
    pair: string,
    iconUrl: string,
    actionUrl: string,
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
    this.pair = pair;
    this.iconUrl = iconUrl;
    this.actionUrl = actionUrl;
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

  // Static method to get all whalesMoneyRules with Multipliers
  static getStaticDefinitions(): Array<Rules> {
    let staticDefinitions = new Array<Rules>();

    let wusdMultiplierOne = new Multiplier(
      "multiplier-1", // multiplier name
      BigDecimal.fromString("1.5"), // multiplier
      BigInt.fromI32(10) // multiplier threshold
    );

    let wusdMultiplierTwo = new Multiplier(
      "multiplier-2",
      BigDecimal.fromString("2.0"),
      BigInt.fromI32(50)
    );

    let wusdCampaignWithMultipleMultipliers = new Rules(
      "0xe3e89bd2e40236b01be50b727766fff710d9b708-0xe3e89bd2e40236b01be50b727766fff710d9b708-0-0", // rules id
      "Stake WUSD", // rules name
      "WUSD", // rules tag
      "WUSD-WUSD", // rules pair
      "123/jpeg", // rules iconUrl
      "wusd.com", // rules actionUrl
      Address.fromString("0xe3e89bd2e40236b01be50b727766fff710d9b708"), // rules origin
      Address.fromString("0xe3e89bd2e40236b01be50b727766fff710d9b708"), // rules address
      BigInt.fromI32(5), // rules min thershold
      BigDecimal.fromString("1000"), // rules max point
      BigDecimal.fromString("100"), // rules base point
      BigDecimal.fromString("1734393600"), // rules start (0 is infinity)
      BigDecimal.fromString("1765929600"), // rules end (0 is infinity)
      "INTERVAL", // rules type
      [wusdMultiplierOne, wusdMultiplierTwo] // rules multiplier
    );
    // push
    staticDefinitions.push(wusdCampaignWithMultipleMultipliers);

    let swusdMultiplierOne = new Multiplier(
      "multiplier-1", // multiplier name
      BigDecimal.fromString("2.5"), // multiplier
      BigInt.fromI32(15) // multiplier threshold
    );

    let swusdMultiplierTwo = new Multiplier(
      "multiplier-2",
      BigDecimal.fromString("3.0"),
      BigInt.fromI32(70)
    );

    let swusdCampaignOneTimeWithTimestamp = new Rules(
      "0xd0f48108191623bbb6d94579174ccb7f05e43086-0xd0f48108191623bbb6d94579174ccb7f05e43086-0-0", // rules id
      "Stake SWUSD", // rules name
      "SWUSD", // rules tag
      "SWUSD-SWUSD", // rules pair
      "1234/jpeg", // rules iconUrl
      "swusd.com", // rules actionUrl
      Address.fromString("0xd0f48108191623bbb6d94579174ccb7f05e43086"), // rules origin
      Address.fromString("0xd0f48108191623bbb6d94579174ccb7f05e43086"), // rules address
      BigInt.fromI32(10), // rules min threshold
      BigDecimal.fromString("1000"), // rules max point
      BigDecimal.fromString("200"), // rules base point
      BigDecimal.fromString("1734393600"), // rules start (0 is infinity)
      BigDecimal.fromString("1765929600"), // rules end (0 is infinity)
      "INTERVAL", // rules type
      [swusdMultiplierOne, swusdMultiplierTwo] // rules multiplier
    );
    staticDefinitions.push(swusdCampaignOneTimeWithTimestamp);

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
      "0xe3e89bd2e40236b01be50b727766fff710d9b708-0x5543a07efa96bbb2ef3406b7d1ae97f669beaa32-1730909782-1732770716", // rules id
      "Add liquidity to Uniswap", // rules name
      "Uniswap", // rules tag
      "WUSD-ETH", // rules pair
      "12345/jpeg", // rules iconUrl
      "uniswap.com", // rules actionUrl
      Address.fromString("0xe3e89bd2e40236b01be50b727766fff710d9b708"), // rules origin
      Address.fromString("0x5543a07efa96bbb2ef3406b7d1ae97f669beaa32"), // rules address
      BigInt.fromI32(5), // rules min threshold
      BigDecimal.fromString("1000"), // rules max point
      BigDecimal.fromString("1"), // rules base point
      BigDecimal.fromString("1734393600"), // rules start
      BigDecimal.fromString("1741619478"), // rules end
      "INTERVAL", // rules type
      [testLiquidityInterval1, testLiquidityInterval2] // rules multiplier
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
      "0xe3e89bd2e40236b01be50b727766fff710d9b708-0xd76e2a1c4a1eb7328c742479f7d92847c493c986-1730728237-1762791382", // rules id
      "Add liquidity to Pendle", // rules name
      "Pendle", // rules tag
      "WUSD-WETH", // rules pair
      "123456/jpeg", // rules iconUrl
      "pendle.com", // rules actionUrl
      Address.fromString("0xe3e89bd2e40236b01be50b727766fff710d9b708"), // rules origin
      Address.fromString("0xd76e2a1c4a1eb7328c742479f7d92847c493c986"), // rules address
      BigInt.fromI32(5), // rules min threshold
      BigDecimal.fromString("8000"), // rules max point
      BigDecimal.fromString("2"), // rules base point
      BigDecimal.fromString("1734393600"), // rules start
      BigDecimal.fromString("1741619478"), // rules end
      "INTERVAL", // rules type
      [testLiquidityHold1, testLiquidityHold2] // rules multiplier
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
      "0xe3e89bd2e40236b01be50b727766fff710d9b708-0x0b4b79cf4a4acb4a181fe68214f9a00a00b70f95-1730728237-1762791382", // rules id
      "Add liquidity to Beefy", // rules name
      "Beefy", // rules tag
      "WUSD-USDC", // rules pair
      "1234567/jpeg", // rules iconUrl
      "beefy.com", // rules actionUrl
      Address.fromString("0xe3e89bd2e40236b01be50b727766fff710d9b708"), // rules origin
      Address.fromString("0x0b4b79cf4a4acb4a181fe68214f9a00a00b70f95"), // rules address
      BigInt.fromI32(5), // rules min threshold
      BigDecimal.fromString("5000"), // rules max point
      BigDecimal.fromString("0.1"), // rules base point
      BigDecimal.fromString("1734393600"), // rules start
      BigDecimal.fromString("1741619478"), // rules end
      "INTERVAL", // rules type
      [testMultipleTransfer1, testMultipleTransfer2] // rules multiplier
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
      userInPoint.pointRule = staticDefinition.id;
      userInPoint.save();
    }
  }
}
