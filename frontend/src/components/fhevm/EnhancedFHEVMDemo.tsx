import React from 'react';
import { useEnhancedFHEVMContext } from '../../providers/EnhancedFHEVMProvider';
import './EnhancedFHEVMDemo.css';

const EnhancedFHEVMDemo: React.FC = () => {
  const {
    isReady,
    isLoading,
    networkSupported,
    encryptedCount,
    inputValue,
    setInputValue,
    performEncryptAdd,
    performEncryptSub,
    refreshState,
    clearCache,
    reinitialize
  } = useEnhancedFHEVMContext();

  const handleAdd = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid positive number');
      return;
    }
    await performEncryptAdd(value);
  };

  const handleSubtract = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid positive number');
      return;
    }
    await performEncryptSub(value);
  };

  const handleClearCache = () => {
    clearCache();
    alert('🗑️ FHEVM cache cleared!');
  };

  const handleReinitialize = async () => {
    try {
      await reinitialize();
      alert('🔄 FHEVM client reinitialized!');
    } catch (error) {
      alert('❌ Reinitialization failed: ' + (error as Error).message);
    }
  };

  if (!networkSupported) {
    return (
      <div className="enhanced-fhevm-demo">
        <div className="network-warning">
          <h3>⚠️ Network Not Supported</h3>
          <p>Please switch to Sepolia Testnet (Chain ID: 11155111) or Hardhat Network (Chain ID: 31337) to use Enhanced FHEVM features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-fhevm-demo">
      <div className="demo-header">
        <h2>🚀 Enhanced FHEVM Demo</h2>
        <p>Advanced FHE operations with Zama CDN SDK and caching</p>
      </div>

      <div className="status-section">
        <div className={`status-indicator ${isReady ? 'ready' : 'not-ready'}`}>
          {isReady ? '✅ Enhanced FHEVM Ready' : '⚠️ Initializing...'}
        </div>
        <div className="status-details">
          <p><strong>Network Supported:</strong> {networkSupported ? '✅' : '❌'}</p>
          <p><strong>Loading:</strong> {isLoading ? '🔄' : '✅'}</p>
        </div>
      </div>

      <div className="encrypted-state">
        <h3>🔐 Encrypted State</h3>
        <div className="state-display">
          <p><strong>Encrypted Counter Handle:</strong></p>
          <code className="handle-display">
            {encryptedCount || 'No encrypted state yet'}
          </code>
        </div>
      </div>

      <div className="controls-section">
        <h3>🎮 Enhanced Controls</h3>
        <div className="input-group">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a number"
            disabled={!isReady || isLoading}
            min="1"
          />
        </div>
        
        <div className="button-group">
          <button
            onClick={handleAdd}
            disabled={!isReady || isLoading || !inputValue}
            className="operation-btn add-btn"
          >
            {isLoading ? '🔄' : '🔐➕'} Enhanced Add
          </button>
          
          <button
            onClick={handleSubtract}
            disabled={!isReady || isLoading || !inputValue}
            className="operation-btn subtract-btn"
          >
            {isLoading ? '🔄' : '🔐➖'} Enhanced Subtract
          </button>
        </div>
      </div>

      <div className="management-section">
        <h3>🛠️ Enhanced Management</h3>
        <div className="management-controls">
          <button
            onClick={refreshState}
            disabled={isLoading}
            className="management-btn refresh-btn"
          >
            🔄 Refresh State
          </button>
          
          <button
            onClick={handleClearCache}
            disabled={isLoading}
            className="management-btn cache-btn"
          >
            🗑️ Clear Cache
          </button>
          
          <button
            onClick={handleReinitialize}
            disabled={isLoading}
            className="management-btn reinit-btn"
          >
            🔧 Reinitialize
          </button>
        </div>
      </div>

      <div className="features-section">
        <h3>✨ Enhanced Features</h3>
        <ul className="features-list">
          <li>✅ Official Zama CDN SDK (v0.1.2)</li>
          <li>✅ Complete SDK verification system</li>
          <li>✅ Sepolia network support (Chain ID: 11155111)</li>
          <li>✅ PublicKey caching with TTL</li>
          <li>✅ createFhevmInstance with providerOrUrl</li>
          <li>✅ Advanced error handling and fallbacks</li>
          <li>✅ Real-time status monitoring</li>
          <li>✅ Cache management utilities</li>
        </ul>
      </div>

      <div className="info-section">
        <h4>ℹ️ Technical Info</h4>
        <ul>
          <li><strong>SDK Source:</strong> https://cdn.zama.ai/relayer-sdk-js/0.1.2/relayer-sdk-js.umd.cjs</li>
          <li><strong>Supported Networks:</strong> Sepolia (11155111), Hardhat (31337), Localhost (1337)</li>
          <li><strong>Cache TTL:</strong> 24 hours</li>
          <li><strong>Encryption:</strong> Real TFHE with mock fallback</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedFHEVMDemo;