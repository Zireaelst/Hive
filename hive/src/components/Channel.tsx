import { useEffect, useState, useRef } from 'react';
import { Card, Flex, Text, Box, Button, TextField, Badge } from '@radix-ui/themes';
import { useMessaging } from '../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { formatTimestamp, formatAddress } from '../utils/formatters';
import { trackEvent, trackError, AnalyticsEvents } from '../utils/analytics';
import { walrusService } from '../services/walrusService';
import { suinsService } from '../services/suinsService';
import { useVoiceRecording } from '../hooks/useVoiceRecording';

interface ChannelProps {
  channelId: string;
  onBack: () => void;
}

export function Channel({ channelId, onBack }: ChannelProps) {
  const currentAccount = useCurrentAccount();
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
  } = useMessaging();

  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [addressNames, setAddressNames] = useState<Map<string, string>>(new Map());
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice recording hook
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error: voiceError,
    availableDevices,
    selectedDeviceId,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    formatTime,
    getAudioDevices,
    setSelectedDevice,
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
              <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>Channel</Text>
              {currentChannel && (
                <Text size="1" style={{ display: 'block', color: 'var(--color-text-muted)' }}>
                  {formatAddress(currentChannel.id.id)}
                </Text>
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

      {/* Messages Area */}
      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
              const fileInfo = parseFileMessage(message.text);
              
              return (
                <Box
                  key={index}
                  style={{
                    alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    minWidth: '120px',
                  }}
                >
                  <Box
                    p="2"
                    style={{
                      backgroundColor: isOwnMessage ? 'var(--color-message-own)' : 'var(--color-message-other)',
                      borderRadius: 'var(--radius-3)',
                      width: 'fit-content',
                      maxWidth: '100%',
                    }}
                  >
                    <Flex direction="column" gap="1">
                      <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                        {isOwnMessage ? 'You' : (addressNames.get(message.sender) || formatAddress(message.sender))}
                      </Text>
                      
                      {fileInfo ? (
                        <Box>
                          {/* Show voice message player */}
                          {fileInfo.isVoice && fileInfo.isWalrus && fileInfo.blobId ? (
                            <Box style={{ marginBottom: '8px' }}>
                              <Flex align="center" gap="2" style={{ marginBottom: '8px' }}>
                                <Text size="2">🎤</Text>
                                <Text size="2" weight="bold" style={{ color: 'var(--color-message-text)' }}>
                                  Voice Message
                                </Text>
                                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                                  ({fileInfo.fileSize})
                                </Text>
                              </Flex>
                              <audio 
                                controls 
                                style={{ 
                                  width: '100%', 
                                  maxWidth: '300px',
                                  height: '32px'
                                }}
                                src={walrusService.getFileUrl(fileInfo.blobId)}
                              />
                              <Flex align="center" gap="2" style={{ marginTop: '4px' }}>
                                <Button
                                  size="1"
                                  variant="soft"
                                  onClick={() => downloadFile(fileInfo.blobId, `${fileInfo.fileName}.webm`)}
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
                            </Box>
                          ) : /* Show image directly if it's a Walrus image */
                          fileInfo.isWalrus && fileInfo.blobId && walrusService.isImageFile(fileInfo.fileName) ? (
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
                              <Flex align="center" gap="2" style={{ marginTop: '4px' }}>
                                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                                  {fileInfo.fileName} ({fileInfo.fileSize})
                                </Text>
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
                            </Box>
                          ) : (
                            /* Show file info for non-image files */
                            <Flex align="center" gap="2" style={{ marginBottom: '8px' }}>
                              <Text size="2">📎</Text>
                              <Text size="2" weight="bold" style={{ color: 'var(--color-message-text)' }}>
                                {fileInfo.fileName}
                              </Text>
                              {fileInfo.fileSize && (
                                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                                  ({fileInfo.fileSize})
                                </Text>
                              )}
                              <Button
                                size="1"
                                variant="soft"
                                onClick={() => {
                                  if (fileInfo.isWalrus && fileInfo.blobId) {
                                    // Handle Walrus files
                                    downloadFile(fileInfo.blobId, fileInfo.fileName);
                                  } else if (fileInfo.isLegacy) {
                                    // Handle legacy base64 files
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
                                  } else if (fileInfo.isIndexedDB && fileInfo.fileId) {
                                    // Handle IndexedDB files (fallback)
                                    alert('This file format is no longer supported. Please ask the sender to resend the file.');
                                  }
                                }}
                                style={{
                                  backgroundColor: 'var(--color-button-secondary)',
                                  color: 'var(--color-text-primary)',
                                  fontSize: '12px',
                                  padding: '2px 8px'
                                }}
                              >
                                Download
                              </Button>
                            </Flex>
                          )}
                          {fileInfo.message && fileInfo.message !== 'File shared' && fileInfo.message !== 'Voice message' && (
                            <Text size="2" style={{ 
                              color: 'var(--color-message-text)',
                              wordWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              marginBottom: '8px'
                            }}>
                              {fileInfo.message}
                            </Text>
                          )}
                        </Box>
                      ) : (
                        <Text size="2" style={{ 
                          color: 'var(--color-message-text)',
                          wordWrap: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {message.text}
                        </Text>
                      )}
                      
                      <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                        {formatTimestamp(message.createdAtMs)}
                      </Text>
                    </Flex>
                  </Box>
                </Box>
              );
            })}
          </Flex>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />

        {isFetchingMessages && messages.length === 0 && (
          <Box style={{ textAlign: 'center', padding: '32px' }}>
            <Text size="2" style={{ color: 'var(--color-text-muted)' }}>Loading messages...</Text>
          </Box>
        )}
      </Box>

      {/* Error Display */}
      {channelError && (
        <Box p="3" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
          <Text size="2" style={{ color: 'var(--color-error)' }}>
            Error: {channelError}
          </Text>
        </Box>
      )}

      {/* Message Input */}
      <Box p="3" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
        {/* Voice Recording UI */}
        {showVoiceRecorder && (
          <Box p="3" style={{ 
            backgroundColor: 'var(--color-background-secondary)', 
            borderRadius: 'var(--radius-2)',
            marginBottom: '8px',
            border: '1px solid var(--color-border-primary)'
          }}>
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                  🎤 Voice Message
                </Text>
                <Button
                  size="1"
                  variant="ghost"
                  onClick={() => {
                    setShowVoiceRecorder(false);
                    clearRecording();
                  }}
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  ✕
                </Button>
              </Flex>
              
              {/* Audio Device Selection */}
              <Flex direction="column" gap="2">
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  Select Microphone:
                </Text>
                <Flex gap="2" align="center" wrap="wrap">
                  <select
                    value={selectedDeviceId || ''}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border-primary)',
                      backgroundColor: 'var(--color-input-background)',
                      color: 'var(--color-input-text)',
                      fontSize: '12px',
                      minWidth: '200px'
                    }}
                  >
                    {availableDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="1"
                    variant="soft"
                    onClick={getAudioDevices}
                    style={{
                      backgroundColor: 'var(--color-background-secondary)',
                      color: 'var(--color-text-primary)',
                      fontSize: '10px',
                      padding: '2px 6px'
                    }}
                  >
                    🔄 Refresh
                  </Button>
                </Flex>
              </Flex>
              
              {voiceError && (
                <Text size="1" style={{ color: 'var(--color-error)' }}>
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
                  
                  {/* Debug info */}
                  <Text size="1" style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    Status: {isRecording ? 'Recording' : 'Stopped'} | 
                    Paused: {isPaused ? 'Yes' : 'No'} | 
                    Time: {formatTime(recordingTime)}
                  </Text>
                  
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
                        <Button
                          size="1"
                          variant="soft"
                          onClick={async () => {
                            try {
                              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                              console.log('Microphone test successful:', stream.getAudioTracks());
                              alert('Microphone is working! You can start recording.');
                              stream.getTracks().forEach(track => track.stop());
                            } catch (error) {
                              console.error('Microphone test failed:', error);
                              alert('Microphone test failed: ' + (error as Error).message);
                            }
                          }}
                          style={{
                            backgroundColor: 'var(--color-background-secondary)',
                            color: 'var(--color-text-primary)'
                          }}
                        >
                          🔍 Test Mic
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
                            backgroundColor: 'var(--color-button-primary)',
                            color: 'var(--color-button-text)'
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
                  <Flex align="center" gap="2">
                    <Text size="2">🎤</Text>
                    <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                      Voice Message ({formatTime(recordingTime)})
                    </Text>
                  </Flex>
                  
                  <audio 
                    controls 
                    style={{ 
                      width: '100%', 
                      height: '32px'
                    }}
                    src={audioUrl || undefined}
                  />
                  
                  <Flex gap="2">
                    <Button
                      size="1"
                      variant="soft"
                      onClick={clearRecording}
                      style={{
                        backgroundColor: 'var(--color-button-secondary)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      🗑️ Delete
                    </Button>
                    <Button
                      size="1"
                      variant="soft"
                      onClick={() => {
                        clearRecording();
                        setShowVoiceRecorder(false);
                      }}
                      style={{
                        backgroundColor: 'var(--color-button-secondary)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      ✏️ Re-record
                    </Button>
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Box>
        )}

        {/* File Preview */}
        {selectedFile && (
          <Box p="2" style={{ 
            backgroundColor: 'var(--color-background-secondary)', 
            borderRadius: 'var(--radius-2)',
            marginBottom: '8px',
            border: '1px solid var(--color-border-primary)'
          }}>
            <Flex justify="between" align="center">
              <Flex align="center" gap="2">
                <Text size="2">📎</Text>
                <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedFile.name} ({walrusService.formatFileSize(selectedFile.size)})
                </Text>
                {isUploading && (
                  <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                    Uploading to Walrus...
                  </Text>
                )}
              </Flex>
              <Button
                size="1"
                variant="ghost"
                onClick={handleRemoveFile}
                style={{ color: 'var(--color-text-muted)' }}
                disabled={isUploading}
              >
                ✕
              </Button>
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
          </Flex>
        </form>
      </Box>

      {/* Channel Details */}
      {currentChannel && (
        <Box p="3" style={{ 
          borderTop: '1px solid var(--color-border-primary)',
          backgroundColor: 'var(--color-background-primary)'
        }}>
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
              Channel Details
            </Text>
            <Flex gap="4" wrap="wrap">
              <Box>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  Channel ID
                </Text>
                <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                  {formatAddress(currentChannel.id.id)}
                </Text>
              </Box>
              <Box>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  Messages
                </Text>
                <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                  {currentChannel.messages_count}
                </Text>
              </Box>
              <Box>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  Members
                </Text>
                <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                  {currentChannel.auth.member_permissions.contents.length}
                </Text>
              </Box>
              <Box>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  Created
                </Text>
                <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                  {formatTimestamp(currentChannel.created_at_ms)}
                </Text>
              </Box>
            </Flex>
            {currentChannel.last_message && (
              <Box style={{ marginTop: '0.5rem' }}>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  Last Message
                </Text>
                <Text size="2" style={{ color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                  {currentChannel.last_message.text}
                </Text>
                <Flex gap="2" align="center" style={{ marginTop: '0.25rem' }}>
                  <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                    from: {addressNames.get(currentChannel.last_message.sender) || formatAddress(currentChannel.last_message.sender)}
                  </Text>
                  <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                    • {formatTimestamp(currentChannel.last_message.createdAtMs)}
                  </Text>
                </Flex>
              </Box>
            )}
          </Flex>
        </Box>
      )}
    </Card>
  );
}