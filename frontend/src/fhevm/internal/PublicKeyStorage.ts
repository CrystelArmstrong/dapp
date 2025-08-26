import { PublicKeyInfo } from './fhevmTypes';

const PUBLIC_KEY_STORAGE_KEY = 'fhevm_public_keys';
const PUBLIC_KEY_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class PublicKeyStorage {
  private static instance: PublicKeyStorage | null = null;
  private cache: Map<number, PublicKeyInfo> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): PublicKeyStorage {
    if (!PublicKeyStorage.instance) {
      PublicKeyStorage.instance = new PublicKeyStorage();
    }
    return PublicKeyStorage.instance;
  }

  public getPublicKey(chainId: number): PublicKeyInfo | null {
    const info = this.cache.get(chainId);
    if (!info) {
      return null;
    }

    // Check if the key has expired
    const now = Date.now();
    if (now - info.timestamp > PUBLIC_KEY_TTL) {
      this.cache.delete(chainId);
      this.saveToStorage();
      return null;
    }

    return info;
  }

  public setPublicKey(chainId: number, publicKey: string): void {
    const info: PublicKeyInfo = {
      key: publicKey,
      timestamp: Date.now(),
      chainId
    };
    
    this.cache.set(chainId, info);
    this.saveToStorage();
    
    console.log(`✅ Cached public key for chain ${chainId}:`, {
      keyPreview: publicKey.substring(0, 20) + '...',
      timestamp: new Date(info.timestamp).toISOString()
    });
  }

  public clearPublicKey(chainId: number): void {
    if (this.cache.has(chainId)) {
      this.cache.delete(chainId);
      this.saveToStorage();
      console.log(`🗑️ Cleared cached public key for chain ${chainId}`);
    }
  }

  public clearAllPublicKeys(): void {
    this.cache.clear();
    this.saveToStorage();
    console.log('🗑️ Cleared all cached public keys');
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Array<[number, PublicKeyInfo]>;
        this.cache = new Map(data);
        console.log('📥 Loaded public key cache from localStorage');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load public key cache:', error);
      this.cache = new Map();
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Failed to save public key cache:', error);
    }
  }

  // Clean up expired keys
  public cleanupExpiredKeys(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [chainId, info] of this.cache.entries()) {
      if (now - info.timestamp > PUBLIC_KEY_TTL) {
        this.cache.delete(chainId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.saveToStorage();
      console.log(`🧹 Cleaned up ${cleanedCount} expired public keys`);
    }
  }
}