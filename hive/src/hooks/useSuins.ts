import { useSuinsClient } from '../providers/SuinsClientProvider';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useState, useCallback, useEffect } from 'react';

export interface NameRecord {
  name: string;
  nftId: string;
  targetAddress: string;
  expirationTimestampMs: string;
  data?: {
    avatar?: string;
    contentHash?: string;
    walrusSiteId?: string;
  };
}

export const useSuins = () => {
  const suinsClient = useSuinsClient();
  const currentAccount = useCurrentAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query name record by name
  const getNameRecord = useCallback(async (name: string): Promise<NameRecord | null> => {
    if (!suinsClient) {
      setError('SuiNS client not available');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const nameRecord = await suinsClient.getNameRecord(name);
      return nameRecord;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get name record';
      setError(errorMsg);
      console.error('Error getting name record:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [suinsClient]);

  // Get all names for an address (reverse lookup)
  const getNamesForAddress = useCallback(async (address: string): Promise<NameRecord[]> => {
    if (!suinsClient) {
      setError('SuiNS client not available');
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Note: This would typically use the indexer API
      // For now, we'll return an empty array as the SDK doesn't have this method
      // In a real implementation, you'd call the SuiNS indexer API
      console.log('Getting names for address:', address);
      return [];
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get names for address';
      setError(errorMsg);
      console.error('Error getting names for address:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [suinsClient]);

  return {
    client: suinsClient,
    isLoading,
    error,
    isReady: !!suinsClient,
    
    // Query functions
    getNameRecord,
    getNamesForAddress,
  };
};

// Hook to get the primary name for the current user
export const useUserSuinsName = () => {
  const { getNameRecord, isLoading, error } = useSuins();
  const currentAccount = useCurrentAccount();
  const [userName, setUserName] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkUserSuinsName = async () => {
      if (!currentAccount?.address) {
        setUserName(null);
        return;
      }

      setIsChecking(true);
      
      try {
        // For now, we'll use a simple approach
        // In a real implementation, you'd query the indexer to get all names for the address
        // and then find the primary/default name
        
        // This is a placeholder - in reality you'd call the indexer API
        // to get all names associated with the address
        console.log('Checking SuiNS name for address:', currentAccount.address);
        
        // For demo purposes, we'll just return null
        // In production, you'd implement the actual lookup
        setUserName(null);
      } catch (err) {
        console.error('Error checking user SuiNS name:', err);
        setUserName(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkUserSuinsName();
  }, [currentAccount?.address]);

  return {
    userName,
    isChecking: isChecking || isLoading,
    error,
  };
};
