import React from 'react';
import { Box, Text, Badge, Flex } from '@radix-ui/themes';
import { useUserSuinsName } from '../hooks/useSuins';

interface SuinsNameDisplayProps {
  address?: string;
  showAddress?: boolean;
  size?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
}

export function SuinsNameDisplay({ 
  address, 
  showAddress = true, 
  size = '2' 
}: SuinsNameDisplayProps) {
  const { userName, isChecking, error } = useUserSuinsName();

  // If we have a SuiNS name, show it
  if (userName) {
    return (
      <Flex align="center" gap="2">
        <Badge 
          size="1"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-button-text)',
            fontWeight: 'bold'
          }}
        >
          .sui
        </Badge>
        <Text 
          size={size} 
          weight="medium" 
          style={{ color: 'var(--color-text-primary)' }}
        >
          {userName}
        </Text>
        {showAddress && address && (
          <Text 
            size="1" 
            style={{ 
              color: 'var(--color-text-muted)',
              fontFamily: 'monospace'
            }}
          >
            ({address.slice(0, 6)}...{address.slice(-4)})
          </Text>
        )}
      </Flex>
    );
  }

  // If we're checking, show loading state
  if (isChecking) {
    return (
      <Flex align="center" gap="2">
        <Text 
          size={size} 
          style={{ color: 'var(--color-text-muted)' }}
        >
          Checking SuiNS...
        </Text>
      </Flex>
    );
  }

  // If there's an error, show error state
  if (error) {
    return (
      <Flex align="center" gap="2">
        <Text 
          size={size} 
          style={{ color: 'var(--color-error)' }}
        >
          SuiNS Error
        </Text>
        {showAddress && address && (
          <Text 
            size="1" 
            style={{ 
              color: 'var(--color-text-muted)',
              fontFamily: 'monospace'
            }}
          >
            ({address.slice(0, 6)}...{address.slice(-4)})
          </Text>
        )}
      </Flex>
    );
  }

  // If no SuiNS name, show regular address
  if (showAddress && address) {
    return (
      <Text 
        size={size} 
        style={{ 
          color: 'var(--color-text-primary)',
          fontFamily: 'monospace'
        }}
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </Text>
    );
  }

  // Fallback
  return null;
}

// Component to display SuiNS name in wallet connection area
export function WalletSuinsDisplay() {
  const { userName, isChecking } = useUserSuinsName();

  if (userName) {
    return (
      <Box style={{ 
        backgroundColor: 'var(--color-background-tertiary)',
        padding: '0.5rem',
        borderRadius: 'var(--radius-2)',
        border: '1px solid var(--color-border-primary)',
        marginTop: '0.5rem'
      }}>
        <Flex align="center" gap="2">
          <Badge 
            size="1"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-button-text)',
              fontWeight: 'bold'
            }}
          >
            .sui
          </Badge>
          <Text 
            size="2" 
            weight="medium" 
            style={{ color: 'var(--color-text-primary)' }}
          >
            {userName}
          </Text>
        </Flex>
        <Text 
          size="1" 
          style={{ 
            color: 'var(--color-text-muted)',
            marginTop: '0.25rem'
          }}
        >
          Your SuiNS domain
        </Text>
      </Box>
    );
  }

  if (isChecking) {
    return (
      <Box style={{ 
        backgroundColor: 'var(--color-background-tertiary)',
        padding: '0.5rem',
        borderRadius: 'var(--radius-2)',
        border: '1px solid var(--color-border-primary)',
        marginTop: '0.5rem'
      }}>
        <Text 
          size="2" 
          style={{ color: 'var(--color-text-muted)' }}
        >
          Checking for SuiNS name...
        </Text>
      </Box>
    );
  }

  // No SuiNS name found, don't show anything
  return null;
}
