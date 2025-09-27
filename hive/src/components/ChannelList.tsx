import { Card, Flex, Text, Box, Separator, Badge, Button } from '@radix-ui/themes';
import { useMessaging } from '../hooks/useMessaging';
import { useEffect } from 'react';
import { formatTimestamp } from '../utils/formatters';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

export function ChannelList() {
  const { channels, isFetchingChannels, fetchChannels, isReady } = useMessaging();

  useEffect(() => {
    console.log('Channels updated:', channels);
  }, [channels]);

  return (
    <Card style={{
      backgroundColor: 'var(--color-card-background)',
      border: '1px solid var(--color-card-border)',
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Flex direction="column" gap="3" style={{ flex: 1 }}>
        <Flex justify="between" align="center">
          <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
            Your Channels
          </Text>
          <Button
            size="1"
            variant="solid"
            onClick={() => {
              trackEvent(AnalyticsEvents.CHANNEL_LIST_REFRESHED);
              fetchChannels();
            }}
            disabled={isFetchingChannels || !isReady}
            style={{
              backgroundColor: 'var(--color-button-secondary)',
              color: 'var(--color-text-primary)'
            }}
          >
            {isFetchingChannels ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Flex>

        <Separator size="4" />

        {!isReady ? (
          <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
            Waiting for messaging client to initialize...
          </Text>
        ) : isFetchingChannels && channels.length === 0 ? (
          <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
            Loading channels...
          </Text>
        ) : channels.length === 0 ? (
          <Box py="4">
            <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
              No channels yet. Create one above to start messaging!
            </Text>
          </Box>
        ) : (
          <Box style={{ flex: 1, overflowY: 'auto' }}>
            <Flex direction="column" gap="2">
              {channels.sort((a, b) => {
                const aTime = a.last_message ? Number(a.last_message.createdAtMs) : Number(a.created_at_ms);
                const bTime = b.last_message ? Number(b.last_message.createdAtMs) : Number(b.created_at_ms);
                return bTime - aTime;
              }).map((channel) => (
                <Box
                  key={channel.id.id}
                  p="2"
                  onClick={() => {
                    window.location.hash = channel.id.id;
                  }}
                  style={{
                    backgroundColor: 'var(--color-background-tertiary)',
                    borderRadius: 'var(--radius-2)',
                    border: '1px solid var(--color-border-primary)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-border-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background-tertiary)';
                  }}
                >
                  <Flex direction="column" gap="1">
                    <Flex justify="between" align="start">
                      <Box>
                        <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                          Channel ID
                        </Text>
                        <Text size="1" style={{ display: 'block', color: 'var(--color-text-muted)' }}>
                          {channel.id.id.slice(0, 16)}...{channel.id.id.slice(-4)}
                        </Text>
                      </Box>
                      <Badge 
                        size="1"
                        style={{
                          backgroundColor: 'var(--color-success)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Active
                      </Badge>
                    </Flex>

                    <Flex gap="3">
                      <Box>
                        <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                          Messages
                        </Text>
                        <Text size="2" weight="medium" style={{ display: 'block', color: 'var(--color-text-primary)' }}>
                          {channel.messages_count}
                        </Text>
                      </Box>

                      <Box>
                        <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                          Members
                        </Text>
                        <Text size="2" weight="medium" style={{ display: 'block', color: 'var(--color-text-primary)' }}>
                          {channel.auth.member_permissions.contents.length}
                        </Text>
                      </Box>

                      <Box>
                        <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                          Created
                        </Text>
                        <Text size="2" weight="medium" style={{ display: 'block', color: 'var(--color-text-primary)' }}>
                          {formatTimestamp(channel.created_at_ms)}
                        </Text>
                      </Box>
                    </Flex>

                  </Flex>
                </Box>
              ))}
            </Flex>
          </Box>
        )}

        {channels.length > 0 && (
          <>
            <Separator size="4" />
            <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
              Auto-refreshes every 10 seconds • {channels.length} channel{channels.length !== 1 ? 's' : ''}
            </Text>
          </>
        )}
      </Flex>
    </Card>
  );
}