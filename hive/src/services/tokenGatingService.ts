import { AccessRule, AccessRuleType } from '../types/channel';

export class TokenGatingService {
  private suiClient: any;
  private currentAccount: any;

  constructor(suiClient: any, currentAccount: any) {
    this.suiClient = suiClient;
    this.currentAccount = currentAccount;
  }

  /**
   * Check if user meets access requirements for a channel
   */
  async checkAccess(accessRules: AccessRule[]): Promise<{ hasAccess: boolean; reason?: string }> {
    if (!this.currentAccount) {
      return { hasAccess: false, reason: 'No wallet connected' };
    }

    for (const rule of accessRules) {
      const result = await this.checkRule(rule);
      if (!result.hasAccess) {
        return result;
      }
    }

    return { hasAccess: true };
  }

  /**
   * Check individual access rule
   */
  private async checkRule(rule: AccessRule): Promise<{ hasAccess: boolean; reason?: string }> {
    switch (rule.type) {
      case AccessRuleType.NFT_OWNERSHIP:
        return this.checkNFTOwnership(rule);
      case AccessRuleType.TOKEN_BALANCE:
        return this.checkTokenBalance(rule);
      case AccessRuleType.SUI_PAYMENT:
        return this.checkSUIPayment(rule);
      case AccessRuleType.GOVERNANCE_TOKEN:
        return this.checkGovernanceToken(rule);
      default:
        return { hasAccess: false, reason: 'Unknown access rule type' };
    }
  }

  /**
   * Check if user owns required NFT
   */
  async checkNftOwnership(address: string, nftCollectionId: string): Promise<boolean> {
    try {
      const objects = await this.suiClient.getOwnedObjects({
        owner: address,
        filter: {
          StructType: nftCollectionId,
        },
        options: {
          showContent: true,
        },
      });

      return objects.data.length > 0;
    } catch (error) {
      console.error('Error checking NFT ownership:', error);
      return false;
    }
  }

  /**
   * Check if user owns required NFT (internal method)
   */
  private async checkNFTOwnership(rule: AccessRule): Promise<{ hasAccess: boolean; reason?: string }> {
    if (!rule.nftCollectionId) {
      return { hasAccess: false, reason: 'NFT collection ID not specified' };
    }

    try {
      const objects = await this.suiClient.getOwnedObjects({
        owner: this.currentAccount.address,
        filter: {
          StructType: rule.nftCollectionId,
        },
        options: {
          showContent: true,
        },
      });

      const hasNFT = objects.data.length > 0;
      return {
        hasAccess: hasNFT,
        reason: hasNFT ? undefined : `You need to own ${rule.nftName || 'the required NFT'} to access this channel`
      };
    } catch (error) {
      console.error('Error checking NFT ownership:', error);
      return { hasAccess: false, reason: 'Error checking NFT ownership' };
    }
  }

  /**
   * Check if user has required token balance
   */
  async checkTokenBalance(rule: AccessRule): Promise<{ hasAccess: boolean; reason?: string }> {
    if (!rule.tokenType || !rule.minBalance) {
      return { hasAccess: false, reason: 'Token type or minimum balance not specified' };
    }

    try {
      const objects = await this.suiClient.getOwnedObjects({
        owner: this.currentAccount.address,
        filter: {
          StructType: rule.tokenType,
        },
        options: {
          showContent: true,
        },
      });

      let totalBalance = 0;
      for (const obj of objects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const balance = obj.data.content.fields.balance || '0';
          totalBalance += parseInt(balance);
        }
      }

      const minBalance = parseInt(rule.minBalance);
      const hasBalance = totalBalance >= minBalance;
      
      return {
        hasAccess: hasBalance,
        reason: hasBalance ? undefined : `You need at least ${rule.minBalance} tokens to access this channel`
      };
    } catch (error) {
      console.error('Error checking token balance:', error);
      return { hasAccess: false, reason: 'Error checking token balance' };
    }
  }

  /**
   * Check if user has made required SUI payment
   */
  private async checkSUIPayment(_rule: AccessRule): Promise<{ hasAccess: boolean; reason?: string }> {
    // This would typically check against a payment contract or database
    // For now, we'll implement a simple check
    return { hasAccess: false, reason: 'SUI payment verification not implemented yet' };
  }

  /**
   * Check if user has governance token
   */
  private async checkGovernanceToken(rule: AccessRule): Promise<{ hasAccess: boolean; reason?: string }> {
    if (!rule.governanceTokenType) {
      return { hasAccess: false, reason: 'Governance token type not specified' };
    }

    try {
      const objects = await this.suiClient.getOwnedObjects({
        owner: this.currentAccount.address,
        filter: {
          StructType: rule.governanceTokenType,
        },
        options: {
          showContent: true,
        },
      });

      const hasToken = objects.data.length > 0;
      return {
        hasAccess: hasToken,
        reason: hasToken ? undefined : 'You need the DAO governance token to access this assembly'
      };
    } catch (error) {
      console.error('Error checking governance token:', error);
      return { hasAccess: false, reason: 'Error checking governance token' };
    }
  }

  /**
   * Get user's NFT collections
   */
  async getUserNFTs(): Promise<Array<{ type: string; name?: string; image?: string }>> {
    if (!this.currentAccount) return [];

    try {
      const objects = await this.suiClient.getOwnedObjects({
        owner: this.currentAccount.address,
        filter: {
          StructType: '0x2::nft::Nft',
        },
        options: {
          showContent: true,
        },
      });

      return objects.data.map((obj: any) => ({
        type: obj.data?.type || '',
        name: obj.data?.content?.fields?.name || 'Unknown NFT',
        image: obj.data?.content?.fields?.url || '',
      }));
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      return [];
    }
  }

  /**
   * Get user's token balances
   */
  async getUserTokenBalances(): Promise<Array<{ type: string; balance: string; symbol?: string }>> {
    if (!this.currentAccount) return [];

    try {
      const objects = await this.suiClient.getOwnedObjects({
        owner: this.currentAccount.address,
        filter: {
          StructType: '0x2::coin::Coin',
        },
        options: {
          showContent: true,
        },
      });

      const tokenMap = new Map<string, { balance: number; symbol?: string }>();

      for (const obj of objects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const type = obj.data.type;
          const balance = parseInt(obj.data.content.fields.balance || '0');
          
          if (tokenMap.has(type)) {
            tokenMap.get(type)!.balance += balance;
          } else {
            tokenMap.set(type, { balance, symbol: this.getTokenSymbol(type) });
          }
        }
      }

      return Array.from(tokenMap.entries()).map(([type, data]) => ({
        type,
        balance: data.balance.toString(),
        symbol: data.symbol,
      }));
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  }

  private getTokenSymbol(type: string): string {
    // Extract symbol from token type
    const parts = type.split('::');
    return parts[parts.length - 1] || 'Unknown';
  }
}
