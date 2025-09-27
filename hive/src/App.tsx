import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { SessionKeyProvider } from "./providers/SessionKeyProvider";
import { MessagingClientProvider } from "./providers/MessagingClientProvider";
import hivelogo from "./assets/hivelogo.png";

import { CreateChannel } from "./components/CreateChannel";
import { ChannelList } from "./components/ChannelList";
import { Channel } from "./components/Channel";
import { FeedbackCard } from "./components/FeedbackCard";
import { FeedbackBubble } from "./components/FeedbackBubble";
import { useState, useEffect } from "react";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { MessagingStatus } from "./components/MessagingStatus";
import { trackEvent, AnalyticsEvents } from "./utils/analytics";
import { useFeedback } from "./hooks/useFeedback";
import { FeedbackService } from "./services/feedbackService";

function AppContent() {
  const currentAccount = useCurrentAccount();
  const [prevAccount, setPrevAccount] = useState(currentAccount);
  const [channelId, setChannelId] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });

  const {
    isOpen: isFeedbackOpen,
    isSending: isFeedbackSending,
    error: feedbackError,
    showBubble,
    shouldShowPrompt,
    openFeedback,
    closeFeedback,
    submitFeedback,
    handleOptOut,
    trackInteraction,
  } = useFeedback();

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

  // Show feedback prompt automatically when threshold is reached
  useEffect(() => {
    if (shouldShowPrompt && !isFeedbackOpen && currentAccount) {
      openFeedback();
      // Mark the card as shown so it won't auto-popup again
      FeedbackService.markCardShown();
    }
  }, [shouldShowPrompt, isFeedbackOpen, currentAccount, openFeedback]);

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        align="center"
        style={{
          backgroundColor: 'var(--color-background-secondary)',
          borderBottom: "1px solid var(--color-border-primary)",
        }}
      >
        <Flex align="center" gap="2">
          <img 
            src={hivelogo} 
            alt="Hive" 
            style={{ 
              height: '80px', 
              width: 'auto' 
            }} 
          />
        </Flex>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
        >
          {currentAccount ? (
            channelId ? (
              <Channel
                channelId={channelId}
                onBack={() => {
                  window.location.hash = '';
                  setChannelId(null);
                }}
                onInteraction={trackInteraction}
              />
            ) : (
              <Flex direction="column" gap="4">
                <MessagingStatus />
                <CreateChannel onInteraction={trackInteraction} />
                <ChannelList />
              </Flex>
            )
          ) : (
            <Heading style={{ color: 'var(--color-text-primary)' }}>Please connect your wallet</Heading>
          )}
        </Container>
      </Container>

      {/* Feedback Components */}
      {isFeedbackOpen && currentAccount && (
        <FeedbackCard
          onSubmit={submitFeedback}
          onClose={closeFeedback}
          onOptOut={handleOptOut}
          isSubmitting={isFeedbackSending}
          error={feedbackError}
        />
      )}

      {showBubble && !isFeedbackOpen && currentAccount && (
        <FeedbackBubble
          onClick={openFeedback}
          isVisible={true}
        />
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
