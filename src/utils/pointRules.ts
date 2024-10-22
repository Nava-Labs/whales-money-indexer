import { BigInt } from "@graphprotocol/graph-ts";

// Define types for bondlinkRules data
type Threshold = {
  minTransferAmount: number;
  maxPoint: number;
};

type PointDetails = {
  basePointTx: number;
  maxPointTx: number;
};

type TimestampPeriod = {
  startTimestamp: number;
  endTimestamp: number;
};

type MultiplierDetail = {
  [key: number]: number;
};

type BondlinkRule = {
  name: string;
  tag: string;
  threshold: Threshold;
  pointDetails: PointDetails;
  timestampPeriod: TimestampPeriod;
  multiplierDetail: MultiplierDetail;
  types: string;
};

// Define the bondlinkRules object with address keys
export const bondlinkRules: { [key: string]: BondlinkRule } = {
  "0x107FA340cCe20602d3cfcbb3630AfD08Ced13449": {
    name: "Stake USDB",
    tag: "USDb",
    threshold: {
      minTransferAmount: 5,
      maxPoint: 1000,
    },
    pointDetails: {
      basePointTx: 100,
      maxPointTx: 1000,
    },
    timestampPeriod: {
      startTimestamp: 0,
      endTimestamp: 0,
    },
    multiplierDetail: {
      2: 7,
      3.5: 10,
      4.25: 12,
    },
    types: "stake",
  },
  "0x21ca2f0DB2963563A07Db10b23Ec8e700764B043": {
    name: "Stake SUSDB",
    tag: "SUSDb",
    threshold: {
      minTransferAmount: 10,
      maxPoint: 1000,
    },
    pointDetails: {
      basePointTx: 100,
      maxPointTx: 1000,
    },
    timestampPeriod: {
      startTimestamp: 0,
      endTimestamp: 0,
    },
    multiplierDetail: {
      2: 15,
      3.5: 20,
      5: 25,
    },
    types: "stake",
  },
};

// Function to check rules based on address
export function checkFromRules(
  address: string
): typeof bondlinkRules[keyof typeof bondlinkRules] | false {
  const rule = bondlinkRules[address];
  if (rule) {
    return rule;
  }
  return false;
}
