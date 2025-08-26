import React, { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWalletContext } from '../providers/WalletProvider';
import deployments from '../contracts/deployments.json';
import './FHECounterDemo.css';

const SIMPLE_COUNTER_ABI = [
  "function increment(bytes32 encryptedValue, bytes calldata inputProof) external",
  "function decrement(bytes32 encryptedValue, bytes calldata inputProof) external", 
  "function getCount() external view returns (uint256)",
  "function getStats() external view returns (uint256 currentCount, uint256 totalOps, uint256 userOps)",
  "function getContractInfo() external view returns (string name, string version, address contractOwner, uint256 deploymentTime)",
  "event CounterIncremented(address indexed user, uint256 newCount, uint256 timestamp)",
  "event CounterDecremented(address indexed user, uint256 newCount, uint256 timestamp)"
];

const FHECounterDemo: React.FC = () => {
  const { provider, account, signer, chainId, switchNetwork } = useWalletContext();

  // State for real blockchain interactions
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [totalOps, setTotalOps] = useState<number>(0);
  const [userOps, setUserOps] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("Ready to interact with real contract");
  const [txHash, setTxHash] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);

  const contractAddress = deployments.SimpleCounter;
  
  // Sepolia testnet chain ID
  const SEPOLIA_CHAIN_ID = 11155111;

  // Initialize contract instance
  useEffect(() => {
    if (signer && contractAddress && chainId) {
      // 验证网络
      if (chainId !== SEPOLIA_CHAIN_ID) {
        setMessage(`⚠️ Wrong network. Please switch to Sepolia (Chain ID: ${SEPOLIA_CHAIN_ID})`);
        setContract(null);
        setIsDeployed(false);
        return;
      }

      // 验证合约地址格式
      if (!ethers.isAddress(contractAddress)) {
        setMessage("❌ Invalid contract address");
        setContract(null);
        setIsDeployed(false);
        return;
      }

      // 验证合约不是零地址
      if (contractAddress === ethers.ZeroAddress) {
        setMessage("❌ Contract not deployed to this network");
        setContract(null);
        setIsDeployed(false);
        return;
      }

      try {
        const contractInstance = new ethers.Contract(
          contractAddress,
          SIMPLE_COUNTER_ABI,
          signer
        );
        setContract(contractInstance);
        setIsDeployed(true);
        setMessage(`✅ Connected to contract on Sepolia: ${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)}`);
      } catch (error) {
        console.error('Failed to create contract instance:', error);
        setMessage("❌ Failed to connect to contract");
        setContract(null);
        setIsDeployed(false);
      }
    } else {
      setContract(null);
      setIsDeployed(false);
      if (!signer) {
        setMessage("Please connect your wallet");
      } else if (!contractAddress) {
        setMessage("Contract address not available");
      } else if (!chainId) {
        setMessage("Network information not available");
      }
    }
  }, [signer, contractAddress, chainId]);

  // Load contract data
  const loadContractData = useCallback(async () => {
    if (!contract || isLoading) return;

    setIsLoading(true);
    try {
      const [count, stats] = await Promise.all([
        contract.getCount(),
        contract.getStats()
      ]);
      
      setCurrentCount(Number(count));
      setTotalOps(Number(stats[1]));
      setUserOps(Number(stats[2]));
      setMessage(`Count: ${count.toString()}, Total ops: ${stats[1].toString()}`);
    } catch (error: any) {
      console.error("Failed to load contract data:", error);
      setMessage(`Error loading data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [contract, isLoading]);

  // Real increment operation with MetaMask
  const performIncrement = useCallback(async () => {
    if (!contract || !signer || isProcessing || !isDeployed) return;

    // 检查网络
    if (chainId !== SEPOLIA_CHAIN_ID) {
      setMessage(`⚠️ Please switch to Sepolia Testnet (Chain ID: ${SEPOLIA_CHAIN_ID})`);
      return;
    }

    setIsProcessing(true);
    setMessage("Preparing increment transaction...");

    try {
      // 检查账户余额
      const balance = await provider?.getBalance(account || '');
      if (balance && balance < ethers.parseEther('0.001')) {
        setMessage("⚠️ Insufficient ETH balance for transaction fees");
        return;
      }

      setMessage("Please confirm transaction in MetaMask...");

      // For the SimpleCounter contract, we need to pass dummy encrypted values
      const dummyEncryptedValue = ethers.ZeroHash;
      const dummyInputProof = "0x";
      
      // 估算 gas
      const estimatedGas = await contract.increment.estimateGas(dummyEncryptedValue, dummyInputProof);
      
      const tx = await contract.increment(dummyEncryptedValue, dummyInputProof, {
        gasLimit: estimatedGas + BigInt(10000) // 添加一些缓冲
      });
      
      setTxHash(tx.hash);
      setMessage(`Transaction sent: ${tx.hash.slice(0, 10)}... Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setMessage(`✅ Increment successful! Block: ${receipt.blockNumber}`);
      } else {
        setMessage(`❌ Transaction failed in block: ${receipt.blockNumber}`);
      }
      
      // Refresh contract data
      setTimeout(() => loadContractData(), 2000);
    } catch (error: any) {
      console.error("Increment failed:", error);
      if (error.code === 4001) {
        setMessage("❌ Transaction rejected by user");
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        setMessage("❌ Insufficient funds for transaction");
      } else if (error.code === 'NETWORK_ERROR') {
        setMessage("❌ Network error. Please try again");
      } else {
        setMessage(`❌ Increment failed: ${error.reason || error.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [contract, signer, isProcessing, isDeployed, chainId, provider, account, loadContractData]);

  // Real decrement operation with MetaMask
  const performDecrement = useCallback(async () => {
    if (!contract || !signer || isProcessing || !isDeployed) return;

    // 检查网络
    if (chainId !== SEPOLIA_CHAIN_ID) {
      setMessage(`⚠️ Please switch to Sepolia Testnet (Chain ID: ${SEPOLIA_CHAIN_ID})`);
      return;
    }

    setIsProcessing(true);
    setMessage("Preparing decrement transaction...");

    try {
      // 检查账户余额
      const balance = await provider?.getBalance(account || '');
      if (balance && balance < ethers.parseEther('0.001')) {
        setMessage("⚠️ Insufficient ETH balance for transaction fees");
        return;
      }

      setMessage("Please confirm transaction in MetaMask...");

      const dummyEncryptedValue = ethers.ZeroHash;
      const dummyInputProof = "0x";
      
      // 估算 gas
      const estimatedGas = await contract.decrement.estimateGas(dummyEncryptedValue, dummyInputProof);
      
      const tx = await contract.decrement(dummyEncryptedValue, dummyInputProof, {
        gasLimit: estimatedGas + BigInt(10000) // 添加一些缓冲
      });
      
      setTxHash(tx.hash);
      setMessage(`Transaction sent: ${tx.hash.slice(0, 10)}... Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setMessage(`✅ Decrement successful! Block: ${receipt.blockNumber}`);
      } else {
        setMessage(`❌ Transaction failed in block: ${receipt.blockNumber}`);
      }
      
      // Refresh contract data
      setTimeout(() => loadContractData(), 2000);
    } catch (error: any) {
      console.error("Decrement failed:", error);
      if (error.code === 4001) {
        setMessage("❌ Transaction rejected by user");
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        setMessage("❌ Insufficient funds for transaction");
      } else if (error.code === 'NETWORK_ERROR') {
        setMessage("❌ Network error. Please try again");
      } else {
        setMessage(`❌ Decrement failed: ${error.reason || error.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [contract, signer, isProcessing, isDeployed, chainId, provider, account, loadContractData]);

  // Load data on mount and when contract changes
  useEffect(() => {
    if (contract) {
      loadContractData();
    }
  }, [contract, loadContractData]);

  // Listen for contract events
  useEffect(() => {
    if (!contract) return;

    const handleIncrement = (user: string, newCount: bigint, timestamp: bigint) => {
      console.log('Counter incremented:', { user, newCount: newCount.toString(), timestamp });
      loadContractData();
    };

    const handleDecrement = (user: string, newCount: bigint, timestamp: bigint) => {
      console.log('Counter decremented:', { user, newCount: newCount.toString(), timestamp });
      loadContractData();
    };

    contract.on('CounterIncremented', handleIncrement);
    contract.on('CounterDecremented', handleDecrement);

    return () => {
      contract.off('CounterIncremented', handleIncrement);
      contract.off('CounterDecremented', handleDecrement);
    };
  }, [contract, loadContractData]);

  // Render conditions
  const canInteract = contract && signer && !isProcessing && isDeployed && chainId === SEPOLIA_CHAIN_ID;
  const isConnected = !!account && !!signer;
  const isOnCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  if (!provider) {
    return <div className="fhe-counter-demo error">❌ No provider available</div>;
  }

  if (!isConnected) {
    return <div className="fhe-counter-demo error">❌ Please connect your wallet</div>;
  }

  if (!isOnCorrectNetwork) {
    return (
      <div className="fhe-counter-demo error">
        <h3>⚠️ Wrong Network</h3>
        <p>Please switch to Sepolia Testnet</p>
        <div style={{ marginTop: '16px', fontSize: '0.9rem' }}>
          <p>Current Network: {chainId ? `Chain ID ${chainId}` : 'Unknown'}</p>
          <p>Required: Sepolia Testnet (Chain ID 11155111)</p>
        </div>
      </div>
    );
  }

  if (!isDeployed) {
    return (
      <div className="fhe-counter-demo error">
        <h3>❌ Contract Not Available</h3>
        <p>Contract is not deployed or accessible</p>
        <div style={{ marginTop: '16px', fontSize: '0.9rem' }}>
          <p>Contract Address: {contractAddress}</p>
          <p>Network: Sepolia Testnet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fhe-counter-demo">
      <div className="demo-header">
        <h3>🔐 Real FHE Counter on Sepolia</h3>
        <p>Live blockchain interaction with MetaMask</p>
        <div className="contract-info">
          <small>Contract: {contractAddress?.slice(0, 8)}...{contractAddress?.slice(-6)}</small>
          <br />
          <small style={{color: '#00ff88'}}>✅ Real Contract - Sepolia Testnet</small>
          <br />
          <small>Connected: {account?.slice(0, 6)}...{account?.slice(-4)}</small>
          <br />
          <small>Network: Chain ID {chainId} {isOnCorrectNetwork ? '✅' : '⚠️'}</small>
          <br />
          <small>Deployed: {isDeployed ? '✅' : '❌'}</small>
        </div>
      </div>

      <div className="demo-content">
        <div className="count-display">
          <div className="count-section">
            <label>Current Count:</label>
            <div className="count-value current">
              {currentCount}
            </div>
          </div>

          <div className="stats-section">
            <div className="stat-item">
              <label>Total Operations:</label>
              <span>{totalOps}</span>
            </div>
            <div className="stat-item">
              <label>Your Operations:</label>
              <span>{userOps}</span>
            </div>
          </div>

          {txHash && (
            <div className="tx-section">
              <label>Latest Transaction:</label>
              <a 
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="tx-link"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
          )}
        </div>

        <div className="demo-controls">
          <div className="control-group">
            <button 
              onClick={loadContractData}
              disabled={isLoading}
              className="btn-refresh"
            >
              {isLoading ? "🔄..." : "🔄"} Refresh Data
            </button>

            <button
              onClick={() => window.open(`https://sepolia.etherscan.io/address/${contractAddress}`, '_blank')}
              className="btn-etherscan"
            >
              🔍 View on Etherscan
            </button>

            {!isOnCorrectNetwork && (
              <button
                onClick={() => switchNetwork(SEPOLIA_CHAIN_ID)}
                className="btn-network"
              >
                🔄 Switch to Sepolia
              </button>
            )}
          </div>

          <div className="control-group">
            <button 
              onClick={performIncrement}
              disabled={!canInteract}
              className="btn-increment"
            >
              {isProcessing ? "⏳..." : "➕"} Increment (+1)
            </button>

            <button 
              onClick={performDecrement}
              disabled={!canInteract}
              className="btn-decrement"
            >
              {isProcessing ? "⏳..." : "➖"} Decrement (-1)
            </button>
          </div>
        </div>

        <div className="status-message">
          <span className={isProcessing || isLoading ? "processing" : "ready"}>
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FHECounterDemo;