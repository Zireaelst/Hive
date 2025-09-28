// Channel Types and Interfaces

export enum ChannelType {
  STANDARD = 'standard',
  TOKEN_GATED = 'token_gated',
  DAO_ASSEMBLY = 'dao_assembly',
  SUBSCRIPTION = 'subscription'
}

export enum AccessRuleType {
  NFT_OWNERSHIP = 'nft_ownership',
  TOKEN_BALANCE = 'token_balance',
  SUI_PAYMENT = 'sui_payment',
  GOVERNANCE_TOKEN = 'governance_token'
}

export interface AccessRule {
  type: AccessRuleType;
  // For NFT ownership
  nftCollectionId?: string;
  nftName?: string;
  // For token balance
  tokenType?: string;
  minBalance?: string;
  // For SUI payment
  amount?: string; // in SUI
  // For governance token
  governanceTokenType?: string;
}

export interface ChannelMetadata {
  name: string;
  description?: string;
  type: ChannelType;
  accessRules?: AccessRule[];
  creatorAddress: string;
  createdAt: number;
  // For DAO assemblies
  daoName?: string;
  governanceToken?: string;
  // For subscription channels
  subscriptionPrice?: string;
  subscriptionPeriod?: 'monthly' | 'yearly';
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  createdAt: number;
  votingDeadline: number;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
  userVote?: 'yes' | 'no' | 'abstain';
  status: 'active' | 'passed' | 'failed' | 'executed';
}

export interface VoteResult {
  proposalId: string;
  voter: string;
  vote: 'yes' | 'no' | 'abstain';
  timestamp: number;
  transactionHash: string;
}
