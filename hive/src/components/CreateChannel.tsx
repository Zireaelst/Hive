import { useState } from 'react';
import { Card, Flex, Text, TextField, Button } from '@radix-ui/themes';
import { useMessaging } from '../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { trackEvent, trackError, AnalyticsEvents } from '../utils/analytics';

interface CreateChannelProps {
  onInteraction?: () => void;
}

export function CreateChannel({ onInteraction }: CreateChannelProps) {
  const { createChannel, isCreatingChannel, channelError, isReady } = useMessaging();
  const currentAccount = useCurrentAccount();
  const [recipientAddresses, setRecipientAddresses] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    // Parse and validate addresses
    if (!recipientAddresses.trim()) {
      setValidationError('Please enter at least one recipient address');
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

    // Validate each address
    const invalidAddresses = addresses.filter(addr => !isValidSuiAddress(addr));
    if (invalidAddresses.length > 0) {
      setValidationError(`Invalid Sui address(es): ${invalidAddresses.join(', ')}`);
      return;
    }

    // Create channel
    const result = await createChannel(addresses);

    if (result?.channelId) {
      setSuccessMessage(`Channel created successfully! ID: ${result.channelId.slice(0, 10)}...`);
      setRecipientAddresses(''); // Clear input on success

      // Track successful channel creation
      trackEvent(AnalyticsEvents.CHANNEL_CREATED, {
        member_count: addresses.length + 1,
        channel_id: result.channelId,
      });

      // Track interaction for feedback
      if (onInteraction) {
        onInteraction();
      }

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
        <Flex direction="column" gap="2">
          <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
            Create New Channel
          </Text>

          <TextField.Root
            size="2"
            placeholder="Enter Sui addresses..."
            value={recipientAddresses}
            onChange={(e) => {
              setRecipientAddresses(e.target.value);
              setValidationError(null);
            }}
            disabled={!isReady || isCreatingChannel}
            style={{
              backgroundColor: 'var(--color-input-background)',
              border: '1px solid var(--color-input-border)',
              color: 'var(--color-input-text)'
            }}
          />

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
            disabled={!isReady || isCreatingChannel}
            type="submit"
            style={{
              backgroundColor: 'var(--color-button-primary)',
              color: 'var(--color-button-text)',
              width: '100%'
            }}
          >
            {isCreatingChannel ? 'Creating...' : 'Create Channel'}
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