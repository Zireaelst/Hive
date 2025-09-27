import React from 'react';
import { Box, Flex, Heading, Text, Button, Card } from '@radix-ui/themes';
import hivelogo from "../assets/hivelogo.png";

interface LandingPageProps {
  onStartMessaging: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartMessaging }) => {
  return (
    <Box style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--color-background-primary) 0%, var(--color-background-secondary) 100%)',
      color: 'var(--color-text-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 30%, rgba(247, 201, 72, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(76, 158, 235, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(174, 234, 247, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 90% 70%, rgba(224, 161, 6, 0.08) 0%, transparent 50%)
        `,
        zIndex: 0,
        animation: 'backgroundShift 20s ease-in-out infinite',
      }} />

      {/* Floating Particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        background: `
          radial-gradient(2px 2px at 20px 30px, rgba(247, 201, 72, 0.3), transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(76, 158, 235, 0.3), transparent),
          radial-gradient(1px 1px at 90px 40px, rgba(174, 234, 247, 0.4), transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(224, 161, 6, 0.3), transparent),
          radial-gradient(2px 2px at 160px 30px, rgba(247, 201, 72, 0.2), transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
        animation: 'particleFloat 15s linear infinite',
      }} />

      <Flex direction="column" style={{ minHeight: '100vh', zIndex: 2, position: 'relative' }}>
        {/* Hero Section */}
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="6"
          style={{ 
            flex: 1, 
            textAlign: 'center', 
            padding: 'var(--space-6)',
            animation: 'fadeInUp 1s ease-out'
          }}
        >
          {/* Logo */}
          <img 
            src={hivelogo} 
            alt="Hive Logo" 
            style={{ 
              height: '120px', 
              width: 'auto',
              filter: 'drop-shadow(0 0 20px rgba(247, 201, 72, 0.3))',
              animation: 'logoGlow 3s ease-in-out infinite alternate',
              marginBottom: '2rem'
            }} 
          />
          <Heading 
            as="h1" 
            size="9" 
            style={{ 
              color: 'var(--color-text-primary)', 
              maxWidth: '900px',
              background: 'linear-gradient(45deg, var(--color-text-primary), var(--color-button-primary))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(247, 201, 72, 0.3)',
              animation: 'titleGlow 2s ease-in-out infinite alternate'
            }}
          >
            Decentralized & Secure Messaging on Sui
          </Heading>
          
          <Text 
            as="p" 
            size="5" 
            style={{ 
              color: 'var(--color-text-muted)', 
              maxWidth: '700px', 
              lineHeight: 1.8,
              fontSize: '1.2rem'
            }}
          >
            Experience true privacy with Hive. Your conversations are end-to-end encrypted and stored on a decentralized network, ensuring only you and your recipients can read them.
          </Text>

          <Text 
            as="p" 
            size="3" 
            style={{ 
              color: 'var(--color-text-muted)', 
              maxWidth: '600px', 
              lineHeight: 1.6,
              fontSize: '1rem',
              marginTop: '1rem',
              fontStyle: 'italic'
            }}
          >
            The SDK uses Seal for encrypting messages and attachments. The Seal SDK requires a session key, which contains a signature from your account and allows the app to retrieve Seal decryption keys for a limited time (30 minutes) without requiring repeated confirmations for each message.
          </Text>

          {/* Feature Cards */}
          <Flex direction="column" gap="6" align="center" style={{ marginTop: '3rem' }}>
            <Card style={{
              background: 'linear-gradient(135deg, rgba(31, 41, 51, 0.8) 0%, rgba(76, 158, 235, 0.1) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(247, 201, 72, 0.3)',
              borderRadius: '20px',
              padding: '2rem',
              minWidth: '350px',
              maxWidth: '450px',
              boxShadow: '0 8px 32px rgba(247, 201, 72, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(247, 201, 72, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }} />
              <Flex align="center" gap="3" style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '2.5rem',
                  filter: 'drop-shadow(0 0 10px rgba(247, 201, 72, 0.5))'
                }}>
                  🔒
                </div>
                <Text size="4" weight="bold" style={{ 
                  color: 'var(--color-button-primary)',
                  textShadow: '0 0 10px rgba(247, 201, 72, 0.3)'
                }}>
                  End-to-End Encryption
                </Text>
              </Flex>
              <Text size="3" style={{ 
                color: 'var(--color-text-muted)', 
                lineHeight: 1.6,
                paddingLeft: '3.5rem'
              }}>
                Your messages are encrypted before they leave your device
              </Text>
            </Card>
            
            <Card style={{
              background: 'linear-gradient(135deg, rgba(31, 41, 51, 0.8) 0%, rgba(174, 234, 247, 0.1) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(76, 158, 235, 0.3)',
              borderRadius: '20px',
              padding: '2rem',
              minWidth: '350px',
              maxWidth: '450px',
              boxShadow: '0 8px 32px rgba(76, 158, 235, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(76, 158, 235, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }} />
              <Flex align="center" gap="3" style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '2.5rem',
                  filter: 'drop-shadow(0 0 10px rgba(76, 158, 235, 0.5))'
                }}>
                  🌐
                </div>
                <Text size="4" weight="bold" style={{ 
                  color: 'var(--color-button-primary)',
                  textShadow: '0 0 10px rgba(76, 158, 235, 0.3)'
                }}>
                  Decentralized
                </Text>
              </Flex>
              <Text size="3" style={{ 
                color: 'var(--color-text-muted)', 
                lineHeight: 1.6,
                paddingLeft: '3.5rem'
              }}>
                No central servers, your data stays in your control
              </Text>
            </Card>
            
            <Card style={{
              background: 'linear-gradient(135deg, rgba(31, 41, 51, 0.8) 0%, rgba(224, 161, 6, 0.1) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(224, 161, 6, 0.3)',
              borderRadius: '20px',
              padding: '2rem',
              minWidth: '350px',
              maxWidth: '450px',
              boxShadow: '0 8px 32px rgba(224, 161, 6, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(224, 161, 6, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }} />
              <Flex align="center" gap="3" style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '2.5rem',
                  filter: 'drop-shadow(0 0 10px rgba(224, 161, 6, 0.5))'
                }}>
                  ⚡
                </div>
                <Text size="4" weight="bold" style={{ 
                  color: 'var(--color-button-primary)',
                  textShadow: '0 0 10px rgba(224, 161, 6, 0.3)'
                }}>
                  Fast & Reliable
                </Text>
              </Flex>
              <Text size="3" style={{ 
                color: 'var(--color-text-muted)', 
                lineHeight: 1.6,
                paddingLeft: '3.5rem'
              }}>
                Built on Sui blockchain for instant transactions
              </Text>
            </Card>
          </Flex>

          <Button
            size="4"
            onClick={onStartMessaging}
            style={{
              background: 'linear-gradient(45deg, var(--color-button-primary), var(--color-button-secondary))',
              color: 'var(--color-button-text)',
              cursor: 'pointer',
              padding: '24px 48px',
              fontSize: '20px',
              fontWeight: 'bold',
              marginTop: '2rem',
              border: 'none',
              borderRadius: '50px',
              boxShadow: '0 8px 25px rgba(247, 201, 72, 0.3)',
              transition: 'all 0.3s ease',
              animation: 'buttonPulse 2s ease-in-out infinite'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(247, 201, 72, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(247, 201, 72, 0.3)';
            }}
          >
            Start Messaging
          </Button>
        </Flex>
      </Flex>

      {/* CSS Animations */}
      <style>{`
        @keyframes backgroundShift {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-10px) translateY(-5px); }
          50% { transform: translateX(5px) translateY(-10px); }
          75% { transform: translateX(-5px) translateY(5px); }
        }
        
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-10px) translateX(5px); }
          66% { transform: translateY(5px) translateX(-5px); }
          100% { transform: translateY(0) translateX(0); }
        }
        
        @keyframes logoGlow {
          0% { filter: drop-shadow(0 0 20px rgba(247, 201, 72, 0.3)); }
          100% { filter: drop-shadow(0 0 30px rgba(247, 201, 72, 0.6)); }
        }
        
        @keyframes titleGlow {
          0% { text-shadow: 0 0 30px rgba(247, 201, 72, 0.3); }
          100% { text-shadow: 0 0 40px rgba(247, 201, 72, 0.6); }
        }
        
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        
        @keyframes buttonPulse {
          0%, 100% { box-shadow: 0 8px 25px rgba(247, 201, 72, 0.3); }
          50% { box-shadow: 0 8px 25px rgba(247, 201, 72, 0.5); }
        }
      `}</style>
    </Box>
  );
};

export default LandingPage;
