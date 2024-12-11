export const blacklistedAddress = [
  "0x0000000000000000000000000000000000000000",
  "0x54859a691339814664c300b29b8f347aec298098",
];

export function isBlacklisted(address: string): boolean {
  for (let i = 0; i < blacklistedAddress.length; i++) {
    if (blacklistedAddress[i].toLowerCase() == address.toLowerCase()) {
      return true;
    }
  }
  return false;
}
