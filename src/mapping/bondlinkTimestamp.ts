import { Address, BigInt } from "@graphprotocol/graph-ts";

// Class for individual timestamps
export class BondlinkTimestamp {
  defi: Address;
  start: BigInt;
  end: BigInt;

  constructor(defi: Address, start: BigInt, end: BigInt) {
    this.defi = defi;
    this.start = start;
    this.end = end;
  }

  // Get all tokens with a static defintion
  static getStaticDefinitions(): Array<BondlinkTimestamp> {
    let staticDefinitions = new Array<BondlinkTimestamp>(3);

    // USDb
    let usdbCampaignOneTime = new BondlinkTimestamp(
      Address.fromString("0x107fa340cce20602d3cfcbb3630afd08ced13449"),
      BigInt.fromI32(0),
      BigInt.fromI32(0)
    );
    staticDefinitions.push(usdbCampaignOneTime);

    let usdbCampaignOneTimeWithTimestamp = new BondlinkTimestamp(
      Address.fromString("0x107fa340cce20602d3cfcbb3630afd08ced13449"),
      BigInt.fromI32(1609459200),
      BigInt.fromI32(1700000000)
    );
    staticDefinitions.push(usdbCampaignOneTimeWithTimestamp);

    let susdbCampaignOneTime = new BondlinkTimestamp(
      Address.fromString("0x21ca2f0DB2963563A07Db10b23Ec8e700764B043"),
      BigInt.fromI32(0),
      BigInt.fromI32(0)
    );
    staticDefinitions.push(susdbCampaignOneTime);

    return staticDefinitions;
  }

  static fromAddress(address: Address): Array<string> {
    let staticDefinitions = this.getStaticDefinitions();
    let addressHex = address.toHexString();
    let matchedDefinitions = new Array<string>();

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      if (staticDefinition.defi.toHexString() == addressHex) {
        // Combine address, start, and end timestamps into a string
        let definitionId =
          staticDefinition.defi.toHexString() +
          "-" +
          staticDefinition.start.toString() +
          "-" +
          staticDefinition.end.toString();
        matchedDefinitions.push(definitionId);
      }
    }

    // If no definitions are found, return an array of null
    if (matchedDefinitions.length == 0) {
      return [""]; // Return an array with one null value
    }

    return matchedDefinitions;
  }
}
