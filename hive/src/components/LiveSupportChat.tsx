import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Flex,
  Text,
  Button,
  TextField,
  Heading,
  IconButton,
  Box,
  Badge,
  Separator,
} from '@radix-ui/themes';
import { Cross2Icon, PaperPlaneIcon, ChatBubbleIcon } from '@radix-ui/react-icons';
import { useMessaging } from '../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { formatTimestamp } from '../utils/formatters';
import { LiveSupportService, SUPPORT_TEAM_ADDRESS } from '../services/liveSupportService';

interface LiveSupportChatProps {
  onClose: () => void;
  isOpen: boolean;
}

export function LiveSupportChat({ onClose, isOpen }: LiveSupportChatProps) {
  const { 
    createChannel, 
    sendMessage, 
    getChannelById, 
    fetchMessages, 
    messages, 
    isSendingMessage,
    isReady 
  } = useMessaging();
  const currentAccount = useCurrentAccount();
  
  const [message, setMessage] = useState('');
  const [supportChannelId, setSupportChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize support channel
  useEffect(() => {
    if (isOpen && currentAccount && isReady) {
      initializeSupportChannel();
    }
  }, [isOpen, currentAccount, isReady]);

  const initializeSupportChannel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if we already have a support channel
      let channelId = LiveSupportService.getSupportChannelId();

      if (!channelId) {
        // Create new support channel
        const result = await createChannel([SUPPORT_TEAM_ADDRESS]);
        if (result && result.channelId) {
          channelId = result.channelId as string;
          LiveSupportService.setSupportChannelId(channelId);
        } else {
          throw new Error('Failed to create support channel');
        }
      }

      setSupportChannelId(channelId);

      // Get channel details and messages
      await getChannelById(channelId);
      await fetchMessages(channelId);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize support';
      setError(errorMsg);
      console.error('Support channel initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !supportChannelId || !currentAccount) return;

    const messageText = message.trim();
    setMessage('');

    try {
      // Send plain text message for better user experience
      await sendMessage(supportChannelId, messageText);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMsg);
      console.error('Send message error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Card
      style={{
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        width: '400px',
        height: '500px',
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 120px)',
        zIndex: 1000,
        backgroundColor: 'var(--color-card-background)',
        border: '1px solid var(--color-card-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      {/* Header */}
      <Flex justify="between" align="center" p="3" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        <Flex align="center" gap="2">
          <ChatBubbleIcon width="20" height="20" style={{ color: 'var(--color-primary)' }} />
          <Heading size="3" style={{ color: 'var(--color-text-primary)' }}>
            Live Support
          </Heading>
          <Badge size="1" color="green" style={{ fontSize: '10px' }}>
            Online
          </Badge>
        </Flex>
        <IconButton
          size="2"
          variant="ghost"
          onClick={onClose}
          style={{ color: 'var(--color-text-primary)' }}
        >
          <Cross2Icon width="18" height="18" />
        </IconButton>
      </Flex>

      {/* Messages Area */}
      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {isLoading ? (
          <Flex justify="center" align="center" style={{ height: '100%' }}>
            <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
              Connecting to support...
            </Text>
          </Flex>
        ) : error ? (
          <Flex justify="center" align="center" style={{ height: '100%' }}>
            <Text size="2" style={{ color: 'var(--color-error)' }}>
              {error}
            </Text>
          </Flex>
        ) : messages.length === 0 ? (
          <Flex justify="center" align="center" style={{ height: '100%' }}>
            <Flex direction="column" align="center" gap="2">
              <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                Welcome to Live Support!
              </Text>
              <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                How can we help you today?
              </Text>
            </Flex>
          </Flex>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.sender === currentAccount?.address;
            const isSupportMessage = msg.sender === SUPPORT_TEAM_ADDRESS;
            
            // Try to parse JSON message, if it's a support request, show only the message text
            let displayText = msg.text;
            try {
              const parsed = JSON.parse(msg.text);
              if (parsed.type === 'support_request' && parsed.message) {
                displayText = parsed.message;
              }
            } catch {
              // Not JSON, use original text
            }
            
            return (
              <Flex
                key={index}
                justify={isOwnMessage ? 'end' : 'start'}
                style={{ marginBottom: '0.5rem' }}
              >
                <Box
                  style={{
                    maxWidth: '80%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-3)',
                    backgroundColor: isOwnMessage 
                      ? 'var(--color-button-primary)' 
                      : isSupportMessage 
                        ? 'var(--color-background-tertiary)'
                        : 'var(--color-background-secondary)',
                    color: isOwnMessage 
                      ? 'var(--color-button-text)' 
                      : 'var(--color-text-primary)',
                  }}
                >
                  <Text size="2" style={{ wordBreak: 'break-word' }}>
                    {displayText}
                  </Text>
                  <Text 
                    size="1" 
                    style={{ 
                      color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)',
                      marginTop: '0.25rem',
                      display: 'block'
                    }}
                  >
                    {formatTimestamp(msg.createdAtMs)}
                  </Text>
                </Box>
              </Flex>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Separator size="4" />

      {/* Message Input */}
      <Flex gap="2" p="3" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
        <TextField.Root
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSendingMessage || isLoading}
          style={{
            flex: 1,
            backgroundColor: 'var(--color-input-background)',
            border: '1px solid var(--color-input-border)',
            color: 'var(--color-input-text)'
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || isSendingMessage || isLoading}
          style={{
            backgroundColor: 'var(--color-button-primary)',
            color: 'var(--color-button-text)'
          }}
        >
          <PaperPlaneIcon width="16" height="16" />
        </Button>
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
