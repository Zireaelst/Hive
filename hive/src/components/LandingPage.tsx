import React from 'react';
import { Box, Flex, Heading, Text, Button } from '@radix-ui/themes';
import hivelogo from "../assets/hivelogo.png";

interface LandingPageProps {
  onStartMessaging: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartMessaging }) => {
  return (
    <Box style={{
      minHeight: '100vh',
      background: 'var(--color-background-primary)',
      color: 'var(--color-text-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Abstract Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 10% 20%, rgba(76, 158, 235, 0.1), transparent 30%), radial-gradient(circle at 80% 90%, rgba(174, 234, 247, 0.08), transparent 40%)',
        zIndex: 0,
      }} />

      <Flex direction="column" style={{ minHeight: '100vh', zIndex: 1, position: 'relative' }}>
        {/* Header */}
        <Flex p="4" align="center" justify="between">
          <img 
            src={hivelogo} 
            alt="Hive Logo" 
            style={{ height: '120px', width: 'auto' }} 
          />
          <Button
            size="3"
            onClick={onStartMessaging}
            style={{
              backgroundColor: 'var(--color-button-secondary)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            Launch App
          </Button>
        </Flex>

        {/* Hero Section */}
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="5"
          style={{ flex: 1, textAlign: 'center', padding: 'var(--space-4)' }}
        >
          <Heading as="h1" size="9" style={{ color: 'var(--color-text-primary)', maxWidth: '800px' }}>
            Decentralized & Secure Messaging on Sui
          </Heading>
          <Text as="p" size="5" style={{ color: 'var(--color-text-muted)', maxWidth: '600px', lineHeight: 1.6 }}>
            Experience true privacy with Hive. Your conversations are end-to-end encrypted and stored on a decentralized network, ensuring only you and your recipients can read them.
          </Text>
          <Button
            size="4"
            onClick={onStartMessaging}
            style={{
              backgroundColor: 'var(--color-button-primary)',
              color: 'var(--color-button-text)',
              cursor: 'pointer',
              padding: '24px 32px',
              fontSize: '20px',
              fontWeight: 'bold',
              marginTop: 'var(--space-4)',
            }}
          >
            Start Messaging
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default LandingPage;
