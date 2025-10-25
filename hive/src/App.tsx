import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading } from "@radix-ui/themes";
import { SessionKeyProvider } from "./providers/SessionKeyProvider";
import { MessagingClientProvider } from "./providers/MessagingClientProvider";
import puffinLogo from "./assets/puffin-logo.png";

import { CreateChannel } from "./components/CreateChannel";
import { ChannelList } from "./components/ChannelList";
import { Channel } from "./components/Channel";
import { useState, useEffect } from "react";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { MessagingStatus } from "./components/MessagingStatus";
import { trackEvent, AnalyticsEvents } from "./utils/analytics";
import LandingPage from "./components/LandingPage";

function AppContent() {
  const currentAccount = useCurrentAccount();
  const [prevAccount, setPrevAccount] = useState(currentAccount);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [channelId, setChannelId] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });


  // Track wallet connection changes
  useEffect(() => {
    if (currentAccount && !prevAccount) {
      trackEvent(AnalyticsEvents.WALLET_CONNECTED, {
        address: currentAccount.address,
      });
    } else if (!currentAccount && prevAccount) {
      trackEvent(AnalyticsEvents.WALLET_DISCONNECTED);
    }
    setPrevAccount(currentAccount);
  }, [currentAccount, prevAccount]);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setChannelId(isValidSuiObjectId(hash) ? hash : null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


  if (showLandingPage) {
    return <LandingPage onStartMessaging={() => setShowLandingPage(false)} />;
  }

  return (
    <>
      {currentAccount && channelId ? (
        <Channel
          channelId={channelId}
          onBack={() => {
            window.location.hash = '';
            setChannelId(null);
          }}
        />
      ) : (
        <Flex style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-primary)' }}>
          {/* Sidebar */}
          <Box style={{
            width: '300px',
            backgroundColor: 'var(--color-background-secondary)',
            borderRight: '1px solid var(--color-border-primary)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {/* Header */}
            <Flex align="center" gap="2" style={{ marginBottom: '1rem' }}>
              <img 
                src={puffinLogo} 
                alt="Puffin" 
                style={{ 
                  height: '80px', 
                  width: 'auto' 
                }} 
              />
            </Flex>

            {/* Create Channel Button */}
            <CreateChannel />

            {/* Channel List */}
            <ChannelList />

            {/* User Info */}
            <Box style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <ConnectButton />
            </Box>
          </Box>

          {/* Main Content */}
          {currentAccount ? (
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <MessagingStatus />
              </Box>
            </Box>
          ) : (
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Heading style={{ color: 'var(--color-text-primary)' }}>Please connect your wallet</Heading>
              </Box>
            </Box>
          )}
        </Flex>
      )}

    </>
  );
}

function App() {
  return (
    <SessionKeyProvider>
      <MessagingClientProvider>
        <AppContent />
      </MessagingClientProvider>
    </SessionKeyProvider>
  );
}

export default App;
