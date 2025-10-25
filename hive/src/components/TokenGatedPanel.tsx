import { useState, useEffect } from 'react';
import { Card, Flex, Text, Button, Badge, Dialog, TextField, Tabs } from '@radix-ui/themes';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { ChannelMetadata, AccessRule, AccessRuleType } from '../types/channel';
import { TokenGatingService } from '../services/tokenGatingService';
import { useMessaging } from '../hooks/useMessaging';

interface TokenGatedPanelProps {
  channelId: string;
  channelName?: string;
  channelMetadata: ChannelMetadata | null;
}

interface AccessCheck {
  rule: AccessRule;
  hasAccess: boolean;
  details: string;
}

export function TokenGatedPanel({ channelId, channelName, channelMetadata }: TokenGatedPanelProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { sendMessage } = useMessaging();
  
  const [accessChecks, setAccessChecks] = useState<AccessCheck[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleType, setNewRuleType] = useState<AccessRuleType>(AccessRuleType.NFT_OWNERSHIP);
  const [newRuleContract, setNewRuleContract] = useState('');
  const [newRuleMinBalance, setNewRuleMinBalance] = useState('');
  const [newRulePrice, setNewRulePrice] = useState('');
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tokenGatingService = new TokenGatingService(suiClient, currentAccount);

  useEffect(() => {
    if (currentAccount && channelMetadata?.accessRules) {
      checkAccess();
    }
  }, [currentAccount, channelMetadata]);

  const checkAccess = async () => {
    if (!currentAccount || !channelMetadata?.accessRules) return;

    setIsChecking(true);
    setError(null);

    try {
      const checks: AccessCheck[] = [];
      let overallAccess = true;

      for (const rule of channelMetadata.accessRules) {
        let hasRuleAccess = false;
        let details = '';

        switch (rule.type) {
          case AccessRuleType.NFT_OWNERSHIP:
            hasRuleAccess = await tokenGatingService.checkNftOwnership(currentAccount.address, rule.nftCollectionId || '');
            details = hasRuleAccess 
              ? `✅ You own the required NFT: ${rule.nftCollectionId}`
              : `❌ You don't own the required NFT: ${rule.nftCollectionId}`;
            break;

          case AccessRuleType.TOKEN_BALANCE:
            const tokenResult = await tokenGatingService.checkTokenBalance(rule);
            hasRuleAccess = tokenResult.hasAccess;
            details = tokenResult.hasAccess 
              ? `✅ You have sufficient token balance: ${rule.minBalance} ${rule.contractAddress}`
              : `❌ Insufficient token balance. Required: ${rule.minBalance} ${rule.contractAddress}`;
            break;

          case AccessRuleType.SUI_PAYMENT:
            // For SUI payment, we'll check if user has made the payment
            // This would typically involve checking on-chain payment records
            hasRuleAccess = false; // Placeholder - would check payment history
            details = `💰 One-time payment required: ${rule.price} SUI`;
            break;

          default:
            details = `❓ Unknown access rule type: ${rule.type}`;
        }

        checks.push({ rule, hasAccess: hasRuleAccess, details });
        
        if (!hasRuleAccess) {
          overallAccess = false;
        }
      }

      setAccessChecks(checks);
      setHasAccess(overallAccess);

    } catch (error) {
      console.error('Error checking access:', error);
      setError(`Failed to check access: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAddRule = async () => {
    if (!channelMetadata) return;

    setIsAddingRule(true);
    setError(null);
    setSuccess(null);

    try {
      const newRule: AccessRule = {
        type: newRuleType,
        contractAddress: newRuleType === AccessRuleType.TOKEN_BALANCE ? newRuleContract : undefined,
        minBalance: newRuleType === AccessRuleType.TOKEN_BALANCE ? newRuleMinBalance : undefined,
        nftCollectionId: newRuleType === AccessRuleType.NFT_OWNERSHIP ? newRuleContract : undefined,
        price: newRuleType === AccessRuleType.SUI_PAYMENT ? newRulePrice : undefined,
      };

      // Update channel metadata
      const updatedMetadata = {
        ...channelMetadata,
        accessRules: [...(channelMetadata.accessRules || []), newRule]
      };

      // Save to localStorage
      const key = `channel_metadata_${channelId}`;
      localStorage.setItem(key, JSON.stringify(updatedMetadata));

      // Send update message
      const updateMessage = `🔐 **Access Rule Added**\n\nNew access rule added to ${channelName || 'this channel'}:\n\n${getRuleDescription(newRule)}`;
      await sendMessage(channelId, updateMessage);

      setSuccess('Access rule added successfully!');
      setShowAddRule(false);
      setNewRuleContract('');
      setNewRuleMinBalance('');
      setNewRulePrice('');

      // Refresh access checks
      await checkAccess();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (error) {
      console.error('Error adding rule:', error);
      setError(`Failed to add rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingRule(false);
    }
  };

  const getRuleDescription = (rule: AccessRule): string => {
    switch (rule.type) {
      case AccessRuleType.NFT_OWNERSHIP:
        return `NFT Ownership: ${rule.nftCollectionId}`;
      case AccessRuleType.TOKEN_BALANCE:
        return `Token Balance: ${rule.minBalance} ${rule.contractAddress}`;
      case AccessRuleType.SUI_PAYMENT:
        return `SUI Payment: ${rule.price} SUI`;
      default:
        return 'Unknown rule type';
    }
  };

  const getRuleTypeColor = (type: AccessRuleType) => {
    switch (type) {
      case AccessRuleType.NFT_OWNERSHIP: return 'purple';
      case AccessRuleType.TOKEN_BALANCE: return 'blue';
      case AccessRuleType.SUI_PAYMENT: return 'green';
      default: return 'gray';
    }
  };

  return (
    <Card style={{ padding: '1rem' }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Text size="4" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
            Token-Gated Channel - {channelName || 'Channel'}
          </Text>
          <Button
            size="2"
            onClick={() => setShowAddRule(true)}
            disabled={!currentAccount}
            style={{
              backgroundColor: 'var(--color-button-secondary)',
              color: 'var(--color-text-primary)'
            }}
          >
            Add Access Rule
          </Button>
        </Flex>

        {error && (
          <Text size="2" style={{ color: 'var(--color-error)' }}>
            {error}
          </Text>
        )}

        {success && (
          <Text size="2" style={{ color: 'var(--color-success)' }}>
            {success}
          </Text>
        )}

        <Tabs.Root defaultValue="access" style={{ marginTop: '1rem' }}>
          <Tabs.List>
            <Tabs.Trigger value="access">Access Status</Tabs.Trigger>
            <Tabs.Trigger value="rules">Access Rules</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="access">
            <Flex direction="column" gap="3">
              <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                <Flex direction="column" gap="2">
                  <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                    🔐 Your Access Status
                  </Text>
                  
                  {isChecking ? (
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      Checking access requirements...
                    </Text>
                  ) : (
                    <Flex justify="between" align="center">
                      <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                        Overall Access:
                      </Text>
                      <Badge 
                        color={hasAccess ? 'green' : 'red'} 
                        size="2"
                      >
                        {hasAccess ? 'GRANTED' : 'DENIED'}
                      </Badge>
                    </Flex>
                  )}
                </Flex>
              </Card>

              {accessChecks.length > 0 && (
                <Flex direction="column" gap="2">
                  <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                    Access Requirements
                  </Text>
                  
                  {accessChecks.map((check, index) => (
                    <Card key={index} style={{ padding: '1rem' }}>
                      <Flex direction="column" gap="2">
                        <Flex justify="between" align="center">
                          <Badge 
                            color={getRuleTypeColor(check.rule.type)} 
                            size="1"
                          >
                            {check.rule.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge 
                            color={check.hasAccess ? 'green' : 'red'} 
                            size="1"
                          >
                            {check.hasAccess ? 'PASS' : 'FAIL'}
                          </Badge>
                        </Flex>
                        
                        <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                          {check.details}
                        </Text>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              )}

              {!hasAccess && accessChecks.length > 0 && (
                <Card style={{ padding: '1rem', backgroundColor: 'var(--color-background-secondary)' }}>
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                      🔒 Access Required
                    </Text>
                    <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                      You need to meet all access requirements to view this channel's content.
                    </Text>
                    <Button
                      size="2"
                      onClick={checkAccess}
                      style={{
                        backgroundColor: 'var(--color-button-primary)',
                        color: 'var(--color-button-text)',
                        alignSelf: 'flex-start'
                      }}
                    >
                      Recheck Access
                    </Button>
                  </Flex>
                </Card>
              )}
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="rules">
            <Flex direction="column" gap="3">
              <Text size="3" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                Access Rules
              </Text>
              
              {channelMetadata?.accessRules && channelMetadata.accessRules.length > 0 ? (
                <Flex direction="column" gap="2">
                  {channelMetadata.accessRules.map((rule, index) => (
                    <Card key={index} style={{ padding: '1rem' }}>
                      <Flex direction="column" gap="2">
                        <Flex justify="between" align="center">
                          <Badge 
                            color={getRuleTypeColor(rule.type)} 
                            size="1"
                          >
                            {rule.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </Flex>
                        
                        <Text size="2" style={{ color: 'var(--color-text-primary)' }}>
                          {getRuleDescription(rule)}
                        </Text>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              ) : (
                <Text size="2" style={{ color: 'var(--color-text-muted)' }}>
                  No access rules configured yet.
                </Text>
              )}
            </Flex>
          </Tabs.Content>
        </Tabs.Root>
      </Flex>

      {/* Add Rule Dialog */}
      <Dialog.Root open={showAddRule} onOpenChange={setShowAddRule}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Add Access Rule</Dialog.Title>
          <Dialog.Description>
            Add a new access requirement for {channelName || 'this channel'}.
          </Dialog.Description>

          <Flex direction="column" gap="3" style={{ marginTop: '1rem' }}>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" style={{ color: 'var(--color-text-primary)' }}>
                Rule Type
              </Text>
              <Flex gap="2" wrap="wrap">
                <Button
                  size="2"
                  variant={newRuleType === AccessRuleType.NFT_OWNERSHIP ? 'solid' : 'soft'}
                  onClick={() => setNewRuleType(AccessRuleType.NFT_OWNERSHIP)}
                  style={{
                    backgroundColor: newRuleType === AccessRuleType.NFT_OWNERSHIP 
                      ? 'var(--color-button-primary)' 
                      : 'var(--color-button-secondary)',
                    color: newRuleType === AccessRuleType.NFT_OWNERSHIP 
                      ? 'var(--color-button-text)' 
                      : 'var(--color-text-primary)'
                  }}
                >
                  NFT Ownership
                </Button>
                <Button
                  size="2"
                  variant={newRuleType === AccessRuleType.TOKEN_BALANCE ? 'solid' : 'soft'}
                  onClick={() => setNewRuleType(AccessRuleType.TOKEN_BALANCE)}
                  style={{
                    backgroundColor: newRuleType === AccessRuleType.TOKEN_BALANCE 
                      ? 'var(--color-button-primary)' 
                      : 'var(--color-button-secondary)',
                    color: newRuleType === AccessRuleType.TOKEN_BALANCE 
                      ? 'var(--color-button-text)' 
                      : 'var(--color-text-primary)'
                  }}
                >
                  Token Balance
                </Button>
                <Button
                  size="2"
                  variant={newRuleType === AccessRuleType.SUI_PAYMENT ? 'solid' : 'soft'}
                  onClick={() => setNewRuleType(AccessRuleType.SUI_PAYMENT)}
                  style={{
                    backgroundColor: newRuleType === AccessRuleType.SUI_PAYMENT 
                      ? 'var(--color-button-primary)' 
                      : 'var(--color-button-secondary)',
                    color: newRuleType === AccessRuleType.SUI_PAYMENT 
                      ? 'var(--color-button-text)' 
                      : 'var(--color-text-primary)'
                  }}
                >
                  SUI Payment
                </Button>
              </Flex>
            </Flex>

            <TextField.Root
              placeholder={
                newRuleType === AccessRuleType.NFT_OWNERSHIP 
                  ? "NFT Collection ID (e.g., 0x123...)" 
                  : newRuleType === AccessRuleType.TOKEN_BALANCE
                  ? "Token Contract Address (e.g., 0x2::sui::SUI)"
                  : "Payment Amount in SUI"
              }
              value={
                newRuleType === AccessRuleType.SUI_PAYMENT 
                  ? newRulePrice 
                  : newRuleContract
              }
              onChange={(e) => {
                if (newRuleType === AccessRuleType.SUI_PAYMENT) {
                  setNewRulePrice(e.target.value);
                } else {
                  setNewRuleContract(e.target.value);
                }
              }}
              style={{
                backgroundColor: 'var(--color-input-background)',
                border: '1px solid var(--color-input-border)',
                color: 'var(--color-input-text)'
              }}
            />

            {newRuleType === AccessRuleType.TOKEN_BALANCE && (
              <TextField.Root
                placeholder="Minimum Balance (e.g., 1000000000)"
                value={newRuleMinBalance}
                onChange={(e) => setNewRuleMinBalance(e.target.value)}
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  border: '1px solid var(--color-input-border)',
                  color: 'var(--color-input-text)'
                }}
              />
            )}
          </Flex>

          <Flex gap="3" justify="end" style={{ marginTop: '1rem' }}>
            <Dialog.Close>
              <Button 
                variant="soft" 
                color="gray"
                disabled={isAddingRule}
                style={{
                  backgroundColor: 'var(--color-button-secondary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleAddRule}
              disabled={!currentAccount || isAddingRule || !newRuleContract}
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-text)'
              }}
            >
              {isAddingRule ? 'Adding...' : 'Add Rule'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}
