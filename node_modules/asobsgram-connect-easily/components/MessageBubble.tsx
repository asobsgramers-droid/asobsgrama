import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

interface MessageBubbleProps {
  content: string;
  senderName: string;
  isMine: boolean;
  isDeleted: boolean;
  isEdited: boolean;
  timestamp: number;
  showSender?: boolean;
  onLongPress?: () => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageBubble({
  content,
  senderName,
  isMine,
  isDeleted,
  isEdited,
  timestamp,
  showSender = false,
  onLongPress,
}: MessageBubbleProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, isMine ? styles.myMessage : styles.theirMessage]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={onLongPress}
        style={[
          styles.bubble,
          {
            backgroundColor: isMine ? theme.colors.primary : theme.colors.surfaceSecondary,
            borderBottomRightRadius: isMine ? 4 : 20,
            borderBottomLeftRadius: isMine ? 20 : 4,
          },
        ]}
      >
        {showSender && !isMine && (
          <Text style={[styles.senderName, { color: theme.colors.accent }]}>
            {senderName}
          </Text>
        )}
        <Text
          style={[
            styles.content,
            {
              color: isMine ? '#FFFFFF' : theme.colors.text,
              fontStyle: isDeleted ? 'italic' : 'normal',
            },
          ]}
        >
          {content}
        </Text>
        <View style={styles.footer}>
          {isEdited && !isDeleted && (
            <Text
              style={[
                styles.edited,
                { color: isMine ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary },
              ]}
            >
              edited
            </Text>
          )}
          <Text
            style={[
              styles.time,
              { color: isMine ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary },
            ]}
          >
            {formatTime(timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    gap: 6,
  },
  edited: {
    fontSize: 11,
  },
  time: {
    fontSize: 11,
  },
});
