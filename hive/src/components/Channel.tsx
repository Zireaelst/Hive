import { useEffect, useState, useRef } from 'react';
import { Card, Flex, Text, Box, Button, TextField, Badge, Dialog, Select, Tabs } from '@radix-ui/themes';
import { useMessaging } from '../hooks/useMessaging';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { formatTimestamp, formatAddress } from '../utils/formatters';
import { trackEvent, trackError, AnalyticsEvents } from '../utils/analytics';
import { walrusService } from '../services/walrusService';
import { suinsService } from '../services/suinsService';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { GovernancePanel } from './GovernancePanel';
import { ChannelType } from '../types/channel';

interface ChannelProps {
  channelId: string;
  onBack: () => void;
}

export function Channel({ channelId, onBack }: ChannelProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoadingOlderRef = useRef(false);
  const {
    currentChannel,
    messages,
    getChannelById,
    fetchMessages,
    sendMessage,
    isFetchingMessages,
    isSendingMessage,
    messagesCursor,
    hasMoreMessages,
    channelError,
    isReady,
    getChannelMetadata,
  } = useMessaging();

  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [addressNames, setAddressNames] = useState<Map<string, string>>(new Map());
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Channel metadata state
  const [channelMetadata, setChannelMetadata] = useState<any>(null);
  
  // Voice recording hook
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error: voiceError,
    availableDevices,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    formatTime,
    getAudioDevices,
  } = useVoiceRecording();

  // Fetch channel and messages on mount
  useEffect(() => {
    if (isReady && channelId) {
      // Track channel open event
      trackEvent(AnalyticsEvents.CHANNEL_OPENED, {
        channel_id: channelId,
      });

      getChannelById(channelId).then(() => {
        fetchMessages(channelId);
      });

      // Load channel metadata
      const metadata = getChannelMetadata(channelId);
      setChannelMetadata(metadata);

      // Auto-refresh messages every 10 seconds
      const interval = setInterval(() => {
        fetchMessages(channelId);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isReady, channelId, getChannelById, fetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Don't scroll if we're loading older messages
    if (!isLoadingOlderRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Reset the flag after messages update
    isLoadingOlderRef.current = false;
  }, [messages]);

  // Resolve SuiNS names for message senders
  useEffect(() => {
    const resolveNames = async () => {
      if (messages.length === 0) return;
      
      const uniqueAddresses = [...new Set(messages.map(msg => msg.sender))];
      const newNames = new Map(addressNames);
      
      for (const address of uniqueAddresses) {
        if (!newNames.has(address)) {
          try {
            const name = await suinsService.getAddressName(address);
            if (name) {
              newNames.set(address, name);
            }
          } catch (error) {
            console.warn('Failed to resolve SuiNS name for:', address);
          }
        }
      }
      
      if (newNames.size !== addressNames.size) {
        setAddressNames(newNames);
      }
    };

    resolveNames();
  }, [messages, addressNames]);

  // Load audio devices when voice recorder is opened
  useEffect(() => {
    if (showVoiceRecorder && availableDevices.length === 0) {
      getAudioDevices();
    }
  }, [showVoiceRecorder, availableDevices.length, getAudioDevices]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper function to get channel members
  const getChannelMembers = () => {
    if (!currentChannel || !currentAccount) return [];
    
    let members: string[] = [];
    const channel = currentChannel as any;
    
    console.log('=== getChannelMembers DEBUG ===');
    console.log('Current account:', currentAccount.address);
    console.log('Channel last_message:', channel.last_message);
    console.log('Messages:', messages);
    
    // Method 1: Get from last message sender (most direct approach)
    if (channel.last_message && channel.last_message.sender) {
      const lastSender = channel.last_message.sender;
      if (lastSender !== currentAccount.address) {
        members = [lastSender];
        console.log('Method 1 - Last message sender:', members);
      }
    }
    
    // Method 2: Get unique message senders from all messages
    if (members.length === 0 && messages && messages.length > 0) {
      const messageSenders = new Set<string>();
      messages.forEach((message: any) => {
        if (message.sender && message.sender !== currentAccount.address) {
          messageSenders.add(message.sender);
        }
      });
      members = Array.from(messageSenders);
      console.log('Method 2 - Message senders:', members);
    }
    
    // Method 3: Check if we can extract from channel details
    if (members.length === 0) {
      console.log('Method 3 - Checking channel details...');
      console.log('Channel object keys:', Object.keys(channel));
      
      // Look for any property that might contain participant info
      Object.keys(channel).forEach(key => {
        const value = channel[key];
        if (typeof value === 'object' && value !== null) {
          console.log(`Checking ${key}:`, value);
        }
      });
    }
    
    console.log('Final members:', members);
    console.log('Length:', members.length);
    
    return members;
  };

  const handlePayment = async () => {
    if (!paymentAmount || !currentAccount) return;

    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentSuccess(false);

    try {
      const members = getChannelMembers();
      let recipientAddress = '';

      if (members.length === 0) {
        throw new Error('No recipients found');
      } else if (members.length === 1) {
        recipientAddress = members[0];
      } else {
        // Multiple members - use selected recipient
        if (!selectedRecipient) {
          throw new Error('Please select a recipient');
        }
        recipientAddress = selectedRecipient;
      }

      console.log('Sending payment to:', recipientAddress);
      console.log('Amount:', paymentAmount);

      // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
      const amountInMist = Math.floor(parseFloat(paymentAmount) * 1_000_000_000);

      // Create transaction
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
      tx.transferObjects([coin], recipientAddress);

      // Execute transaction
      const { digest } = await signAndExecute({ transaction: tx });

      console.log('Payment successful:', digest);
      setPaymentSuccess(true);

      // Send a message about the payment
      const messageContent = `💰 Sent ${paymentAmount} SUI to ${formatAddress(recipientAddress)}`;
      await sendMessage(channelId, messageContent);

      // Reset form after success
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentSuccess(false);
        setSelectedRecipient('');
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!messageText.trim() && !selectedFile && !audioBlob) || isSendingMessage || isUploading) {
      return;
    }

    let messageContent = messageText;
    
    // Handle voice message upload to Walrus
    if (audioBlob) {
      setIsUploading(true);
      try {
        // Create a File object from the audio blob
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
          type: 'audio/webm;codecs=opus'
        });
        
        // Upload audio file to Walrus
        const fileInfo = await walrusService.uploadFile(audioFile);
        
        // Create message with Walrus file info
        const duration = formatTime(recordingTime);
        messageContent = `🎤 Voice Message (${duration})\n${messageText || 'Voice message'}\n\n[Walrus: ${fileInfo.blobId}]`;
      } catch (error) {
        console.error('Voice message upload error:', error);
        setIsUploading(false);
        alert('Failed to upload voice message to Walrus. Please try again.');
        return;
      }
    }
    // Handle file upload to Walrus
    else if (selectedFile) {
      setIsUploading(true);
      try {
        // Upload file to Walrus
        const fileInfo = await walrusService.uploadFile(selectedFile);
        
        // Create message with Walrus file info
        const fileSize = walrusService.formatFileSize(fileInfo.fileSize);
        messageContent = `📎 ${fileInfo.fileName} (${fileSize})\n${messageText || 'File shared'}\n\n[Walrus: ${fileInfo.blobId}]`;
      } catch (error) {
        console.error('File upload error:', error);
        setIsUploading(false);
        alert('Failed to upload file to Walrus. Please try again.');
        return;
      }
    }

    const result = await sendMessage(channelId, messageContent);
    if (result) {
      setMessageText(''); // Clear input on success
      setSelectedFile(null); // Clear selected file
      clearRecording(); // Clear voice recording
      setShowVoiceRecorder(false); // Hide voice recorder
      setIsUploading(false);
      // Track successful message send
      trackEvent(AnalyticsEvents.MESSAGE_SENT, {
        channel_id: channelId,
        message_length: messageContent.length,
        has_file: selectedFile ? 1 : 0,
        has_voice: audioBlob ? 1 : 0,
      });
    } else if (channelError) {
      // Track message sending error
      trackError('message_send', channelError, {
        channel_id: channelId,
      });
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };


  const downloadFile = async (blobId: string, fileName: string) => {
    try {
      const blob = await walrusService.downloadFile(blobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file from Walrus');
    }
  };

  const parseFileMessage = (messageText: string) => {
    // Parse Walrus voice message format
    const voiceMatch = messageText.match(/🎤 Voice Message \((.+?)\)\n(.*?)\n\n\[Walrus: (.+?)\]/s);
    if (voiceMatch) {
      return {
        fileName: `Voice Message (${voiceMatch[1]})`,
        fileSize: voiceMatch[1],
        message: voiceMatch[2],
        blobId: voiceMatch[3],
        isWalrus: true,
        isVoice: true
      };
    }
    
    // Parse Walrus file message format
    const walrusMatch = messageText.match(/📎 (.+?) \((.+?)\)\n(.*?)\n\n\[Walrus: (.+?)\]/s);
    if (walrusMatch) {
      return {
        fileName: walrusMatch[1],
        fileSize: walrusMatch[2],
        message: walrusMatch[3],
        blobId: walrusMatch[4],
        isWalrus: true
      };
    }
    
    // Fallback for old IndexedDB format
    const fileMatch = messageText.match(/📎 (.+?) \((.+?)\)\n(.*?)\n\n\[FileID: (.+?)\]/s);
    if (fileMatch) {
      return {
        fileName: fileMatch[1],
        fileSize: fileMatch[2],
        message: fileMatch[3],
        fileId: fileMatch[4],
        isIndexedDB: true
      };
    }
    
    // Fallback for old base64 format
    const oldFileMatch = messageText.match(/📎 (.+?) \((.+?)\)\n(.*?)\n\n\[File: (.+?)\]\.\.\./s);
    if (oldFileMatch) {
      return {
        fileName: oldFileMatch[1],
        fileSize: oldFileMatch[2],
        message: oldFileMatch[3],
        fileData: oldFileMatch[4],
        isLegacy: true
      };
    }
    
    // Fallback for very old format without size
    const veryOldFileMatch = messageText.match(/📎 (.+?)\n(.*?)\n\n\[File: (.+?)\]\.\.\./s);
    if (veryOldFileMatch) {
      return {
        fileName: veryOldFileMatch[1],
        message: veryOldFileMatch[2],
        fileData: veryOldFileMatch[3],
        isLegacy: true
      };
    }
    return null;
  };

  const handleLoadMore = () => {
    if (messagesCursor && !isFetchingMessages) {
      isLoadingOlderRef.current = true;
      fetchMessages(channelId, messagesCursor);
      // Track loading more messages
      trackEvent(AnalyticsEvents.MESSAGES_LOADED_MORE, {
        channel_id: channelId,
      });
    }
  };

  const renderMessages = () => (
    <>
      {/* Load More Button */}
      {hasMoreMessages && (
        <Box style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Button
            size="2"
            variant="soft"
            onClick={handleLoadMore}
            disabled={isFetchingMessages}
          >
            {isFetchingMessages ? 'Loading...' : 'Load older messages'}
          </Button>
        </Box>
      )}

      {/* Messages */}
      {messages.length === 0 && !isFetchingMessages ? (
        <Box style={{ textAlign: 'center', padding: '32px' }}>
          <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
            No messages yet. Start the conversation!
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap="2">
          {messages.map((message, index) => {
            const isOwnMessage = message.sender === currentAccount?.address;
            const senderName = addressNames.get(message.sender) || formatAddress(message.sender);
            
            // Parse file information from message
            const fileInfo = parseFileMessage(message.text);
            
            return (
              <Box
                key={`${message.sender}-${index}`}
                style={{
                  alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  backgroundColor: isOwnMessage 
                    ? 'var(--color-message-own)' 
                    : 'var(--color-message-other)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border-primary)'
                }}
              >
                <Flex direction="column" gap="1">
                  {!isOwnMessage && (
                    <Text size="1" weight="bold" style={{ color: 'var(--color-text-muted)' }}>
                      {senderName}
                    </Text>
                  )}
                  
                  {/* File Display */}
                  {fileInfo ? (
                    <Box>
                      {/* Show file info */}
                      <Box style={{ 
                        backgroundColor: 'var(--color-background-secondary)', 
                        padding: '8px', 
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}>
                        <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                          📎 {fileInfo.fileName}
                        </Text>
                        <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                          {fileInfo.fileSize}
                        </Text>
                        
                        {/* Download button for different file types */}
                        {fileInfo.isWalrus ? (
                          <Flex gap="2" style={{ marginTop: '8px' }}>
                            <Button
                              size="1"
                              variant="soft"
                              onClick={() => downloadFile(fileInfo.blobId, fileInfo.fileName)}
                              style={{
                                backgroundColor: 'var(--color-button-secondary)',
                                color: 'var(--color-text-primary)',
                                fontSize: '10px',
                                padding: '1px 6px'
                              }}
                            >
                              Download
                            </Button>
                          </Flex>
                        ) : fileInfo.isWalrus && fileInfo.blobId && walrusService.isImageFile(fileInfo.fileName) ? (
                          <Box style={{ marginBottom: '8px' }}>
                            <img 
                              src={walrusService.getFileUrl(fileInfo.blobId)} 
                              alt={fileInfo.fileName}
                              style={{
                                maxWidth: '300px',
                                maxHeight: '300px',
                                borderRadius: 'var(--radius-2)',
                                objectFit: 'cover',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                // Open image in new tab on click
                                window.open(walrusService.getFileUrl(fileInfo.blobId), '_blank');
                              }}
                            />
                          </Box>
                        ) : fileInfo.isIndexedDB ? (
                          <Flex gap="2" style={{ marginTop: '8px' }}>
                            <Button
                              size="1"
                              variant="soft"
                              onClick={() => alert('IndexedDB download not supported')}
                              style={{
                                backgroundColor: 'var(--color-button-secondary)',
                                color: 'var(--color-text-primary)',
                                fontSize: '10px',
                                padding: '1px 6px'
                              }}
                            >
                              Download
                            </Button>
                          </Flex>
                        ) : fileInfo.isLegacy ? (
                          <Flex gap="2" style={{ marginTop: '8px' }}>
                            <Button
                              size="1"
                              variant="soft"
                              onClick={() => {
                                // Handle legacy file download
                                const base64 = fileInfo.fileData.includes(',') ? fileInfo.fileData.split(',')[1] : fileInfo.fileData;
                                const byteCharacters = atob(base64);
                                const byteNumbers = new Array(byteCharacters.length);
                                
                                for (let i = 0; i < byteCharacters.length; i++) {
                                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray]);
                                const url = window.URL.createObjectURL(blob);
                                
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = fileInfo.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              }}
                              style={{
                                backgroundColor: 'var(--color-button-secondary)',
                                color: 'var(--color-text-primary)',
                                fontSize: '10px',
                                padding: '1px 6px'
                              }}
                            >
                              Download
                            </Button>
                          </Flex>
                        ) : null}
                      </Box>
                      
                      {/* Show message text if any */}
                      {fileInfo.message && (
                        <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                          {fileInfo.message}
                        </Text>
                      )}
                    </Box>
                  ) : (
                    /* Regular text message */
                    <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                      {message.text}
                    </Text>
                  )}
                  
                  <Text size="1" style={{ 
                    color: 'var(--color-text-muted)', 
                    textAlign: isOwnMessage ? 'right' : 'left' 
                  }}>
                    {formatTimestamp(message.createdAtMs)}
                  </Text>
                </Flex>
              </Box>
            );
          })}
        </Flex>
      )}
      
      {/* Scroll to bottom ref */}
      <div ref={messagesEndRef} />
    </>
  );

  if (!isReady) {
    return (
      <Card>
        <Text size="2" color="gray">
          Waiting for messaging client to initialize...
        </Text>
      </Card>
    );
  }

  return (
    <Card style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--color-card-background)',
      border: 'none',
      borderRadius: 0
    }}>
      {/* Header */}
      <Box p="3" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        <Flex justify="between" align="center">
          <Flex gap="3" align="center">
            <Button 
              size="2" 
              variant="solid" 
              onClick={onBack}
              style={{
                backgroundColor: 'var(--color-button-secondary)',
                color: 'var(--color-text-primary)'
              }}
            >
              ← Back
            </Button>
            <Box>
              <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                {channelMetadata?.name || 'Channel'}
              </Text>
              {currentChannel && (
                <Text size="1" style={{ display: 'block', color: 'var(--color-text-muted)' }}>
                  {formatAddress(currentChannel.id.id)}
                </Text>
              )}
              {channelMetadata?.type && (
                <Badge 
                  size="1"
                  color={
                    channelMetadata.type === ChannelType.DAO_ASSEMBLY ? 'purple' :
                    channelMetadata.type === ChannelType.TOKEN_GATED ? 'green' :
                    channelMetadata.type === ChannelType.SUBSCRIPTION ? 'orange' : 'blue'
                  }
                >
                  {channelMetadata.type.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </Box>
          </Flex>
          {currentChannel && (
            <Flex gap="2">
              <Badge 
                size="1"
                style={{
                  backgroundColor: 'var(--color-success)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {currentChannel.messages_count} messages
              </Badge>
            </Flex>
          )}
        </Flex>
      </Box>

      {/* Main Content Area */}
      {channelMetadata?.type === ChannelType.DAO_ASSEMBLY ? (
        <Tabs.Root defaultValue="messages" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs.List style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
            <Tabs.Trigger value="messages">Messages</Tabs.Trigger>
            <Tabs.Trigger value="governance">Governance</Tabs.Trigger>
          </Tabs.List>
          
          <Tabs.Content value="messages" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
              {renderMessages()}
            </Box>
          </Tabs.Content>
          
          <Tabs.Content value="governance" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <GovernancePanel 
              channelId={channelId} 
              channelName={channelMetadata?.name}
            />
          </Tabs.Content>
        </Tabs.Root>
      ) : (
        <Box 
          style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {renderMessages()}
        </Box>
      )}

      {/* Message Input Area */}
      <Box p="3" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <Box p="3" style={{ 
            backgroundColor: 'var(--color-background-secondary)', 
            borderRadius: 'var(--radius-3)',
            marginBottom: '16px'
          }}>
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                  Voice Recorder
                </Text>
            <Button
                  size="1"
              variant="soft"
                  onClick={() => setShowVoiceRecorder(false)}
                  style={{
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  ✕
            </Button>
              </Flex>
              
              {voiceError && (
                <Text size="2" style={{ color: 'var(--color-error)' }}>
                  {voiceError}
                </Text>
              )}
              
              {!audioBlob ? (
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
            <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready to record'}
            </Text>
                    {isRecording && (
                      <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                        {formatTime(recordingTime)}
                      </Text>
                    )}
                  </Flex>
                  
                  <Flex gap="2" align="center" wrap="wrap">
                    {!isRecording ? (
                      <>
                        <Button
                          size="2"
                          variant="solid"
                          onClick={startRecording}
                          disabled={!isReady}
                  style={{
                            backgroundColor: 'var(--color-error)',
                            color: 'white'
                          }}
                        >
                          🎤 Start Recording
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="2"
                          variant="solid"
                          onClick={isPaused ? resumeRecording : pauseRecording}
                    style={{
                            backgroundColor: 'var(--color-warning)',
                            color: 'white'
                          }}
                        >
                          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                        </Button>
                        <Button
                          size="2"
                          variant="solid"
                          onClick={stopRecording}
                          style={{
                            backgroundColor: 'var(--color-success)',
                            color: 'white'
                          }}
                        >
                          ⏹️ Stop
                        </Button>
                      </>
                    )}
                  </Flex>
                </Flex>
              ) : (
                <Flex direction="column" gap="2">
                  <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                    Recording complete! ({formatTime(recordingTime)})
                      </Text>
                  <audio 
                    controls 
                                style={{
                      width: '100%', 
                                  maxWidth: '300px',
                      height: '32px'
                                }}
                    src={audioUrl || undefined}
                              />
                  <Flex gap="2">
                                <Button
                      size="2"
                      variant="solid"
                      onClick={clearRecording}
                                  style={{
                                    backgroundColor: 'var(--color-button-secondary)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      🗑️ Clear
                    </Button>
                    <Button
                      size="2"
                      variant="solid"
                      onClick={startRecording}
                      disabled={!isReady}
                      style={{
                        backgroundColor: 'var(--color-error)',
                        color: 'white'
                      }}
                    >
                      🎤 Record Again
                                </Button>
                  </Flex>
                </Flex>
              )}
                              </Flex>
                            </Box>
        )}

        <form onSubmit={handleSendMessage}>
          <Flex gap="2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
                              <Button
              size="3"
              type="button"
                                variant="soft"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSendingMessage || isUploading || !isReady || showVoiceRecorder}
              style={{
                backgroundColor: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-primary)'
              }}
            >
              📎
            </Button>
            <Button
              size="3"
              type="button"
              variant="soft"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              disabled={isSendingMessage || isUploading || !isReady || selectedFile !== null}
              style={{
                backgroundColor: showVoiceRecorder ? 'var(--color-error)' : 'var(--color-background-secondary)',
                color: showVoiceRecorder ? 'white' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border-primary)'
              }}
            >
              🎤
            </Button>
            <TextField.Root
              size="3"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isSendingMessage || isUploading || !isReady}
              style={{ 
                flex: 1,
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />
            <Button
              size="3"
              type="submit"
              disabled={(!messageText.trim() && !selectedFile && !audioBlob) || isSendingMessage || isUploading || !isReady}
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-text)'
              }}
            >
              {isSendingMessage || isUploading ? 'Sending...' : 'Send'}
            </Button>
            
            {/* Dropdown Button */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <Button
                size="3"
                type="button"
                variant="soft"
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isSendingMessage || isUploading || !isReady}
                style={{
                  backgroundColor: 'var(--color-background-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-primary)',
                  minWidth: '40px'
                }}
              >
                ▼
              </Button>
              
              {showDropdown && (
                <Box
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    backgroundColor: 'var(--color-card-background)',
                    border: '1px solid var(--color-border-primary)',
                    borderRadius: 'var(--radius-3)',
                    padding: '8px',
                    minWidth: '120px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <Flex direction="column" gap="1">
                    <Button
                      size="2"
                      variant="ghost"
                      onClick={() => {
                        setShowPaymentModal(true);
                        setShowDropdown(false);
                                }}
                                style={{
                        justifyContent: 'flex-start',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      💰 Send Payment
                              </Button>
                            </Flex>
                </Box>
              )}
            </div>
          </Flex>
        </form>
      </Box>

      {/* Payment Modal */}
      <Dialog.Root open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Title>Send Payment</Dialog.Title>
          <Dialog.Description>
            Send SUI tokens to channel members
          </Dialog.Description>

          <Flex direction="column" gap="3" style={{ marginTop: '1rem' }}>
            <Box>
              <Text size="2" weight="bold" mb="2" style={{ color: 'var(--color-text-primary)' }}>
                Amount (SUI)
                            </Text>
              <TextField.Root
                type="number"
                step="0.001"
                placeholder="0.001"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={isProcessingPayment}
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-input-border)',
                  color: 'var(--color-input-text)'
                }}
              />
                        </Box>

            {/* Recipient Display */}
            <Box>
              <Text size="2" weight="bold" mb="2" style={{ color: 'var(--color-text-primary)' }}>
                Recipient
              </Text>
              {(() => {
                const members = getChannelMembers();
                if (members.length === 0) {
                  return (
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      No recipients found
                    </Text>
                  );
                } else if (members.length === 1) {
                  return (
                    <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                      {formatAddress(members[0])}
                    </Text>
                  );
                } else {
                  return (
                    <Select.Root value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <Select.Trigger
                        style={{
                          backgroundColor: 'var(--color-input-background)',
                          border: '1px solid var(--color-input-border)',
                          color: 'var(--color-input-text)'
                        }}
                      />
                      <Select.Content>
                        {members.map((member) => (
                          <Select.Item key={member} value={member}>
                            {formatAddress(member)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  );
                }
              })()}
            </Box>

            {/* Error Message */}
            {paymentError && (
              <Text size="2" style={{ color: 'var(--color-error)' }}>
                {paymentError}
                        </Text>
                      )}
                      
            {/* Success Message */}
            {paymentSuccess && (
              <Text size="2" style={{ color: 'var(--color-success)' }}>
                ✅ Payment Successful!
                      </Text>
            )}

            {/* Action Buttons */}
            <Flex gap="3" mt="4">
              <Dialog.Close>
                <Button
                  variant="soft"
                  color="gray"
                  disabled={isProcessingPayment}
                  style={{
                    backgroundColor: 'var(--color-button-secondary)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                onClick={handlePayment}
                disabled={!paymentAmount || isProcessingPayment || paymentSuccess}
                style={{
                  backgroundColor: 'var(--color-button-primary)',
                  color: 'var(--color-button-text)'
                }}
              >
                {isProcessingPayment ? 'Processing...' : 'Send Payment'}
              </Button>
                    </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}