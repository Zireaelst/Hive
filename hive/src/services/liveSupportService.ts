export const SUPPORT_TEAM_ADDRESS = '0x405375e5ff599e7f16e8af8ffeb7a8cae30685a98f06500058b0e05c726a91ed';

export interface SupportMessage {
  type: 'support_request';
  message: string;
  timestamp: number;
  userAddress: string;
  priority: 'low' | 'medium' | 'high';
  category?: 'technical' | 'billing' | 'general' | 'bug_report';
}

export class LiveSupportService {
  private static SUPPORT_CHANNEL_KEY = 'support_channel_id';
  private static SUPPORT_SENT_KEY = 'support_sent';
  private static SUPPORT_OPT_OUT_KEY = 'support_opt_out';
  private static SUPPORT_CARD_SHOWN_KEY = 'support_card_shown';
  private static INTERACTION_COUNT_KEY = 'interaction_count';
  private static INTERACTION_THRESHOLD = 2; // Show support after 2 interactions

  static getSupportChannelId(): string | null {
    return localStorage.getItem(this.SUPPORT_CHANNEL_KEY);
  }

  static setSupportChannelId(channelId: string): void {
    localStorage.setItem(this.SUPPORT_CHANNEL_KEY, channelId);
  }

  static hasSentSupport(): boolean {
    return localStorage.getItem(this.SUPPORT_SENT_KEY) === 'true';
  }

  static markSupportSent(): void {
    localStorage.setItem(this.SUPPORT_SENT_KEY, 'true');
    this.resetInteractionCount();
  }

  static hasOptedOut(): boolean {
    return localStorage.getItem(this.SUPPORT_OPT_OUT_KEY) === 'true';
  }

  static setOptOut(optOut: boolean): void {
    localStorage.setItem(this.SUPPORT_OPT_OUT_KEY, optOut.toString());
  }

  static hasShownCard(): boolean {
    return localStorage.getItem(this.SUPPORT_CARD_SHOWN_KEY) === 'true';
  }

  static markCardShown(): void {
    localStorage.setItem(this.SUPPORT_CARD_SHOWN_KEY, 'true');
  }

  static getInteractionCount(): number {
    const count = localStorage.getItem(this.INTERACTION_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  }

  static incrementInteractionCount(): void {
    const current = this.getInteractionCount();
    localStorage.setItem(this.INTERACTION_COUNT_KEY, (current + 1).toString());
  }

  static resetInteractionCount(): void {
    localStorage.setItem(this.INTERACTION_COUNT_KEY, '0');
  }

  static shouldShowSupport(): boolean {
    // Don't show if user opted out or already shown the card automatically
    if (this.hasOptedOut() || this.hasShownCard()) {
      return false;
    }
    // Show if interaction threshold is reached
    return this.getInteractionCount() >= this.INTERACTION_THRESHOLD;
  }

  static formatSupportMessage(
    message: string,
    userAddress: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    category: 'technical' | 'billing' | 'general' | 'bug_report' = 'general'
  ): string {
    const supportData: SupportMessage = {
      type: 'support_request',
      message,
      priority,
      category,
      timestamp: Date.now(),
      userAddress,
    };
    return JSON.stringify(supportData, null, 2);
  }
}
