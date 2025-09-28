import { Card, Flex, Text, Box, Separator, Badge, Button, Tabs } from '@radix-ui/themes';
import { useMessaging } from '../hooks/useMessaging';
import { useEffect, useState } from 'react';
import { formatTimestamp, formatAddress } from '../utils/formatters';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';
import { ChannelType, ChannelMetadata } from '../types/channel';

interface DAOInvite {
  id: string;
  channelId: string;
  channelName: string;
  inviterAddress: string;
  invitedAddress: string;
  message: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export function ChannelList() {
  const { channels, isFetchingChannels, fetchChannels, isReady, getChannelMetadata } = useMessaging();
  const [channelMetadataMap, setChannelMetadataMap] = useState<Map<string, ChannelMetadata>>(new Map());
  const [daoInvites, setDaoInvites] = useState<DAOInvite[]>([]);

  useEffect(() => {
    console.log('Channels updated:', channels);
    
    // Load metadata for all channels
    const metadataMap = new Map<string, ChannelMetadata>();
    channels.forEach(channel => {
      const metadata = getChannelMetadata(channel.id.id);
      if (metadata) {
        metadataMap.set(channel.id.id, metadata);
      }
    });
    setChannelMetadataMap(metadataMap);
  }, [channels, getChannelMetadata]);

  useEffect(() => {
    // Load DAO invites from localStorage
    const loadDAOInvites = () => {
      try {
        const stored = localStorage.getItem('dao_invites');
        if (stored) {
          const invites = JSON.parse(stored);
          setDaoInvites(invites);
        }
      } catch (error) {
        console.error('Error loading DAO invites:', error);
      }
    };

    loadDAOInvites();
  }, []);

  const getChannelTypeBadge = (channelId: string) => {
    const metadata = channelMetadataMap.get(channelId);
    if (!metadata) {
      return { type: 'Standard', color: 'blue' as const };
    }

    switch (metadata.type) {
      case ChannelType.DAO_ASSEMBLY:
        return { type: 'DAO Assembly', color: 'purple' as const };
      case ChannelType.TOKEN_GATED:
        return { type: 'Token-Gated', color: 'green' as const };
      case ChannelType.SUBSCRIPTION:
        return { type: 'Subscription', color: 'orange' as const };
      default:
        return { type: 'Private Chat', color: 'blue' as const };
    }
  };

  const getChannelName = (channelId: string) => {
    const metadata = channelMetadataMap.get(channelId);
    return metadata?.name || 'Unnamed Channel';
  };

  const handleAcceptInvite = (inviteId: string) => {
    setDaoInvites(prev => prev.map(invite => 
      invite.id === inviteId ? { ...invite, status: 'accepted' } : invite
    ));
    
    // Save to localStorage
    const updatedInvites = daoInvites.map(invite => 
      invite.id === inviteId ? { ...invite, status: 'accepted' } : invite
    );
    localStorage.setItem('dao_invites', JSON.stringify(updatedInvites));
  };

  const handleDeclineInvite = (inviteId: string) => {
    setDaoInvites(prev => prev.map(invite => 
      invite.id === inviteId ? { ...invite, status: 'declined' } : invite
    ));
    
    // Save to localStorage
    const updatedInvites = daoInvites.map(invite => 
      invite.id === inviteId ? { ...invite, status: 'declined' } : invite
    );
    localStorage.setItem('dao_invites', JSON.stringify(updatedInvites));
  };

  const pendingInvites = daoInvites.filter(invite => invite.status === 'pending');

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

        <Tabs.Root defaultValue="channels" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs.List>
            <Tabs.Trigger value="channels">
              Channels ({channels.length})
            </Tabs.Trigger>
            {pendingInvites.length > 0 && (
              <Tabs.Trigger value="invites">
                DAO Invites ({pendingInvites.length})
              </Tabs.Trigger>
            )}
          </Tabs.List>

          <Tabs.Content value="channels" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

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
                  }).map((channel) => {
                    const typeBadge = getChannelTypeBadge(channel.id.id);
                    const channelName = getChannelName(channel.id.id);
                    return (
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
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-border-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-background-tertiary)';
                      }}
                    >
                      <Flex direction="column" gap="1">
                        <Flex justify="between" align="start" style={{ width: '100%' }}>
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                              {channelName}
                            </Text>
                            <Text size="1" style={{ display: 'block', color: 'var(--color-text-muted)' }}>
                              {channel.id.id.slice(0, 16)}...{channel.id.id.slice(-4)}
                            </Text>
                          </Box>
                          <Flex gap="1" align="center" style={{ flexShrink: 0 }}>
                            <Badge 
                              size="1"
                              color={typeBadge.color}
                            >
                              {typeBadge.type}
                            </Badge>
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
                    );
                  })}
                </Flex>
              </Box>
            )}
          </Tabs.Content>

          <Tabs.Content value="invites" style={{ flex: 1, overflowY: 'auto' }}>
            <Flex direction="column" gap="3">
              <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                DAO Assembly Invitations
              </Text>
              
              {pendingInvites.length === 0 ? (
                <Box py="4">
                  <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                    No pending DAO invitations.
                  </Text>
                </Box>
              ) : (
                <Flex direction="column" gap="2">
                  {pendingInvites.map((invite) => (
                    <Box
                      key={invite.id}
                      p="3"
                      style={{
                        backgroundColor: 'var(--color-background-secondary)',
                        borderRadius: 'var(--radius-2)',
                        border: '1px solid var(--color-border-primary)',
                      }}
                    >
                      <Flex direction="column" gap="2">
                        <Flex justify="between" align="start">
                          <Box>
                            <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                              {invite.channelName}
                            </Text>
                            <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                              Invited by: {formatAddress(invite.inviterAddress)}
                            </Text>
                          </Box>
                          <Badge color="purple" size="1">
                            DAO Assembly
                          </Badge>
                        </Flex>
                        
                        <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                          {invite.message}
                        </Text>
                        
                        <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                          {formatTimestamp(invite.timestamp)}
                        </Text>
                        
                        <Flex gap="2" style={{ marginTop: '8px' }}>
                          <Button
                            size="2"
                            onClick={() => {
                              handleAcceptInvite(invite.id);
                              window.location.hash = invite.channelId;
                            }}
                            style={{
                              backgroundColor: 'var(--color-success)',
                              color: 'white'
                            }}
                          >
                            Accept Invitation
                          </Button>
                          <Button
                            size="2"
                            variant="soft"
                            onClick={() => handleDeclineInvite(invite.id)}
                            style={{
                              backgroundColor: 'var(--color-button-secondary)',
                              color: 'var(--color-text-primary)'
                            }}
                          >
                            Decline
                          </Button>
                        </Flex>
                      </Flex>
                    </Box>
                  ))}
                </Flex>
              )}
            </Flex>
          </Tabs.Content>
        </Tabs.Root>

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