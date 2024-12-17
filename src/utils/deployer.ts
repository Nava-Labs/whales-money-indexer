export const deployerAddresses = ["0x9E2581389736e76f0A02c4EADcFa6209464eec91"];

export function isDeployer(address: string): boolean {
  for (let i = 0; i < deployerAddresses.length; i++) {
    if (deployerAddresses[i].toLowerCase() == address.toLowerCase()) {
      return true;
    }
  }
  return false;
}
