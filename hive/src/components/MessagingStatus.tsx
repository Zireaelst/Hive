import { useMessaging } from '../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Card, Text, Flex, Button } from '@radix-ui/themes';
import { useSessionKey } from '../providers/SessionKeyProvider';

export function MessagingStatus() {
  const currentAccount = useCurrentAccount();
  const { sessionKey, isInitializing, error, isReady } = useMessaging();
  const { initializeManually } = useSessionKey();

  return (
    <Card 
      style={{
        backgroundColor: 'var(--color-card-background)',
        border: '1px solid var(--color-card-border)',
        padding: '1.5rem',
        maxWidth: '400px'
      }}
    >
      <Flex direction="column" gap="3" align="center">
        <Text size="4" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
          {isReady ? 'Ready to use' : 'Setup Required'}
        </Text>

        {currentAccount && !sessionKey && !isInitializing && (
          <Button
            onClick={initializeManually}
            variant="solid"
            size="3"
            style={{
              backgroundColor: 'var(--color-button-primary)',
              color: 'var(--color-button-text)',
              width: '100%'
            }}
          >
            Sign Session Key
          </Button>
        )}

        {isReady && (
          <Text size="2" style={{ color: 'var(--color-success)', textAlign: 'center' }}>
            ✓ Messaging client is ready!
          </Text>
        )}

        {error && (
          <Text size="2" style={{ color: 'var(--color-error)', textAlign: 'center' }}>
            Error: {error.message}
          </Text>
        )}
      </Flex>
    </Card>
  );
}