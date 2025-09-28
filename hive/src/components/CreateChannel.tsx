import { useState } from 'react';
import { Card, Flex, Text, TextField, Button, Select, Badge } from '@radix-ui/themes';
import { useMessaging } from '../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { trackEvent, trackError, AnalyticsEvents } from '../utils/analytics';
import { suinsService } from '../services/suinsService';
import { ChannelType } from '../types/channel';

interface CreateChannelProps {}

export function CreateChannel({}: CreateChannelProps) {
  const { createChannel, isCreatingChannel, channelError, isReady } = useMessaging();
  const currentAccount = useCurrentAccount();
  
  // Form state
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelType, setChannelType] = useState<ChannelType>(ChannelType.STANDARD);
  const [recipientAddresses, setRecipientAddresses] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  
  // Access rules state
  const [accessRules] = useState<any[]>([]);
  
  // DAO specific state
  const [daoName, setDaoName] = useState('');
  const [governanceToken, setGovernanceToken] = useState('');
  
  // Subscription specific state
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    // Validate channel name
    if (!channelName.trim()) {
      setValidationError('Please enter a channel name');
      return;
    }

    // Validate channel type specific fields
    if (channelType === ChannelType.DAO_ASSEMBLY) {
      if (!daoName.trim() || !governanceToken.trim()) {
        setValidationError('Please enter DAO name and governance token for DAO Assembly');
        return;
      }
    }

    if (channelType === ChannelType.SUBSCRIPTION) {
      if (!subscriptionPrice.trim()) {
        setValidationError('Please enter subscription price');
        return;
      }
    }

    // Parse and validate addresses (only for standard channels)
    let resolvedAddresses: string[] = [];
    if (channelType === ChannelType.STANDARD) {
      if (!recipientAddresses.trim()) {
        setValidationError('Please enter at least one recipient address for standard channels');
        return;
      }

      const addresses = recipientAddresses
        .split(',')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      if (addresses.length === 0) {
        setValidationError('Please enter at least one recipient address');
        return;
      }

      // Check for duplicate addresses in the input
      const uniqueAddresses = [...new Set(addresses)];
      if (uniqueAddresses.length !== addresses.length) {
        setValidationError('Duplicate addresses detected. Please enter each address only once.');
        return;
      }

      // Check if user is trying to add their own address
      if (currentAccount && addresses.some(addr => addr.toLowerCase() === currentAccount.address.toLowerCase())) {
        setValidationError('You cannot add your own connected wallet address. You will be automatically included in the channel.');
        return;
      }

      // Resolve SuiNS names to addresses and validate
      setIsResolving(true);
      
      for (const addr of addresses) {
        try {
          const resolved = await suinsService.resolveToAddress(addr);
          if (resolved && isValidSuiAddress(resolved)) {
            resolvedAddresses.push(resolved);
          } else {
            setValidationError(`Invalid address or SuiNS name: ${addr}`);
            setIsResolving(false);
            return;
          }
        } catch (error) {
          setValidationError(`Failed to resolve: ${addr}`);
          setIsResolving(false);
          return;
        }
      }
      
      setIsResolving(false);
    }

    // Create channel metadata
    const channelMetadata = {
      name: channelName,
      description: channelDescription,
      type: channelType,
      accessRules: accessRules,
      creatorAddress: currentAccount?.address || '',
      createdAt: Date.now(),
      daoName: channelType === ChannelType.DAO_ASSEMBLY ? daoName : undefined,
      governanceToken: channelType === ChannelType.DAO_ASSEMBLY ? governanceToken : undefined,
      subscriptionPrice: channelType === ChannelType.SUBSCRIPTION ? subscriptionPrice : undefined,
      subscriptionPeriod: channelType === ChannelType.SUBSCRIPTION ? subscriptionPeriod : undefined,
    };

    // Create channel
    const result = await createChannel(resolvedAddresses, channelMetadata);

    if (result?.channelId) {
      setSuccessMessage(`Channel created successfully! ID: ${result.channelId.slice(0, 10)}...`);
      // Clear form on success
      setChannelName('');
      setChannelDescription('');
      setChannelType(ChannelType.STANDARD);
      setRecipientAddresses('');
      setDaoName('');
      setGovernanceToken('');
      setSubscriptionPrice('');

      // Track successful channel creation
      trackEvent(AnalyticsEvents.CHANNEL_CREATED, {
        channel_type: channelType,
        member_count: resolvedAddresses.length + 1,
        channel_id: result.channelId,
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } else if (channelError) {
      // Track channel creation error
      trackError('channel_creation', channelError);
    }
  };

  return (
    <Card 
      style={{
        backgroundColor: 'var(--color-card-background)',
        border: '1px solid var(--color-card-border)',
        padding: '1rem'
      }}
    >
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
            Create New Channel
          </Text>

          {/* Channel Name */}
          <TextField.Root
            size="2"
            placeholder="Channel name (required)"
            value={channelName}
            onChange={(e) => {
              setChannelName(e.target.value);
              setValidationError(null);
            }}
            disabled={!isReady || isCreatingChannel}
            style={{
              backgroundColor: 'var(--color-input-background)',
              border: '1px solid var(--color-input-border)',
              color: 'var(--color-input-text)'
            }}
          />

          {/* Channel Description */}
          <TextField.Root
            size="2"
            placeholder="Channel description (optional)"
            value={channelDescription}
            onChange={(e) => {
              setChannelDescription(e.target.value);
              setValidationError(null);
            }}
            disabled={!isReady || isCreatingChannel}
            style={{
              backgroundColor: 'var(--color-input-background)',
              border: '1px solid var(--color-input-border)',
              color: 'var(--color-input-text)'
            }}
          />

          {/* Channel Type */}
          <Flex direction="column" gap="2">
            <Text size="2" weight="medium" style={{ color: 'var(--color-text-primary)' }}>
              Channel Type
            </Text>
            <Select.Root
              value={channelType}
              onValueChange={(value) => {
                setChannelType(value as ChannelType);
                setValidationError(null);
              }}
              disabled={!isReady || isCreatingChannel}
            >
              <Select.Trigger
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-input-border)',
                  color: 'var(--color-input-text)'
                }}
              />
              <Select.Content>
                <Select.Item value={ChannelType.STANDARD}>
                  <Flex align="center" gap="2">
                    <Text>Standard Channel</Text>
                    <Badge color="blue" size="1">Private</Badge>
                  </Flex>
                </Select.Item>
                <Select.Item value={ChannelType.TOKEN_GATED}>
                  <Flex align="center" gap="2">
                    <Text>Token-Gated Channel</Text>
                    <Badge color="green" size="1">NFT/Token Required</Badge>
                  </Flex>
                </Select.Item>
                <Select.Item value={ChannelType.DAO_ASSEMBLY}>
                  <Flex align="center" gap="2">
                    <Text>DAO Assembly</Text>
                    <Badge color="purple" size="1">Governance</Badge>
                  </Flex>
                </Select.Item>
                <Select.Item value={ChannelType.SUBSCRIPTION}>
                  <Flex align="center" gap="2">
                    <Text>Subscription Channel</Text>
                    <Badge color="orange" size="1">Paid Access</Badge>
                  </Flex>
                </Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>

          {/* DAO Assembly Fields */}
          {channelType === ChannelType.DAO_ASSEMBLY && (
            <Flex direction="column" gap="2">
              <TextField.Root
                size="2"
                placeholder="DAO Name (e.g., Sui Foundation)"
                value={daoName}
                onChange={(e) => {
                  setDaoName(e.target.value);
                  setValidationError(null);
                }}
                disabled={!isReady || isCreatingChannel}
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-input-border)',
                  color: 'var(--color-input-text)'
                }}
              />
              <TextField.Root
                size="2"
                placeholder="Governance Token Type (e.g., 0x2::sui::SUI)"
                value={governanceToken}
                onChange={(e) => {
                  setGovernanceToken(e.target.value);
                  setValidationError(null);
                }}
                disabled={!isReady || isCreatingChannel}
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-input-border)',
                  color: 'var(--color-input-text)'
                }}
              />
            </Flex>
          )}

          {/* Subscription Fields */}
          {channelType === ChannelType.SUBSCRIPTION && (
            <Flex direction="column" gap="2">
              <TextField.Root
                size="2"
                placeholder="Subscription Price (SUI)"
                value={subscriptionPrice}
                onChange={(e) => {
                  setSubscriptionPrice(e.target.value);
                  setValidationError(null);
                }}
                disabled={!isReady || isCreatingChannel}
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-input-border)',
                  color: 'var(--color-input-text)'
                }}
              />
              <Select.Root
                value={subscriptionPeriod}
                onValueChange={(value) => setSubscriptionPeriod(value as 'monthly' | 'yearly')}
                disabled={!isReady || isCreatingChannel}
              >
                <Select.Trigger
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    border: '1px solid var(--color-input-border)',
                    color: 'var(--color-input-text)'
                  }}
                />
                <Select.Content>
                  <Select.Item value="monthly">Monthly</Select.Item>
                  <Select.Item value="yearly">Yearly</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
          )}

          {/* Standard Channel Recipients */}
          {channelType === ChannelType.STANDARD && (
            <TextField.Root
              size="2"
              placeholder="Enter Sui addresses or SuiNS names (e.g., 0x123... or alice.sui)..."
              value={recipientAddresses}
              onChange={(e) => {
                setRecipientAddresses(e.target.value);
                setValidationError(null);
              }}
              disabled={!isReady || isCreatingChannel || isResolving}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />
          )}

          {validationError && (
            <Text size="1" style={{ color: 'var(--color-error)' }}>
              {validationError}
            </Text>
          )}

          {channelError && (
            <Text size="1" style={{ color: 'var(--color-error)' }}>
              Error: {channelError}
            </Text>
          )}

          {successMessage && (
            <Text size="1" style={{ color: 'var(--color-success)' }}>
              {successMessage}
            </Text>
          )}

          <Button
            size="2"
            disabled={!isReady || isCreatingChannel || isResolving}
            type="submit"
            style={{
              backgroundColor: 'var(--color-button-primary)',
              color: 'var(--color-button-text)',
              width: '100%'
            }}
          >
            {isResolving ? 'Resolving...' : isCreatingChannel ? 'Creating...' : 'Create Channel'}
          </Button>

          {!isReady && (
            <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
              Waiting for client...
            </Text>
          )}
        </Flex>
      </form>
    </Card>
  );
}