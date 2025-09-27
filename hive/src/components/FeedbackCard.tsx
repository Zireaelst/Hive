import { useState } from 'react';
import {
  Card,
  Flex,
  Text,
  Button,
  TextArea,
  Checkbox,
  Heading,
  IconButton,
  Separator,
  Callout,
} from '@radix-ui/themes';
import { Cross2Icon, InfoCircledIcon } from '@radix-ui/react-icons';
import { FeedbackService } from '../services/feedbackService';

interface FeedbackCardProps {
  onSubmit: (rating: 'thumbs_up' | 'thumbs_down', message?: string) => Promise<boolean>;
  onClose: () => void;
  onOptOut: (optOut: boolean) => void;
  isSubmitting: boolean;
  error: string | null;
}

export function FeedbackCard({
  onSubmit,
  onClose,
  onOptOut,
  isSubmitting,
  error,
}: FeedbackCardProps) {
  const [rating, setRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [message, setMessage] = useState('');
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Check if this is first-time feedback (channel needs to be created)
  const hasExistingChannel = !!FeedbackService.getFeedbackChannelId();

  const handleSubmit = async () => {
    if (!rating) return;

    const success = await onSubmit(rating, message || undefined);
    if (success) {
      onClose();
    }
  };

  const handleClose = () => {
    if (dontAskAgain) {
      onOptOut(true);
    }
    onClose();
  };

  return (
    <Card
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        width: '400px',
        maxWidth: 'calc(100vw - 40px)',
        zIndex: 1000,
        backgroundColor: 'var(--color-card-background)',
        border: '1px solid var(--color-card-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <Flex direction="column" gap="4" p="4">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="5" style={{ color: 'var(--color-text-primary)' }}>How's your experience?</Heading>
          <IconButton
            size="2"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            style={{ color: 'var(--color-text-primary)' }}
          >
            <Cross2Icon width="18" height="18" />
          </IconButton>
        </Flex>

        <Flex direction="column" gap="2">
          <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
            Your feedback is sent directly to the team via Sui's Messaging SDK - completely private and decentralized.
          </Text>

          <Callout.Root size="1" variant="surface">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              <Flex direction="column" gap="1">
                <Text size="1" weight="medium" style={{ color: 'var(--color-text-primary)' }}>
                  {hasExistingChannel ? 'Ready to send' : 'First-time setup required'}
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  {hasExistingChannel
                    ? 'Your feedback will be sent directly (1 transaction).'
                    : 'Creates a private channel between you and the team (3 transactions: channel creation, encryption setup, and message).'}
                </Text>
              </Flex>
            </Callout.Text>
          </Callout.Root>
        </Flex>

        <Separator size="4" />

        {/* Rating Buttons */}
        <Flex gap="3" justify="center">
          <Button
            size="4"
            variant={rating === 'thumbs_up' ? 'solid' : 'outline'}
            onClick={() => setRating('thumbs_up')}
            disabled={isSubmitting}
            style={{
              flex: 1,
              fontSize: '24px',
              padding: '16px',
              backgroundColor: rating === 'thumbs_up' ? 'var(--color-button-primary)' : 'transparent',
              color: rating === 'thumbs_up' ? 'var(--color-button-text)' : 'var(--color-text-primary)',
              borderColor: 'var(--color-border-primary)'
            }}
          >
            👍
          </Button>
          <Button
            size="4"
            variant={rating === 'thumbs_down' ? 'solid' : 'outline'}
            onClick={() => setRating('thumbs_down')}
            disabled={isSubmitting}
            style={{
              flex: 1,
              fontSize: '24px',
              padding: '16px',
              backgroundColor: rating === 'thumbs_down' ? 'var(--color-button-primary)' : 'transparent',
              color: rating === 'thumbs_down' ? 'var(--color-button-text)' : 'var(--color-text-primary)',
              borderColor: 'var(--color-border-primary)'
            }}
          >
            👎
          </Button>
        </Flex>

        {/* Optional Message */}
        <TextArea
          placeholder="Optional: Tell us more about your experience..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
          style={{ 
            minHeight: '80px',
            backgroundColor: 'var(--color-input-background)',
            border: '1px solid var(--color-input-border)',
            color: 'var(--color-input-text)'
          }}
        />

        {/* Error Display */}
        {error && (
          <Text size="2" style={{ color: 'var(--color-error)' }}>
            {error}
          </Text>
        )}

        {/* Don't Ask Again Checkbox */}
        <Flex align="center" gap="2">
          <Checkbox
            checked={dontAskAgain}
            onCheckedChange={(checked) => setDontAskAgain(checked === true)}
            disabled={isSubmitting}
          />
          <Text size="2" style={{ color: 'var(--color-text-primary)' }}>Don't ask me again</Text>
        </Flex>

        {/* Action Buttons */}
        <Flex gap="2" justify="end">
          <Button
            variant="soft"
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              backgroundColor: 'var(--color-background-tertiary)',
              color: 'var(--color-text-primary)'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!rating || isSubmitting}
            style={{
              backgroundColor: 'var(--color-button-primary)',
              color: 'var(--color-button-text)'
            }}
          >
            {isSubmitting
              ? (hasExistingChannel ? 'Sending feedback...' : 'Setting up channel...')
              : `Send Feedback${!hasExistingChannel ? ' (3 txns)' : ''}`}
          </Button>
        </Flex>
      </Flex>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  );
}