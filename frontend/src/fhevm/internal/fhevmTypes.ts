export interface FhevmRelayerSDKType {
  initSDK: (...args: any[]) => any;
  createInstance: (...args: any[]) => any;
  SepoliaConfig: object;
  __initialized__?: boolean;
}

export interface FhevmWindowType extends Window {
  relayerSDK: FhevmRelayerSDKType;
}

export interface FhevmInstanceType {
  createEncryptedInput: (contractAddress: string, userAddress: string) => EncryptedInputType;
  decrypt: (handle: string, privateKey: string) => Promise<any>;
}

export interface EncryptedInputType {
  add32: (value: number) => EncryptedInputType;
  addBool: (value: boolean) => EncryptedInputType;
  encrypt: () => Promise<{
    handles: string[];
    inputProof: string;
  }>;
}

export interface FhevmConfig {
  chainId: number;
  publicKey?: string;
  provider?: any;
}

export interface PublicKeyInfo {
  key: string;
  timestamp: number;
  chainId: number;
}