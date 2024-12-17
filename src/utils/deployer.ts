export const deployerAddresses = ["0x00338632793C9566c5938bE85219103C1BC4fDE2"];

export function isDeployer(address: string): boolean {
  for (let i = 0; i < deployerAddresses.length; i++) {
    if (deployerAddresses[i].toLowerCase() == address.toLowerCase()) {
      return true;
    }
  }
  return false;
}
