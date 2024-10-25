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
    let staticDefinitions = new Array<BondlinkRules>(3);

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
    let usdbCampaignOneTimeWithTimestamp = new BondlinkRules(
      "0x107FA340cCe20602d3cfcbb3630AfD08Ced13459",
      "Stake USDb",
      "USDb",
      BigInt.fromI32(5),
      BigInt.fromI32(1000),
      BigInt.fromI32(100),
      BigInt.fromI32(1000),
      BigInt.fromI32(1609459200),
      BigInt.fromI32(1700000000),
      "ONETIME"
    );
    staticDefinitions.push(usdbCampaignOneTimeWithTimestamp);

    // Example with Timestamps
    let susdbCampaignOneTimeWithTimestamp = new BondlinkRules(
      "0x21ca2f0DB2963563A07Db10b23Ec8e700764B04",
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

  static getPoint(id: string, amount: BigDecimal): BigInt {
    let staticDefinitions = this.getStaticDefinitions();
    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      if (staticDefinition.id == id) {
        if (
          amount.ge(
            BigDecimal.fromString(staticDefinition.minTransferAmount.toString())
          )
        ) {
          return staticDefinition.basePointTx;
        }
      }
    }
    // return
    return BigInt.fromI32(0);
  }

  static convertToEther(amount: BigInt): BigDecimal {
    let divisor = BigInt.fromI32(10).pow(18); // 10^18 as BigInt
    return amount.toBigDecimal().div(divisor.toBigDecimal());
  }
}
