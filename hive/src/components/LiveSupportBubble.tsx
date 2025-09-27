import { IconButton, Badge } from '@radix-ui/themes';
import { ChatBubbleIcon } from '@radix-ui/react-icons';

interface LiveSupportBubbleProps {
  onClick: () => void;
  isVisible: boolean;
  isOnline?: boolean;
  unreadCount?: number;
}

export function LiveSupportBubble({ onClick, isVisible, isOnline = true, unreadCount = 0 }: LiveSupportBubbleProps) {
  if (!isVisible) return null;

  return (
    <div style={{ position: 'relative' }}>
      <IconButton
        size="4"
        onClick={onClick}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 999,
          backgroundColor: isOnline ? 'var(--color-button-primary)' : 'var(--color-background-tertiary)',
          color: isOnline ? 'var(--color-button-text)' : 'var(--color-text-muted)',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          animation: isOnline ? 'pulse 2s infinite' : 'none',
        }}
      >
        <ChatBubbleIcon width="24" height="24" />
      </IconButton>
      
      {/* Online indicator */}
      {isOnline && (
        <div
          style={{
            position: 'fixed',
            bottom: '75px',
            right: '75px',
            zIndex: 1000,
            width: '12px',
            height: '12px',
            backgroundColor: '#22c55e',
            borderRadius: '50%',
            border: '2px solid var(--color-background-primary)',
            animation: 'pulse 2s infinite',
          }}
        />
      )}
      
      {/* Unread count badge */}
      {unreadCount > 0 && (
        <Badge
          size="1"
          style={{
            position: 'fixed',
            bottom: '70px',
            right: '70px',
            zIndex: 1000,
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '10px',
            minWidth: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
      
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          }
          50% {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 8px rgba(0, 0, 0, 0.1);
          }
          100% {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          }
        }
      `}</style>
    </div>
  );
}
