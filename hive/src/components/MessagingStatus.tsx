import { useMessaging } from '../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Box, Card, Text, Badge, Flex, Separator, Button } from '@radix-ui/themes';
import { useSessionKey } from '../providers/SessionKeyProvider';

export function MessagingStatus() {
  const currentAccount = useCurrentAccount();
  const { client, sessionKey, isInitializing, error, isReady } = useMessaging();
  const { initializeManually } = useSessionKey();

  return (
    <Card 
      mb="4"
      style={{
        backgroundColor: 'var(--color-card-background)',
        border: '1px solid var(--color-card-border)'
      }}
    >
      <Flex direction="column" gap="3">
        <Box>
          <Text size="5" weight="bold" style={{ color: 'var(--color-text-primary)' }}>Messaging SDK Status</Text>
        </Box>

        <Separator size="4" />

        <Flex direction="column" gap="2">
          <Flex justify="between">
            <Text style={{ color: 'var(--color-text-primary)' }}>Current Account:</Text>
            <Badge 
              style={{
                backgroundColor: currentAccount ? 'var(--color-success)' : 'var(--color-text-muted)',
                color: 'var(--color-text-primary)'
              }}
            >
              {currentAccount?.address ?
                `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}` :
                'Not connected'}
            </Badge>
          </Flex>

          <Flex justify="between">
            <Text style={{ color: 'var(--color-text-primary)' }}>Session Key:</Text>
            <Badge 
              style={{
                backgroundColor: sessionKey ? 'var(--color-success)' : isInitializing ? 'var(--color-warning)' : 'var(--color-text-muted)',
                color: 'var(--color-text-primary)'
              }}
            >
              {isInitializing ? 'Initializing...' : sessionKey ? 'Active' : 'Not initialized'}
            </Badge>
          </Flex>

          <Flex justify="between">
            <Text style={{ color: 'var(--color-text-primary)' }}>Messaging Client:</Text>
            <Badge 
              style={{
                backgroundColor: client ? 'var(--color-success)' : 'var(--color-text-muted)',
                color: 'var(--color-text-primary)'
              }}
            >
              {client ? 'Ready' : 'Not initialized'}
            </Badge>
          </Flex>

          <Flex justify="between">
            <Text style={{ color: 'var(--color-text-primary)' }}>Overall Status:</Text>
            <Badge 
              style={{
                backgroundColor: isReady ? 'var(--color-success)' : isInitializing ? 'var(--color-warning)' : 'var(--color-error)',
                color: 'var(--color-text-primary)'
              }}
            >
              {isReady ? 'Ready to use' : isInitializing ? 'Setting up...' : 'Not ready'}
            </Badge>
          </Flex>
        </Flex>

        {error && (
          <>
            <Separator size="4" />
            <Box>
              <Text size="2" style={{ color: 'var(--color-error)' }}>Error: {error.message}</Text>
            </Box>
          </>
        )}

        {currentAccount && !sessionKey && !isInitializing && (
          <>
            <Separator size="4" />
            <Box>
              <Flex direction="column" gap="2">
                <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                  The SDK uses Seal for encrypting messages and attachments. The Seal SDK requires a session key,
                  which contains a signature from your account and allows the app to retrieve Seal decryption keys
                  for a limited time (30 minutes) without requiring repeated confirmations for each message.
                </Text>
                <Button
                  onClick={initializeManually}
                  variant="solid"
                  size="2"
                  style={{
                    backgroundColor: 'var(--color-button-primary)',
                    color: 'var(--color-button-text)'
                  }}
                >
                  Sign Session Key
                </Button>
              </Flex>
            </Box>
          </>
        )}

        {isReady && (
          <>
            <Separator size="4" />
            <Box>
              <Text size="3" style={{ color: 'var(--color-success)' }}>
                ✓ Messaging client is ready! You can now use it to send and receive messages.
              </Text>
            </Box>
          </>
        )}
      </Flex>
    </Card>
  );
}