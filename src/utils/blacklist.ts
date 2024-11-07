export const blacklistedAddress = [
  "0x0000000000000000000000000000000000000000",
  "0xe70b4b2bd4026d8e286f52cf45ab71f04cd50efa",
];

export function isBlacklisted(address: string): boolean {
  for (let i = 0; i < blacklistedAddress.length; i++) {
    if (blacklistedAddress[i].toLowerCase() == address.toLowerCase()) {
      return true;
    }
  }
  return false;
}
