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
import { isValidSuiAddress } from '@mysten/sui/utils';

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
  
  // Location sharing state
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [manualLocationLabel, setManualLocationLabel] = useState('');
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  
  // Channel metadata state
  const [channelMetadata, setChannelMetadata] = useState<any>(null);
  
  // Invite state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteAddress, setInviteAddress] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  
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

  // Parse a location message
  const parseLocationMessage = (messageText: string) => {
    // Format: 📍 Location: <lat>,<lng>\n<label>
    const match = messageText.match(/📍\s*Location:\s*([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)(?:\n(.*))?$/s);
    if (!match) return null;
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    const label = (match[3] || '').trim();
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng, label };
  };

  const getStaticMapUrl = (lat: number, lng: number) => {
    // OpenStreetMap static map (no key)
    const zoom = 15;
    const size = '300x200';
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=${lat},${lng},red-pushpin`;
  };

  const getMapsLinkUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

  const buildLocationMessage = (lat: number, lng: number, label?: string) => {
    const safeLabel = (label || '').trim();
    return `📍 Location: ${lat},${lng}${safeLabel ? `\n${safeLabel}` : ''}`;
  };

  const sendLocation = async (lat: number, lng: number, label?: string) => {
    const msg = buildLocationMessage(lat, lng, label);
    setIsSharingLocation(true);
    try {
      await sendMessage(channelId, msg);
      trackEvent(AnalyticsEvents.MESSAGE_SENT, {
        channel_id: channelId,
        message_length: msg.length,
        has_location: 1,
      });
    } catch (e) {
      console.error('Send location error:', e);
      trackError('message_send', 'send_location_failed', { channel_id: channelId });
    } finally {
      setIsSharingLocation(false);
    }
  };

  const requestAndSendCurrentLocation = () => {
    if (!navigator.geolocation) {
      setShowLocationDialog(true);
      return;
    }
    setIsSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await sendLocation(latitude, longitude, 'Current location');
        setIsSharingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsSharingLocation(false);
        setShowLocationDialog(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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

  const handleInvite = async () => {
    if (!inviteAddress.trim()) {
      setInviteError('Please enter a wallet address or SuiNS name');
      return;
    }

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      // Resolve SuiNS name to address if needed
      let resolvedAddress = inviteAddress.trim();
      
      // Check if it's a SuiNS name (contains .sui)
      if (inviteAddress.includes('.sui')) {
        const resolved = await suinsService.resolveToAddress(inviteAddress);
        if (resolved && isValidSuiAddress(resolved)) {
          resolvedAddress = resolved;
        } else {
          setInviteError(`Invalid SuiNS name: ${inviteAddress}`);
          setIsInviting(false);
          return;
        }
      } else if (!isValidSuiAddress(inviteAddress)) {
        setInviteError(`Invalid wallet address: ${inviteAddress}`);
        setIsInviting(false);
        return;
      }

      // Check if user is trying to invite themselves
      if (currentAccount && resolvedAddress.toLowerCase() === currentAccount.address.toLowerCase()) {
        setInviteError('You cannot invite your own address. You are already a member.');
        setIsInviting(false);
        return;
      }

      // Create invitation data
      const invitationData = {
        id: `invite-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        channelId: channelId,
        channelName: channelMetadata?.name || 'Channel',
        channelType: channelMetadata?.type || 'standard',
        inviterAddress: currentAccount?.address || '',
        invitedAddress: resolvedAddress,
        timestamp: Date.now(),
        status: 'pending'
      };

      // Create invitation message for the channel
      const channelTypeText = channelMetadata?.type === 'subscription' ? 'Subscription' : 
                             channelMetadata?.type === 'token_gated' ? 'Token-Gated' : 'Channel';
      const invitationMessage = `🔗 **${channelTypeText} Channel Invitation**\n\n${formatAddress(resolvedAddress)} has been invited to join this ${channelTypeText.toLowerCase()} channel.\n\nInvited by: ${formatAddress(currentAccount?.address || '')}\n\nPlease connect your wallet to participate.`;
      
      // Send invitation message to the channel
      await sendMessage(channelId, invitationMessage);
      
      // Upload invitation data to Walrus for the invited user
      try {
        const invitationBlob = new Blob([JSON.stringify(invitationData)], { type: 'application/json' });
        const invitationFile = new File([invitationBlob], `channel-invitation-${invitationData.id}.json`, {
          type: 'application/json'
        });
        
        const fileInfo = await walrusService.uploadFile(invitationFile);
        
        // Create a special message with the invitation data
        const walrusInvitationMessage = `🎯 **${channelTypeText} Channel Invitation Data**\n\nChannel: ${channelMetadata?.name || 'Channel'}\nType: ${channelTypeText}\nInvited by: ${formatAddress(currentAccount?.address || '')}\n\n[Walrus: ${fileInfo.blobId}]`;
        
        // Send the invitation data message to the channel
        await sendMessage(channelId, walrusInvitationMessage);
        
      } catch (error) {
        console.error('Error uploading invitation to Walrus:', error);
        // Fallback to localStorage if Walrus fails
        try {
          const existingInvites = JSON.parse(localStorage.getItem('channel_invites') || '[]');
          existingInvites.push(invitationData);
          localStorage.setItem('channel_invites', JSON.stringify(existingInvites));
        } catch (localError) {
          console.error('Error saving channel invitation to localStorage:', localError);
        }
      }
      
      setInviteSuccess(`Successfully invited ${formatAddress(resolvedAddress)} to the ${channelTypeText.toLowerCase()} channel!`);
      setInviteAddress('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setInviteSuccess(null), 5000);
      
    } catch (error) {
      console.error('Error inviting member:', error);
      setInviteError(`Failed to invite member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInviting(false);
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
                      
                  {/* Location Display (modern card style) */}
                      {(() => {
                        const loc = parseLocationMessage(message.text);
                        if (!loc) return null;
                        return (
                          <Box>
                            <Box
                              style={{
                                backgroundColor: 'var(--color-background-secondary)',
                                border: '1px solid var(--color-border-primary)',
                                borderRadius: '12px',
                                padding: '10px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                              }}
                            >
                              <Flex align="center" gap="2" style={{ marginBottom: '8px' }}>
                                <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                                  📍 Location
                                </Text>
                                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                                  {loc.label || 'Current location'}
                                </Text>
                              </Flex>
                              <Box style={{ position: 'relative' }}>
                                <img
                                  src={getStaticMapUrl(loc.lat, loc.lng)}
                                  alt={`Map ${loc.lat},${loc.lng}`}
                                  style={{
                                    width: '260px',
                                    height: '160px',
                                    borderRadius: '10px',
                                    objectFit: 'cover',
                                    display: 'block',
                                    backgroundColor: 'var(--color-background-tertiary)',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(getMapsLinkUrl(loc.lat, loc.lng), '_blank')}
                                />
                              </Box>
                              <Flex justify="between" align="center" style={{ marginTop: '8px' }}>
                                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                                  {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                                </Text>
                                <Flex gap="2">
                                  <Button
                                    size="1"
                                    variant="soft"
                                    onClick={() => window.open(getMapsLinkUrl(loc.lat, loc.lng), '_blank')}
                                    style={{
                                      backgroundColor: 'var(--color-background-primary)',
                                      color: 'var(--color-text-primary)',
                                      fontSize: '11px',
                                      padding: '2px 8px'
                                    }}
                                  >
                                    Open in Maps
                                  </Button>
                                  <Button
                                    size="1"
                                    variant="soft"
                                    onClick={() => navigator.clipboard.writeText(getMapsLinkUrl(loc.lat, loc.lng))}
                                    style={{
                                      backgroundColor: 'var(--color-background-primary)',
                                      color: 'var(--color-text-primary)',
                                      fontSize: '11px',
                                      padding: '2px 8px'
                                    }}
                                  >
                                    Copy Link
                                  </Button>
                                </Flex>
                              </Flex>
                            </Box>
                          </Box>
                        );
                      })()}

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
      ) : channelMetadata?.type === ChannelType.SUBSCRIPTION ? (
        <Tabs.Root defaultValue="messages" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs.List style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
            <Tabs.Trigger value="messages">Messages</Tabs.Trigger>
            <Tabs.Trigger value="subscription">Subscription</Tabs.Trigger>
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
          
          <Tabs.Content value="subscription" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <Card style={{ padding: '1rem' }}>
              <Flex direction="column" gap="3">
                <Text size="4" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                  💳 Subscription Channel
          </Text>
                
                {channelMetadata && (
                  <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                    <Flex direction="column" gap="2">
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
                        <Badge color="orange" size="1">
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
                    </Flex>
                  </Card>
                )}

                <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                  <Flex direction="column" gap="2">
                    <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                      🔒 Premium Content
                    </Text>
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      This channel contains premium content that requires a subscription.
                    </Text>
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      Subscribe to access exclusive content, discussions, and features.
                    </Text>
                  </Flex>
                </Card>

                <Flex gap="2">
                  <Button
                    size="3"
                    style={{
                      backgroundColor: 'var(--color-button-primary)',
                      color: 'var(--color-button-text)',
                      flex: 1
                    }}
                  >
                    Subscribe Now
                  </Button>
                  <Button
                    size="3"
                    onClick={() => setShowInviteModal(true)}
                    style={{
                      backgroundColor: 'var(--color-button-secondary)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    Invite
                  </Button>
                </Flex>
              </Flex>
            </Card>
          </Tabs.Content>
        </Tabs.Root>
      ) : channelMetadata?.type === ChannelType.TOKEN_GATED ? (
        <Tabs.Root defaultValue="messages" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs.List style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
            <Tabs.Trigger value="messages">Messages</Tabs.Trigger>
            <Tabs.Trigger value="access">Access Control</Tabs.Trigger>
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
          
          <Tabs.Content value="access" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <Card style={{ padding: '1rem' }}>
              <Flex direction="column" gap="3">
                <Text size="4" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                  🔐 Token-Gated Channel
                </Text>
                
                {channelMetadata && (
                  <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                    <Flex direction="column" gap="2">
                      <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                        Access Requirements
                      </Text>
                      
                      {channelMetadata.accessRules && channelMetadata.accessRules.length > 0 ? (
                        <Flex direction="column" gap="2">
                          {channelMetadata.accessRules.map((rule: any, index: number) => (
                            <Flex key={index} justify="between" align="center" p="2" style={{ 
                              backgroundColor: 'var(--color-background-tertiary)', 
                              borderRadius: 'var(--radius-2)' 
                            }}>
                              <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                                {rule.type === 'nft_ownership' && `NFT: ${rule.nftCollectionId}`}
                                {rule.type === 'token_balance' && `Token: ${rule.minBalance} ${rule.contractAddress}`}
                                {rule.type === 'sui_payment' && `Payment: ${rule.price} SUI`}
                              </Text>
                              <Badge 
                                color={
                                  rule.type === 'nft_ownership' ? 'purple' :
                                  rule.type === 'token_balance' ? 'blue' :
                                  rule.type === 'sui_payment' ? 'green' : 'gray'
                                } 
                                size="1"
                              >
                                {rule.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </Flex>
                          ))}
                        </Flex>
                      ) : (
                        <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                          No access rules configured yet.
                        </Text>
                      )}
                    </Flex>
                  </Card>
                )}

                <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                  <Flex direction="column" gap="2">
                    <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                      🔒 Exclusive Access
                    </Text>
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      This channel is restricted to users who meet the access requirements.
                    </Text>
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      Connect your wallet to check if you have the required tokens or NFTs.
                    </Text>
                  </Flex>
                </Card>

                <Flex gap="2">
                  <Button
                    size="3"
                    style={{
                      backgroundColor: 'var(--color-button-secondary)',
                      color: 'var(--color-text-primary)',
                      flex: 1
                    }}
                  >
                    Check Access
                  </Button>
                  <Button
                    size="3"
                    onClick={() => setShowInviteModal(true)}
                    style={{
                      backgroundColor: 'var(--color-button-primary)',
                      color: 'var(--color-button-text)'
                    }}
                  >
                    Invite
                  </Button>
                </Flex>
              </Flex>
            </Card>
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
                    <Button
                      size="2"
                      variant="ghost"
                      onClick={() => {
                        setShowDropdown(false);
                        requestAndSendCurrentLocation();
                      }}
                      disabled={isSharingLocation}
                      style={{
                        justifyContent: 'flex-start',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      📍 Share Location
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

      {/* Invite Modal */}
      <Dialog.Root open={showInviteModal} onOpenChange={setShowInviteModal}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Invite to Channel</Dialog.Title>
          <Dialog.Description>
            Invite someone to join {channelMetadata?.name || 'this channel'} by entering their wallet address or SuiNS name.
          </Dialog.Description>

          <Flex direction="column" gap="3" style={{ marginTop: '1rem' }}>
            <TextField.Root
              placeholder="Enter wallet address (0x...) or SuiNS name (alice.sui)"
              value={inviteAddress}
              onChange={(e) => {
                setInviteAddress(e.target.value);
                setInviteError(null);
              }}
              disabled={isInviting}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />

            {inviteError && (
              <Text size="2" style={{ color: 'var(--color-error)' }}>
                {inviteError}
              </Text>
            )}

            {inviteSuccess && (
              <Text size="2" style={{ color: 'var(--color-success)' }}>
                {inviteSuccess}
              </Text>
            )}

            <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                  📋 What happens when you invite someone:
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  • An invitation message will be posted in the channel
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  • The invited person can see the invitation and join
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  • They will gain access to channel content and discussions
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  • All channel members can participate in conversations
                </Text>
              </Flex>
            </Card>
          </Flex>

          <Flex gap="3" justify="end" style={{ marginTop: '1rem' }}>
            <Dialog.Close>
              <Button 
                variant="soft" 
                color="gray"
                disabled={isInviting}
                style={{
                  backgroundColor: 'var(--color-button-secondary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleInvite}
              disabled={!inviteAddress.trim() || isInviting}
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-text)'
              }}
            >
              {isInviting ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Manual Location Dialog */}
      <Dialog.Root open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <Dialog.Content style={{ maxWidth: 420 }}>
          <Dialog.Title>Share Location</Dialog.Title>
          <Dialog.Description>
            Enter coordinates to share your location.
          </Dialog.Description>
          <Flex direction="column" gap="3" style={{ marginTop: '1rem' }}>
            <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
              Latitude
            </Text>
            <TextField.Root
              placeholder="e.g. 41.0082"
              value={manualLatitude}
              onChange={(e) => setManualLatitude(e.target.value)}
              disabled={isSharingLocation}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />
            <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
              Longitude
            </Text>
            <TextField.Root
              placeholder="e.g. 28.9784"
              value={manualLongitude}
              onChange={(e) => setManualLongitude(e.target.value)}
              disabled={isSharingLocation}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />
            <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
              Label (optional)
            </Text>
            <TextField.Root
              placeholder="Home, Office, ..."
              value={manualLocationLabel}
              onChange={(e) => setManualLocationLabel(e.target.value)}
              disabled={isSharingLocation}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />
          </Flex>
          <Flex gap="3" justify="end" style={{ marginTop: '1rem' }}>
            <Dialog.Close>
              <Button 
                variant="soft" 
                color="gray"
                disabled={isSharingLocation}
                style={{
                  backgroundColor: 'var(--color-button-secondary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={async () => {
                const lat = parseFloat(manualLatitude);
                const lng = parseFloat(manualLongitude);
                if (Number.isNaN(lat) || Number.isNaN(lng)) {
                  alert('Please enter valid coordinates.');
                  return;
                }
                await sendLocation(lat, lng, manualLocationLabel);
                setShowLocationDialog(false);
                setManualLatitude('');
                setManualLongitude('');
                setManualLocationLabel('');
              }}
              disabled={isSharingLocation}
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-text)'
              }}
            >
              {isSharingLocation ? 'Sharing...' : 'Share'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}