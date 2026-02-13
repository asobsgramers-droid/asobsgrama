import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from './Avatar';

interface ChatListItemProps {
  name: string;
  lastMessage?: string;
  time?: number;
  unreadCount?: number;
  isOnline?: boolean;
  isGroup?: boolean;
  isChannel?: boolean;
  subscriberCount?: number;
  memberCount?: number;
  onPress: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function ChatListItem({
  name,
  lastMessage,
  time,
  unreadCount,
  isOnline,
  isGroup,
  isChannel,
  subscriberCount,
  memberCount,
  onPress,
}: ChatListItemProps) {
  const { theme } = useTheme();

  const getSubtitle = () => {
    if (lastMessage) return lastMessage;
    if (isChannel && subscriberCount !== undefined) {
      return `${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}`;
    }
    if (isGroup && memberCount !== undefined) {
      return `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
    }
    return '';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar
        name={name}
        size={56}
        isOnline={!isGroup && !isChannel ? isOnline : undefined}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            {isChannel && (
              <Text style={[styles.icon, { color: theme.colors.primary }]}>📢</Text>
            )}
            {isGroup && (
              <Text style={[styles.icon, { color: theme.colors.primary }]}>👥</Text>
            )}
            <Text
              style={[styles.name, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
          </View>
          {time && (
            <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
              {formatTime(time)}
            </Text>
          )}
        </View>
        <View style={styles.footer}>
          <Text
            style={[styles.lastMessage, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {getSubtitle()}
          </Text>
          {unreadCount !== undefined && unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  lastMessage: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
