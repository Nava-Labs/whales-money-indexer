export const whitelistedAddress = [
  "0x00338632793c9566c5938be85219103c1bc4fde2",
  "0x00338632793c9566c5938be85219103c1bc4fde3",
  "0x00338632793c9566c5938be85219103c1bc4fde4",
  "0x00338632793c9566c5938be85219103c1bc4fde5",
];

export function isWhitelisted(address: string): boolean {
  for (let i = 0; i < whitelistedAddress.length; i++) {
    if (whitelistedAddress[i].toLowerCase() == address.toLowerCase()) {
      return true;
    }
  }
  return false;
}
