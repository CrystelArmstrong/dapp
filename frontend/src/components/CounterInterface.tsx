import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { CounterABI, CONTRACT_ADDRESSES, getContract } from '../utils/contracts';
import './CounterInterface.css';

// 🟧 Neo-Brutalist Standard Counter Components
const BrutalistCounterContainer = styled.div`
  background: #ffffff;
  border: 4px solid #000000;
  padding: 32px;
  box-shadow: 8px 8px 0px #000000;
  position: relative;
  color: #000000;
  font-family: 'JetBrains Mono', monospace;
`;

const BrutalistHeader = styled.div`
  margin-bottom: 24px;
  text-align: center;
`;

const BrutalistTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #ff0000;
  text-shadow: 2px 2px 0px #000000;
`;

const BrutalistSubtitle = styled.p`
  margin: 0;
  color: #0000ff;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.9rem;
`;

const CountDisplay = styled.div`
  background: #000000;
  color: #00ff00;
  padding: 32px;
  margin-bottom: 24px;
  text-align: center;
  border: 4px solid #00ff00;
  box-shadow: 4px 4px 0px #ff0000;
`;

const CountValue = styled.h3`
  font-size: 3rem;
  margin: 0;
  font-weight: 900;
  font-family: 'JetBrains Mono', monospace;
`;

const CountLabel = styled.p`
  margin: 8px 0 0 0;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.8;
`;

const ControlsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const InputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const BrutalistInput = styled.input`
  flex: 1;
  padding: 16px;
  background: #ffff00;
  color: #000000;
  border: 4px solid #000000;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 1rem;
  
  &::placeholder {
    color: #666666;
    font-weight: 700;
  }
  
  &:focus {
    outline: none;
    background: #ffffff;
    box-shadow: 4px 4px 0px #0000ff;
  }
  
  &:disabled {
    background: #cccccc;
    color: #666666;
  }
`;

const BrutalistButton = styled.button<{ variant: 'refresh' | 'increment' | 'decrement' }>`
  padding: 16px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
  border: 4px solid #000000;
  min-width: 120px;
  
  ${props => {
    switch (props.variant) {
      case 'refresh':
        return `
          background: #0000ff;
          color: #ffffff;
          box-shadow: 4px 4px 0px #ff0000;
          
          &:hover:not(:disabled) {
            background: #0000cc;
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px #ff0000;
          }
        `;
      case 'increment':
        return `
          background: #00ff00;
          color: #000000;
          box-shadow: 4px 4px 0px #0000ff;
          flex: 1;
          
          &:hover:not(:disabled) {
            background: #00dd00;
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px #0000ff;
          }
        `;
      case 'decrement':
        return `
          background: #ff0000;
          color: #ffffff;
          box-shadow: 4px 4px 0px #ffff00;
          flex: 1;
          
          &:hover:not(:disabled) {
            background: #dd0000;
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px #ffff00;
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: 4px 4px 0px #666666 !important;
  }
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const InfoSection = styled.div`
  background: #ff00ff;
  color: #ffffff;
  padding: 20px;
  border: 4px solid #000000;
  box-shadow: 4px 4px 0px #00ffff;
  font-weight: 900;
  text-transform: uppercase;
  text-align: center;
`;

const StatusAlert = styled.div<{ variant?: 'info' | 'warning' | 'error' }>`
  padding: 16px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 16px;
  border: 3px solid #000000;
  text-align: center;
  
  ${props => {
    switch (props.variant) {
      case 'warning':
        return `
          background: #ffff00;
          color: #000000;
          box-shadow: 3px 3px 0px #ff0000;
        `;
      case 'error':
        return `
          background: #ff0000;
          color: #ffffff;
          box-shadow: 3px 3px 0px #000000;
        `;
      default:
        return `
          background: #00ffff;
          color: #000000;
          box-shadow: 3px 3px 0px #0000ff;
        `;
    }
  }}
`;

interface CounterInterfaceProps {
  provider: ethers.BrowserProvider | null;
  account: string | null;
}

const CounterInterface: React.FC<CounterInterfaceProps> = ({ provider, account }) => {
  const [count, setCount] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const initContract = async () => {
      if (provider && account) {
        const counterContract = await getContract(CONTRACT_ADDRESSES.Counter, CounterABI, provider);
        setContract(counterContract);
        loadCount(counterContract);
      }
    };
    initContract();
  }, [provider, account]);

  const loadCount = async (contractInstance?: ethers.Contract) => {
    if (!contractInstance && !contract) return;
    
    try {
      const currentContract = contractInstance || contract;
      const currentCount = await currentContract!.getCount();
      setCount(Number(currentCount));
    } catch (error: any) {
      console.error('Error loading count:', error);
      toast.error('Failed to load counter value');
    }
  };

  const handleIncrement = async () => {
    if (!contract) return;
    
    // Use inputValue or default to 1
    const value = inputValue ? parseInt(inputValue) : 1;
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.increment(value);
      toast.info('Transaction submitted...');
      await tx.wait();
      toast.success(`Counter incremented by ${value} successfully!`);
      await loadCount();
      setInputValue('');
    } catch (error: any) {
      console.error('Error incrementing:', error);
      toast.error('Failed to increment counter: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = async () => {
    if (!contract) return;
    
    // Use inputValue or default to 1
    const value = inputValue ? parseInt(inputValue) : 1;
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    if (value > count) {
      toast.error('Cannot decrement below zero');
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.decrement(value);
      toast.info('Transaction submitted...');
      await tx.wait();
      toast.success(`Counter decremented by ${value} successfully!`);
      await loadCount();
      setInputValue('');
    } catch (error: any) {
      console.error('Error decrementing:', error);
      toast.error('Failed to decrement counter: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!provider || !account) {
    return (
      <StatusAlert variant="info">
        CONNECT WALLET TO INTERACT WITH COUNTER
      </StatusAlert>
    );
  }

  return (
    <BrutalistCounterContainer>
      <BrutalistHeader>
        <BrutalistTitle className="counter-title">🟧 BLOCKCHAIN COUNTER</BrutalistTitle>
        <BrutalistSubtitle className="counter-subtitle">
          TRANSPARENT BLOCKCHAIN OPERATIONS
        </BrutalistSubtitle>
      </BrutalistHeader>
      
      <CountDisplay>
        <CountValue>{count}</CountValue>
        <CountLabel>CURRENT COUNT</CountLabel>
      </CountDisplay>

      <ControlsSection>
        <InputRow>
          <BrutalistInput
            type="number"
            placeholder="ENTER AMOUNT..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            min="1"
            className="counter-input"
          />
          <BrutalistButton 
            variant="refresh"
            onClick={() => loadCount()}
            disabled={loading}
            className="counter-button"
          >
            🔄 REFRESH
          </BrutalistButton>
        </InputRow>

        <ButtonGrid>
          <BrutalistButton
            variant="increment"
            onClick={handleIncrement}
            disabled={loading}
            className="counter-button"
          >
            {loading ? '⏳ PROCESSING' : `⬆️ ADD ${inputValue || '1'}`}
          </BrutalistButton>
          <BrutalistButton
            variant="decrement"
            onClick={handleDecrement}
            disabled={loading}
            className="counter-button"
          >
            {loading ? '⏳ PROCESSING' : `⬇️ SUB ${inputValue || '1'}`}
          </BrutalistButton>
        </ButtonGrid>
      </ControlsSection>

      <InfoSection>
        🟧 BLOCKCHAIN COUNTER: TRANSPARENT BLOCKCHAIN OPERATIONS
      </InfoSection>
    </BrutalistCounterContainer>
  );
};

export default CounterInterface;