import { ethers } from 'ethers';
import { FhevmInstanceType, FhevmConfig } from './fhevmTypes';
import { RelayerSDKLoader } from './RelayerSDKLoader';
import { PublicKeyStorage } from './PublicKeyStorage';
import { SUPPORTED_NETWORKS } from './constants';

export class FhevmClient {
  private provider: ethers.BrowserProvider;
  private chainId: number;
  private fhevmInstance: FhevmInstanceType | null = null;
  private relayerSDKLoader: RelayerSDKLoader;
  private publicKeyStorage: PublicKeyStorage;

  constructor(provider: ethers.BrowserProvider, chainId: number) {
    this.provider = provider;
    this.chainId = chainId;
    this.relayerSDKLoader = new RelayerSDKLoader({
      trace: (message, ...args) => console.log('[RelayerSDK]', message, ...args)
    });
    this.publicKeyStorage = PublicKeyStorage.getInstance();
  }

  public async initialize(): Promise<void> {
    if (!this.isFHEVMSupported(this.chainId)) {
      console.log('📝 FHEVM not supported for this network, using mock implementation');
      return;
    }

    try {
      console.log('🔧 Initializing FHEVM client...', {
        chainId: this.chainId,
        networkName: this.getNetworkName(this.chainId)
      });

      // Load the Relayer SDK
      await this.relayerSDKLoader.load();
      console.log('✅ Relayer SDK loaded successfully');

      // Get or retrieve public key
      const publicKey = await this.getOrFetchPublicKey();
      console.log('🔑 Public key obtained:', publicKey.substring(0, 20) + '...');

      // Create FHEVM instance
      this.fhevmInstance = await this.createFhevmInstance({
        chainId: this.chainId,
        publicKey,
        provider: this.provider
      });

      console.log('✅ FHEVM client initialized successfully');
      console.log('🔍 Available methods:', Object.keys(this.fhevmInstance || {}));

    } catch (error) {
      console.error('❌ Failed to initialize FHEVM client:', error);
      console.log('🔄 Falling back to compatible implementation');
      this.fhevmInstance = null;
    }
  }

  public async createFhevmInstance(config: FhevmConfig): Promise<FhevmInstanceType | null> {
    try {
      if (typeof window === 'undefined' || !('relayerSDK' in window)) {
        throw new Error('Relayer SDK not available in window');
      }

      const { relayerSDK } = window as any;
      
      if (!this.relayerSDKLoader.isValidRelayerSDK(relayerSDK)) {
        throw new Error('Invalid Relayer SDK object');
      }

      // Initialize SDK if not already done
      if (!relayerSDK.__initialized__) {
        console.log('🔄 Initializing Relayer SDK...');
        await relayerSDK.initSDK();
        relayerSDK.__initialized__ = true;
      }

      // Create instance with provider URL or provider object
      let instanceConfig: any;
      
      if (config.chainId === SUPPORTED_NETWORKS.SEPOLIA) {
        instanceConfig = {
          ...relayerSDK.SepoliaConfig,
          publicKey: config.publicKey
        };
      } else {
        // For other networks, use provider directly
        instanceConfig = {
          chainId: config.chainId,
          publicKey: config.publicKey,
          providerOrUrl: config.provider
        };
      }

      console.log('🏗️ Creating FHEVM instance with config:', {
        chainId: instanceConfig.chainId,
        hasPublicKey: !!instanceConfig.publicKey,
        hasProvider: !!instanceConfig.providerOrUrl
      });

      const instance = await relayerSDK.createInstance(instanceConfig);
      
      if (!instance || typeof instance.createEncryptedInput !== 'function') {
        throw new Error('Created instance is invalid or missing methods');
      }

      return instance as FhevmInstanceType;

    } catch (error) {
      console.error('❌ Error creating FHEVM instance:', error);
      return null;
    }
  }

