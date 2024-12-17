export const boostedAddress = [
  "0x9E2581389736e76f0A02c4EADcFa6209464eec91",
  "0x9E2581389736e76f0A02c4EADcFa6209464eec92",
  "0x9E2581389736e76f0A02c4EADcFa6209464eec93",
  "0x9E2581389736e76f0A02c4EADcFa6209464eec94",
];

export function isBoosted(address: string): boolean {
  for (let i = 0; i < boostedAddress.length; i++) {
    if (boostedAddress[i].toLowerCase() == address.toLowerCase()) {
      return true;
    }
  }
  return false;
}
