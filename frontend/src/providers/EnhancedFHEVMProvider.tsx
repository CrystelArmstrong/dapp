import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWalletContext } from './WalletProvider';
import { FhevmProvider, useFhevm } from '../fhevm/useFhevm';

interface EnhancedFHEVMContextType {
  isReady: boolean;
  isLoading: boolean;
  networkSupported: boolean;
  encryptedCount: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  performEncryptAdd: (value: number) => Promise<void>;
  performEncryptSub: (value: number) => Promise<void>;
  refreshState: () => Promise<void>;
  // New enhanced features
  clearCache: () => void;
  reinitialize: () => Promise<void>;
}

const EnhancedFHEVMContext = createContext<EnhancedFHEVMContextType | undefined>(undefined);

export const useEnhancedFHEVMContext = () => {
  const context = useContext(EnhancedFHEVMContext);
  if (!context) {
    throw new Error('useEnhancedFHEVMContext must be used within an EnhancedFHEVMProvider');
  }
  return context;
};

interface EnhancedFHEVMProviderProps {
  children: React.ReactNode;
}

const EnhancedFHEVMProviderInner: React.FC<EnhancedFHEVMProviderProps> = ({ children }) => {
  const { provider, account, chainId } = useWalletContext();
  const { client, isLoading: fhevmLoading, isReady: fhevmReady, error, reinitialize, clearCache } = useFhevm();
  
  const [isLoading, setIsLoading] = useState(false);
  const [encryptedCount, setEncryptedCount] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');

  const networkSupported = chainId ? [11155111, 31337, 1337].includes(chainId) : false;
  const isReady = fhevmReady && provider !== null && account !== null && networkSupported;

  const performEncryptAdd = useCallback(async (value: number) => {
    if (!client || !provider || !networkSupported) {
      toast.error('FHEVM client not ready or network not supported');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐➕ Starting enhanced FHEVM Add operation...');
      
      const contractAddress = "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1";
      
      // Use the enhanced client to create encrypted input
      const encryptedInput = await client.createEncryptedInput(contractAddress, value, 'euint32');
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: contractAddress,
        data: ethers.concat([
          ethers.id("add(bytes32,bytes)").slice(0, 10),
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "bytes"],
            [encryptedInput.handle, encryptedInput.proof]
          )
        ]),
        gasPrice: ethers.parseUnits('150', 'gwei'),
        gasLimit: BigInt(3000000),
        type: 0
      });
      
      toast.info(`🔐➕ Enhanced Add transaction submitted: ${tx.hash.substring(0, 10)}...`);
      
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        toast.success('🎉 Enhanced FHEVM Add operation successful!');
        setInputValue('');
        await refreshState();
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error: any) {
      console.error('Enhanced FHEVM Add operation failed:', error);
      
      if (error.message.includes('dropped') || error.message.includes('replaced')) {
        toast.error('🚫 Transaction dropped or replaced');
      } else if (error.message.includes('execution reverted')) {
        toast.error('🔧 FHEVM Add execution failed');
      } else {
        toast.error('🔐➕ Enhanced FHEVM Add failed: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [client, provider, networkSupported]);

  const performEncryptSub = useCallback(async (value: number) => {
    if (!client || !provider || !networkSupported) {
      toast.error('FHEVM client not ready or network not supported');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐➖ Starting enhanced FHEVM Sub operation...');
      
      const contractAddress = "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1";
      
      // Use the enhanced client to create encrypted input
      const encryptedInput = await client.createEncryptedInput(contractAddress, value, 'euint32');
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: contractAddress,
        data: ethers.concat([
          ethers.id("subtract(bytes32,bytes)").slice(0, 10),
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "bytes"],
            [encryptedInput.handle, encryptedInput.proof]
          )
        ]),
        gasPrice: ethers.parseUnits('150', 'gwei'),
        gasLimit: BigInt(3000000),
        type: 0
      });
      
      toast.info(`🔐➖ Enhanced Sub transaction submitted: ${tx.hash.substring(0, 10)}...`);
      
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        toast.success('🎉 Enhanced FHEVM Sub operation successful!');
        setInputValue('');
        await refreshState();
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error: any) {
      console.error('Enhanced FHEVM Sub operation failed:', error);
      
      if (error.message.includes('dropped') || error.message.includes('replaced')) {
        toast.error('🚫 Transaction dropped or replaced');
      } else if (error.message.includes('execution reverted')) {
        toast.error('🔧 FHEVM Sub execution failed');
      } else {
        toast.error('🔐➖ Enhanced FHEVM Sub failed: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [client, provider, networkSupported]);

  const refreshState = useCallback(async () => {
    if (!provider || !account) return;
    
    try {
      const timestamp = Date.now();
      const mockHandle = ethers.id(`enhanced_encrypted_${timestamp}_${account}`);
      setEncryptedCount(mockHandle);
    } catch (error) {
      console.error('Error refreshing state:', error);
    }
  }, [provider, account]);

  useEffect(() => {
    if (isReady) {
      refreshState();
    }
  }, [isReady, refreshState]);

  const contextValue: EnhancedFHEVMContextType = {
    isReady,
    isLoading: isLoading || fhevmLoading,
    networkSupported,
    encryptedCount,
    inputValue,
    setInputValue,
    performEncryptAdd,
    performEncryptSub,
    refreshState,
    clearCache,
    reinitialize,
  };

  return (
    <EnhancedFHEVMContext.Provider value={contextValue}>
      {children}
    </EnhancedFHEVMContext.Provider>
  );
};

export const EnhancedFHEVMProvider: React.FC<EnhancedFHEVMProviderProps> = ({ children }) => {
  const { provider } = useWalletContext();
  
  return (
    <FhevmProvider provider={provider}>
      <EnhancedFHEVMProviderInner>
        {children}
      </EnhancedFHEVMProviderInner>
    </FhevmProvider>
  );
};