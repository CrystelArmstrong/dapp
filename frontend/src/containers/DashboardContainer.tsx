import React from 'react';
import { useWalletContext } from '../providers/WalletProvider';
import { useFHEVMContext } from '../providers/FHEVMProvider';
import FHECounterDemo from '../components/FHECounterDemo';
import WalletConnectionCard from '../components/wallet/WalletConnectionCard';
import NetworkWarningCard from '../components/network/NetworkWarningCard';
import './DashboardContainer.css';

const DashboardContainer: React.FC = () => {
  const { isConnected, provider, account } = useWalletContext();
  const { networkSupported } = useFHEVMContext();

  if (!isConnected) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-grid">
          <WalletConnectionCard />
        </div>
      </div>
    );
  }

  if (!networkSupported) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-grid">
          <NetworkWarningCard />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">🔐 FHE Privacy DApp</h2>
        <p className="dashboard-subtitle">
          Fully Homomorphic Encryption powered by Zama FHEVM
        </p>
      </div>
      
      <div className="dashboard-grid dashboard-grid-single">
        <div className="fhe-demo-wrapper">
          <FHECounterDemo />
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;