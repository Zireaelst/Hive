import { useState, useEffect, useCallback } from 'react';
import { useMessaging } from './useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { LiveSupportService, SUPPORT_TEAM_ADDRESS } from '../services/liveSupportService';
import { trackEvent, trackError } from '../utils/analytics';

export interface LiveSupportState {
  isOpen: boolean;
  isSending: boolean;
  error: string | null;
  hasSentSupport: boolean;
  hasOptedOut: boolean;
  shouldShowPrompt: boolean;
  showBubble: boolean;
}

export const useLiveSupport = () => {
  const { createChannel, sendMessage, isReady, channels, fetchChannels } = useMessaging();
  const currentAccount = useCurrentAccount();

  const [state, setState] = useState<LiveSupportState>({
    isOpen: false,
    isSending: false,
    error: null,
    hasSentSupport: LiveSupportService.hasSentSupport(),
    hasOptedOut: LiveSupportService.hasOptedOut(),
    shouldShowPrompt: false,
    showBubble: false,
  });

  // Always show support bubble when wallet is connected
  useEffect(() => {
    setState(prev => ({
      ...prev,
      shouldShowPrompt: false, // Don't auto-show prompt
      showBubble: true, // Always show bubble when connected
    }));
  }, []);

  // Track interaction
  const trackInteraction = useCallback(() => {
    if (!LiveSupportService.hasOptedOut()) {
      LiveSupportService.incrementInteractionCount();
      const interactionCount = LiveSupportService.getInteractionCount();

      // Check if we should now show the prompt (only if not already shown)
      if (LiveSupportService.shouldShowSupport() && !state.isOpen && !LiveSupportService.hasShownCard()) {
        setState(prev => ({
          ...prev,
          shouldShowPrompt: true,
          isOpen: true,
          showBubble: true,  // Also show bubble when card opens
        }));
        LiveSupportService.markCardShown();
        trackEvent('support_shown', { trigger: 'auto' });
      } else if (interactionCount >= 2 && !LiveSupportService.hasOptedOut()) {
        // Just show the bubble if we've already shown the card before
        setState(prev => ({
          ...prev,
          showBubble: true,
        }));
      }
    }
  }, [state.isOpen]);

  // Open support card
  const openSupport = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      error: null,
    }));
    trackEvent('support_shown', { trigger: 'manual' });
  }, []);

  // Close support card
  const closeSupport = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      shouldShowPrompt: false,  // Reset this to prevent re-opening
      error: null,
    }));
    trackEvent('support_dismissed');
  }, []);

  // Handle opt out
  const handleOptOut = useCallback((optOut: boolean) => {
    LiveSupportService.setOptOut(optOut);
    setState(prev => ({
      ...prev,
      hasOptedOut: optOut,
      showBubble: !optOut && LiveSupportService.getInteractionCount() >= 2,
    }));
    if (optOut) {
      trackEvent('support_opt_out');
    }
  }, []);

  // Get or create support channel
  const getOrCreateSupportChannel = useCallback(async (): Promise<string | null> => {
    // Check if we already have a channel ID stored
    let channelId = LiveSupportService.getSupportChannelId();

    if (!channelId) {
      // Fetch current channels if needed
      if (channels.length === 0) {
        await fetchChannels();
      }

      // Look for existing direct channel with support team (exactly 2 members)
      const supportChannel = channels.find(channel => {
        const members = channel.auth.member_permissions.contents;

        // Must be a direct channel (2 members only)
        if (members.length !== 2) return false;

        // Check if one of the members is the support team
        const hasSupportTeam = members.some((member: any) => {
          // Member might be an object with address property or a string
          const memberAddress = typeof member === 'string' ? member : member.address;
          return memberAddress &&
                 memberAddress.toLowerCase() === SUPPORT_TEAM_ADDRESS.toLowerCase();
        });

        return hasSupportTeam;
      });

      if (supportChannel) {
        // Found existing channel, store and use it
        channelId = supportChannel.id.id as string;
        LiveSupportService.setSupportChannelId(channelId);
        trackEvent('support_submitted', { action: 'channel_reused', channel_id: channelId });
      } else {
        // Create new channel with support team
        const result = await createChannel([SUPPORT_TEAM_ADDRESS]);

        if (result && result.channelId) {
          channelId = result.channelId as string;
          LiveSupportService.setSupportChannelId(channelId);
          trackEvent('support_submitted', { action: 'channel_created', channel_id: channelId });
        } else {
          return null;
        }
      }
    }

    return channelId;
  }, [createChannel, channels, fetchChannels]);

  // Submit support message
  const submitSupportMessage = useCallback(async (
    message: string,
    priority: string,
    category: string
  ) => {
    if (!isReady || !currentAccount) {
      setState(prev => ({
        ...prev,
        error: 'Wallet not connected or messaging not ready',
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      isSending: true,
      error: null,
    }));

    try {
      // Get or create support channel
      const channelId = await getOrCreateSupportChannel();

      if (!channelId) {
        throw new Error('Failed to create support channel');
      }

      // Format support message
      const supportMessage = LiveSupportService.formatSupportMessage(
        message,
        currentAccount.address,
        priority as 'low' | 'medium' | 'high',
        category as 'technical' | 'billing' | 'general' | 'bug_report'
      );

      // Send support message
      const result = await sendMessage(channelId, supportMessage);

      if (result) {
        // Mark support as sent
        LiveSupportService.markSupportSent();

        setState(prev => ({
          ...prev,
          isSending: false,
          isOpen: false,
          hasSentSupport: true,
          showBubble: LiveSupportService.getInteractionCount() >= 2 && !LiveSupportService.hasOptedOut(),
          error: null,
        }));

        trackEvent('support_submitted', {
          priority,
          category,
          has_message: !!message ? 1 : 0,
          channel_id: channelId,
        });

        return true;
      } else {
        throw new Error('Failed to send support message');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setState(prev => ({
        ...prev,
        isSending: false,
        error: errorMessage,
      }));

      trackError('support_submit', errorMessage);

      return false;
    }
  }, [isReady, currentAccount, getOrCreateSupportChannel, sendMessage]);

  return {
    ...state,
    openSupport,
    closeSupport,
    submitSupportMessage,
    handleOptOut,
    trackInteraction,
  };
};
