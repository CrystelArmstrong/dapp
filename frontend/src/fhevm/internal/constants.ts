export const SDK_CDN_URL = "https://cdn.zama.ai/relayer-sdk-js/0.1.2/relayer-sdk-js.umd.cjs";

export const SUPPORTED_NETWORKS = {
  SEPOLIA: 11155111,
  HARDHAT: 31337,
  LOCALHOST: 1337
} as const;

export const SEPOLIA_CONFIG = {
  chainId: SUPPORTED_NETWORKS.SEPOLIA,
  name: 'Sepolia Testnet',
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'
};