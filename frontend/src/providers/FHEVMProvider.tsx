import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWalletContext } from './WalletProvider';

// Mock FHE instance interface
interface MockFhevmInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => {
    add32: (value: number) => void;
    encrypt: () => Promise<{ handles: string[], inputProof: string }>;
  };
  userDecrypt: (
    handles: { handle: string, contractAddress: string }[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, any>>;
}

type FhevmGoState = "idle" | "loading" | "ready" | "error";

interface FHEVMContextType {
  instance: MockFhevmInstance | undefined;
  status: FhevmGoState;
  networkSupported: boolean;
}

const FHEVMContext = createContext<FHEVMContextType | undefined>(undefined);

export const useFHEVMContext = () => {
  const context = useContext(FHEVMContext);
  if (!context) {
    throw new Error('useFHEVMContext must be used within a FHEVMProvider');
  }
  return context;
};

interface FHEVMProviderProps {
  children: React.ReactNode;
}

export const FHEVMProvider: React.FC<FHEVMProviderProps> = ({ children }) => {
  const { provider, chainId } = useWalletContext();
  const [instance, setInstance] = useState<MockFhevmInstance | undefined>();
  const [status, setStatus] = useState<FhevmGoState>("idle");
  const [networkSupported, setNetworkSupported] = useState(false);

  // Mock storage for encrypted values
  const encryptedStorage = useRef<Map<string, number>>(new Map());

  // Create mock FHE instance
  const createMockInstance = useCallback((): MockFhevmInstance => {
    return {
      createEncryptedInput: (contractAddress: string, userAddress: string) => {
        let value = 0;
        
        return {
          add32: (val: number) => {
            value = val;
          },
          encrypt: async () => {
            // Simulate encryption time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const handle = ethers.id(`encrypted_${Date.now()}_${value}`);
            const proof = ethers.hexlify(ethers.randomBytes(128));
            
            // Store the actual value for later decryption
            encryptedStorage.current.set(handle, value);
            
            return {
              handles: [handle],
              inputProof: proof
            };
          }
        };
      },
      
      userDecrypt: async (
        handles: { handle: string, contractAddress: string }[],
        privateKey: string,
        publicKey: string,
        signature: string,
        contractAddresses: string[],
        userAddress: string,
        startTimestamp: number,
        durationDays: number
      ) => {
        // Simulate decryption time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const result: Record<string, any> = {};
        
        for (const { handle } of handles) {
          // Return stored value or a random value if not found
          const storedValue = encryptedStorage.current.get(handle);
          result[handle] = storedValue !== undefined ? storedValue : Math.floor(Math.random() * 100);
        }
        
        return result;
      }
    };
  }, []);

  useEffect(() => {
    const checkNetworkSupport = () => {
      if (!chainId) {
        setNetworkSupported(false);
        return;
      }
      
      // Support Sepolia and local networks
      const isSepolia = chainId === 11155111;
      const isLocalHardhat = chainId === 31337 || chainId === 1337;
      const supported = isSepolia || isLocalHardhat;
      
      setNetworkSupported(supported);
      
      if (supported && provider) {
        setStatus("loading");
        // Simulate loading time
        setTimeout(() => {
          setInstance(createMockInstance());
          setStatus("ready");
        }, 1000);
      } else {
        setInstance(undefined);
        setStatus("error");
      }
    };

    checkNetworkSupport();
  }, [provider, chainId, createMockInstance]);

  const contextValue: FHEVMContextType = {
    instance,
    status,
    networkSupported,
  };

  return (
    <FHEVMContext.Provider value={contextValue}>
      {children}
    </FHEVMContext.Provider>
  );
};