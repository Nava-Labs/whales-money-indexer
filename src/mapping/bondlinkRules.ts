import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";

export class BondlinkRules {
  id: string;
  name: string;
  tag: string;

  minTransferAmount: BigInt;
  maxPoint: BigInt;

  basePointTx: BigInt;
  maxPointTx: BigInt;

  startTimestamp: BigInt;
  endTimestamp: BigInt;

  types: string;

  constructor(
    id: string,
    name: string,
    tag: string,
    minTransferAmount: BigInt,
    maxPoint: BigInt,
    basePointTx: BigInt,
    maxPointTx: BigInt,
    startTimestamp: BigInt,
    endTimestamp: BigInt,
    types: string
  ) {
    this.id = id;
    this.name = name;
    this.tag = tag;
    this.minTransferAmount = minTransferAmount;
    this.maxPoint = maxPoint;
    this.basePointTx = basePointTx;
    this.maxPointTx = maxPointTx;
    this.startTimestamp = startTimestamp;
    this.endTimestamp = endTimestamp;
    this.types = types;
  }

  // Get all Campaign with a static definition
  static getStaticDefinitions(): Array<BondlinkRules> {
    let staticDefinitions = new Array<BondlinkRules>();

    // Example with MultiplierRule objects
    let usdbCampaignOneTime = new BondlinkRules(
      "0x107fa340cce20602d3cfcbb3630afd08ced13449",
      "Stake USDb",
      "USDb",
      BigInt.fromI32(5),
      BigInt.fromI32(1000),
      BigInt.fromI32(100),
      BigInt.fromI32(1000),
      BigInt.fromI32(0),
      BigInt.fromI32(0),
      "ONETIME"
    );
    staticDefinitions.push(usdbCampaignOneTime);

    // Example with Timestamps
    let susdbCampaignOneTimeWithTimestamp = new BondlinkRules(
      "0x21ca2f0db2963563a07db10b23ec8e700764b04",
      "Stake SUSDb",
      "SUSDb",
      BigInt.fromI32(5),
      BigInt.fromI32(1000),
      BigInt.fromI32(100),
      BigInt.fromI32(1000),
      BigInt.fromI32(0),
      BigInt.fromI32(0),
      "ONETIME"
    );
    staticDefinitions.push(susdbCampaignOneTimeWithTimestamp);

    return staticDefinitions;
  }

  static fromId(id: string): BondlinkRules | null {
    let staticDefinitions = this.getStaticDefinitions();

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      if (staticDefinition.id == id) {
        return staticDefinition;
      }
    }
    // If not found, return null
    return null;
  }

  static getPoint(
    id: string,
    amount: BigDecimal,
    nowTimestamp: BigInt
  ): BigInt {
    let staticDefinitions = this.getStaticDefinitions();
    // Search the definition using the address
    let pointGet = BigInt.fromI32(0);
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      if (staticDefinition.id == id) {
        if (
          (staticDefinition.startTimestamp == BigInt.fromI32(0) &&
            staticDefinition.endTimestamp == BigInt.fromI32(0)) ||
          (staticDefinition.startTimestamp.le(nowTimestamp) &&
            nowTimestamp.le(staticDefinition.endTimestamp))
        ) {
          if (
            amount.ge(
              BigDecimal.fromString(
                staticDefinition.minTransferAmount.toString()
              )
            )
          ) {
            pointGet.plus(staticDefinition.basePointTx);
          }
        }

        if (pointGet.ge(staticDefinition.maxPointTx)) {
          pointGet = staticDefinition.maxPointTx;
        }
      }
    }
    // return
    return pointGet;
  }

  static convertToEther(amount: BigInt): BigDecimal {
    let divisor = BigInt.fromI32(10).pow(18); // 10^18 as BigInt
    return amount.toBigDecimal().div(divisor.toBigDecimal());
  }
}