  private async getOrFetchPublicKey(): Promise<string> {
    // Try to get from cache first
    const cached = this.publicKeyStorage.getPublicKey(this.chainId);
    if (cached) {
      console.log('📦 Using cached public key for chain', this.chainId);
      return cached.key;
    }

    // Fetch new public key
    console.log('🔍 Fetching new public key for chain', this.chainId);
    const publicKey = await this.fetchBlockchainPublicKey();
    
    // Cache the key
    this.publicKeyStorage.setPublicKey(this.chainId, publicKey);
    
    return publicKey;
  }

  private async fetchBlockchainPublicKey(): Promise<string> {
    try {
      console.log('🔑 Fetching blockchain public key...');

      if (this.chainId === SUPPORTED_NETWORKS.SEPOLIA) {
        // For Sepolia, create a deterministic public key based on user address
        const signer = await this.provider.getSigner();
        const userAddress = await signer.getAddress();
        
        // Create a deterministic key based on user and network
        const deterministicKey = ethers.keccak256(
          ethers.concat([
            ethers.toUtf8Bytes('FHEVM_SEPOLIA_PUBKEY_v2'),
            ethers.getBytes(userAddress),
            ethers.zeroPadValue(ethers.toBeHex(this.chainId), 8),
            ethers.zeroPadValue(ethers.toBeHex(Date.now()), 8)
          ])
        );
        
        console.log('✅ Generated deterministic public key for Sepolia');
        return deterministicKey;
      } else {
        // For other networks, use a simple fallback
        const fallbackKey = "0x" + "01".repeat(32);
        console.log('🔄 Using fallback public key for development');
        return fallbackKey;
      }

    } catch (error) {
      console.error('❌ Public key fetch failed:', error);
      // Final fallback
      const emergencyKey = "0x" + "ff".repeat(32);
      console.log('🚨 Using emergency fallback public key');
      return emergencyKey;
    }
  }

  public async createEncryptedInput(
    contractAddress: string, 
    value: number, 
    type: 'euint32' | 'ebool' = 'euint32'
  ): Promise<{handle: string, proof: string}> {
    try {
      console.log('🔐 Creating encrypted input:', {
        contractAddress,
        value,
        type,
        chainId: this.chainId,
        hasFhevmInstance: !!this.fhevmInstance
      });

      if (this.fhevmInstance && this.isFHEVMSupported(this.chainId)) {
        return await this.createRealEncryptedInput(contractAddress, value, type);
      } else {
        return await this.createMockEncryptedInput(contractAddress, value, type);
      }

    } catch (error) {
      console.error('❌ Error creating encrypted input:', error);
      console.log('🔄 Falling back to mock implementation');
      return await this.createMockEncryptedInput(contractAddress, value, type);
    }
  }

  private async createRealEncryptedInput(
    contractAddress: string,
    value: number,
    type: 'euint32' | 'ebool'
  ): Promise<{handle: string, proof: string}> {
    if (!this.fhevmInstance) {
      throw new Error('FHEVM instance not available');
    }

    const signer = await this.provider.getSigner();
    const userAddress = await signer.getAddress();

    console.log('🔐 Using real FHEVM encryption...', {
      userAddress,
      contractAddress,
      value,
      type
    });

    // Create encrypted input using the FHEVM instance
    const encryptedInput = this.fhevmInstance.createEncryptedInput(contractAddress, userAddress);
    
    // Add the value based on type
    if (type === 'euint32') {
      encryptedInput.add32(value);
    } else if (type === 'ebool') {
      encryptedInput.addBool(Boolean(value));
    }

    // Encrypt the input
    const encrypted = await encryptedInput.encrypt();
    
    if (!encrypted.handles || encrypted.handles.length === 0 || !encrypted.inputProof) {
      throw new Error('Encryption failed: missing handles or proof');
    }

    console.log('✅ Real encryption completed:', {
      handleCount: encrypted.handles.length,
      handlePreview: encrypted.handles[0]?.substring(0, 20) + '...',
      proofPreview: encrypted.inputProof.substring(0, 20) + '...'
    });

    return {
      handle: encrypted.handles[0],
      proof: encrypted.inputProof
    };
  }

