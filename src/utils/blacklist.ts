export const blacklistedAddress = [
  "0x0000000000000000000000000000000000000000",
  "0xe3e89bd2e40236b01be50b727766fff710d9b708",
  "0x9E2581389736e76f0A02c4EADcFa6209464eec91",
];

export function isBlacklisted(address: string): boolean {
  for (let i = 0; i < blacklistedAddress.length; i++) {
    if (blacklistedAddress[i].toLowerCase() == address.toLowerCase()) {
      return true;
    }
  }
  return false;
}
