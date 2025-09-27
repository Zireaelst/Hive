import { createContext, ReactNode, useMemo, useContext } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { SuinsClient } from '@mysten/suins';

const SuinsClientContext = createContext<SuinsClient | null>(null);

export const useSuinsClient = (): SuinsClient | null => {
  const ctx = useContext(SuinsClientContext);
  if (ctx === undefined) {
    throw new Error('useSuinsClient must be used within a SuinsClientProvider');
  }
  return ctx;
};

export const SuinsClientProvider = ({
  children,
}: {
  children: ReactNode | ReactNode[];
}) => {
  const suiClient = useSuiClient();

  const suinsClient = useMemo(() => {
    if (!suiClient) return null;

    try {
      // Create SuiNS client for testnet
      const suinsClient = new SuinsClient({
        client: suiClient,
        network: 'testnet',
      });

      return suinsClient;
    } catch (error) {
      console.error('Failed to create SuiNS client:', error);
      return null;
    }
  }, [suiClient]);

  return (
    <SuinsClientContext.Provider value={suinsClient}>
      {children}
    </SuinsClientContext.Provider>
  );
};
