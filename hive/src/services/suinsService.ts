import { SuinsClient } from '@mysten/suins';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

class SuinsService {
  private suinsClient: SuinsClient;
  private addressToNameCache: Map<string, string> = new Map();
  private nameToAddressCache: Map<string, string> = new Map();

  constructor() {
    const suiClient = new SuiClient({
      url: getFullnodeUrl('testnet'),
    });

    this.suinsClient = new SuinsClient({
      client: suiClient,
      network: 'testnet',
    });
  }

  async getAddressName(address: string): Promise<string | null> {
    // Check cache first
    if (this.addressToNameCache.has(address)) {
      return this.addressToNameCache.get(address) || null;
    }

    try {
      // For now, we'll use a placeholder implementation
      // The SuiNS SDK doesn't provide a direct method to get names by address
      // In a production environment, you would need to:
      // 1. Query the SuiNS registry contract directly
      // 2. Use event filtering to find names that point to this address
      // 3. Or maintain your own index of address-to-name mappings
      
      // This is a simplified approach that returns null for now
      // You can implement the actual registry querying logic here
      
      return null;
    } catch (error) {
      console.warn('Failed to resolve SuiNS name for address:', address, error);
      return null;
    }
  }

  async getAddressFromName(name: string): Promise<string | null> {
    // Check cache first
    if (this.nameToAddressCache.has(name)) {
      return this.nameToAddressCache.get(name) || null;
    }

    try {
      const nameRecord = await this.suinsClient.getNameRecord(name);
      
      if (nameRecord && nameRecord.targetAddress) {
        // Cache the result
        this.nameToAddressCache.set(name, nameRecord.targetAddress);
        this.addressToNameCache.set(nameRecord.targetAddress, name);
        return nameRecord.targetAddress;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to resolve address for SuiNS name:', name, error);
      return null;
    }
  }

  // Format address display - show SuiNS name if available, otherwise show formatted address
  async formatAddressDisplay(address: string): Promise<string> {
    const name = await this.getAddressName(address);
    return name || this.formatAddress(address);
  }

  // Simple address formatter (fallback)
  private formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Check if a string is a SuiNS name (ends with .sui)
  isSuiNSName(input: string): boolean {
    return input.endsWith('.sui') && input.length > 4;
  }

  // Check if a string is a valid Sui address
  isSuiAddress(input: string): boolean {
    return input.startsWith('0x') && input.length === 66;
  }

  // Resolve input to address (handles both addresses and SuiNS names)
  async resolveToAddress(input: string): Promise<string | null> {
    if (this.isSuiAddress(input)) {
      return input;
    }
    
    if (this.isSuiNSName(input)) {
      return await this.getAddressFromName(input);
    }
    
    return null;
  }

  // Clear cache (useful for testing or when names change)
  clearCache(): void {
    this.addressToNameCache.clear();
    this.nameToAddressCache.clear();
  }
}

export const suinsService = new SuinsService();
