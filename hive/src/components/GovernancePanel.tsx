import { useState, useEffect } from 'react';
import { Card, Flex, Text, Button, Badge, Dialog, TextField, TextArea } from '@radix-ui/themes';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { GovernanceService } from '../services/governanceService';
import { GovernanceProposal } from '../types/channel';
import { formatTimestamp } from '../utils/formatters';

interface GovernancePanelProps {
  channelId: string;
  channelName?: string;
}

export function GovernancePanel({ channelId, channelName }: GovernancePanelProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  
  // Create proposal form state
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [votingDeadline, setVotingDeadline] = useState('');
  
  const governanceService = new GovernanceService(suiClient, currentAccount, signAndExecute);

  useEffect(() => {
    loadProposals();
  }, [channelId]);

  const loadProposals = async () => {
    setIsLoading(true);
    try {
      const proposalsList = await governanceService.getProposals(channelId);
      setProposals(proposalsList);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!proposalTitle.trim() || !proposalDescription.trim() || !votingDeadline) {
      return;
    }

    setIsCreatingProposal(true);
    try {
      const deadline = new Date(votingDeadline).getTime();
      const result = await governanceService.createProposal(
        channelId,
        proposalTitle,
        proposalDescription,
        deadline
      );

      if (result.success) {
        setShowCreateProposal(false);
        setProposalTitle('');
        setProposalDescription('');
        setVotingDeadline('');
        await loadProposals();
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
    } finally {
      setIsCreatingProposal(false);
    }
  };

  const handleVote = async (proposalId: string, vote: 'yes' | 'no' | 'abstain') => {
    try {
      const result = await governanceService.castVote(channelId, proposalId, vote);
      if (result.success) {
        await loadProposals();
      }
    } catch (error) {
      console.error('Error casting vote:', error);
    }
  };

  const getVoteButtonColor = (vote: 'yes' | 'no' | 'abstain') => {
    switch (vote) {
      case 'yes': return 'green';
      case 'no': return 'red';
      case 'abstain': return 'gray';
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'blue';
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'executed': return 'purple';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Card style={{ padding: '1rem' }}>
        <Text>Loading governance proposals...</Text>
      </Card>
    );
  }

  return (
    <Card style={{ padding: '1rem' }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Text size="4" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
            DAO Governance - {channelName || 'Assembly'}
          </Text>
          <Button
            size="2"
            onClick={() => setShowCreateProposal(true)}
            disabled={!currentAccount}
            style={{
              backgroundColor: 'var(--color-button-primary)',
              color: 'var(--color-button-text)'
            }}
          >
            Create Proposal
          </Button>
        </Flex>

        {proposals.length === 0 ? (
          <Text style={{ color: 'var(--color-text-muted)' }}>
            No proposals yet. Create the first proposal to start governance discussions.
          </Text>
        ) : (
          <Flex direction="column" gap="3">
            {proposals.map((proposal) => (
              <Card key={proposal.id} style={{ padding: '1rem' }}>
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                      {proposal.title}
                    </Text>
                    <Badge color={getProposalStatusColor(proposal.status)}>
                      {proposal.status.toUpperCase()}
                    </Badge>
                  </Flex>
                  
                  <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                    {proposal.description}
                  </Text>
                  
                  <Flex justify="between" align="center">
                    <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                      Proposed by {formatAddress(proposal.proposer)} • {formatTimestamp(proposal.createdAt)}
                    </Text>
                    <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                      Voting ends: {formatTimestamp(proposal.votingDeadline)}
                    </Text>
                  </Flex>

                  <Flex justify="between" align="center">
                    <Flex gap="2">
                      <Text size="2" style={{ color: 'var(--color-success)' }}>
                        Yes: {proposal.votes.yes}
                      </Text>
                      <Text size="2" style={{ color: 'var(--color-error)' }}>
                        No: {proposal.votes.no}
                      </Text>
                      <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                        Abstain: {proposal.votes.abstain}
                      </Text>
                    </Flex>
                    
                    {proposal.status === 'active' && currentAccount && (
                      <Flex gap="2">
                        <Button
                          size="1"
                          color={getVoteButtonColor('yes')}
                          onClick={() => handleVote(proposal.id, 'yes')}
                          disabled={proposal.userVote !== undefined}
                        >
                          YES
                        </Button>
                        <Button
                          size="1"
                          color={getVoteButtonColor('no')}
                          onClick={() => handleVote(proposal.id, 'no')}
                          disabled={proposal.userVote !== undefined}
                        >
                          NO
                        </Button>
                        <Button
                          size="1"
                          color={getVoteButtonColor('abstain')}
                          onClick={() => handleVote(proposal.id, 'abstain')}
                          disabled={proposal.userVote !== undefined}
                        >
                          ABSTAIN
                        </Button>
                      </Flex>
                    )}
                  </Flex>

                  {proposal.userVote && (
                    <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                      Your vote: {proposal.userVote.toUpperCase()}
                    </Text>
                  )}
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Flex>

      {/* Create Proposal Dialog */}
      <Dialog.Root open={showCreateProposal} onOpenChange={setShowCreateProposal}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Create New Proposal</Dialog.Title>
          <Dialog.Description>
            Create a new governance proposal for this DAO assembly.
          </Dialog.Description>

          <Flex direction="column" gap="3" style={{ marginTop: '1rem' }}>
            <TextField.Root
              placeholder="Proposal title"
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />

            <TextArea
              placeholder="Proposal description"
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)',
                minHeight: '100px'
              }}
            />

            <TextField.Root
              type="datetime-local"
              placeholder="Voting deadline"
              value={votingDeadline}
              onChange={(e) => setVotingDeadline(e.target.value)}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />
          </Flex>

          <Flex gap="3" justify="end" style={{ marginTop: '1rem' }}>
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleCreateProposal}
              disabled={!proposalTitle.trim() || !proposalDescription.trim() || !votingDeadline || isCreatingProposal}
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-text)'
              }}
            >
              {isCreatingProposal ? 'Creating...' : 'Create Proposal'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}

// Helper function to format addresses
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
