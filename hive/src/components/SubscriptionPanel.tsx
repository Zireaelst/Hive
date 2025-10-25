import { useState, useEffect } from 'react';
import { Card, Flex, Text, Button, Badge, Dialog, Tabs } from '@radix-ui/themes';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { formatTimestamp, formatAddress } from '../utils/formatters';
import { ChannelMetadata } from '../types/channel';
import { useMessaging } from '../hooks/useMessaging';

interface SubscriptionPanelProps {
  channelId: string;
  channelName?: string;
  channelMetadata: ChannelMetadata | null;
}

interface Subscription {
  id: string;
  channelId: string;
  subscriberAddress: string;
  startDate: number;
  endDate: number;
  amount: string;
  period: 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled';
}

export function SubscriptionPanel({ channelId, channelName, channelMetadata }: SubscriptionPanelProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { sendMessage } = useMessaging();
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, [channelId]);

  const loadSubscriptions = () => {
    try {
      const stored = localStorage.getItem(`subscriptions_${channelId}`);
      if (stored) {
        const subs = JSON.parse(stored);
        setSubscriptions(subs);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!currentAccount || !channelMetadata) return;

    setIsSubscribing(true);
    setSubscriptionError(null);
    setSubscriptionSuccess(null);

    try {
      const price = parseFloat(channelMetadata.subscriptionPrice || '0');
      const period = channelMetadata.subscriptionPeriod || 'monthly';
      
      if (price <= 0) {
        setSubscriptionError('Invalid subscription price');
        return;
      }

      // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
      const amountInMist = Math.floor(price * 1_000_000_000);

      // Create transaction
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
      tx.transferObjects([coin], channelMetadata.creatorAddress);

      // Execute transaction
      const { digest } = await signAndExecute({ transaction: tx });

      // Create subscription record
      const now = Date.now();
      const endDate = period === 'monthly' 
        ? now + (30 * 24 * 60 * 60 * 1000) // 30 days
        : now + (365 * 24 * 60 * 60 * 1000); // 365 days

      const newSubscription: Subscription = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        channelId,
        subscriberAddress: currentAccount.address,
        startDate: now,
        endDate,
        amount: channelMetadata.subscriptionPrice || '0',
        period,
        status: 'active'
      };

      // Save subscription
      const updatedSubscriptions = [...subscriptions, newSubscription];
      setSubscriptions(updatedSubscriptions);
      localStorage.setItem(`subscriptions_${channelId}`, JSON.stringify(updatedSubscriptions));

      // Send subscription message
      const subscriptionMessage = `💳 **Subscription Payment**\n\n${formatAddress(currentAccount.address)} has subscribed to ${channelName || 'this channel'} for ${period} at ${price} SUI.\n\nTransaction: ${digest}`;
      await sendMessage(channelId, subscriptionMessage);

      setSubscriptionSuccess(`Successfully subscribed to ${channelName || 'this channel'}!`);
      setShowSubscribe(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSubscriptionSuccess(null), 5000);

    } catch (error) {
      console.error('Subscription error:', error);
      setSubscriptionError(`Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const getSubscriptionStatus = (subscription: Subscription) => {
    const now = Date.now();
    if (subscription.status === 'cancelled') return 'cancelled';
    if (now > subscription.endDate) return 'expired';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'expired': return 'red';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  const currentSubscription = subscriptions.find(sub => 
    sub.subscriberAddress === currentAccount?.address && 
    getSubscriptionStatus(sub) === 'active'
  );

  if (isLoading) {
    return (
      <Card style={{ padding: '1rem' }}>
        <Text>Loading subscription information...</Text>
      </Card>
    );
  }

  return (
    <Card style={{ padding: '1rem' }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Text size="4" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
            Subscription Channel - {channelName || 'Channel'}
          </Text>
          {!currentSubscription && (
            <Button
              size="2"
              onClick={() => setShowSubscribe(true)}
              disabled={!currentAccount}
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-text)'
              }}
            >
              Subscribe
            </Button>
          )}
        </Flex>

        {subscriptionError && (
          <Text size="2" style={{ color: 'var(--color-error)' }}>
            {subscriptionError}
          </Text>
        )}

        {subscriptionSuccess && (
          <Text size="2" style={{ color: 'var(--color-success)' }}>
            {subscriptionSuccess}
          </Text>
        )}

        <Tabs.Root defaultValue="info" style={{ marginTop: '1rem' }}>
          <Tabs.List>
            <Tabs.Trigger value="info">Subscription Info</Tabs.Trigger>
            <Tabs.Trigger value="history">My Subscriptions</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="info">
            <Flex direction="column" gap="3">
              <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                <Flex direction="column" gap="2">
                  <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                    💳 Subscription Details
                  </Text>
                  
                  {channelMetadata && (
                    <>
                      <Flex justify="between" align="center">
                        <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                          Price:
                        </Text>
                        <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                          {channelMetadata.subscriptionPrice} SUI
                        </Text>
                      </Flex>
                      
                      <Flex justify="between" align="center">
                        <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                          Period:
                        </Text>
                        <Badge color="blue" size="1">
                          {channelMetadata.subscriptionPeriod?.toUpperCase()}
                        </Badge>
                      </Flex>
                      
                      <Flex justify="between" align="center">
                        <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                          Creator:
                        </Text>
                        <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                          {formatAddress(channelMetadata.creatorAddress)}
                        </Text>
                      </Flex>
                    </>
                  )}
                </Flex>
              </Card>

              {currentSubscription ? (
                <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                  <Flex direction="column" gap="2">
                    <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                      ✅ Your Active Subscription
                    </Text>
                    
                    <Flex justify="between" align="center">
                      <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                        Status:
                      </Text>
                      <Badge color="green" size="1">
                        ACTIVE
                      </Badge>
                    </Flex>
                    
                    <Flex justify="between" align="center">
                      <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                        Expires:
                      </Text>
                      <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                        {formatTimestamp(currentSubscription.endDate)}
                      </Text>
                    </Flex>
                    
                    <Flex justify="between" align="center">
                      <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                        Amount:
                      </Text>
                      <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                        {currentSubscription.amount} SUI
                      </Text>
                    </Flex>
                  </Flex>
                </Card>
              ) : (
                <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                  <Flex direction="column" gap="2">
                    <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                      🔒 Subscription Required
                    </Text>
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      You need an active subscription to access this channel's content.
                    </Text>
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      Click "Subscribe" to gain access.
                    </Text>
                  </Flex>
                </Card>
              )}
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="history">
            <Flex direction="column" gap="3">
              <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                My Subscription History
              </Text>
              
              {subscriptions.length === 0 ? (
                <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                  No subscriptions found.
                </Text>
              ) : (
                <Flex direction="column" gap="2">
                  {subscriptions
                    .filter(sub => sub.subscriberAddress === currentAccount?.address)
                    .sort((a, b) => b.startDate - a.startDate)
                    .map((subscription) => {
                      const status = getSubscriptionStatus(subscription);
                      return (
                        <Card key={subscription.id} style={{ padding: '1rem' }}>
                          <Flex direction="column" gap="2">
                            <Flex justify="between" align="center">
                              <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                                {subscription.amount} SUI - {subscription.period}
                              </Text>
                              <Badge color={getStatusColor(status)} size="1">
                                {status.toUpperCase()}
                              </Badge>
                            </Flex>
                            
                            <Flex justify="between" align="center">
                              <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                                Started: {formatTimestamp(subscription.startDate)}
                              </Text>
                              <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                                Expires: {formatTimestamp(subscription.endDate)}
                              </Text>
                            </Flex>
                          </Flex>
                        </Card>
                      );
                    })}
                </Flex>
              )}
            </Flex>
          </Tabs.Content>
        </Tabs.Root>
      </Flex>

      {/* Subscribe Dialog */}
      <Dialog.Root open={showSubscribe} onOpenChange={setShowSubscribe}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Subscribe to Channel</Dialog.Title>
          <Dialog.Description>
            Subscribe to {channelName || 'this channel'} to access premium content.
          </Dialog.Description>

          <Flex direction="column" gap="3" style={{ marginTop: '1rem' }}>
            {channelMetadata && (
              <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      Subscription Price:
                    </Text>
                    <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                      {channelMetadata.subscriptionPrice} SUI
                    </Text>
                  </Flex>
                  
                  <Flex justify="between" align="center">
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      Billing Period:
                    </Text>
                    <Badge color="blue" size="1">
                      {channelMetadata.subscriptionPeriod?.toUpperCase()}
                    </Badge>
                  </Flex>
                </Flex>
              </Card>
            )}

            <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
              By subscribing, you will gain access to this channel's premium content for the selected period.
            </Text>
          </Flex>

          <Flex gap="3" justify="end" style={{ marginTop: '1rem' }}>
            <Dialog.Close>
              <Button 
                variant="soft" 
                color="gray"
                disabled={isSubscribing}
                style={{
                  backgroundColor: 'var(--color-button-secondary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleSubscribe}
              disabled={!currentAccount || isSubscribing}
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-text)'
              }}
            >
              {isSubscribing ? 'Processing...' : 'Subscribe'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}
