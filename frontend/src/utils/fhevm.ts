import { ethers } from 'ethers';
import { FhevmClient, createFhevmClient } from '../fhevm/internal/fhevm';

// Re-export the improved FhevmClient as FHEVMClient for compatibility
export class FHEVMClient extends FhevmClient {}

// Re-export createFhevmClient as createFHEVMClient for compatibility
export const createFHEVMClient = createFhevmClient;