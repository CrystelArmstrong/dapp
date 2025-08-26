import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { FhevmClient } from './internal/fhevm';

interface FhevmContextType {
  client: FhevmClient | null;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  reinitialize: () => Promise<void>;
  clearCache: () => void;
}

const FhevmContext = createContext<FhevmContextType>({
  client: null,
  isLoading: true,
  isReady: false,
  error: null,
  reinitialize: async () => {},
  clearCache: () => {}
});

interface FhevmProviderProps {
  children: ReactNode;
  provider: ethers.BrowserProvider | null;
}

export function FhevmProvider({ children, provider }: FhevmProviderProps) {
  const [client, setClient] = useState<FhevmClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeClient = useCallback(async () => {
    if (!provider) {
      setClient(null);
      setIsReady(false);
      setIsLoading(false);
      setError('No provider available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('🔧 Initializing FHEVM client...');

      const network = await provider.getNetwork();
      const fhevmClient = new FhevmClient(provider, Number(network.chainId));
      
      await fhevmClient.initialize();
      
      setClient(fhevmClient);
      setIsReady(fhevmClient.isReady());
      
      console.log('✅ FHEVM client initialized successfully', {
        chainId: Number(network.chainId),
        isReady: fhevmClient.isReady(),
        supportsFHEVM: fhevmClient.isFHEVMSupported(Number(network.chainId))
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to initialize FHEVM client:', errorMessage);
      setError(errorMessage);
      setClient(null);
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  const reinitialize = async () => {
    console.log('🔄 Reinitializing FHEVM client...');
    await initializeClient();
  };

  const clearCache = () => {
    if (client) {
      console.log('🗑️ Clearing FHEVM cache...');
      client.clearAllPublicKeyCache();
    }
  };

  useEffect(() => {
    initializeClient();
  }, [provider, initializeClient]);

  const contextValue: FhevmContextType = {
    client,
    isLoading,
    isReady,
    error,
    reinitialize,
    clearCache
  };

  return (
    <FhevmContext.Provider value={contextValue}>
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevm() {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error('useFhevm must be used within a FhevmProvider');
  }
  return context;
}