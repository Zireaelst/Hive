import { useState, useEffect } from 'react';
import { Card, Flex, Text, Button, Badge, Dialog, TextField, TextArea, Tabs } from '@radix-ui/themes';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { GovernanceService } from '../services/governanceService';
import { GovernanceProposal } from '../types/channel';
import { formatTimestamp, formatAddress } from '../utils/formatters';
import { suinsService } from '../services/suinsService';
import { useMessaging } from '../hooks/useMessaging';
import { isValidSuiAddress } from '@mysten/sui/utils';

interface GovernancePanelProps {
  channelId: string;
  channelName?: string;
}

export function GovernancePanel({ channelId, channelName }: GovernancePanelProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { sendMessage } = useMessaging();
  
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  
  // Create proposal form state
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [votingDeadline, setVotingDeadline] = useState('');
  
  // Member management state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  
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

  const handleAddMember = async () => {
    if (!newMemberAddress.trim()) {
      setMemberError('Please enter a wallet address or SuiNS name');
      return;
    }

    setIsAddingMember(true);
    setMemberError(null);
    setMemberSuccess(null);

    try {
      // Resolve SuiNS name to address if needed
      let resolvedAddress = newMemberAddress.trim();
      
      // Check if it's a SuiNS name (contains .sui)
      if (newMemberAddress.includes('.sui')) {
        const resolved = await suinsService.resolveToAddress(newMemberAddress);
        if (resolved && isValidSuiAddress(resolved)) {
          resolvedAddress = resolved;
        } else {
          setMemberError(`Invalid SuiNS name: ${newMemberAddress}`);
          setIsAddingMember(false);
          return;
        }
      } else if (!isValidSuiAddress(newMemberAddress)) {
        setMemberError(`Invalid wallet address: ${newMemberAddress}`);
        setIsAddingMember(false);
        return;
      }

      // Check if user is trying to add themselves
      if (currentAccount && resolvedAddress.toLowerCase() === currentAccount.address.toLowerCase()) {
        setMemberError('You cannot add your own address. You are already a member.');
        setIsAddingMember(false);
        return;
      }

      // Send invitation message to the channel
      const invitationMessage = `🔗 **DAO Assembly Invitation**\n\n${formatAddress(resolvedAddress)} has been invited to join this DAO Assembly.\n\nInvited by: ${formatAddress(currentAccount?.address || '')}\n\nPlease connect your wallet to participate in governance discussions.`;
      
      await sendMessage(channelId, invitationMessage);
      
      // Save invitation to localStorage for the invited user
      const invitation = {
        id: `invite-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        channelId: channelId,
        channelName: channelName || 'DAO Assembly',
        inviterAddress: currentAccount?.address || '',
        invitedAddress: resolvedAddress,
        message: invitationMessage,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      // Load existing invites and add new one
      try {
        const existingInvites = JSON.parse(localStorage.getItem('dao_invites') || '[]');
        existingInvites.push(invitation);
        localStorage.setItem('dao_invites', JSON.stringify(existingInvites));
      } catch (error) {
        console.error('Error saving DAO invitation:', error);
      }
      
      setMemberSuccess(`Successfully invited ${formatAddress(resolvedAddress)} to the DAO Assembly!`);
      setNewMemberAddress('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setMemberSuccess(null), 5000);
      
    } catch (error) {
      console.error('Error adding member:', error);
      setMemberError(`Failed to add member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingMember(false);
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
          <Flex gap="2">
            <Button
              size="2"
              onClick={() => setShowAddMember(true)}
              disabled={!currentAccount}
              style={{
                backgroundColor: 'var(--color-button-secondary)',
                color: 'var(--color-text-primary)'
              }}
            >
              Add Member
            </Button>
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
        </Flex>

        <Tabs.Root defaultValue="proposals" style={{ marginTop: '1rem' }}>
          <Tabs.List>
            <Tabs.Trigger value="proposals">Proposals</Tabs.Trigger>
            <Tabs.Trigger value="members">Members</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="proposals">

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
          </Tabs.Content>

          <Tabs.Content value="members">
            <Flex direction="column" gap="3">
              <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                DAO Assembly Members
              </Text>
              
              <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                <Flex direction="column" gap="2">
                  <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                    💡 <strong>How to add members:</strong>
                  </Text>
                  <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                    • Click "Add Member" button above
                  </Text>
                  <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                    • Enter wallet address (0x...) or SuiNS name (alice.sui)
                  </Text>
                  <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                    • An invitation message will be sent to the channel
                  </Text>
                  <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                    • Members can join by connecting their wallet
                  </Text>
                </Flex>
              </Card>

              <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                Member management is handled through the messaging system. All members who have access to this channel can participate in governance discussions and voting.
              </Text>
            </Flex>
          </Tabs.Content>
        </Tabs.Root>
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

      {/* Add Member Dialog */}
      <Dialog.Root open={showAddMember} onOpenChange={setShowAddMember}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Add DAO Assembly Member</Dialog.Title>
          <Dialog.Description>
            Invite a new member to join this DAO Assembly by entering their wallet address or SuiNS name.
          </Dialog.Description>

          <Flex direction="column" gap="3" style={{ marginTop: '1rem' }}>
            <TextField.Root
              placeholder="Enter wallet address (0x...) or SuiNS name (alice.sui)"
              value={newMemberAddress}
              onChange={(e) => {
                setNewMemberAddress(e.target.value);
                setMemberError(null);
              }}
              disabled={isAddingMember}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />

            {memberError && (
              <Text size="2" style={{ color: 'var(--color-error)' }}>
                {memberError}
              </Text>
            )}

            {memberSuccess && (
              <Text size="2" style={{ color: 'var(--color-success)' }}>
                {memberSuccess}
              </Text>
            )}

            <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                  📋 What happens when you add a member:
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  • An invitation message will be posted in the channel
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  • The invited person can see the invitation and join
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  • They will gain access to governance discussions and voting
                </Text>
                <Text size="1" style={{ color: 'var(--color-text-muted)' }}>
                  • All channel members can participate in DAO governance
                </Text>
              </Flex>
            </Card>
          </Flex>

          <Flex gap="3" justify="end" style={{ marginTop: '1rem' }}>
            <Dialog.Close>
              <Button 
                variant="soft" 
                color="gray"
                disabled={isAddingMember}
                style={{
                  backgroundColor: 'var(--color-button-secondary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleAddMember}
              disabled={!newMemberAddress.trim() || isAddingMember}
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-text)'
              }}
            >
              {isAddingMember ? 'Adding...' : 'Add Member'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}