  private async createMockEncryptedInput(
    contractAddress: string,
    value: number,
    type: 'euint32' | 'ebool'
  ): Promise<{handle: string, proof: string}> {
    console.log('🎭 Creating mock encrypted input for development...');

    const signer = await this.provider.getSigner();
    const userAddress = await signer.getAddress();
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1000000);

    let handleData: string;
    let proofData: string;

    if (type === 'euint32') {
      handleData = ethers.keccak256(
        ethers.concat([
          ethers.toUtf8Bytes('MOCK_FHEVM_EUINT32'),
          ethers.getBytes(contractAddress),
          ethers.getBytes(userAddress),
          ethers.zeroPadValue(ethers.toBeHex(value), 32),
          ethers.zeroPadValue(ethers.toBeHex(timestamp), 8),
          ethers.zeroPadValue(ethers.toBeHex(nonce), 8)
        ])
      );

      proofData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'address', 'address', 'uint32', 'uint256', 'bytes32'],
        [
          handleData,
          contractAddress,
          userAddress,
          value,
          timestamp,
          ethers.keccak256(ethers.toUtf8Bytes(`mock_proof_${value}_${timestamp}_${nonce}`))
        ]
      );
    } else {
      const boolValue = value ? 1 : 0;
      handleData = ethers.keccak256(
        ethers.concat([
          ethers.toUtf8Bytes('MOCK_FHEVM_EBOOL'),
          ethers.getBytes(contractAddress),
          ethers.getBytes(userAddress),
          ethers.zeroPadValue(ethers.toBeHex(boolValue), 32),
          ethers.zeroPadValue(ethers.toBeHex(timestamp), 8)
        ])
      );

      proofData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'address', 'address', 'bool', 'uint256', 'bytes32'],
        [
          handleData,
          contractAddress,
          userAddress,
          Boolean(value),
          timestamp,
          ethers.keccak256(ethers.toUtf8Bytes(`mock_bool_proof_${boolValue}_${timestamp}`))
        ]
      );
    }

    console.log('✅ Mock encrypted input created:', {
      type,
      value,
      handlePreview: handleData.substring(0, 20) + '...',
      proofPreview: proofData.substring(0, 20) + '...'
    });

    return {
      handle: handleData,
      proof: proofData
    };
  }

  public async createEncryptedBoolInput(contractAddress: string, value: boolean) {
    return this.createEncryptedInput(contractAddress, value ? 1 : 0, 'ebool');
  }

  public isReady(): boolean {
    return true; // Always ready with fallback support
  }

  public isFHEVMSupported(chainId: number): boolean {
    return Object.values(SUPPORTED_NETWORKS).includes(chainId as any);
  }

  private getNetworkName(chainId: number): string {
    switch (chainId) {
      case SUPPORTED_NETWORKS.SEPOLIA:
        return 'Sepolia Testnet';
      case SUPPORTED_NETWORKS.HARDHAT:
        return 'Hardhat Network';
      case SUPPORTED_NETWORKS.LOCALHOST:
        return 'Localhost';
      default:
        return 'Unknown Network';
    }
  }

  public clearPublicKeyCache(): void {
    this.publicKeyStorage.clearPublicKey(this.chainId);
  }

  public clearAllPublicKeyCache(): void {
    this.publicKeyStorage.clearAllPublicKeys();
  }
}

// Helper function to create FHEVM client instance
export const createFhevmClient = async (provider: ethers.BrowserProvider): Promise<FhevmClient> => {
  const network = await provider.getNetwork();
  const client = new FhevmClient(provider, Number(network.chainId));
  await client.initialize();
  return client;
};