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

  // Static method to get all BondlinkRules with Multipliers
  static getStaticDefinitions(): Array<Rules> {
    let staticDefinitions = new Array<Rules>();

    let usdbMultiplierOne = new Multiplier(
      "multiplier-1", // multiplier name
      BigDecimal.fromString("1.5"), // multiplier
      BigInt.fromI32(10) // multiplier threshold
    );

    let usdbMultiplierTwo = new Multiplier(
      "multiplier-2",
      BigDecimal.fromString("2.0"),
      BigInt.fromI32(50)
    );

    let usdbCampaignWithMultipleMultipliers = new Rules(
      "0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa-0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa-0-0", // rules id
      "Stake USDb", // rules name
      "USDb", // rules tag
      "123/jpeg", // rules iconUrl
      "usdb.com", // rules actionUrl
      Address.fromString("0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa"), // rules origin
      Address.fromString("0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa"), // rules address
      BigInt.fromI32(5), // rules min thershold
      BigDecimal.fromString("1000"), // rules max point
      BigDecimal.fromString("100"), // rules base point
      BigDecimal.fromString("0"), // rules start (0 is infinity)
      BigDecimal.fromString("0"), // rules end (0 is infinity)
      "ONETIME", // rules type
      [usdbMultiplierOne, usdbMultiplierTwo] // rules multiplier
    );
    // push
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
      "0xb888feba9984446c68b0f0cf7af60ffa17b0be91-0xb888feba9984446c68b0f0cf7af60ffa17b0be91-0-0",
      "Stake SUSDb",
      "SUSDb",
      "1234/jpeg", // rules iconUrl
      "susdb.com", // rules actionUrl
      Address.fromString("0xb888feba9984446c68b0f0cf7af60ffa17b0be91"),
      Address.fromString("0xb888feba9984446c68b0f0cf7af60ffa17b0be91"),
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
      "0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa-0x1e6643f5768b98a095e08148e1ad130729b1a6d2-1730909782-1731255382",
      "Add liquidity to Uniswap",
      "Uniswap",
      "12345/jpeg", // rules iconUrl
      "uniswap.com", // rules actionUrl
      Address.fromString("0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa"),
      Address.fromString("0x1e6643f5768b98a095e08148e1ad130729b1a6d2"),
      BigInt.fromI32(5),
      BigDecimal.fromString("1000"),
      BigDecimal.fromString("1"),
      BigDecimal.fromString("1730909782"),
      BigDecimal.fromString("1731255382"),
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
      "0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa-0xd76e2a1c4a1eb7328c742479f7d92847c493c986-1730728237-1762791382",
      "Add liquidity to Pendle",
      "Pendle",
      "123456/jpeg", // rules iconUrl
      "pendle.com", // rules actionUrl
      Address.fromString("0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa"),
      Address.fromString("0xd76e2a1c4a1eb7328c742479f7d92847c493c986"),
      BigInt.fromI32(5),
      BigDecimal.fromString("8000"),
      BigDecimal.fromString("2"),
      BigDecimal.fromString("1730728237"),
      BigDecimal.fromString("1762791382"),
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
      "0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa-0xf5c2ed0db1d79c62eb1ddad3897ba55fbbcf1a33-1730728237-1762791382",
      "Add liquidity to Beefy",
      "Beefy",
      "1234567/jpeg", // rules iconUrl
      "beefy.com", // rules actionUrl
      Address.fromString("0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa"),
      Address.fromString("0xf5c2ed0db1d79c62eb1ddad3897ba55fbbcf1a33"),
      BigInt.fromI32(5),
      BigDecimal.fromString("5000"),
      BigDecimal.fromString("0.1"),
      BigDecimal.fromString("1730728237"),
      BigDecimal.fromString("1762791382"),
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
