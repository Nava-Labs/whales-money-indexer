import { BigInt } from "@graphprotocol/graph-ts";
import { UserActivity } from "../types/schema";

export function createActivity(
  txHash: string,
  types: string,
  user: string,
  amount: BigInt,
  timestamp: BigInt,
  defiIntegration: string
): void {
  let activity = new UserActivity(txHash);
  activity.type = types;
  activity.amount = amount;
  activity.timestamp = timestamp;
  activity.user = user;
  activity.defi = defiIntegration;
}
