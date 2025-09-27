import { useState } from 'react';
import {
  Card,
  Flex,
  Text,
  Button,
  TextArea,
  Heading,
  IconButton,
  Separator,
  Callout,
  Badge,
  Select,
} from '@radix-ui/themes';
import { Cross2Icon, ChatBubbleIcon, PersonIcon, ClockIcon } from '@radix-ui/react-icons';
import { LiveSupportService } from '../services/liveSupportService';

interface LiveSupportCardProps {
  onSubmit: (message: string, priority: string, category: string) => Promise<boolean>;
  onClose: () => void;
  isSubmitting: boolean;
  error: string | null;
  supportAgentName?: string;
  isAgentOnline?: boolean;
}

export function LiveSupportCard({
  onSubmit,
  onClose,
  isSubmitting,
  error,
  supportAgentName = "Support Team",
  isAgentOnline = true,
}: LiveSupportCardProps) {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  // Check if this is first-time support (channel needs to be created)
  const hasExistingChannel = !!LiveSupportService.getSupportChannelId();

  const handleSubmit = async () => {
    if (!message.trim()) return;

    const success = await onSubmit(message, priority, category);
    if (success) {
      setMessage('');
      setIsFirstMessage(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Card
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        width: '450px',
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
          <Flex align="center" gap="2">
            <ChatBubbleIcon width="20" height="20" style={{ color: 'var(--color-primary)' }} />
            <Heading size="4" style={{ color: 'var(--color-text-primary)' }}>
              Live Support
            </Heading>
            <Badge 
              size="1" 
              color={isAgentOnline ? "green" : "gray"}
              style={{ fontSize: '10px' }}
            >
              {isAgentOnline ? 'Online' : 'Offline'}
            </Badge>
          </Flex>
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
            Get instant help from our support team. All messages are encrypted and private using Sui's Messaging SDK with Walrus storage.
          </Text>

          <Callout.Root size="1" variant="surface">
            <Callout.Icon>
              <PersonIcon />
            </Callout.Icon>
            <Callout.Text>
              <Flex direction="column" gap="1">
                <Text size="1" weight="medium" style={{ color: 'var(--color-text-primary)' }}>
                  {hasExistingChannel ? `Connected to ${supportAgentName}` : 'Connecting to support...'}
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  {hasExistingChannel
                    ? 'Your message will be sent securely (1 transaction).'
                    : 'Creates a private channel between you and the team (3 transactions: channel creation, encryption setup, and message).'}
                </Text>
              </Flex>
            </Callout.Text>
          </Callout.Root>

          {isAgentOnline && (
            <Callout.Root size="1" color="green">
              <Callout.Icon>
                <ClockIcon />
              </Callout.Icon>
              <Callout.Text>
                <Text size="1" style={{ color: 'var(--color-success)' }}>
                  Average response time: 2-5 minutes
                </Text>
              </Callout.Text>
            </Callout.Root>
          )}
        </Flex>

        <Separator size="4" />

        {/* Category and Priority Selection */}
        <Flex gap="2">
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Text size="1" weight="medium" style={{ color: 'var(--color-text-primary)' }}>
              Category
            </Text>
            <Select.Root value={category} onValueChange={setCategory} disabled={isSubmitting}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="general">General</Select.Item>
                <Select.Item value="technical">Technical</Select.Item>
                <Select.Item value="billing">Billing</Select.Item>
                <Select.Item value="bug_report">Bug Report</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Text size="1" weight="medium" style={{ color: 'var(--color-text-primary)' }}>
              Priority
            </Text>
            <Select.Root value={priority} onValueChange={setPriority} disabled={isSubmitting}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="low">Low</Select.Item>
                <Select.Item value="medium">Medium</Select.Item>
                <Select.Item value="high">High</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
        </Flex>

        {/* Message Input */}
        <Flex direction="column" gap="2">
          <Text size="2" weight="medium" style={{ color: 'var(--color-text-primary)' }}>
            How can we help you?
          </Text>
          <TextArea
            placeholder="Describe your issue or question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting || !isAgentOnline}
            style={{ 
              minHeight: '120px',
              backgroundColor: 'var(--color-input-background)',
              border: '1px solid var(--color-input-border)',
              color: 'var(--color-input-text)'
            }}
          />
        </Flex>

        {/* Error Display */}
        {error && (
          <Text size="2" style={{ color: 'var(--color-error)' }}>
            {error}
          </Text>
        )}

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
            disabled={!message.trim() || isSubmitting || !isAgentOnline}
            style={{
              backgroundColor: 'var(--color-button-primary)',
              color: 'var(--color-button-text)'
            }}
          >
            {isSubmitting
              ? (hasExistingChannel ? 'Sending...' : 'Connecting...')
              : `Send Message${!hasExistingChannel ? ' (3 txns)' : ''}`}
          </Button>
        </Flex>

        {/* Support Info */}
        <Flex direction="column" gap="1" style={{ marginTop: '0.5rem' }}>
          <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
            Support hours: 24/7
          </Text>
          <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
            All conversations are encrypted and stored on Walrus
          </Text>
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
